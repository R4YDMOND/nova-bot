"""
Движок текстовых команд — ТЗ №7 (страница «Команды») + ТЗ №7.1
(гибкий доступ: роли/каналы для Lolka, реальные уровни VK-руководителей).

Реальное выполнение доступно только для текстовых/prefix-команд:
  - встроенные: /ping, /help (единственные, у кого есть готовый текст ответа)
  - пользовательские: любые команды, созданные в конструкторе (всегда имеют
    фиксированный текстовый ответ, поэтому исполняются полностью)

VK callback-кнопки и настоящие Lolka Slash/Context-Menu (Interactions API)
не поддерживаются текущей инфраструктурой для конструктора команд — не
реализуются (отдельно от предустановленных кнопок Профиль/Топ/Закрыть
в редакторе шаблонов, см. ranking/actions.py).

Модерационные встроенные команды (/ban /kick /mute /clear) в этой версии
не выполняются по тексту — только управляются (enabled/cooldown/доступ)
через дашборд; сами наказания уже выполняются через существующие
защищённые действия (/api/vk/moderate, журнал модерации).

── Доступ (ТЗ №7.1) ─────────────────────────────────────────────────────
Lolka и VK принципиально отличаются по модели прав, поэтому проверяются
раздельно (на все команды — встроенные и пользовательские):

  • Lolka — у бота есть Discord-совместимый список ролей участника
    (`member.roles`, приходит в каждом MESSAGE_CREATE) и `channel_id`.
    Доступ гибкий: allowed_roles/ignored_roles/allowed_channels/
    ignored_channels (пусто = не ограничено), как в Juniper Bot.
    ВАЖНО: старая проверка через `member.permissions` (битовое поле)
    удалена — в реальном Gateway MESSAGE_CREATE это поле не приходит
    (оно есть только в Interactions API), поэтому moderator/admin/owner
    на Lolka фактически никогда не проходили проверку. Роли — рабочий
    и единственный источник данных о правах участника на Gateway-событии.

  • VK — жёстко ограничен 5 уровнями руководителей сообщества
    (groups.getMembers, filter=managers, поле role): moderator, editor,
    administrator, advertiser, creator(=owner). Кастомных ролей на VK
    нет, поэтому конструктор ролей/каналов для VK не показывается —
    только выбор одного из этих уровней.

In-memory кэш кулдаунов (без Redis — free-план), TTL сбрасывается сам по себе,
т.к. хранится только "последнее использование".
"""

import time
import threading
from typing import Any, Callable, Dict, List, Optional

# Единственные встроенные команды с реальным текстовым ответом
# (совпадает с тем, что уже было в lolka_gateway.COMMAND_RESPONSES).
BUILTIN_RESPONSES: Dict[str, str] = {
    "ping": "🏓 Pong! Бот работает исправно",
    "help": (
        "🤖 Команды Нова:\n"
        "🏓 /ping — проверка бота\n"
        "❓ /help — список команд"
    ),
}

# Уровни прав VK-руководителей (groups.getMembers?filter=managers, поле role) —
# 'creator' сопоставляется с внутренним уровнем 'owner'. 'advertiser' не входит
# в иерархию (отдельное неиерархическое право, как и в интерфейсе управления
# сообществом VK — «Добавление руководителя»).
VK_ROLE_RANK: Dict[str, int] = {
    "moderator": 1,
    "editor": 2,
    "administrator": 3,
    "owner": 4,  # creator
}
VK_PERMISSION_LEVELS = ("all", "moderator", "editor", "administrator", "advertiser", "owner")


class CommandMatch:
    __slots__ = (
        "name", "response", "cooldown", "permission", "log_usage",
        "allowed_roles", "ignored_roles", "allowed_channels", "ignored_channels",
    )

    def __init__(
        self, name: str, response: str, cooldown: int, permission: str, log_usage: bool,
        allowed_roles: Optional[List[str]] = None, ignored_roles: Optional[List[str]] = None,
        allowed_channels: Optional[List[str]] = None, ignored_channels: Optional[List[str]] = None,
    ):
        self.name = name
        self.response = response
        self.cooldown = cooldown
        self.permission = permission
        self.log_usage = log_usage
        self.allowed_roles = allowed_roles or []
        self.ignored_roles = ignored_roles or []
        self.allowed_channels = allowed_channels or []
        self.ignored_channels = ignored_channels or []


class CommandsEngine:
    """
    Разбирает текст сообщения на префикс+имя, ищет активную команду
    (встроенную с готовым ответом или пользовательскую) в конфиге сервера,
    проверяет кулдаун и доступ (роли/каналы на Lolka, уровень руководителя
    на VK), возвращает готовый ответ бота.
    Thread-safe (GIL), in-memory состояние кулдаунов.
    """

    def __init__(self):
        self._lock = threading.Lock()
        # (server_id, platform, user_id, command_name) -> timestamp последнего использования
        self._last_used: Dict[tuple, float] = {}

    # ── Кулдаун ──────────────────────────────────────────────────────────

    def _check_cooldown(self, server_id: Any, platform: str, user_id: Any, name: str, cooldown: int) -> bool:
        """True — можно выполнять (кулдаун прошёл или отключён)."""
        if cooldown <= 0:
            return True
        key = (server_id, platform, str(user_id), name)
        with self._lock:
            now = time.time()
            last = self._last_used.get(key)
            if last is not None and now - last < cooldown:
                return False
            self._last_used[key] = now
            return True

    # ── Доступ: Lolka (роли/каналы) ─────────────────────────────────────

    @staticmethod
    def check_access_lolka(
        channel_id: Any,
        member_roles: Optional[List[str]],
        allowed_roles: List[str], ignored_roles: List[str],
        allowed_channels: List[str], ignored_channels: List[str],
    ) -> bool:
        """Пусто в списке = ограничение не действует (как в Juniper Bot)."""
        roles = set(member_roles or [])

        if ignored_roles and roles & set(ignored_roles):
            return False
        if allowed_roles and not (roles & set(allowed_roles)):
            return False

        ch = str(channel_id) if channel_id is not None else None
        if ignored_channels and ch in {str(c) for c in ignored_channels}:
            return False
        if allowed_channels and ch not in {str(c) for c in allowed_channels}:
            return False

        return True

    # ── Доступ: VK (уровень руководителя сообщества) ───────────────────

    @staticmethod
    def check_permission_vk(permission: str, vk_managers: Optional[Dict[str, Dict[str, Any]]], user_id: Any) -> bool:
        """
        vk_managers — {str(user_id): {"role": "moderator"|"editor"|"administrator"|"creator"|"advertiser"}},
        получено из groups.getMembers(filter=managers) и закэшировано (см. main.py).
        """
        if permission == "all":
            return True
        info = (vk_managers or {}).get(str(user_id))
        if not info:
            return False
        role = info.get("role")
        if permission == "advertiser":
            return role in ("advertiser", "creator")
        rank = VK_ROLE_RANK["owner"] if role == "creator" else VK_ROLE_RANK.get(role, 0)
        required = VK_ROLE_RANK.get(permission)
        if required is None:
            return False
        return rank >= required

    # ── Поиск команды ────────────────────────────────────────────────────

    def match(self, text: str, platform: str, commands_config: Dict[str, Any]) -> Optional[CommandMatch]:
        """
        commands_config — распарсенный JSON конфига модуля 'commands' сервера:
        {"builtin": [{"name","enabled","cooldown","permission",
                      "allowedRoles","ignoredRoles","allowedChannels","ignoredChannels"}, ...],
         "custom": [{"name","enabled","platforms","vkPrefix","lolkaPrefix","cooldown",
                     "permission","allowedRoles","ignoredRoles","allowedChannels","ignoredChannels",
                     "response","logUsage"}, ...]}
        Поля ролей/каналов актуальны только для platform="lolka" — для VK игнорируются
        (проверка идёт по permission через check_permission_vk).
        """
        if not text:
            return None
        token = text.strip().split(" ")[0].lower()
        if not token:
            return None

        builtin_overrides = {o.get("name"): o for o in (commands_config.get("builtin") or [])}
        custom_commands: List[dict] = commands_config.get("custom") or []

        def _access_fields(src: dict) -> dict:
            return {
                "allowed_roles": src.get("allowedRoles") or [],
                "ignored_roles": src.get("ignoredRoles") or [],
                "allowed_channels": src.get("allowedChannels") or [],
                "ignored_channels": src.get("ignoredChannels") or [],
            }

        # 1. Пользовательские команды — точное совпадение с их префиксом на платформе
        prefix_field = "vkPrefix" if platform == "vk" else "lolkaPrefix"
        for cmd in custom_commands:
            if not cmd.get("enabled", True):
                continue
            if platform not in (cmd.get("platforms") or []):
                continue
            prefix = (cmd.get(prefix_field) or "").strip().lower()
            if prefix and prefix == token:
                return CommandMatch(
                    name=cmd.get("name", ""),
                    response=cmd.get("response", ""),
                    cooldown=int(cmd.get("cooldown") or 0),
                    permission=cmd.get("permission", "all"),
                    log_usage=bool(cmd.get("logUsage", True)),
                    **_access_fields(cmd),
                )

        # 2. Встроенные команды с реальным ответом (ping/help), только с "/"-префиксом
        if token.startswith("/"):
            name = token[1:]
            if name in BUILTIN_RESPONSES:
                override = builtin_overrides.get(name) or {}
                if not override.get("enabled", True):
                    return None
                return CommandMatch(
                    name=name,
                    response=BUILTIN_RESPONSES[name],
                    cooldown=int(override.get("cooldown", 0) or 0),
                    permission=override.get("permission", "all"),
                    log_usage=True,
                    **_access_fields(override),
                )

        return None

    # ── Выполнение ───────────────────────────────────────────────────────

    def execute(
        self,
        text: str,
        platform: str,
        server_id: Any,
        user_id: Any,
        commands_config: Dict[str, Any],
        channel_id: Any = None,
        member_roles: Optional[List[str]] = None,
        vk_managers: Optional[Dict[str, Dict[str, Any]]] = None,
        on_usage: Optional[Callable[[str], None]] = None,
    ) -> Optional[str]:
        """
        Возвращает текст ответа бота или None (команда не найдена/недоступна).
        on_usage(name) вызывается синхронно при УСПЕШНОМ выполнении команды с
        включённым log_usage (флаг "Логировать использование" в конструкторе/встроенных
        командах) — движок сам не пишет в БД (остаётся без знания о SQLAlchemy/сессиях),
        решение о том, как и куда логировать, остаётся за вызывающей стороной
        (main.py/lolka_gateway.py). Исключения из on_usage проглатываются — сбой логирования
        не должен ломать ответ пользователю.
        """
        m = self.match(text, platform, commands_config)
        if not m:
            return None

        if platform == "lolka":
            if not self.check_access_lolka(
                channel_id, member_roles,
                m.allowed_roles, m.ignored_roles, m.allowed_channels, m.ignored_channels,
            ):
                return None
        else:
            if not self.check_permission_vk(m.permission, vk_managers, user_id):
                return None

        if not self._check_cooldown(server_id, platform, user_id, m.name, m.cooldown):
            return None

        if m.log_usage and on_usage:
            try:
                on_usage(m.name)
            except Exception:
                pass

        return m.response


_engine = CommandsEngine()


def get_commands_engine() -> CommandsEngine:
    return _engine
