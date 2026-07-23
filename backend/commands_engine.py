"""
Движок текстовых команд — ТЗ №7 (страница «Команды»).
Реальное выполнение доступно только для текстовых/prefix-команд:
  - встроенные: /ping, /help (единственные, у кого есть готовый текст ответа)
  - пользовательские: любые команды, созданные в конструкторе (всегда имеют
    фиксированный текстовый ответ, поэтому исполняются полностью)

VK callback-кнопки и настоящие Lolka Slash/Context-Menu (Interactions API)
не поддерживаются текущей инфраструктурой — не реализуются.

Модерационные встроенные команды (/ban /kick /mute /clear) в этой версии
не выполняются по тексту — только управляются (enabled/cooldown/permission)
через дашборд; сами наказания уже выполняются через существующие
защищённые действия (/api/vk/moderate, журнал модерации).

In-memory кэш кулдаунов (без Redis — free-план), TTL сбрасывается сам по себе,
т.к. хранится только "последнее использование".
"""

import time
import threading
from typing import Any, Dict, List, Optional

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

# Уровни прав, которые движок умеет проверить без доп. инфраструктуры.
# 'moderator' и 'admin' объединены в одну проверку (нет данных для более
# тонкого разделения без API получения ролей/менеджеров сообщества).
PERMISSION_LEVELS = ("all", "moderator", "admin", "owner")


class CommandMatch:
    __slots__ = ("name", "response", "cooldown", "permission", "log_usage")

    def __init__(self, name: str, response: str, cooldown: int, permission: str, log_usage: bool):
        self.name = name
        self.response = response
        self.cooldown = cooldown
        self.permission = permission
        self.log_usage = log_usage


class CommandsEngine:
    """
    Разбирает текст сообщения на префикс+имя, ищет активную команду
    (встроенную с готовым ответом или пользовательскую) в конфиге сервера,
    проверяет кулдаун и права, возвращает готовый ответ бота.
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

    # ── Права доступа ───────────────────────────────────────────────────

    @staticmethod
    def check_permission_lolka(permission: str, member_permissions: Optional[str]) -> bool:
        """member_permissions — битовое поле прав участника Lolka (Discord-совместимое, строка-число)."""
        if permission == "all":
            return True
        if not member_permissions:
            return False
        try:
            bits = int(member_permissions)
        except (TypeError, ValueError):
            return False
        ADMINISTRATOR = 0x8
        BAN_MEMBERS = 0x4
        KICK_MEMBERS = 0x2
        if bits & ADMINISTRATOR:
            return True  # администратор проходит любую проверку (в т.ч. owner-уровень)
        if permission == "moderator":
            return bool(bits & (BAN_MEMBERS | KICK_MEMBERS))
        return False  # admin/owner без ADMINISTRATOR — недостаточно прав

    @staticmethod
    def check_permission_vk(permission: str) -> bool:
        """
        На VK нет доступа к списку менеджеров сообщества без дополнительного
        API-вызова (groups.getMembers filter=managers) — эта интеграция не
        входит в текущий объём работ. Чтобы не выдавать привилегированные
        команды всем подряд, ограниченные по правам команды на VK пока не
        выполняются (остаются видимыми/переключаемыми в дашборде).
        """
        return permission == "all"

    # ── Поиск и выполнение команды ──────────────────────────────────────

    def match(self, text: str, platform: str, commands_config: Dict[str, Any]) -> Optional[CommandMatch]:
        """
        commands_config — распарсенный JSON конфига модуля 'commands' сервера:
        {"builtin": [{"name","enabled","cooldown","permission"}, ...],
         "custom": [{"name","enabled","platforms","vkPrefix","lolkaPrefix",
                     "cooldown","permission","response","logUsage"}, ...]}
        """
        if not text:
            return None
        token = text.strip().split(" ")[0].lower()
        if not token:
            return None

        builtin_overrides = {o.get("name"): o for o in (commands_config.get("builtin") or [])}
        custom_commands: List[dict] = commands_config.get("custom") or []

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
                )

        # 2. Встроенные команды с реальным ответом (ping/help), только с "/"-префиксом
        if token.startswith("/"):
            name = token[1:]
            if name in BUILTIN_RESPONSES:
                override = builtin_overrides.get(name)
                if override and not override.get("enabled", True):
                    return None
                return CommandMatch(
                    name=name,
                    response=BUILTIN_RESPONSES[name],
                    cooldown=int((override or {}).get("cooldown", 0) or 0),
                    permission=(override or {}).get("permission", "all"),
                    log_usage=True,
                )

        return None

    def execute(
        self,
        text: str,
        platform: str,
        server_id: Any,
        user_id: Any,
        commands_config: Dict[str, Any],
        member_permissions: Optional[str] = None,
    ) -> Optional[str]:
        """Возвращает текст ответа бота или None (команда не найдена/не выполнена)."""
        m = self.match(text, platform, commands_config)
        if not m:
            return None

        if platform == "lolka":
            if not self.check_permission_lolka(m.permission, member_permissions):
                return None
        else:
            if not self.check_permission_vk(m.permission):
                return None

        if not self._check_cooldown(server_id, platform, user_id, m.name, m.cooldown):
            return None

        return m.response


_engine = CommandsEngine()


def get_commands_engine() -> CommandsEngine:
    return _engine
