"""
Gateway-клиент для собственного бота Nova в Lolka.
Протокол Discord-совместимый: op 0 = Dispatch, op 2 = Identify, op 1/11 = Heartbeat/Ack.
"""
import asyncio
import json
import os
import random
from typing import Dict, Optional
import websockets

from ranking.xp_handler import award_xp_for_message, award_xp_for_voice_minutes
from ranking.template import render_notify_template, render_message_template
from ranking.actions import ACTION_PROFILE, ACTION_LEADERBOARD, ACTION_CLOSE, ACTION_NP_GIVE, get_profile_summary, get_leaderboard_text
from ranking.nova_points import give_nova_point, claim_daily, list_shop_items, buy_shop_item, get_currency_label
from ranking.account_link import generate_link_code, confirm_link_code
from ranking import np_farm_cache
from database import SessionLocal
from commands_engine import get_commands_engine
import ai_engine
from moderation_engine import ModerationEngine, ModerationResult

_moderation_engine = ModerationEngine()

_commands_engine = get_commands_engine()


# Discord-совместимые биты интентов Gateway (см. документацию Lolka — протокол идентичен discord.py).
# ВАЖНО: привилегированные интенты (Members, Presences, Message Content) должны быть явно
# включены в портале разработчика (вкладка "Бот" → "Привилегированные интенты"). Если запросить
# бит, который не включён в портале — Lolka разрывает соединение сразу после Identify.
INTENT_GUILDS = 1 << 0
INTENT_GUILD_MEMBERS = 1 << 1          # привилегированный — вкл. в портале (Server Members Intent)
INTENT_GUILD_MODERATION = 1 << 2
INTENT_GUILD_WEBHOOKS = 1 << 5
INTENT_GUILD_INVITES = 1 << 6
INTENT_GUILD_VOICE_STATES = 1 << 7
INTENT_GUILD_PRESENCES = 1 << 8        # привилегированный — у нас ВЫКЛЮЧЕН в портале, не запрашиваем!
INTENT_GUILD_MESSAGES = 1 << 9
INTENT_GUILD_MESSAGE_REACTIONS = 1 << 10
INTENT_GUILD_MESSAGE_TYPING = 1 << 11
INTENT_DIRECT_MESSAGES = 1 << 12
INTENT_DIRECT_MESSAGE_REACTIONS = 1 << 13
INTENT_MESSAGE_CONTENT = 1 << 15       # привилегированный — вкл. в портале (Message Content Intent)

# Набор интентов, которые реально включены в портале разработчика Nova Bot.
# Если позже включите Presence Intent в портале — добавьте сюда INTENT_GUILD_PRESENCES.
BOT_INTENTS = (
    INTENT_GUILDS
    | INTENT_GUILD_MEMBERS
    | INTENT_GUILD_MODERATION
    | INTENT_GUILD_WEBHOOKS
    | INTENT_GUILD_INVITES
    | INTENT_GUILD_VOICE_STATES
    | INTENT_GUILD_MESSAGES
    | INTENT_GUILD_MESSAGE_REACTIONS
    | INTENT_GUILD_MESSAGE_TYPING
    | INTENT_DIRECT_MESSAGES
    | INTENT_DIRECT_MESSAGE_REACTIONS
    | INTENT_MESSAGE_CONTENT
)


class LolkaGateway:
    def __init__(self, token: str, gateway_url: str, api_base_url: str, client_id: str = ""):
        self.token = token
        self.gateway_url = gateway_url
        self.api_base_url = api_base_url
        # application_id для followup-эндпоинтов /webhooks/{app.id}/{interaction.token}
        # (см. "Документация по ботам в Lolka.md", раздел "Исходный ответ (@original)").
        # Читается из LOLKA_CLIENT_ID (main.py:startup) или переопределяется из READY, если он есть в d.application.id.
        self.application_id = client_id or os.getenv("LOLKA_CLIENT_ID", "")
        self.ws = None
        self.sequence = None
        self.session_id = None
        self.connected = False
        self._heartbeat_task = None
        # Голосовой фарм (ТЗ №5 Rev.9, п.11) — occupancy голосовых каналов, строится
        # исключительно из VOICE_STATE_UPDATE (никаких доп. REST-запросов). guild_id ->
        # channel_id -> set(user_id). Обнуляется при каждом новом connect() — после
        # разрыва соединения состояние всё равно устарело.
        self._voice_occupancy: Dict[str, Dict[str, set]] = {}
        self._voice_tick_started = False

    async def run_forever(self):
        """Подключение с автопереподключением при обрыве связи (экспоненциальный backoff)."""
        backoff = 5
        while True:
            try:
                await self.connect()
            except Exception as e:
                print(f"LOLKA GATEWAY: соединение прервано — {e}")
            self.connected = False
            print(f"LOLKA GATEWAY: переподключение через {backoff} сек")
            await asyncio.sleep(backoff)
            backoff = min(backoff * 2, 60)

    async def connect(self):
        async with websockets.connect(self.gateway_url, ping_interval=None) as ws:
            self.ws = ws
            self.connected = True
            self._voice_occupancy = {}  # состояние устарело после разрыва — начинаем заново
            print("LOLKA GATEWAY: соединение установлено")
            if not self._voice_tick_started:
                self._voice_tick_started = True
                asyncio.create_task(self.voice_tick_loop())
            await self.identify()
            await self.listen()

    async def identify(self):
        print(f"LOLKA GATEWAY: отправляю Identify (intents={BOT_INTENTS})")
        await self.ws.send(json.dumps({
            "op": 2,  # Identify
            "d": {
                "token": self.token,
                "intents": BOT_INTENTS,
                "properties": {
                    "os": "linux",
                    "browser": "Nova Bot",
                    "device": "Nova Bot",
                },
            },
        }))

    async def send_heartbeat(self, interval_ms: int):
        try:
            while True:
                await asyncio.sleep(interval_ms / 1000)
                await self.ws.send(json.dumps({"op": 1, "d": self.sequence}))
        except (asyncio.CancelledError, websockets.exceptions.ConnectionClosed):
            return

    async def listen(self):
        try:
            async for message in self.ws:
                data = json.loads(message)
                await self.handle_event(data)
        finally:
            if self._heartbeat_task:
                self._heartbeat_task.cancel()

    async def handle_event(self, event: dict):
        op = event.get("op")
        t = event.get("t")
        d = event.get("d")
        s = event.get("s")
        if s is not None:
            self.sequence = s

        if op == 10:  # Hello — содержит heartbeat_interval
            interval = (d or {}).get("heartbeat_interval", 41250)
            self._heartbeat_task = asyncio.create_task(self.send_heartbeat(interval))
            return

        if op == 0:  # Dispatch
            if t == "READY":
                self.session_id = (d or {}).get("session_id")
                app_id = ((d or {}).get("application") or {}).get("id")
                if app_id:
                    self.application_id = str(app_id)
                print("LOLKA GATEWAY: READY, session_id =", self.session_id)
            elif t == "MESSAGE_CREATE":
                await self.on_message_create(d or {})
            elif t == "GUILD_MEMBER_ADD":
                await self.on_member_join(d or {})
            elif t == "INTERACTION_CREATE":
                await self.on_interaction_create(d or {})
            elif t == "VOICE_STATE_UPDATE":
                self._on_voice_state_update(d or {})

    async def on_message_create(self, data: dict):
        content = (data.get("content") or "").strip()
        channel_id = data.get("channel_id")
        guild_id = data.get("guild_id")
        author = data.get("author", {}) or {}

        # Бот не должен отвечать сам себе
        if author.get("bot"):
            return

        if content and channel_id:
            # server_id может быть None, если гильдия ещё не синхронизирована в дашборде
            # (/dashboard/servers → «Sync Lolka») — в этом случае встроенные /ping и /help
            # всё равно должны отвечать (как и до ТЗ №7), а пользовательские команды и
            # переопределения builtin просто недоступны без конфига (commands_config={}).
            server_id = self._resolve_server_id(guild_id) if guild_id else None
            member = data.get("member") or {}

            # Модерация (Level 1 — локальные правила, Level 2 — AI) — ТЗ №9, этап 4.
            # Раньше была подключена только для VK/MAX; Lolka — основная тестовая платформа,
            # поэтому отсутствие проверки здесь было существенным пробелом.
            if server_id and author.get("id"):
                from models import ModuleConfig, ModerationEvent, AISettings

                db = SessionLocal()
                try:
                    mod_config_row = db.query(ModuleConfig).filter(
                        ModuleConfig.server_id == int(server_id), ModuleConfig.module_name == "moderation"
                    ).first()
                    mod_config = {}
                    if mod_config_row and mod_config_row.config:
                        try:
                            mod_config = json.loads(mod_config_row.config)
                        except Exception:
                            pass

                    result = _moderation_engine.check_message(author["id"], content, mod_config)

                    if not result and _moderation_engine.is_suspicious(content):
                        ai_settings_row = db.query(AISettings).filter(AISettings.server_id == int(server_id)).first()
                        if ai_settings_row and ai_settings_row.moderation_enabled:
                            toxicity = await asyncio.to_thread(
                                ai_engine.check_toxicity, content, ai_settings_row.provider or "yandexgpt"
                            )
                            if toxicity["score"] >= ai_settings_row.moderation_threshold:
                                result = ModerationResult(
                                    "delete",
                                    f"AI-модерация: токсичность {toxicity['score']}% (тематики: {', '.join(toxicity['topics']) or '—'})",
                                    "aiModeration",
                                )

                    if result:
                        await self._delete_message(channel_id, data.get("id", ""))
                        db.add(ModerationEvent(
                            server_id=int(server_id), platform="lolka", type=f"{result.action}_message",
                            title=result.reason, description=f"Правило: {result.rule}",
                            target_user_id=str(author["id"]), target_message_id=str(data.get("id", "")),
                        ))
                        db.commit()
                        return
                except Exception as e:
                    # Модерация не должна иметь возможность уронить обработку всего сообщения —
                    # иначе одно исключение здесь (например, из-за не до конца применённой
                    # миграции колонки или сбоя AI-провайдера) молча обрывает диспетчеризацию
                    # команд ниже для КАЖДОГО сообщения на синхронизированном сервере.
                    print(f"⚠️ LOLKA: ошибка модерации сообщения — {e}")
                finally:
                    db.close()

            if content.startswith("/"):
                print(f"LOLKA GATEWAY DEBUG: получена команда '{content}' guild_id={guild_id} server_id={server_id} channel_id={channel_id}")
            reply = _commands_engine.execute(
                text=content,
                platform="lolka",
                server_id=server_id,
                user_id=author.get("id"),
                commands_config=self._load_commands_config(server_id) if server_id else {},
                channel_id=channel_id,
                member_roles=member.get("roles"),
                on_usage=(lambda name: self._increment_command_usage(server_id, name)) if server_id else None,
            )
            if content.startswith("/"):
                print(f"LOLKA GATEWAY DEBUG: execute() вернул reply={reply!r}")
            if reply:
                await self.send_message(channel_id, reply)

            # Nova Points: ежедневный бонус /daily и магазин ролей /shop (ТЗ №5 Rev.9, п.11-12).
            # Отдельно от commands_engine — эти команды требуют динамического ответа
            # (случайная сумма, кнопки), а не фиксированного текста.
            # "!" — альтернатива "/": Lolka-клиент перехватывает ввод "/" нативной панелью
            # выбора Slash-команд ДО отправки, а /daily,/shop,/link не зарегистрированы через
            # Interactions API (см. commands_engine.build_lolka_slash_commands — туда попадают
            # только builtin/custom из страницы «Команды»), поэтому как текст никогда не
            # доходят без "!" (тот же фикс, что и для /ping,/help — commands_engine.py).
            if server_id and author.get("id"):
                stripped = content.strip()
                lower = stripped.lower()
                if lower in ("/daily", "!daily"):
                    await self._handle_daily(channel_id, server_id, str(author["id"]))
                elif lower in ("/shop", "!shop"):
                    await self._handle_shop(channel_id, server_id)
                elif lower.startswith("/link") or lower.startswith("!link"):
                    await self._handle_link(channel_id, server_id, str(author["id"]), stripped)
                elif lower in ("/ai", "!ai") or lower.startswith("/ai ") or lower.startswith("!ai "):
                    display_name = author.get("global_name") or author.get("username") or str(author["id"])
                    await self._handle_ai(channel_id, server_id, str(author["id"]), display_name, stripped, str(guild_id))

        # Начисление XP за сообщение + level-up уведомление (по аналогии с VK, см. main.py)
        user_id = author.get("id")
        if guild_id and user_id:
            username = author.get("global_name") or author.get("username") or str(user_id)
            await self._award_xp_and_notify(str(guild_id), str(user_id), username, content, channel_id)

            # Пассивный фарм NP за сообщение (write-behind, ТЗ №5 Rev.9, п.11+15).
            server_id_for_farm = self._resolve_server_id(str(guild_id))
            if server_id_for_farm and content:
                db = SessionLocal()
                try:
                    settings = np_farm_cache.get_farm_settings(db, server_id_for_farm, "lolka")
                finally:
                    db.close()
                if settings and settings.np_enabled and settings.np_farm_enabled:
                    np_farm_cache.register_message(
                        server_id_for_farm, "lolka", str(user_id),
                        settings.np_farm_min, settings.np_farm_max,
                    )

    async def _generate_ai_reply_text(self, server_id: str, channel_id: str, user_id: str,
                                       user_name: str, question: str, guild_id: str) -> str:
        """Общая логика для /ai (текстовая команда и настоящая Slash-команда) — резолвит
        AISettings и вызывает generate_ai_reply. Вынесена отдельно, т.к. Slash-путь отвечает
        через _followup_edit_original, а текстовый — через send_message (разные способы
        доставки ответа, но одинаковая генерация)."""
        from models import AISettings

        db = SessionLocal()
        try:
            ai_settings_row = db.query(AISettings).filter(AISettings.server_id == int(server_id)).first()
            if not ai_settings_row:
                return "AI не настроен для этого сервера — откройте /dashboard/ai"
            reply = await asyncio.to_thread(
                ai_engine.generate_ai_reply, db, server_id, channel_id, user_id,
                user_name, "", question, ai_settings_row, "lolka", guild_id,
            )
            return reply or "AI сейчас недоступен (дневной лимит исчерпан или все провайдеры недоступны)"
        finally:
            db.close()

    async def _handle_ai(self, channel_id: str, server_id: str, user_id: str, user_name: str, raw_text: str, guild_id: str) -> None:
        question = raw_text[3:].strip()
        if not question:
            await self.send_message(channel_id, "Использование: /ai <вопрос> (или !ai <вопрос>)")
            return
        text = await self._generate_ai_reply_text(server_id, channel_id, user_id, user_name, question, guild_id)
        await self.send_message(channel_id, text)

    async def _handle_link(self, channel_id: str, server_id: str, user_id: str, raw_text: str) -> None:
        parts = raw_text.split(maxsplit=1)
        db = SessionLocal()
        try:
            if len(parts) == 1:
                result = generate_link_code(db, server_id, "lolka", user_id)
                if result.get("status") == "ok":
                    text = (
                        f"🔗 Код для связки аккаунтов: {result['code']}\n"
                        f"Введите «/link {result['code']}» в VK-сообществе в течение 10 минут, "
                        f"чтобы Nova Points и роли работали на обеих платформах через один баланс."
                    )
                else:
                    text = result.get("error", "Не удалось создать код")
            else:
                result = confirm_link_code(db, server_id, "lolka", user_id, parts[1])
                text = "✅ Аккаунты VK и Lolka связаны!" if result.get("status") == "ok" \
                    else result.get("error", "Не удалось связать аккаунты")
        finally:
            db.close()
        await self.send_message(channel_id, text)

    async def _handle_daily(self, channel_id: str, server_id: str, user_id: str) -> None:
        db = SessionLocal()
        try:
            result = claim_daily(db, server_id, "lolka", user_id)
        finally:
            db.close()
        text = result.get("message") or result.get("error", "Не удалось получить бонус")
        await self.send_message(channel_id, text)

    async def _handle_shop(self, channel_id: str, server_id: str) -> None:
        db = SessionLocal()
        try:
            items = list_shop_items(db, server_id, "lolka")
            currency_name = get_currency_label(db, server_id, "lolka")["name"]
        finally:
            db.close()
        if not items:
            await self.send_message(channel_id, "🛒 Магазин пуст — администратор ещё не добавил роли на продажу")
            return
        components = [{
            "type": 1,
            "components": [{
                "type": 2, "style": 1,
                "label": f"{(it.role_name or it.role_id)} — {it.price} {currency_name}"[:80],
                "custom_id": f"shop_buy:{it.id}",
            }],
        } for it in items]
        await self.send_message(channel_id, "🛒 Магазин ролей — выберите товар:", components=components)

    async def _award_xp_and_notify(
        self,
        guild_id: str,
        user_id: str,
        username: str,
        content: str,
        channel_id: Optional[str],
    ) -> None:
        """
        Начисляет XP за сообщение Lolka и, если участник повысил уровень,
        реально отправляет уведомление в канал (settings.notify_channel,
        либо тот же channel_id, если канал уведомлений не задан).
        Аналог _award_xp_and_notify_vk из backend/main.py.
        """
        server_id = self._resolve_server_id(guild_id)
        if not server_id:
            return

        result = await award_xp_for_message(
            server_id=server_id,
            platform="lolka",
            user_id=user_id,
            username=username,
            message_text=content,
            channel_id=str(channel_id) if channel_id else None,
        )
        if not result or not result.get("leveled_up"):
            return

        try:
            notify_channel = result.get("notify_channel")
            target_channel_id = notify_channel or channel_id
            if not target_channel_id:
                return

            mention = f"<@{user_id}>" if result.get("ping_user") else username

            structured = None
            if result.get("notify_template"):
                try:
                    structured = json.loads(result["notify_template"])
                except (json.JSONDecodeError, TypeError):
                    structured = None

            if structured and (structured.get("embed_enabled") or structured.get("buttons") or structured.get("select_menus")):
                rendered = render_message_template(
                    structured,
                    platform="lolka",
                    user=mention,
                    level=result["new_level"],
                    guild=result.get("guild", ""),
                    xp=result.get("xp"),
                    next_level_xp=result.get("next_level_xp"),
                    rank=result.get("rank"),
                    target_user_id=str(user_id),
                )
                await self.send_message(
                    target_channel_id, rendered["content"],
                    embeds=rendered.get("embeds"), components=rendered.get("components"),
                )
            else:
                template = result.get("notify_message") or "🎉 {user} достиг {level} уровня!"
                text_to_send = render_notify_template(
                    template,
                    user=mention,
                    level=result["new_level"],
                    guild=result.get("guild", ""),
                    xp=result.get("xp"),
                    next_level_xp=result.get("next_level_xp"),
                    rank=result.get("rank"),
                )
                await self.send_message(target_channel_id, text_to_send)
        except Exception as e:
            print(f"LOLKA GATEWAY: ошибка level-up уведомления — {e}")

    async def _award_voice_xp_and_notify(
        self,
        guild_id: str,
        user_id: str,
        username: str,
        channel_id: Optional[str],
    ) -> None:
        """
        Голосовой аналог _award_xp_and_notify — начисляет XP за минуту в голосовом канале
        (award_xp_for_voice_minutes) и, при level-up, отправляет то же уведомление, что и
        для текстовых сообщений. Логика уведомления намеренно продублирована (а не вынесена
        в общий метод), чтобы не трогать уже рабочий _award_xp_and_notify.
        """
        server_id = self._resolve_server_id(guild_id)
        if not server_id:
            return

        result = await award_xp_for_voice_minutes(
            server_id=server_id, platform="lolka", user_id=user_id, username=username, minutes=1,
        )
        if not result or not result.get("leveled_up"):
            return

        try:
            notify_channel = result.get("notify_channel")
            target_channel_id = notify_channel or channel_id
            if not target_channel_id:
                return

            mention = f"<@{user_id}>" if result.get("ping_user") else username

            structured = None
            if result.get("notify_template"):
                try:
                    structured = json.loads(result["notify_template"])
                except (json.JSONDecodeError, TypeError):
                    structured = None

            if structured and (structured.get("embed_enabled") or structured.get("buttons") or structured.get("select_menus")):
                rendered = render_message_template(
                    structured,
                    platform="lolka",
                    user=mention,
                    level=result["new_level"],
                    guild=result.get("guild", ""),
                    xp=result.get("xp"),
                    next_level_xp=result.get("next_level_xp"),
                    rank=result.get("rank"),
                    target_user_id=str(user_id),
                )
                await self.send_message(
                    target_channel_id, rendered["content"],
                    embeds=rendered.get("embeds"), components=rendered.get("components"),
                )
            else:
                template = result.get("notify_message") or "🎉 {user} достиг {level} уровня!"
                text_to_send = render_notify_template(
                    template,
                    user=mention,
                    level=result["new_level"],
                    guild=result.get("guild", ""),
                    xp=result.get("xp"),
                    next_level_xp=result.get("next_level_xp"),
                    rank=result.get("rank"),
                )
                await self.send_message(target_channel_id, text_to_send)
        except Exception as e:
            print(f"LOLKA GATEWAY: ошибка level-up уведомления (голос) — {e}")

    @staticmethod
    def _resolve_server_id(guild_id: str) -> Optional[str]:
        """Сопоставляет Lolka guild_id с внутренним Server.id (используется как server_id в RankingSettings)."""
        from database import SessionLocal
        from models import Server

        db = SessionLocal()
        try:
            server = db.query(Server).filter(
                Server.server_id == guild_id,
                Server.platform == "lolka",
            ).first()
            return str(server.id) if server else None
        finally:
            db.close()

    @staticmethod
    def _load_commands_config(server_id: str) -> dict:
        """Читает конфиг модуля 'commands' (страница «Команды») для сервера."""
        from database import SessionLocal
        from models import ModuleConfig

        db = SessionLocal()
        try:
            row = db.query(ModuleConfig).filter(
                ModuleConfig.server_id == int(server_id),
                ModuleConfig.module_name == "commands",
            ).first()
            if not row or not row.config:
                return {}
            try:
                return json.loads(row.config)
            except (json.JSONDecodeError, TypeError):
                return {}
        finally:
            db.close()

    @staticmethod
    def _increment_command_usage(server_id: str, name: str) -> None:
        """
        Логирование использования команды (ТЗ №7, критерий 9.3) — без новой таблицы
        (см. обоснование отказа от BotCommand/CommandUsage в «Выполненные действия»):
        счётчик usageCount хранится в том же JSON ModuleConfig 'commands', что и остальные
        настройки страницы. Read-modify-write без блокировок — при редких одновременных
        вызовах одной команды возможна погрешность в 1 (некритично для счётчика в UI).
        """
        from database import SessionLocal
        from models import ModuleConfig

        db = SessionLocal()
        try:
            row = db.query(ModuleConfig).filter(
                ModuleConfig.server_id == int(server_id),
                ModuleConfig.module_name == "commands",
            ).first()
            try:
                config = json.loads(row.config) if row and row.config else {}
            except (json.JSONDecodeError, TypeError):
                config = {}
            builtin = config.get("builtin") or []
            custom = config.get("custom") or []

            found = False
            for entry in builtin:
                if entry.get("name") == name:
                    entry["usageCount"] = int(entry.get("usageCount") or 0) + 1
                    found = True
                    break
            if not found:
                for entry in custom:
                    if entry.get("name") == name:
                        entry["usageCount"] = int(entry.get("usageCount") or 0) + 1
                        found = True
                        break
            if not found:
                # Встроенная команда без override — создаём запись только со счётчиком
                builtin.append({"name": name, "usageCount": 1})

            config["builtin"] = builtin
            config["custom"] = custom
            if row:
                row.config = json.dumps(config)
            else:
                row = ModuleConfig(server_id=int(server_id), module_name="commands", is_enabled=True, config=json.dumps(config))
                db.add(row)
            db.commit()
        except Exception as e:
            print(f"⚠️ LOLKA: не удалось залогировать использование команды '{name}': {e}")
            db.rollback()
        finally:
            db.close()

    async def on_member_join(self, data: dict):
        username = (data.get("user") or {}).get("username", "участник")
        print(f"LOLKA GATEWAY: новый участник — {username}")
        # Место для приветственных сообщений/автовыдачи роли — по аналогии с on_message_create

    def _on_voice_state_update(self, data: dict) -> None:
        """
        Обновляет in-memory occupancy голосовых каналов (ТЗ №5 Rev.9, п.11 — голосовой
        фарм). channel_id отсутствует/None, если участник вышел из голосового канала.
        Один VOICE_STATE_UPDATE описывает ПОЛНОЕ текущее состояние участника, поэтому
        сначала убираем его из всех каналов гильдии, затем (если он всё ещё в голосе)
        добавляем в актуальный канал — так же корректно обрабатывается и переход между
        каналами одним и тем же событием.
        """
        guild_id = data.get("guild_id")
        if not guild_id:
            return
        user_id = data.get("user_id") or ((data.get("member") or {}).get("user") or {}).get("id")
        if not user_id:
            return
        channel_id = data.get("channel_id")

        guild_channels = self._voice_occupancy.setdefault(str(guild_id), {})
        for members in guild_channels.values():
            members.discard(str(user_id))

        if channel_id:
            guild_channels.setdefault(str(channel_id), set()).add(str(user_id))

    async def voice_tick_loop(self) -> None:
        """
        Раз в минуту начисляет XP (settings.xp_per_voice_minute) и NP
        (settings.np_voice_per_hour, через np_farm_cache — write-behind) всем участникам
        голосовых каналов, где сейчас ≥2 активных участника (анти-фарм условие из ТЗ —
        см. тултип "Опыт за голосовую минуту"). Работает только для Lolka: у VK нет
        голосовых каналов/событий вообще.
        """
        while True:
            await asyncio.sleep(60)
            try:
                # Копия под локом не нужна — _voice_occupancy обновляется только из
                # синхронного _on_voice_state_update в том же event loop (нет гонок).
                for guild_id, channels in list(self._voice_occupancy.items()):
                    server_id = self._resolve_server_id(guild_id)
                    if not server_id:
                        continue
                    db = SessionLocal()
                    try:
                        settings = np_farm_cache.get_farm_settings(db, server_id, "lolka")
                    finally:
                        db.close()
                    if not settings:
                        continue

                    for channel_id, members in channels.items():
                        if len(members) < 2:
                            continue
                        for user_id in list(members):
                            if settings.xp_per_voice_minute:
                                await self._award_voice_xp_and_notify(guild_id, user_id, f"id{user_id}", channel_id)
                            if settings.np_enabled and settings.np_voice_enabled:
                                np_farm_cache.register_voice_minute(server_id, "lolka", user_id, settings.np_voice_per_hour)
            except Exception as e:
                print(f"LOLKA GATEWAY: ошибка voice_tick_loop — {e}")

    async def on_interaction_create(self, data: dict):
        """
        type: 2 = APPLICATION_COMMAND (настоящий Slash-вызов, зарегистрированный через
              sync_lolka_guild_commands в main.py) — см. _on_slash_command.
        type: 3 = MESSAGE_COMPONENT — клик по кнопке (редактор шаблонов, вкладка
              «Компоненты»): Профиль/Топ/Закрыть/Дать Nova Point. Для select-меню
              (component_type == 3) действие берётся из выбранного значения опции
              (values[0]), а не из custom_id самого селекта.
        Ответить нужно в течение 3 секунд (см. Документация по ботам в Lolka.md).
        """
        interaction_type = data.get("type")
        if interaction_type == 2:
            await self._on_slash_command(data)
            return
        if interaction_type != 3:
            return

        interaction_id = data.get("id")
        interaction_token = data.get("token")
        if not interaction_id or not interaction_token:
            return

        custom_id = ((data.get("data") or {}).get("custom_id")) or ""
        component_type = (data.get("data") or {}).get("component_type")
        if component_type == 3:
            # Select Menu (выпадающий список, ТЗ №5 Rev.9, Этап 2.1): значение выбранной
            # опции — то же действие, что и у кнопок (см. BUTTON_ACTIONS во frontend), а не
            # сам custom_id селекта. Обрабатываем как effective_id вместо custom_id кнопки.
            values = (data.get("data") or {}).get("values") or []
            effective_id = values[0] if values else ""
        else:
            effective_id = custom_id
        guild_id = data.get("guild_id")
        member = data.get("member") or {}
        user = member.get("user") or data.get("user") or {}
        user_id = user.get("id")

        server_id = self._resolve_server_id(str(guild_id)) if guild_id else None

        # Действия, требующие обращения к БД (Профиль/Топ/NP/Магазин), сначала отвечают
        # DEFERRED (type 5 — «бот думает…»), чтобы гарантированно уложиться в 3-секундный
        # бюджет интеракции, а реальный текст досылается через PATCH @original (см.
        # "Документация по ботам в Lolka.md", раздел "Исходный ответ (@original)"; ТЗ №5
        # Rev.9, риск "Таймауты интеракций Lolka"). ACTION_CLOSE — мгновенное действие
        # без содержимого, defer ему не нужен.
        try:
            if effective_id == ACTION_PROFILE and server_id and user_id:
                await self._interaction_callback(interaction_id, interaction_token, 5, {"flags": 64})
                text = get_profile_summary(server_id, "lolka", str(user_id))
                await self._followup_edit_original(interaction_token, {"content": text})

            elif effective_id == ACTION_LEADERBOARD and server_id:
                await self._interaction_callback(interaction_id, interaction_token, 5, {})
                text = get_leaderboard_text(server_id, "lolka")
                await self._followup_edit_original(interaction_token, {"content": text})

            elif effective_id == ACTION_CLOSE:
                await self._interaction_callback(interaction_id, interaction_token, 6, {})  # тихий ack
                message = data.get("message") or {}
                channel_id = data.get("channel_id") or message.get("channel_id")
                message_id = message.get("id")
                if channel_id and message_id:
                    await self._delete_message(channel_id, message_id)

            elif effective_id.startswith(f"{ACTION_NP_GIVE}:") and server_id and user_id:
                await self._interaction_callback(interaction_id, interaction_token, 5, {"flags": 64})
                receiver_id = effective_id.split(":", 1)[1]
                db = SessionLocal()
                try:
                    np_result = give_nova_point(db, server_id, "lolka", str(user_id), receiver_id)
                finally:
                    db.close()
                text = np_result.get("message") or np_result.get("error", "Не удалось выдать Nova Point")
                await self._followup_edit_original(interaction_token, {"content": text})

            elif effective_id.startswith("shop_buy:") and server_id and user_id:
                await self._interaction_callback(interaction_id, interaction_token, 5, {"flags": 64})
                item_id_raw = effective_id.split(":", 1)[1]
                try:
                    item_id = int(item_id_raw)
                except ValueError:
                    item_id = None
                if item_id is None:
                    await self._followup_edit_original(interaction_token, {"content": "Не удалось определить товар"})
                else:
                    db = SessionLocal()
                    try:
                        buy_result = buy_shop_item(db, server_id, "lolka", str(user_id), item_id)
                    finally:
                        db.close()
                    if buy_result.get("status") == "ok":
                        await self._grant_role(guild_id, buy_result["target_user_id"], buy_result["role_id"])
                        text = buy_result.get("message")
                    else:
                        text = buy_result.get("error", "Не удалось купить товар")
                    await self._followup_edit_original(interaction_token, {"content": text})

            else:
                await self._interaction_callback(interaction_id, interaction_token, 6, {})
        except Exception as e:
            print(f"LOLKA GATEWAY: ошибка обработки интеракции — {e}")

    async def _on_slash_command(self, data: dict) -> None:
        """
        Настоящий Slash-вызов (зарегистрирован через sync_lolka_guild_commands, main.py).
        Собираем синтетический текст "/name" и прогоняем через тот же
        commands_engine.execute(), что и обычные текстовые команды (on_message_create) —
        доступ по ролям/каналам, кулдаун, логирование usageCount не дублируются.
        Отвечаем DEFERRED (type 5), затем реальный текст — через PATCH @original, т.к.
        БД-запросы могут не уложиться в 3-секундный бюджет интеракции.
        """
        interaction_id = data.get("id")
        interaction_token = data.get("token")
        if not interaction_id or not interaction_token:
            return

        name = ((data.get("data") or {}).get("name")) or ""
        guild_id = data.get("guild_id")
        channel_id = data.get("channel_id")
        member = data.get("member") or {}
        user = member.get("user") or data.get("user") or {}
        user_id = user.get("id")

        try:
            await self._interaction_callback(interaction_id, interaction_token, 5, {})

            server_id = self._resolve_server_id(str(guild_id)) if guild_id else None

            # /ai не проходит через commands_engine.execute() (executable:false в каталоге,
            # см. frontend/src/lib/commands-catalog.ts) — как и в on_message_create, ответ
            # генерируется через generate_ai_reply. В отличие от текстового пути, вопрос
            # приходит не строкой после команды, а параметром Slash-команды (options[].value,
            # см. BUILTIN_COMMAND_OPTIONS в commands_engine.py).
            if name == "ai":
                options = (data.get("data") or {}).get("options") or []
                question = next((str(o.get("value", "")).strip() for o in options if o.get("name") == "question"), "")
                if not question:
                    await self._followup_edit_original(interaction_token, {"content": "Использование: /ai question:<вопрос>"})
                    return
                if not server_id:
                    await self._followup_edit_original(interaction_token, {"content": "AI не настроен для этого сервера — откройте /dashboard/ai"})
                    return
                display_name = user.get("global_name") or user.get("username") or str(user_id)
                text = await self._generate_ai_reply_text(server_id, channel_id, str(user_id), display_name, question, str(guild_id))
                await self._followup_edit_original(interaction_token, {"content": text})
                return

            reply = _commands_engine.execute(
                text=f"/{name}",
                platform="lolka",
                server_id=server_id,
                user_id=user_id,
                commands_config=self._load_commands_config(server_id) if server_id else {},
                channel_id=channel_id,
                member_roles=member.get("roles"),
                on_usage=(lambda cmd_name: self._increment_command_usage(server_id, cmd_name)) if server_id else None,
            )
            text = reply or "⚠️ Команда сейчас недоступна (отключена, ограничен доступ или кулдаун)"
            await self._followup_edit_original(interaction_token, {"content": text})
        except Exception as e:
            print(f"LOLKA GATEWAY: ошибка обработки Slash-команды '{name}' — {e}")

    async def _followup_edit_original(self, interaction_token: str, data: dict):
        """
        PATCH /webhooks/{app.id}/{interaction.token}/messages/@original — второй этап
        ответа после DEFERRED (type 5): подставляет реальный контент вместо «бот думает…».
        Авторизация — тем же interaction_token в URL, заголовок Authorization не нужен.
        """
        import requests
        if not self.application_id:
            print("LOLKA GATEWAY: не задан application_id (LOLKA_CLIENT_ID) — followup @original невозможен")
            return
        try:
            await asyncio.to_thread(
                requests.patch,
                f"{self.api_base_url}/webhooks/{self.application_id}/{interaction_token}/messages/@original",
                headers={"Content-Type": "application/json"},
                json=data,
                timeout=10,
            )
        except Exception as e:
            print(f"LOLKA GATEWAY: ошибка followup @original — {e}")

    async def _grant_role(self, guild_id: Optional[str], user_id: str, role_id: str) -> None:
        """PUT /guilds/{guild}/members/{user}/roles/{role} — выдача купленной в /shop роли (ТЗ №5 Rev.9, п.12)."""
        if not guild_id:
            return
        import requests
        try:
            await asyncio.to_thread(
                requests.put,
                f"{self.api_base_url}/guilds/{guild_id}/members/{user_id}/roles/{role_id}",
                headers={"Authorization": f"Bot {self.token}"},
                timeout=10,
            )
        except Exception as e:
            print(f"LOLKA GATEWAY: ошибка выдачи роли {role_id} участнику {user_id} — {e}")

    async def _interaction_callback(self, interaction_id: str, interaction_token: str, cb_type: int, data: dict):
        """POST /interactions/{id}/{token}/callback — авторизация самим interaction_token в URL."""
        import requests
        payload: dict = {"type": cb_type}
        if data:
            payload["data"] = data
        try:
            await asyncio.to_thread(
                requests.post,
                f"{self.api_base_url}/interactions/{interaction_id}/{interaction_token}/callback",
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=10,
            )
        except Exception as e:
            print(f"LOLKA GATEWAY: ошибка callback интеракции — {e}")

    async def _delete_message(self, channel_id: str, message_id: str):
        """DELETE /channels/{channel_id}/messages/{message_id} — обычным bot-токеном,
        не через interaction (сообщение с кнопками отправлено проактивно ботом,
        а не как ответ на интеракцию)."""
        import requests
        try:
            await asyncio.to_thread(
                requests.delete,
                f"{self.api_base_url}/channels/{channel_id}/messages/{message_id}",
                headers={"Authorization": f"Bot {self.token}"},
                timeout=10,
            )
        except Exception as e:
            print(f"LOLKA GATEWAY: ошибка удаления сообщения — {e}")

    async def send_message(self, channel_id: str, content: str, embeds: Optional[list] = None, components: Optional[list] = None):
        """Отправка через REST (не через Gateway) — так же, как в Discord-совместимом API.
        embeds/components — Discord-формат из render_message_template (ТЗ №5 Rev.6, п.3.2)."""
        import requests
        payload: dict = {"content": content}
        if embeds:
            payload["embeds"] = embeds
        if components:
            payload["components"] = components
        try:
            resp = await asyncio.to_thread(
                requests.post,
                f"{self.api_base_url}/channels/{channel_id}/messages",
                headers={"Authorization": f"Bot {self.token}", "Content-Type": "application/json"},
                json=payload,
                timeout=10,
            )
            print(f"LOLKA GATEWAY DEBUG: send_message → HTTP {resp.status_code}")
        except Exception as e:
            print(f"LOLKA GATEWAY: ошибка отправки сообщения — {e}")
