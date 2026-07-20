"""
VK Bot API Service — ТЗ №5
Реальная интеграция с VK Bot API с rate limiting (20 req/sec).

Методы:
  - delete_message      → messages.delete
  - ban_user            → groups.banUser
  - send_message        → messages.send
  - get_members         → groups.getMembers
  - get_conversations   → messages.getConversations
  - get_by_id           → groups.getById

Rate limit: 20 запросов в секунду на один токен (VK ограничение).
"""

import time
import threading
import requests
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

VK_API_VERSION = "5.199"
VK_API_BASE = "https://api.vk.com/method"

# Rate limiting: 20 req/sec = 1 запрос каждые 50 мс
_MIN_INTERVAL = 0.055  # 55 мс запас на сетевую задержку


class VKAPIError(Exception):
    """Ошибка от VK API с кодом и описанием."""
    def __init__(self, code: int, message: str):
        self.code = code
        self.message = message
        super().__init__(f"VK API error {code}: {message}")


class VKRateLimitError(VKAPIError):
    """Превышен rate limit (код 6 или 9)."""
    pass


class VKBotService:
    """
    Сервис для работы с VK Bot API.
    Thread-safe rate limiting через блокировку на уровне экземпляра.
    """

    def __init__(self, access_token: str):
        self.access_token = access_token
        self._last_request_time = 0.0
        self._lock = threading.Lock()

    # ── Rate limiting core ────────────────────────────────────────────────

    def _wait_for_rate_limit(self):
        """Ждёт, пока не пройдёт минимальный интервал между запросами."""
        with self._lock:
            now = time.time()
            elapsed = now - self._last_request_time
            if elapsed < _MIN_INTERVAL:
                time.sleep(_MIN_INTERVAL - elapsed)
            self._last_request_time = time.time()

    def _call(self, method: str, params: Dict[str, Any], max_retries: int = 3) -> Dict[str, Any]:
        """
        Вызов метода VK API с rate limiting и retry при ошибках 6/9.
        """
        for attempt in range(max_retries):
            self._wait_for_rate_limit()

            try:
                resp = requests.get(
                    f"{VK_API_BASE}/{method}",
                    params={
                        **params,
                        "access_token": self.access_token,
                        "v": VK_API_VERSION,
                    },
                    timeout=15,
                )
                data = resp.json()
            except requests.Timeout:
                if attempt == max_retries - 1:
                    raise VKAPIError(-1, "VK API: превышено время ожидания")
                time.sleep(0.5 * (attempt + 1))
                continue
            except requests.RequestException as e:
                if attempt == max_retries - 1:
                    raise VKAPIError(-1, f"VK API: сетевая ошибка — {e}")
                time.sleep(0.5 * (attempt + 1))
                continue

            if "error" in data:
                error = data["error"]
                code = error.get("error_code", -1)
                msg = error.get("error_msg", "Unknown VK error")

                if code in (6, 9):  # Too many requests / Flood control
                    wait = 0.5 * (attempt + 1)
                    time.sleep(wait)
                    continue

                raise VKAPIError(code, msg)

            return data.get("response", {})

        raise VKRateLimitError(6, "VK API: превышен лимит запросов после ретраев")

    # ── Public API methods ────────────────────────────────────────────────

    def get_group_info(self, group_id: str) -> Dict[str, Any]:
        """Получить информацию о сообществе."""
        resp = self._call("groups.getById", {
            "group_ids": group_id,
            "fields": "photo_200,members_count,description",
        })
        items = resp if isinstance(resp, list) else resp.get("groups", [])
        return items[0] if items else {}

    def get_members(self, group_id: str, count: int = 1000, offset: int = 0) -> List[Dict[str, Any]]:
        """Получить участников сообщества."""
        resp = self._call("groups.getMembers", {
            "group_id": group_id,
            "count": min(count, 1000),
            "offset": offset,
            "fields": "first_name,last_name,photo_100,last_seen",
        })
        return resp.get("items", [])

    def get_users(self, user_ids: List[str], fields: str = "photo_100,online,screen_name") -> List[Dict[str, Any]]:
        """
        Получить данные пользователей по ID (users.get).
        Разбивает на чанки по 1000 ID (лимит VK API).
        """
        if not user_ids:
            return []

        all_users: List[Dict[str, Any]] = []
        for i in range(0, len(user_ids), 1000):
            chunk = user_ids[i:i + 1000]
            resp = self._call("users.get", {
                "user_ids": ",".join(chunk),
                "fields": fields,
            })
            all_users.extend(resp if isinstance(resp, list) else [])

        return all_users

    def get_conversations(self, count: int = 200, offset: int = 0) -> List[Dict[str, Any]]:
        """Получить список бесед (peer_id)."""
        resp = self._call("messages.getConversations", {
            "count": min(count, 200),
            "offset": offset,
            "extended": 1,
        })
        return resp.get("items", [])

    def send_message(
        self,
        peer_id: int,
        message: str,
        keyboard: Optional[str] = None,
        attachment: Optional[str] = None,
        reply_to: Optional[int] = None,
    ) -> int:
        """
        Отправить сообщение.
        Возвращает message_id.
        """
        params: Dict[str, Any] = {
            "peer_id": peer_id,
            "message": message,
            "random_id": int(time.time() * 1000),  # уникальный ID для дедупликации
        }
        if keyboard:
            params["keyboard"] = keyboard
        if attachment:
            params["attachment"] = attachment
        if reply_to:
            params["reply_to"] = reply_to

        resp = self._call("messages.send", params)
        return resp  # VK возвращает message_id как int

    def delete_message(self, message_id: int, delete_for_all: bool = True) -> int:
        """
        Удалить сообщение.
        Требует права messages (для токена сообщества).
        """
        params = {
            "message_ids": message_id,
            "delete_for_all": 1 if delete_for_all else 0,
        }
        resp = self._call("messages.delete", params)
        return resp  # 1 — успех

    def ban_user(
        self,
        group_id: str,
        user_id: int,
        end_date: Optional[int] = None,
        reason: Optional[int] = None,
        comment: Optional[str] = None,
    ) -> int:
        """
        Забанить пользователя в сообществе.

        reason: 0=другое, 1=спам, 2=оскорбление, 3=провокация,
                4=троллинг, 5=флуд, 6=нарушение правил
        end_date: unix timestamp, когда бан истекает (None = навсегда)
        """
        params: Dict[str, Any] = {
            "group_id": group_id,
            "user_id": user_id,
        }
        if end_date:
            params["end_date"] = end_date
        if reason is not None:
            params["reason"] = reason
        if comment:
            params["comment"] = comment
            params["comment_visible"] = 0  # комментарий виден только админам

        resp = self._call("groups.banUser", params)
        return resp  # 1 — успех

    def unban_user(self, group_id: str, user_id: int) -> int:
        """Разбанить пользователя."""
        resp = self._call("groups.unbanUser", {
            "group_id": group_id,
            "user_id": user_id,
        })
        return resp  # 1 — успех

    def remove_chat_user(self, chat_id: int, user_id: int) -> int:
        """Исключить пользователя из беседы."""
        resp = self._call("messages.removeChatUser", {
            "chat_id": chat_id,
            "user_id": user_id,
        })
        return resp  # 1 — успех

    def get_message_by_id(self, message_id: int) -> Dict[str, Any]:
        """Получить сообщение по ID."""
        resp = self._call("messages.getById", {
            "message_ids": message_id,
        })
        items = resp.get("items", [])
        return items[0] if items else {}

    def is_messages_allowed(self, group_id: str, user_id: int) -> bool:
        """Проверить, может ли бот писать пользователю."""
        resp = self._call("messages.isMessagesFromGroupAllowed", {
            "group_id": group_id,
            "user_id": user_id,
        })
        return resp.get("is_allowed", 0) == 1

    # ── Moderation helpers ────────────────────────────────────────────────

    def moderate_message(
        self,
        group_id: str,
        message_id: int,
        action: str,
        user_id: Optional[int] = None,
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Универсальный метод модерации сообщения.
        action: "delete" | "ban" | "warn" | "mute"
        """
        result = {"action": action, "message_id": message_id, "success": False}

        if action == "delete":
            result["success"] = bool(self.delete_message(message_id))

        elif action == "ban" and user_id:
            ban_reason = 1 if reason and "спам" in reason.lower() else 0
            result["success"] = bool(self.ban_user(group_id, user_id, reason=ban_reason, comment=reason))

        elif action == "warn":
            # Отправляем предупреждение пользователю
            if user_id:
                warn_text = f"⚠️ Предупреждение: {reason or 'нарушение правил'}"
                self.send_message(peer_id=user_id, message=warn_text)
                result["success"] = True

        elif action == "mute":
            # В VK нет прямого "mute" — используем ban на 1 час
            if user_id:
                end = int((datetime.utcnow() + timedelta(hours=1)).timestamp())
                result["success"] = bool(self.ban_user(group_id, user_id, end_date=end, comment=reason))

        return result


# ── Singleton factory ───────────────────────────────────────────────────

_vk_services: Dict[str, VKBotService] = {}


def get_vk_service(access_token: str) -> VKBotService:
    """Получить или создать сервис для токена (singleton per token)."""
    if access_token not in _vk_services:
        _vk_services[access_token] = VKBotService(access_token)
    return _vk_services[access_token]


def clear_vk_service(access_token: str):
    """Удалить сервис из кэша (при смене/отзыве токена)."""
    _vk_services.pop(access_token, None)
