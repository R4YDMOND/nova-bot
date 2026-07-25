"""
Gateway-клиент для собственного бота Nova в Lolka.
Протокол Discord-совместимый: op 0 = Dispatch, op 2 = Identify, op 1/11 = Heartbeat/Ack.
"""
import asyncio
import json
import os
import random
from typing import Optional
import websockets

from ranking.xp_handler import award_xp_for_message
from ranking.template import render_notify_template, render_message_template
from ranking.actions import ACTION_PROFILE, ACTION_LEADERBOARD, ACTION_CLOSE, ACTION_NP_GIVE, get_profile_summary, get_leaderboard_text
from ranking.nova_points import give_nova_point, claim_daily, list_shop_items, buy_shop_item, get_currency_label
from ranking.account_link import generate_link_code, confirm_link_code
from ranking import np_farm_cache
from database import SessionLocal
from commands_engine import get_commands_engine

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
            print("LOLKA GATEWAY: соединение установлено")
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
            if reply:
                await self.send_message(channel_id, reply)

            # Nova Points: ежедневный бонус /daily и магазин ролей /shop (ТЗ №5 Rev.9, п.11-12).
            # Отдельно от commands_engine — эти команды требуют динамического ответа
            # (случайная сумма, кнопки), а не фиксированного текста.
            if server_id and author.get("id"):
                lower = content.strip().lower()
                if lower == "/daily":
                    await self._handle_daily(channel_id, server_id, str(author["id"]))
                elif lower == "/shop":
                    await self._handle_shop(channel_id, server_id)
                elif lower == "/link" or lower.startswith("/link "):
                    await self._handle_link(channel_id, server_id, str(author["id"]), content.strip())

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

    async def on_interaction_create(self, data: dict):
        """
        Обрабатывает клик по кнопке (type: 3 = MESSAGE_COMPONENT) — предустановленные
        действия редактора шаблонов (вкладка «Компоненты»): Профиль/Топ/Закрыть/Дать Nova
        Point. Для select-меню (component_type == 3) действие берётся из выбранного
        значения опции (values[0]), а не из custom_id самого селекта.
        Ответить нужно в течение 3 секунд (см. Документация по ботам в Lolka.md).
        """
        if data.get("type") != 3:
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
            await asyncio.to_thread(
                requests.post,
                f"{self.api_base_url}/channels/{channel_id}/messages",
                headers={"Authorization": f"Bot {self.token}", "Content-Type": "application/json"},
                json=payload,
                timeout=10,
            )
        except Exception as e:
            print(f"LOLKA GATEWAY: ошибка отправки сообщения — {e}")
