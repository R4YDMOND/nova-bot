"""
Gateway-клиент для собственного бота Nova в Lolka.
Протокол Discord-совместимый: op 0 = Dispatch, op 2 = Identify, op 1/11 = Heartbeat/Ack.
"""
import asyncio
import json
import random
from typing import Optional
import websockets

from ranking.xp_handler import award_xp_for_message
from ranking.template import render_notify_template, render_message_template

# Простейший набор команд бота — независим от backend/main.py,
# чтобы не создавать циклический импорт (main.py импортирует этот модуль).
COMMAND_RESPONSES = {
    "/ping": "🏓 Понг!",
    "/help": (
        "**🤖 Команды Нова:**\n"
        "📊 `/stats` — статистика сервера\n"
        "🎵 `/play` — включить музыку\n"
        "🛡️ `/mod` — модерация\n"
        "❓ `/help` — список команд"
    ),
}


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
    def __init__(self, token: str, gateway_url: str, api_base_url: str):
        self.token = token
        self.gateway_url = gateway_url
        self.api_base_url = api_base_url
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
                print("LOLKA GATEWAY: READY, session_id =", self.session_id)
            elif t == "MESSAGE_CREATE":
                await self.on_message_create(d or {})
            elif t == "GUILD_MEMBER_ADD":
                await self.on_member_join(d or {})

    async def on_message_create(self, data: dict):
        content = (data.get("content") or "").strip()
        channel_id = data.get("channel_id")
        guild_id = data.get("guild_id")
        author = data.get("author", {}) or {}

        # Бот не должен отвечать сам себе
        if author.get("bot"):
            return

        command = content.split(" ")[0].lower()
        reply = COMMAND_RESPONSES.get(command)
        if reply and channel_id:
            await self.send_message(channel_id, reply)

        # Начисление XP за сообщение + level-up уведомление (по аналогии с VK, см. main.py)
        user_id = author.get("id")
        if guild_id and user_id:
            username = author.get("global_name") or author.get("username") or str(user_id)
            await self._award_xp_and_notify(str(guild_id), str(user_id), username, content, channel_id)

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

    async def on_member_join(self, data: dict):
        username = (data.get("user") or {}).get("username", "участник")
        print(f"LOLKA GATEWAY: новый участник — {username}")
        # Место для приветственных сообщений/автовыдачи роли — по аналогии с on_message_create

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
            requests.post(
                f"{self.api_base_url}/channels/{channel_id}/messages",
                headers={"Authorization": f"Bot {self.token}", "Content-Type": "application/json"},
                json=payload,
                timeout=10,
            )
        except Exception as e:
            print(f"LOLKA GATEWAY: ошибка отправки сообщения — {e}")
