"""
backend/max_gateway.py — минимальный клиент MAX Bot API (https://dev.max.ru/docs-api).

MAX подключается как третья платформа бота. Функционал MAX (ТЗ №5 Rev.10, п.1):
  1. AI-ассистент (диалог с ботом + двухуровневая AI-модерация)
  2. Система уровней — начисление XP, уведомления о level-up с inline-клавиатурой
     (Профиль/Топ/Закрыть/Nova Point), обработка нажатий (update_type == "message_callback",
     см. backend/main.py, max_webhook).
  3. Вебхуки/репостинг сторонних событий — В ПЛАНАХ, не реализовано в этом файле.

Архитектура намеренно зеркалит Lolka: ОДИН бот-токен на всё приложение (MAX_BOT_TOKEN),
конкретные "серверы" в БД (Server.platform == "max") идентифицируются chat_id диалога/чата MAX.
Админ добавляет MAX-чат на странице /dashboard/servers, указывая его chat_id.

Доставка обновлений — только Webhook: MAX официально не рекомендует Long Polling для прода
(ограничен по скорости и сроку хранения событий), в отличие от VK/Lolka, поэтому здесь нет
аналога VKLongPollListener — только POST /subscriptions при старте + приём событий на
POST /api/max/webhook (см. backend/main.py).
"""
import os
from typing import Optional
import requests

MAX_API_BASE = "https://platform-api2.max.ru"


def _token() -> str:
    return os.getenv("MAX_BOT_TOKEN", "")


def _headers() -> dict:
    return {"Authorization": _token(), "Content-Type": "application/json"}


def is_configured() -> bool:
    return bool(_token())


def register_webhook() -> None:
    """POST /subscriptions — регистрирует Webhook при старте бэкенда. Идемпотентно: повторный
    вызов с тем же url обновляет существующую подписку (MAX не создаёт дубликаты на один url)."""
    token = _token()
    webhook_url = os.getenv("MAX_WEBHOOK_URL", "")
    if not token or not webhook_url:
        print("INFO: MAX_BOT_TOKEN/MAX_WEBHOOK_URL не заданы — MAX Gateway не подключается")
        return
    try:
        resp = requests.post(
            f"{MAX_API_BASE}/subscriptions",
            headers=_headers(),
            json={
                "url": webhook_url,
                "update_types": ["message_created", "message_callback", "bot_added", "bot_started", "bot_removed", "user_added"],
                "secret": os.getenv("MAX_WEBHOOK_SECRET", ""),
            },
            timeout=10,
        )
        if resp.ok:
            print("OK: MAX webhook подписка зарегистрирована")
        else:
            print(f"MAX GATEWAY WARNING: подписка не создана — {resp.status_code} {resp.text[:200]}")
    except requests.RequestException as e:
        print(f"MAX GATEWAY WARNING: не удалось зарегистрировать webhook — {e}")


def send_message(chat_id: str, text: str, attachments: Optional[list] = None) -> bool:
    """POST /messages?chat_id=... — отправка сообщения в чат (AI-ассистент, уведомления
    об уровнях). attachments — список вложений (например, inline_keyboard из
    ranking/template.py, convert_components_to_max_keyboard)."""
    if not is_configured():
        return False
    try:
        payload: dict = {"text": (text or "")[:4000]}
        if attachments:
            payload["attachments"] = attachments
        resp = requests.post(
            f"{MAX_API_BASE}/messages",
            params={"chat_id": chat_id},
            headers=_headers(),
            json=payload,
            timeout=15,
        )
        if not resp.ok:
            print(f"MAX GATEWAY: ошибка отправки сообщения в чат {chat_id} — {resp.status_code}")
        return resp.ok
    except requests.RequestException as e:
        print(f"MAX GATEWAY: сетевая ошибка отправки сообщения — {e}")
        return False


def answer_callback(callback_id: str, notification: Optional[str] = None, message: Optional[dict] = None) -> bool:
    """POST /answers?callback_id=... — ответ на нажатие callback-кнопки (см.
    MAX - Документация.md, "Ответ на callback"). Нужно ответить, иначе кнопка "зависает"
    с индикатором загрузки на клиенте. notification — всплывающее уведомление пользователю
    (аналог VK show_snackbar); message — опционально обновляет исходное сообщение."""
    if not is_configured() or not callback_id:
        return False
    try:
        body: dict = {}
        if notification:
            body["notification"] = notification[:100]
        if message:
            body["message"] = message
        resp = requests.post(
            f"{MAX_API_BASE}/answers",
            params={"callback_id": callback_id},
            headers=_headers(),
            json=body,
            timeout=10,
        )
        if not resp.ok:
            print(f"MAX GATEWAY: ошибка ответа на callback {callback_id} — {resp.status_code} {resp.text[:200]}")
        return resp.ok
    except requests.RequestException as e:
        print(f"MAX GATEWAY: сетевая ошибка ответа на callback — {e}")
        return False


def delete_message(message_id: str) -> bool:
    """DELETE /messages?message_id=... — удаление сообщения (AutoMod, Level 1/2)."""
    if not is_configured() or not message_id:
        return False
    try:
        resp = requests.delete(
            f"{MAX_API_BASE}/messages",
            params={"message_id": message_id},
            headers=_headers(),
            timeout=10,
        )
        if not resp.ok:
            print(f"MAX GATEWAY: ошибка удаления сообщения {message_id} — {resp.status_code}")
        return resp.ok
    except requests.RequestException as e:
        print(f"MAX GATEWAY: сетевая ошибка удаления сообщения — {e}")
        return False
