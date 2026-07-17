from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel, EmailStr
import hashlib
import base64
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, SessionLocal
from models import Server, ModuleConfig, AISettings, Member, MusicProvider, Event, User, NotificationSettings, Webhook, ModerationEvent, VKConnection
from vk_bot_service import VKBotService, VKAPIError, get_vk_service, clear_vk_service
from moderation_engine import ModerationEngine
from fastapi.responses import PlainTextResponse
from typing import Optional
from auth_utils import (
    hash_password, verify_password, generate_verification_token, token_expiry,
    create_access_token, create_refresh_token, verify_token,
)
from email_utils import send_verification_email, send_email
import requests
import random
import re
import os
import secrets
import asyncio
import time
from datetime import datetime, timedelta

# Новые импорты для JSONB endpoints
import json
from typing import Any, Dict
from sqlalchemy import text

# Временное хранилище PKCE code_verifier (ключ = state)
vk_pkce_store: dict = {}
LOLKA_BOT_BASE_URL = "https://lolka.app/api/bot/v10"
LOLKA_GATEWAY_URL = "wss://lolka.app/ws/bot"

lolka_gateway_instance = None


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class VKConnectRequest(BaseModel):
    server_id: str           # server_id из таблицы servers (строка)
    group_id: str           # ID сообщества VK (число или clubXXXX)
    access_token: str       # Токен сообщества
    webhook_secret: str = ""
    confirmation_code: str = ""


class VKModerateRequest(BaseModel):
    group_id: str
    message_id: int
    action: str             # "delete" | "ban" | "warn" | "mute"
    user_id: Optional[int] = None
    reason: Optional[str] = None


class VKSendMessageRequest(BaseModel):
    group_id: str
    peer_id: int
    message: str


class CreateServerRequest(BaseModel):
    name: str
    server_id: str
    platform: str = "vk"
    webhook_url: str = ""
    icon_url: str = ""
    member_count: int = 0

app = FastAPI(title="Nova API", version="0.7.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://nova-bot-1-1hsz.onrender.com",  # реальный frontend на Render
        "https://nova-bot-4vmp.vercel.app",       # старый Vercel — оставлен временно
        "http://localhost:3000",                   # локальная разработка
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Moderation engine (ТЗ №5) ───────────────────────────────────────────────
_moderation_engine = ModerationEngine()


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """
    Без этого хендлера необработанное исключение вылетает выше CORSMiddleware,
    и браузер видит голый 500 без Access-Control-Allow-Origin — из-за чего
    в консоли это выглядит как ошибка CORS, хотя реальная причина другая.
    Хендлер сам является частью ExceptionMiddleware, который CORSMiddleware
    оборачивает — поэтому заголовки добавляются как обычно.
    """
    print(f"❌ Необработанная ошибка на {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "internal_error", "detail": str(exc)},
    )


@app.on_event("startup")
async def startup():
    init_db()
    global lolka_gateway_instance
    token = os.getenv("LOLKA_BOT_TOKEN", "")
    if token:
        from lolka_gateway import LolkaGateway
        lolka_gateway_instance = LolkaGateway(token, LOLKA_GATEWAY_URL, LOLKA_BOT_BASE_URL)
        asyncio.create_task(lolka_gateway_instance.run_forever())
        print("OK: Lolka Gateway task запущена")
    else:
        print("INFO: LOLKA_BOT_TOKEN не задан — Gateway не подключается")

@app.head("/")
@app.get("/")
def root():
    """
    Корневой роут для health check.
    HEAD используется UptimeRobot для мониторинга.
    """
    return {"status": "ok", "version": "0.7.0"}

def _normalize_server_id(raw_id: str, platform: str) -> str:
    """
    Приводит server_id к чистому виду, который безопасно ложится в БД
    и сравнивается с Integer-колонками в других таблицах (ModuleConfig и т.д.).

    Принимает как готовый ID, так и вставленную ссылку:
      - "240082352"                          -> "240082352"
      - "https://vk.com/club240082352"       -> "240082352"
      - "https://vk.com/public240082352"     -> "240082352"
      - "vk.com/club240082352"               -> "240082352"

    Для VK-сообществ с текстовым screen_name (без цифр, например vk.com/durov)
    однозначно вытащить числовой ID без обращения к VK API нельзя —
    в этом случае просим ввести ID вручную.
    """
    raw_id = (raw_id or "").strip()
    if not raw_id:
        raise ValueError("server_id не может быть пустым")

    if platform == "vk":
        match = re.search(r"(?:club|public)(\d+)", raw_id)
        if match:
            return match.group(1)
        if raw_id.isdigit():
            return raw_id
        raise ValueError(
            "Не удалось распознать числовой ID VK-сообщества. "
            "Укажите ID напрямую (например 240082352) или ссылку вида "
            "vk.com/club240082352 — ссылки с текстовым именем (vk.com/durov) "
            "пока не поддерживаются, нужен числовой ID."
        )

    if platform == "lolka":
        # Вставленная ссылка вида https://lolka.app/servers/<id> или .../channels/<id>/...
        match = re.search(r"lolka\.app/(?:servers|channels)/(\d+)", raw_id)
        if match:
            return match.group(1)
        if raw_id.isdigit():
            return raw_id
        raise ValueError(
            "Не удалось распознать числовой ID Lolka-сервера. "
            "Укажите ID напрямую или ссылку вида lolka.app/servers/780713670838272."
        )

    # Остальные платформы — просто чистим пробелы
    return raw_id


def _get_server_or_error(db, server_id: str):
    """
    Находит сервер по server_id для эндпоинтов сохранения настроек
    (modules, ai, notifications, auto-forward, reports).

    ВАЖНО: раньше эти эндпоинты при отсутствии сервера тихо создавали
    новую запись Server(name="Auto-created", ...) — тот же класс бага,
    что и старый sync_lolka_servers, только с другой стороны: настройки
    сохранялись для server_id, который ещё не был добавлен администратором
    на /dashboard/servers (например при гонке состояний на фронте, пока
    ServerProvider ещё не выбрал реальный сервер, и запрос уходил с
    server_id="default"). В результате в списке серверов всплывали
    "призрачные" записи, не добавленные вручную.

    Теперь — никогда не создаём сервер неявно. Если записи нет, вызывающий
    код должен вернуть понятную ошибку и попросить сначала добавить сервер
    на странице /dashboard/servers.
    """
    if not server_id or server_id == "default":
        return None
    return db.query(Server).filter(Server.server_id == server_id).first()


@app.get("/api/servers")
def get_servers(platform: str = Query("")):
    db = SessionLocal()
    try:
        query = db.query(Server)
        if platform:
            query = query.filter(Server.platform == platform)
        servers = query.all()
        result = [
            {
                "id": s.id,
                "name": s.name,
                "server_id": s.server_id,
                "platform": s.platform or "vk",
                "icon_url": s.icon_url or "",
                "member_count": s.member_count or 0,
                "is_active": True if s.is_active is None else bool(s.is_active),
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in servers
        ]
        return {"servers": result, "total": len(result)}
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()

@app.post("/api/servers")
def create_server(data: CreateServerRequest):
    try:
        server_id = _normalize_server_id(data.server_id, data.platform)
    except ValueError as e:
        return {"error": str(e)}

    db = SessionLocal()
    try:
        existing = db.query(Server).filter(Server.server_id == server_id).first()
        if existing:
            return {"error": "Сервер с таким ID уже зарегистрирован"}
        server = Server(
            name=data.name,
            server_id=server_id,
            webhook_url=data.webhook_url,
            platform=data.platform,
            icon_url=data.icon_url,
            member_count=data.member_count,
        )
        db.add(server)
        db.commit()
        db.refresh(server)
        return {"status": "created", "server": {"id": server.id, "name": server.name, "platform": server.platform}}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()

@app.delete("/api/servers/cleanup-ghosts")
def cleanup_ghost_servers():
    """
    Одноразовая очистка: удаляет серверы, которые могли быть созданы
    старым багом (либо старым sync_lolka_servers, либо settings-эндпоинтами,
    которые раньше тихо создавали Server(name="Auto-created", ...)).

    Удаляет только записи с именем ровно "Auto-created" — то есть только
    то, что могло появиться исключительно через автосоздание, а не
    что-либо добавленное вручную. Настоящие серверы с реальными именами
    (даже если появились из-за старого бага sync_lolka_servers) эта ручка
    не трогает — их нужно удалить вручную через кнопку 🗑 на /dashboard/servers,
    если они не нужны, ровно так же, как любой другой сервер.
    """
    db = SessionLocal()
    try:
        ghosts = db.query(Server).filter(Server.name == "Auto-created").all()
        removed = [{"id": g.id, "server_id": g.server_id, "platform": g.platform} for g in ghosts]
        for g in ghosts:
            db.delete(g)
        db.commit()
        return {"status": "ok", "removed_count": len(removed), "removed": removed}
    except Exception as e:
        db.rollback()
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


@app.delete("/api/servers/{db_id}")
def delete_server(db_id: int):
    db = SessionLocal()
    try:
        server = db.query(Server).filter(Server.id == db_id).first()
        if not server:
            return {"error": "Сервер не найден"}
        db.delete(server)
        db.commit()
        return {"status": "deleted"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


def send_to_lolka(webhook_url: str, message: str, username: str = "Нова", avatar_url: str = ""):
    payload = {"content": message, "username": username}
    if avatar_url:
        payload["avatar_url"] = avatar_url
    try:
        resp = requests.post(webhook_url, json=payload, timeout=5)
        return {"status_code": resp.status_code, "ok": resp.ok}
    except requests.RequestException as e:
        raise Exception(f"Ошибка соединения: {str(e)}")


@app.post("/api/webhook/lolka")
def lolka_webhook(data: dict):
    print(f"📨 Получен вебхук: {data}")
    
    message = data.get("content", "")
    user = data.get("author", {}).get("username", "Неизвестный")
    channel = data.get("channel", "Неизвестный")
    server_id = data.get("server_id", "")
    webhook_url = data.get("webhook_url", "")
    avatar_url = data.get("avatar_url", "")
    
    response = None
    
    if message.startswith("/ping"):
        response = f"🏓 Понг, {user}!"
    
    elif message.startswith("/help") or message.startswith("/помощь"):
        response = f"""**🤖 Команды Нова:**
📊 `/stats` — статистика сервера
🎵 `/play` — включить музыку
🛡️ `/mod` — модерация
❓ `/help` — список команд
💡 `/hello` — приветствие
↗ `/forward ссылка` — переслать контент в каналы"""
    
    elif message.startswith("/stats"):
        response = f"""**📊 Статистика:**
👤 Пользователь: {user}
💬 Канал: {channel}
🤖 Бот: Нова v0.7.0
⚡ Статус: Работает
🌐 Сервер: {server_id or 'Неизвестный'}"""
    
    elif message.startswith("/hello") or message.startswith("/привет"):
        greetings = [
            f"✨ Привет, {user}! Я Нова — умный помощник этого сервера!",
            f"🚀 Здравствуй, {user}! Готов помочь!",
            f"💫 Приветствую, {user}! Чем могу быть полезна?",
        ]
        response = random.choice(greetings)
    
    elif message.startswith("/forward") or message.startswith("/перешли"):
        urls = extract_urls(message)
        if urls:
            platform = data.get("platform", "Lolka")
            server_name = data.get("server_name", "")
            response = f"🔍 Нашёл {len(urls)} ссылок. Отправляю в подходящие каналы..."
        else:
            response = "❌ Не нашёл ссылок. Используйте: /forward https://..."
    
    else:
        print(f"💬 {user} написал: {message}")
    
    if response and webhook_url:
        try:
            send_result = send_to_lolka(webhook_url, response, avatar_url=avatar_url)
            print(f"📤 Ответ отправлен: {send_result}")
            return {
                "status": "ok",
                "response": response,
                "reply_to": user,
                "sent_to_chat": True
            }
        except Exception as e:
            print(f"❌ Ошибка отправки: {e}")
            return {
                "status": "ok",
                "response": response,
                "reply_to": user,
                "sent_to_chat": False,
                "error": str(e)
            }
    
    if response:
        return {
            "status": "ok",
            "response": response,
            "reply_to": user,
            "sent_to_chat": False
        }
    
    return {
        "status": "received",
        "message": "Сообщение получено"
    }


# ==================== API для модулей ====================

@app.get("/api/settings/modules")
def get_modules(server_id: str = Query("default")):
    db = SessionLocal()
    try:
        server = db.query(Server).filter(Server.server_id == server_id).first()
        if not server:
            return {"modules": [], "message": "Сервер не найден"}
        
        configs = db.query(ModuleConfig).filter(ModuleConfig.server_id == server.id).all()
        modules = [
            {"name": c.module_name, "enabled": c.is_enabled, "config": c.config}
            for c in configs
        ]
        return {"modules": modules}
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()


@app.post("/api/settings/modules")
def save_modules(data: dict):
    db = SessionLocal()
    try:
        server_id = data.get("server_id", "default")
        modules = data.get("modules", [])

        server = _get_server_or_error(db, server_id)
        if not server:
            return {"error": "Сервер не найден. Сначала добавьте его на странице /dashboard/servers."}

        for mod in modules:
            existing = db.query(ModuleConfig).filter(
                ModuleConfig.server_id == server.id,
                ModuleConfig.module_name == mod["name"]
            ).first()
            
            if existing:
                existing.is_enabled = mod.get("enabled", False)
                existing.config = mod.get("config", "")
            else:
                new_config = ModuleConfig(
                    server_id=server.id,
                    module_name=mod["name"],
                    is_enabled=mod.get("enabled", False),
                    config=mod.get("config", "")
                )
                db.add(new_config)
        
        db.commit()

        # ── Хук логирования события модерации (ТЗ №4) ──
        if any(m.get("name") == "moderation" for m in modules):
            log_event = ModerationEvent(
                server_id=server.id,
                platform=server.platform or "vk",
                type="settings_updated",
                title="Настройки модерации обновлены",
                description=f"Пользователь {data.get('user_id', 'system')} изменил конфигурацию"
            )
            db.add(log_event)
            db.commit()

        return {"status": "saved", "modules_count": len(modules)}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


# ==================== API для AI-настроек ====================

@app.get("/api/settings/ai")
def get_ai_settings(server_id: str = Query("default")):
    db = SessionLocal()
    try:
        server = db.query(Server).filter(Server.server_id == server_id).first()
        if not server:
            return {"settings": None, "message": "Сервер не найден"}
        
        ai = db.query(AISettings).filter(AISettings.server_id == server.id).first()
        if not ai:
            return {"settings": {
                "botName": "Нова", "personality": "friendly",
                "temperature": 0.7, "maxLength": 500,
                "useEmoji": True, "systemPrompt": "Ты — дружелюбный AI-помощник."
            }}
        
        return {"settings": {
            "botName": ai.bot_name, "personality": ai.personality,
            "temperature": ai.temperature, "systemPrompt": ai.system_prompt or ""
        }}
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()


@app.post("/api/settings/ai")
def save_ai_settings(data: dict):
    db = SessionLocal()
    try:
        server_id = data.get("server_id", "default")

        server = _get_server_or_error(db, server_id)
        if not server:
            return {"error": "Сервер не найден. Сначала добавьте его на странице /dashboard/servers."}

        ai = db.query(AISettings).filter(AISettings.server_id == server.id).first()
        if not ai:
            ai = AISettings(server_id=server.id)
            db.add(ai)
        
        ai.bot_name = data.get("botName", "Нова")
        ai.personality = data.get("personality", "friendly")
        ai.temperature = data.get("temperature", 0.7)
        ai.system_prompt = data.get("systemPrompt", "")
        
        db.commit()
        return {"status": "saved"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


# ==================== API для уведомлений (VK / MAX / Email) ====================
# Ранее здесь были уведомления через Telegram — полностью заменены на VK, MAX и Email.

@app.get("/api/settings/notifications")
def get_notification_settings(server_id: str = Query("default")):
    db = SessionLocal()
    try:
        server = db.query(Server).filter(Server.server_id == server_id).first()
        if not server:
            return {"settings": {
                "email": {"enabled": True, "address": ""},
                "vk": {"enabled": False, "webhook_url": ""},
                "max": {"enabled": False, "webhook_url": ""},
            }}

        n = db.query(NotificationSettings).filter(NotificationSettings.server_id == server.id).first()
        if not n:
            return {"settings": {
                "email": {"enabled": True, "address": ""},
                "vk": {"enabled": False, "webhook_url": ""},
                "max": {"enabled": False, "webhook_url": ""},
            }}

        return {"settings": {
            "email": {"enabled": n.email_enabled, "address": n.email_address or ""},
            "vk": {"enabled": n.vk_enabled, "webhook_url": n.vk_webhook_url or ""},
            "max": {"enabled": n.max_enabled, "webhook_url": n.max_webhook_url or ""},
        }}
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()


@app.post("/api/settings/notifications")
def save_notification_settings(data: dict):
    db = SessionLocal()
    try:
        server_id = data.get("server_id", "default")
        email = data.get("email", {}) or {}
        vk = data.get("vk", {}) or {}
        max_ = data.get("max", {}) or {}

        server = _get_server_or_error(db, server_id)
        if not server:
            return {"error": "Сервер не найден. Сначала добавьте его на странице /dashboard/servers."}

        n = db.query(NotificationSettings).filter(NotificationSettings.server_id == server.id).first()
        if not n:
            n = NotificationSettings(server_id=server.id)
            db.add(n)

        n.email_enabled = bool(email.get("enabled", True))
        n.email_address = email.get("address", "") or ""
        n.vk_enabled = bool(vk.get("enabled", False))
        n.vk_webhook_url = vk.get("webhook_url", "") or ""
        n.max_enabled = bool(max_.get("enabled", False))
        n.max_webhook_url = max_.get("webhook_url", "") or ""
        n.updated_at = datetime.utcnow()

        db.commit()
        return {"status": "saved"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


@app.post("/api/settings/notifications/test")
def test_notification(data: dict):
    """Отправить тестовое уведомление по выбранному каналу: vk | max | email"""
    channel = data.get("channel", "")
    title = "🔔 Тестовое уведомление Nova Bot"
    message = "Это тестовое уведомление — если вы его видите, канал настроен верно."

    try:
        if channel in ("vk", "max"):
            webhook_url = data.get("webhook_url", "")
            if not webhook_url:
                return {"error": "webhook_url required"}
            resp = requests.post(webhook_url, json={
                "content": f"**{title}**\n\n{message}",
                "username": "Нова 🔔",
            }, timeout=10)
            return {"status": "sent", "http_status": resp.status_code}

        if channel == "email":
            address = data.get("address", "")
            if not address:
                return {"error": "address required"}
            ok = send_email(address, title, f"<h2>{title}</h2><p>{message}</p>")
            if not ok:
                return {"error": "Не удалось отправить письмо. Проверьте RESEND_API_KEY на сервере."}
            return {"status": "sent"}

        return {"error": "Неизвестный канал уведомлений"}
    except Exception as e:
        return {"error": str(e)}


# ==================== Lolka OAuth (вход пользователя) ====================
# OAuth2-логин через приложения Lolka ещё не запущен платформой (раздел
# "Приложения" в их портале помечен как "скоро"). Пока это так, не дёргаем
# несуществующие oauth2/authorize и oauth2/token — фронтенд получит понятный
# статус и покажет "скоро" вместо зависшего редиректа/непонятной ошибки.

@app.get("/api/auth/lolka")
def auth_lolka():
    return {
        "error": "not_available",
        "message": "Вход через Lolka пока недоступен — OAuth2-приложения на платформе Lolka ещё не запущены.",
    }


@app.get("/api/auth/lolka/callback")
def auth_lolka_callback(code: str = "", state: str = ""):
    return {
        "error": "not_available",
        "message": "Вход через Lolka пока недоступен — OAuth2-приложения на платформе Lolka ещё не запущены.",
    }


@app.get("/api/auth/vk")
def auth_vk():
    app_id = os.getenv("VK_APP_ID", "")
    redirect_uri = os.getenv("VK_REDIRECT_URI", "")
    state = secrets.token_hex(16)

    # VK ID OAuth 2.1 требует PKCE (code_challenge)
    code_verifier = secrets.token_urlsafe(64)
    digest = hashlib.sha256(code_verifier.encode()).digest()
    code_challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()

    vk_pkce_store[state] = code_verifier

    url = (
        f"https://id.vk.com/oauth2/auth"
        f"?client_id={app_id}"
        f"&redirect_uri={redirect_uri}"
        f"&response_type=code"
        f"&scope=vkid.personal_info+email"
        f"&state={state}"
        f"&code_challenge={code_challenge}"
        f"&code_challenge_method=S256"
    )
    return {"url": url, "state": state}
@app.get("/api/auth/vk/callback")
def auth_vk_callback(code: str = None, state: str = "", device_id: str = ""):
    if not code:
        raise HTTPException(status_code=400, detail="No code")

    app_id = os.getenv("VK_APP_ID", "")
    secret_key = os.getenv("VK_SECRET_KEY", "")
    redirect_uri = os.getenv("VK_REDIRECT_URI", "")

    code_verifier = vk_pkce_store.pop(state, "")
    if not code_verifier:
        raise HTTPException(status_code=400, detail="Сессия истекла или state не найден")

    try:
        resp = requests.post("https://id.vk.com/oauth2/token", data={
            "grant_type": "authorization_code",
            "client_id": app_id,
            "client_secret": secret_key,
            "code": code,
            "code_verifier": code_verifier,
            "redirect_uri": redirect_uri,
            "device_id": device_id or "web",
            "state": state,
        }, timeout=10)
        token_data = resp.json()
        if "error" in token_data:
            raise HTTPException(status_code=400, detail=token_data.get("error_description", token_data["error"]))
        access_token = token_data.get("access_token", "")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обмена кода: {str(e)}")

    try:
        user_resp = requests.get("https://id.vk.com/oauth2/user_info", headers={
            "Authorization": f"Bearer {access_token}"
        }, timeout=10)
        user_data = user_resp.json().get("user", {})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения пользователя: {str(e)}")

    nova_token = secrets.token_hex(32)
    return {
        "status": "ok",
        "token": nova_token,
        "user": {
            "id": user_data.get("user_id"),
            "username": f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip(),
            "avatar": user_data.get("avatar"),
        },
    }


# ==================== E-mail регистрация ====================
@app.post("/api/auth/register")
def register(data: RegisterRequest):
    db = SessionLocal()
    try:
        email = data.email.strip().lower()
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email уже зарегистрирован")
        if len(data.password) < 8:
            raise HTTPException(status_code=400, detail="Пароль должен быть не короче 8 символов")
        token = generate_verification_token()
        user = User(
            email=email,
            password_hash=hash_password(data.password),
            verification_token=token,
            verification_token_expires=token_expiry(),
        )
        db.add(user)
        db.commit()
        base_url = "https://nova-bot-rpsy.onrender.com"
        email_sent = send_verification_email(email, token, base_url)
        if not email_sent:
            print(f"[register] Пользователь {email} создан, но письмо НЕ отправлено")
        return {
            "status": "ok",
            "message": "Проверьте почту для подтверждения" if email_sent else "Аккаунт создан, но письмо не отправлено — попробуйте позже",
            "email_sent": email_sent,
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.get("/api/auth/verify")
def verify_email(token: str):
    """Подтверждение e-mail по ссылке из письма"""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.verification_token == token).first()
        if not user:
            raise HTTPException(status_code=400, detail="Неверный или уже использованный токен")
        if user.verification_token_expires and user.verification_token_expires < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Срок действия ссылки истёк, зарегистрируйтесь заново")

        user.is_verified = True
        user.verification_token = None
        user.verification_token_expires = None
        db.commit()

        frontend_url = "https://nova-bot-1-1hsz.onrender.com"
        return RedirectResponse(url=f"{frontend_url}/login?verified=1")
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.post("/api/auth/login")
def login(data: LoginRequest):
    """Вход по e-mail и паролю — выдаёт настоящую пару JWT (access + refresh)."""
    db = SessionLocal()
    try:
        email = data.email.strip().lower()
        user = db.query(User).filter(User.email == email).first()
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Неверный email или пароль")
        if not user.is_verified:
            raise HTTPException(status_code=403, detail="Подтвердите email перед входом")

        payload = {"sub": str(user.id), "email": user.email}
        access_token = create_access_token(payload)
        refresh_token = create_refresh_token(payload)

        user.refresh_token = refresh_token
        db.commit()

        return {
            "status": "ok",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {"id": user.id, "email": user.email},
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.post("/api/auth/refresh")
def refresh_access_token(data: RefreshRequest):
    """Выдаёт новую пару токенов по действующему refresh-токену (с ротацией —
    старый refresh-токен сразу перестаёт быть валидным)."""
    db = SessionLocal()
    try:
        payload = verify_token(data.refresh_token, expected_type="refresh")
        if not payload:
            raise HTTPException(status_code=401, detail="Refresh-токен недействителен или истёк")

        user = db.query(User).filter(User.id == int(payload["sub"])).first()
        if not user or user.refresh_token != data.refresh_token:
            # user.refresh_token не совпадает — токен был отозван (logout)
            # или уже использован раньше (ротация), либо это чужой/поддельный токен
            raise HTTPException(status_code=401, detail="Refresh-токен отозван")

        new_payload = {"sub": str(user.id), "email": user.email}
        access_token = create_access_token(new_payload)
        new_refresh_token = create_refresh_token(new_payload)

        user.refresh_token = new_refresh_token
        db.commit()

        return {
            "status": "ok",
            "access_token": access_token,
            "refresh_token": new_refresh_token,
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.post("/api/auth/logout")
def logout(data: LogoutRequest):
    """Отзывает refresh-токен — им больше нельзя будет обновить access-токен,
    даже если срок действия ещё не истёк."""
    db = SessionLocal()
    try:
        payload = verify_token(data.refresh_token, expected_type="refresh")
        if not payload:
            # токен и так уже нерабочий — с точки зрения клиента это тоже успешный logout
            return {"status": "ok"}

        user = db.query(User).filter(User.id == int(payload["sub"])).first()
        if user and user.refresh_token == data.refresh_token:
            user.refresh_token = None
            db.commit()

        return {"status": "ok"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.post("/api/auth/resend-verification")
def resend_verification(data: dict):
    """Повторно отправить письмо с подтверждением уже существующему,
    но ещё не подтверждённому аккаунту (без создания нового пользователя)."""
    email = data.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="email обязателен")
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь с таким email не найден")
        if user.is_verified:
            return {"status": "already_verified", "email_sent": False}

        token = generate_verification_token()
        user.verification_token = token
        user.verification_token_expires = token_expiry()
        db.commit()

        base_url = "https://nova-bot-rpsy.onrender.com"
        email_sent = send_verification_email(user.email, token, base_url)
        if not email_sent:
            print(f"[resend-verification] Письмо для {user.email} НЕ отправлено")
        return {"status": "ok", "email_sent": email_sent}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.post("/api/auth/forgot-password")
def forgot_password(data: ForgotPasswordRequest):
    """Запросить восстановление пароля. Ответ одинаковый независимо от того,
    существует ли такой email в базе — чтобы через этот эндпоинт нельзя было
    проверять, какие адреса зарегистрированы."""
    db = SessionLocal()
    try:
        email = data.email.strip().lower()
        user = db.query(User).filter(User.email == email).first()
        if user:
            token = generate_verification_token()
            user.password_reset_token = token
            user.password_reset_expires = token_expiry(hours=1)
            db.commit()

            frontend_url = "https://nova-bot-1-1hsz.onrender.com"
            reset_link = f"{frontend_url}/reset-password?token={token}"
            sent = send_email(
                user.email,
                "Восстановление пароля — Nova Bot",
                f"<h2>Восстановление пароля</h2>"
                f"<p>Перейдите по ссылке, чтобы задать новый пароль:</p>"
                f'<p><a href="{reset_link}">{reset_link}</a></p>'
                f"<p>Ссылка действительна 1 час. Если вы не запрашивали восстановление — "
                f"просто проигнорируйте это письмо.</p>",
            )
            if not sent:
                print(f"[forgot-password] Письмо для {user.email} НЕ отправлено")

        # Намеренно не сообщаем, найден ли email — одинаковый ответ в обоих случаях
        return {"status": "ok"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@app.post("/api/auth/reset-password")
def reset_password(data: ResetPasswordRequest):
    """Установить новый пароль по токену из письма. Заодно отзывает
    все действующие refresh-токены — старые сессии придётся начать заново."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.password_reset_token == data.token).first()
        if not user:
            raise HTTPException(status_code=400, detail="Неверная или уже использованная ссылка")
        if user.password_reset_expires and user.password_reset_expires < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Срок действия ссылки истёк, запросите восстановление заново")
        if len(data.new_password) < 8:
            raise HTTPException(status_code=400, detail="Пароль должен быть не короче 8 символов")

        user.password_hash = hash_password(data.new_password)
        user.password_reset_token = None
        user.password_reset_expires = None
        user.refresh_token = None
        db.commit()
        return {"status": "ok"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


# ==================== Отправка сообщений ====================

@app.post("/api/send/lolka")
def send_to_lolka_webhook(data: dict):
    webhook_url = data.get("webhook_url", "")
    message = data.get("message", "")
    username = data.get("username", "Нова")
    avatar_url = data.get("avatar_url", "")

    if not webhook_url or not message:
        return {"status": "error", "message": "webhook_url и message обязательны"}

    payload = {"content": message, "username": username}
    if avatar_url:
        payload["avatar_url"] = avatar_url

    try:
        resp = requests.post(webhook_url, json=payload, timeout=10)
        return {"status": "ok", "sent": resp.ok, "platform": "lolka"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/send/vk")
def send_to_vk(data: dict):
    group_id = data.get("group_id", "")
    message = data.get("message", "")
    access_token = data.get("access_token", os.getenv("VK_ACCESS_TOKEN", ""))
    
    if not group_id or not message:
        return {"status": "error", "message": "group_id и message обязательны"}
    
    try:
        resp = requests.post("https://api.vk.com/method/wall.post", params={
            "owner_id": f"-{group_id}", "message": message,
            "access_token": access_token, "v": "5.199"
        }, timeout=10)
        return {"status": "ok", "sent": "error" not in resp.json(), "platform": "vk"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/send/broadcast")
def send_broadcast(data: dict):
    message = data.get("message", "")
    webhooks = data.get("webhooks", [])
    avatar_url = data.get("avatar_url", "")
    
    results = []
    for wh in webhooks:
        if wh.get("platform") == "lolka":
            r = send_to_lolka_webhook({"webhook_url": wh.get("url"), "message": message, "avatar_url": avatar_url})
            results.append({"platform": "lolka", "sent": r.get("sent")})
        elif wh.get("platform") == "vk":
            r = send_to_vk({"group_id": wh.get("group_id"), "message": message})
            results.append({"platform": "vk", "sent": r.get("sent")})
    
    return {
        "status": "ok",
        "sent_count": len([r for r in results if r.get("sent")]),
        "total": len(results)
    }


# ==================== Lolka Bot (REST API) ====================

def _lolka_bot_headers():
    token = os.getenv("LOLKA_BOT_TOKEN", "")
    return {"Authorization": f"Bot {token}"} if token else {}


def _lolka_bot_request(method: str, url: str, max_retries: int = 3, **kwargs):
    """
    Обёртка над запросами к Lolka Bot API с ретраем при 429 — по паттерну
    Discord (Lolka Bot API прямо позиционируется как Discord-совместимый,
    см. документацию, раздел «Готовые библиотеки»). Рабочая гипотеза,
    т.к. точный формат 429 в доках Lolka не расписан отдельно:
      - ждём время из заголовка Retry-After (или поля retry_after в JSON-теле,
        как это делает Discord), плюс небольшой запас;
      - если ни заголовка, ни поля нет — фиксированный backoff 0.5s * попытка.
    Если это предположение не подтвердится документацией/поведением API —
    достаточно поправить только эту функцию, все вызовы уже центростремительны.
    """
    kwargs.setdefault("headers", _lolka_bot_headers())
    kwargs.setdefault("timeout", 10)
    last_resp = None
    for attempt in range(max_retries):
        resp = requests.request(method, url, **kwargs)
        if resp.status_code != 429:
            return resp
        last_resp = resp
        wait = None
        retry_after_header = resp.headers.get("Retry-After")
        if retry_after_header is not None:
            try:
                wait = float(retry_after_header)
            except ValueError:
                wait = None
        if wait is None:
            try:
                body = resp.json()
                if isinstance(body, dict) and "retry_after" in body:
                    wait = float(body["retry_after"])
            except Exception:
                wait = None
        if wait is None:
            wait = 0.5 * (attempt + 1)
        time.sleep(wait + 0.1)  # небольшой запас, чтобы не постучаться на грани окна
    return last_resp


@app.get("/api/lolka/bot/gateway")
def get_lolka_gateway():
    """URL и лимиты для подключения к Gateway (как discord /gateway/bot)"""
    return {
        "url": LOLKA_GATEWAY_URL,
        "shards": 1,
        "session_start_limit": {"total": 1000, "remaining": 1000, "reset_after": 0, "max_concurrency": 1},
    }


@app.get("/api/lolka/bot")
def get_lolka_bot_info():
    """Статус собственного бота: подключён ли Gateway, какой токен настроен"""
    token = os.getenv("LOLKA_BOT_TOKEN", "")
    if not token:
        return {"configured": False, "connected": False, "bot": None}

    connected = lolka_gateway_instance is not None and getattr(lolka_gateway_instance, "connected", False)
    bot_info = None
    try:
        resp = _lolka_bot_request("GET", f"{LOLKA_BOT_BASE_URL}/users/@me")
        if resp is not None and resp.ok:
            bot_info = resp.json()
    except Exception:
        pass

    return {"configured": True, "connected": connected, "bot": bot_info}


@app.get("/api/lolka/bot/guilds")
def get_lolka_bot_guilds():
    """
    Список серверов (гильдий), где реально состоит бот Nova в Lolka.
    ВАЖНО: approximate_member_count в ответе появляется только если передать
    with_counts=true — раньше этот параметр не передавался, из-за чего
    member_count всегда приходил нулевым (см. документацию: GET /users/@me/guilds).
    """
    if not os.getenv("LOLKA_BOT_TOKEN", ""):
        return {"error": "LOLKA_BOT_TOKEN не настроен", "guilds": []}
    try:
        resp = _lolka_bot_request(
            "GET", f"{LOLKA_BOT_BASE_URL}/users/@me/guilds",
            params={"limit": 200, "with_counts": "true"},
        )
        if resp is None:
            return {"error": "Lolka API: превышен лимит запросов", "guilds": []}
        if not resp.ok:
            return {"error": f"Lolka API вернул {resp.status_code}", "guilds": []}
        guilds = resp.json()
        return {
            "guilds": [
                {
                    "id": str(g.get("id")),
                    "name": g.get("name", "Без названия"),
                    "icon": g.get("icon"),
                    "member_count": g.get("approximate_member_count", 0),
                }
                for g in guilds
            ]
        }
    except Exception as e:
        return {"error": str(e), "guilds": []}


@app.get("/api/lolka/bot/guilds/available")
def get_lolka_available_guilds():
    """
    Гильдии, где бот состоит, но которые ЕЩЁ НЕ подключены к дашборду Nova
    (нет строки в servers). Это "кандидаты на добавление" для preview-флоу:
    админ сам решает, какие из них добавить — в отличие от старого
    автосинка, который добавлял их все без спроса.
    """
    guilds_resp = get_lolka_bot_guilds()
    if guilds_resp.get("error"):
        return guilds_resp

    db = SessionLocal()
    try:
        existing_ids = {s.server_id for s in db.query(Server.server_id).all()}
    finally:
        db.close()

    available = [g for g in guilds_resp.get("guilds", []) if g["id"] not in existing_ids]
    return {"guilds": available, "total": len(available)}


@app.post("/api/servers/sync-lolka")
def sync_lolka_servers():
    """
    Подтягивает свежие name/icon/member_count для Lolka-серверов, УЖЕ
    добавленных вручную в servers (platform='lolka'). Не создаёт новые
    записи — раньше это делало (auto-add по факту членства бота в гильдии),
    и в проде это привело к тому, что в дашборде сами всплывали серверы,
    которые администратор не добавлял (бот мог состоять в них по любой
    причине — тестовый сервер, кто-то пригласил и т.п.). Разделение прав
    "бот состоит в сервере" и "сервер подключён к дашборду Nova" — сознательное.
    """
    guilds_resp = get_lolka_bot_guilds()
    if guilds_resp.get("error"):
        return {"status": "error", "error": guilds_resp["error"]}

    db = SessionLocal()
    synced = 0
    errors = []
    try:
        guilds_by_id = {str(g.get("id", "")): g for g in guilds_resp.get("guilds", []) if g.get("id")}
        existing_servers = db.query(Server).filter(Server.platform == "lolka").all()

        for server in existing_servers:
            g = guilds_by_id.get(server.server_id)
            if not g:
                continue  # бот не(больше) не в этом сервере — оставляем запись как есть, не трогаем
            try:
                icon_url = g.get("icon") or ""
                server.name = g.get("name", server.name)
                server.icon_url = icon_url or server.icon_url
                server.member_count = g.get("member_count", server.member_count)
                db.flush()
                synced += 1
            except Exception as item_err:
                db.rollback()
                errors.append(f"{server.server_id}: {item_err}")
        db.commit()
        result = {"status": "ok", "synced": synced}
        if errors:
            result["errors"] = errors
        return result
    except Exception as e:
        db.rollback()
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


# ==================== VK: сообщества (groups) ====================
#
# ВАЖНО (см. документацию VK + разбор ТЗ): groups.get отдаёт группы
# ПОЛЬЗОВАТЕЛЯ, а не сообщества, где установлен бот. Единого метода
# "дай мне все паблики с ботом" в VK нет (в отличие от Lolka/Discord-like
# API, где есть /users/@me/guilds). Поэтому источник правды — таблица
# servers (platform='vk'): администратор добавляет ID сообщества вручную
# (форма на /dashboard/servers уже это умеет), а этот блок лишь
# ДОПОЛНЯЕТ уже сохранённые записи реальными name/icon/member_count
# через groups.getById.

VK_API_VERSION = "5.199"
VK_API_BASE = "https://api.vk.com/method"

_vk_groups_cache: dict = {}  # {cache_key: (expires_at, payload)}
_VK_CACHE_TTL = 300  # 5 минут, как рекомендовано в ТЗ


class VKAPIError(Exception):
    def __init__(self, code: int, message: str):
        self.code = code
        self.message = message
        super().__init__(f"VK API error {code}: {message}")


def _get_vk_access_token() -> str:
    token = os.getenv("VK_ACCESS_TOKEN", "")
    if not token:
        raise HTTPException(status_code=500, detail="VK_ACCESS_TOKEN не настроен на сервере")
    return token


def _call_vk_api(method: str, params: dict, max_retries: int = 3) -> dict:
    """
    Обёртка над VK API с обработкой rate limit (код ошибки 6) и таймаутов.
    Версия API (v) передаётся в каждом запросе, а не в OAuth-ссылке.
    """
    token = _get_vk_access_token()
    last_exc: Exception | None = None
    for attempt in range(max_retries):
        try:
            resp = requests.get(
                f"{VK_API_BASE}/{method}",
                params={**params, "access_token": token, "v": VK_API_VERSION},
                timeout=10,
            )
            data = resp.json()
            if "error" in data:
                error_code = data["error"].get("error_code")
                error_msg = data["error"].get("error_msg", "VK API error")
                if error_code == 6:  # Too many requests per second
                    time.sleep(0.5 * (attempt + 1))  # экспоненциальный backoff
                    continue
                raise VKAPIError(error_code, error_msg)
            return data.get("response", {})
        except requests.Timeout as e:
            last_exc = e
            if attempt == max_retries - 1:
                raise HTTPException(status_code=504, detail="VK API: превышено время ожидания")
            time.sleep(1)
    raise HTTPException(status_code=429, detail=f"VK API: превышен лимит запросов ({last_exc})")


def _vk_groups_by_ids(group_ids: list) -> list:
    """groups.getById принимает до 500 ID за один запрос — так что даже
    для большого списка серверов это один вызов, а не N запросов."""
    if not group_ids:
        return []
    response = _call_vk_api("groups.getById", {
        "group_ids": ",".join(str(g) for g in group_ids),
        "fields": "photo_200,members_count",
    })
    items = response if isinstance(response, list) else response.get("groups", [])
    return items


@app.get("/api/vk/groups")
def get_vk_groups(server_id: str = Query("")):
    """
    Информация о сообществах VK.
    - server_id указан -> данные по одному сообществу (не обязательно из БД).
    - server_id не указан -> данные по всем VK-сообществам, уже добавленным в servers.
    Результат кэшируется на 5 минут, чтобы не упираться в rate limit VK
    при частых обновлениях дашборда.
    """
    cache_key = server_id or "__all__"
    cached = _vk_groups_cache.get(cache_key)
    if cached and cached[0] > datetime.utcnow().timestamp():
        return cached[1]

    try:
        if server_id:
            group_ids = [server_id]
        else:
            db = SessionLocal()
            try:
                group_ids = [s.server_id for s in db.query(Server).filter(Server.platform == "vk").all()]
            finally:
                db.close()

        items = _vk_groups_by_ids(group_ids)
        result = {
            "groups": [
                {
                    "id": str(g.get("id")),
                    "name": g.get("name", "Без названия"),
                    "icon": g.get("photo_200"),
                    "member_count": g.get("members_count", 0),
                }
                for g in items
            ],
            "total": len(items),
        }
        _vk_groups_cache[cache_key] = (datetime.utcnow().timestamp() + _VK_CACHE_TTL, result)
        return result
    except VKAPIError as e:
        raise HTTPException(status_code=400, detail=f"VK API: {e.message}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка: {str(e)}")


def sync_vk_groups() -> dict:
    """Подтягивает name/icon/member_count из VK для уже сохранённых сообществ
    (platform='vk') и обновляет строки в servers. Новые сообщества сюда не
    добавляет — они появляются через ручное добавление на /dashboard/servers,
    поскольку VK не отдаёт единый список 'где установлен бот'."""
    db = SessionLocal()
    try:
        vk_servers = db.query(Server).filter(Server.platform == "vk").all()
        if not vk_servers:
            return {"status": "ok", "synced": 0}

        by_id = {s.server_id: s for s in vk_servers}
        try:
            items = _vk_groups_by_ids(list(by_id.keys()))
        except VKAPIError as e:
            return {"status": "error", "error": f"VK API: {e.message}"}

        synced = 0
        for g in items:
            server = by_id.get(str(g.get("id")))
            if not server:
                continue
            server.name = g.get("name", server.name)
            server.icon_url = g.get("photo_200") or server.icon_url
            server.member_count = g.get("members_count", server.member_count)
            synced += 1
        db.commit()
        _vk_groups_cache.clear()  # инвалидируем кэш после обновления
        return {"status": "ok", "synced": synced}
    except Exception as e:
        db.rollback()
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


@app.post("/api/servers/sync-vk")
def sync_vk_servers():
    """Ручной триггер обновления данных VK-сообществ (см. sync_vk_groups)."""
    return sync_vk_groups()


@app.post("/api/servers/sync-all")
def sync_all_platforms():
    """Синхронизировать серверы из ВСЕХ платформ (Lolka + VK) одним вызовом —
    именно так, как описано в ПРАВКЕ #1 ТЗ."""
    lolka_result = sync_lolka_servers()
    vk_result = sync_vk_groups()
    total = lolka_result.get("synced", 0) + vk_result.get("synced", 0)
    errors = [e for e in (lolka_result.get("error"), vk_result.get("error")) if e]
    return {
        "status": "ok" if not errors else "partial",
        "synced": total,
        "lolka": lolka_result,
        "vk": vk_result,
        "errors": errors,
    }


@app.get("/api/lolka/bot/invite")
def lolka_bot_invite(server_id: str = Query("")):
    """Ссылка авторизации для добавления бота на сервер.
    Реальный формат из портала разработчика Lolka: просто /bot-authorize?client_id=...
    (без redirect_uri/response_type/scope — это НЕ oauth2/authorize, у ботов свой,
    более простой эндпоинт установки)."""
    client_id = os.getenv("LOLKA_CLIENT_ID", "")
    if not client_id:
        return {"error": "LOLKA_CLIENT_ID не настроен на сервере"}
    return {"url": f"https://lolka.app/bot-authorize?client_id={client_id}"}


@app.post("/api/lolka/bot/add")
def add_lolka_bot(data: dict):
    """Совместимо со старой сигнатурой из ТЗ: возвращает ту же invite-ссылку"""
    server_id = data.get("server_id", "")
    return lolka_bot_invite(server_id=server_id)


@app.post("/api/lolka/bot/message/send")
def lolka_send_message(data: dict):
    """Отправить сообщение в канал от имени бота (не webhook, а REST bot API)"""
    channel_id = data.get("channel_id", "")
    content = data.get("content", "")
    if not channel_id or not content:
        return {"error": "channel_id и content обязательны"}
    if not os.getenv("LOLKA_BOT_TOKEN", ""):
        return {"error": "LOLKA_BOT_TOKEN не настроен"}
    try:
        resp = _lolka_bot_request(
            "POST", f"{LOLKA_BOT_BASE_URL}/channels/{channel_id}/messages",
            headers={**_lolka_bot_headers(), "Content-Type": "application/json"},
            json={"content": content},
        )
        if resp is None:
            return {"error": "Lolka API: превышен лимит запросов"}
        return {"status": "ok" if resp.ok else "error", "response": resp.json() if resp.content else {}}
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/lolka/bot/server/{server_id}/members")
def lolka_get_server_members(server_id: str):
    if not os.getenv("LOLKA_BOT_TOKEN", ""):
        return {"error": "LOLKA_BOT_TOKEN не настроен"}
    try:
        resp = _lolka_bot_request("GET", f"{LOLKA_BOT_BASE_URL}/guilds/{server_id}/members")
        if resp is None:
            return {"error": "Lolka API: превышен лимит запросов"}
        return {"status": "ok" if resp.ok else "error", "members": resp.json() if resp.ok else []}
    except Exception as e:
        return {"error": str(e)}


@app.put("/api/lolka/bot/member/{user_id}/role")
def lolka_add_member_role(user_id: str, data: dict):
    server_id = data.get("server_id", "")
    role_id = data.get("role_id", "")
    if not os.getenv("LOLKA_BOT_TOKEN", ""):
        return {"error": "LOLKA_BOT_TOKEN не настроен"}
    if not server_id or not role_id:
        return {"error": "server_id и role_id обязательны"}
    try:
        resp = _lolka_bot_request(
            "PUT", f"{LOLKA_BOT_BASE_URL}/guilds/{server_id}/members/{user_id}/roles/{role_id}",
        )
        if resp is None:
            return {"error": "Lolka API: превышен лимит запросов"}
        return {"status": "ok" if resp.ok else "error"}
    except Exception as e:
        return {"error": str(e)}


# ==================== Forward + AI ====================

forward_stats = []


def extract_urls(text: str) -> list:
    url_pattern = r'https?://[^\s]+'
    return re.findall(url_pattern, text)


def detect_content_type(url: str) -> str:
    url_lower = url.lower()
    
    video_domains = ['youtube.com', 'youtu.be', 'vk.com/video', 'rutube.ru', 'vimeo.com', 'tiktok.com']
    article_domains = ['habr.com', 'vc.ru', 'medium.com', 'tjournal.ru', 'dtf.ru', 'pikabu.ru']
    post_domains = ['t.me', 'vk.com/wall', 'twitter.com', 'x.com']
    music_domains = ['spotify.com', 'music.yandex.ru', 'music.apple.com', 'bandcamp.com', 'soundcloud.com']
    
    for d in video_domains:
        if d in url_lower: return 'videos'
    for d in article_domains:
        if d in url_lower: return 'articles'
    for d in post_domains:
        if d in url_lower: return 'posts'
    for d in music_domains:
        if d in url_lower: return 'music'
    
    return 'other'


def generate_ai_comment(url: str, content_type: str, platform: str = "Lolka", server_name: str = "") -> str:
    type_names = {'videos': 'видео', 'articles': 'статья', 'posts': 'пост', 'music': 'музыка', 'other': 'ссылка'}
    type_name = type_names.get(content_type, 'ссылка')
    
    if server_name:
        platform_context = f"в сообществе ВКонтакте «{server_name}»" if platform == "VK" else f"на сервере Lolka «{server_name}»"
    else:
        platform_context = "в сообществе ВКонтакте" if platform == "VK" else "на сервере Lolka"
    
    style = "дружелюбный, как в паблике VK" if platform == "VK" else "весёлый, энергичный, как в игровом сообществе"
    
    prompt = f"""Ты — дружелюбный AI-помощник {platform_context}.
Напиши короткий живой комментарий (1 предложение, до 15 слов) на русском языке, 
представляя эту {type_name}: {url}
Стиль: {style}, как будто ты делишься находкой с друзьями.
Не используй Markdown. Ответь просто текстом."""

    gemini_key = os.getenv("GEMINI_API_KEY", "")
    if gemini_key:
        try:
            resp = requests.post(f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}", json={"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 0.9, "maxOutputTokens": 50}}, timeout=8)
            if resp.ok:
                data = resp.json()
                text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                if text and len(text) > 5: return text.strip()
        except Exception as e: print(f"Gemini error: {e}")
    
    deepseek_key = os.getenv("DEEPSEEK_API_KEY", "")
    if deepseek_key:
        try:
            resp = requests.post("https://api.deepseek.com/v1/chat/completions", headers={"Authorization": f"Bearer {deepseek_key}", "Content-Type": "application/json"}, json={"model": "deepseek-chat", "messages": [{"role": "user", "content": prompt}], "max_tokens": 50, "temperature": 0.9}, timeout=10)
            if resp.ok:
                data = resp.json()
                text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                if text and len(text) > 5: return text.strip()
        except Exception as e: print(f"DeepSeek error: {e}")
    
    server_prefix = f"«{server_name}»" if server_name else ""
    if platform == "VK":
        fallback = {'videos': [f"Ребята из {server_prefix}, нашёл крутое видео!", f"Подписчики {server_prefix}, гляньте какое видео — огонь!", "ВК-шные, вот это находка — обязательно к просмотру!"], 'articles': [f"Для {server_prefix} — полезная статья!", f"Подписчикам {server_prefix} на заметку!", "Читайте, это важно для нашего паблика!"], 'posts': [f"Смотрите какой пост для {server_prefix}!", "ВК не спит — делюсь интересным постом!", "Для подписчиков — горячее обсуждение!"], 'music': [f"Для {server_prefix} — отличный трек!", "Подписчикам в плейлист — музыкальная находка!", "ВК, послушайте что я нашёл!"], 'other': [f"Для {server_prefix} — полезная ссылка!", "Подписчикам пригодится!", "ВК-паблик, смотрите что нашёл!"]}
    else:
        fallback = {'videos': [f"Эй, {server_prefix}, посмотрите какое видео!", "Ребята, это видео просто огонь — рекомендую!", "Вот это находка! Обязательно к просмотру."], 'articles': [f"{server_prefix}, нашёл статью которая стоит прочтения!", "Полезный материал — рекомендую ознакомиться!", "Статья дня — обязательно посмотрите!"], 'posts': [f"{server_prefix}, смотрите какой интересный пост!", "Вот это обсуждение — присоединяйтесь!", "Делюсь постом который вызвал бурю эмоций!"], 'music': [f"{server_prefix}, нашёл отличный трек для плейлиста!", "Послушайте какая музыка мне попалась!", "Этот трек сегодня в моём сердечке!"], 'other': [f"{server_prefix}, смотрите что я нашёл!", "Полезная ссылка для вас!", "Делюсь находкой — пригодится!"]}
    return random.choice(fallback.get(content_type, fallback['other']))


@app.post("/api/forward")
def forward_content(data: dict):
    message = data.get("message", "")
    webhooks = data.get("webhooks", [])
    platform = data.get("platform", "Lolka")
    server_name = data.get("serverName", "")
    avatar_url = data.get("avatar_url", "")
    
    urls = extract_urls(message)
    if not urls: return {"status": "error", "message": "Ссылки не найдены"}
    
    comment = message
    for url in urls: comment = comment.replace(url, '').replace('/forward', '').replace('/перешли', '').strip()
    
    results = []
    for url in urls:
        content_type = detect_content_type(url)
        ai_comment = generate_ai_comment(url, content_type, platform, server_name)
        full_message = f"{ai_comment}\n💬 {comment}\n{url}" if comment else f"{ai_comment}\n{url}"
        matching_webhooks = [w for w in webhooks if w.get("rules", {}).get(content_type, False)]
        if not matching_webhooks:
            results.append({"url": url, "type": content_type, "sent": False, "message": "Нет каналов для этого типа"})
            continue
        for wh in matching_webhooks:
            try:
                if wh.get("platform") == "lolka": send_to_lolka_webhook({"webhook_url": wh.get("url"), "message": full_message, "avatar_url": avatar_url})
                elif wh.get("platform") == "vk": send_to_vk({"group_id": wh.get("group_id"), "message": full_message})
                forward_stats.append({"url": url, "type": content_type, "platform": wh.get("platform"), "channel": wh.get("channel", ""), "timestamp": datetime.utcnow().isoformat()})
            except: pass
        results.append({"url": url, "type": content_type, "comment": ai_comment, "sent": True, "channels": len(matching_webhooks)})
    return {"status": "ok", "results": results, "total_urls": len(urls), "total_sent": sum(1 for r in results if r.get("sent"))}


@app.get("/api/forward/stats")
def get_forward_stats():
    if not forward_stats: return {"total": 0, "today": 0, "by_type": {}, "by_platform": {}, "recent": []}
    by_type = {}
    for s in forward_stats: t = s.get("type", "other"); by_type[t] = by_type.get(t, 0) + 1
    by_platform = {}
    for s in forward_stats: p = s.get("platform", "unknown"); by_platform[p] = by_platform.get(p, 0) + 1
    today = datetime.utcnow().strftime("%Y-%m-%d")
    recent = sorted(forward_stats, key=lambda x: x.get("timestamp", ""), reverse=True)[:10]
    return {"total": len(forward_stats), "today": len([s for s in forward_stats if s.get("timestamp", "").startswith(today)]), "by_type": by_type, "by_platform": by_platform, "recent": recent}


# ==================== Сканирование контента ====================

@app.post("/api/scan/content")
def scan_content(data: dict):
    platform = data.get("platform", "vk")
    group_id = data.get("group_id", "")
    min_likes = data.get("min_likes", 5)
    server_name = data.get("serverName", "")
    webhooks = data.get("webhooks", [])
    avatar_url = data.get("avatar_url", "")
    if platform != "vk" or not group_id: return {"status": "ok", "found": 0, "sent": 0}
    access_token = os.getenv("VK_ACCESS_TOKEN", "")
    if not access_token: return {"status": "ok", "found": 0, "sent": 0}
    try:
        resp = requests.get("https://api.vk.com/method/wall.get", params={"owner_id": f"-{group_id}", "count": 10, "filter": "owner", "access_token": access_token, "v": "5.199"}, timeout=10)
        data_resp = resp.json()
        if "error" in data_resp: return {"status": "ok", "found": 0, "sent": 0}
        posts = data_resp.get("response", {}).get("items", [])
    except: return {"status": "ok", "found": 0, "sent": 0}
    found = 0; sent = 0
    for post in posts:
        likes = post.get("likes", {}).get("count", 0); reposts = post.get("reposts", {}).get("count", 0)
        if likes + reposts < min_likes: continue
        found += 1
        post_url = f"https://vk.com/wall-{group_id}_{post.get('id')}"
        content_type = "posts"
        for att in post.get("attachments", []):
            t = att.get("type", "")
            if t == "video": content_type = "videos"
            elif t == "link": content_type = "articles"
            elif t == "audio": content_type = "music"
        matching = [w for w in webhooks if w.get("rules", {}).get(content_type, False)]
        if matching:
            ai = generate_ai_comment(post_url, content_type, "VK", server_name)
            msg = f"🔥 Популярное ({likes}👍):\n{ai}\n{post_url}"
            for wh in matching:
                try:
                    if wh.get("platform") == "vk": send_to_vk({"group_id": wh.get("group_id"), "message": msg})
                    elif wh.get("platform") == "lolka": send_to_lolka_webhook({"webhook_url": wh.get("url"), "message": msg, "avatar_url": avatar_url})
                    sent += 1
                except: pass
    return {"status": "ok", "found": found, "sent": sent, "total_posts": len(posts)}


@app.get("/api/scan/auto")
def auto_scan():
    return {"status": "ok", "message": "Автосканирование работает", "timestamp": datetime.utcnow().isoformat()}


# ==================== Логи и статистика вебхуков ====================

webhook_logs = []


@app.get("/api/webhooks/logs")
def get_webhook_logs(webhook_id: str = Query(""), limit: int = 20):
    """Логи отправленных сообщений через вебхуки"""
    logs = webhook_logs
    if webhook_id:
        logs = [l for l in logs if l.get("webhook_id") == webhook_id]
    return {
        "logs": sorted(logs, key=lambda x: x.get("timestamp", ""), reverse=True)[:limit],
        "total": len(logs)
    }


@app.get("/api/webhooks/stats")
def get_webhook_stats(webhook_id: str = Query("")):
    """Статистика по вебхуку"""
    logs = webhook_logs
    if webhook_id:
        logs = [l for l in logs if l.get("webhook_id") == webhook_id]
    
    today = datetime.utcnow().strftime("%Y-%m-%d")
    today_logs = [l for l in logs if l.get("timestamp", "").startswith(today)]
    
    return {
        "total_sent": len(logs),
        "today_sent": len(today_logs),
        "last_sent": logs[0].get("timestamp") if logs else None
    }


@app.post("/api/webhooks/auto-forward")
def auto_forward(data: dict):
    """Автоматический кросс-постинг между платформами"""
    source_platform = data.get("source_platform", "")
    message = data.get("message", "")
    source_channel = data.get("channel", "")
    source_server = data.get("server_name", "")
    
    # Ищем все активные вебхуки
    db = SessionLocal()
    try:
        # Получаем настройки авто-форварда
        config = db.query(ModuleConfig).filter(
            ModuleConfig.module_name == "auto_forward"
        ).first()
        
        if not config or not config.is_enabled:
            return {"status": "disabled"}
        
        import json
        rules = json.loads(config.config) if config.config else {}
        
        if not rules.get("enabled"):
            return {"status": "disabled"}
        
        # Определяем платформу-назначение
        target_platform = "vk" if source_platform.lower() == "lolka" else "lolka"
        
        if not rules.get(f"from_{source_platform.lower()}_to_{target_platform}"):
            return {"status": "skipped", "reason": "rule not enabled"}
        
        # Находим вебхуки для целевой платформы
        from models import Server
        servers = db.query(Server).all()
        
        sent_count = 0
        for server in servers:
            if server.webhook_url and target_platform == "lolka":
                try:
                    formatted_msg = f"📢 **Из {source_platform.upper()}**\n{source_server}: {message}"
                    requests.post(server.webhook_url, json={
                        "content": formatted_msg,
                        "username": "Нова 🔄"
                    }, timeout=10)
                    sent_count += 1
                    
                    webhook_logs.append({
                        "webhook_id": str(server.id),
                        "message": formatted_msg[:100],
                        "platform": target_platform,
                        "timestamp": datetime.utcnow().isoformat()
                    })
                except:
                    pass
        
        return {"status": "ok", "sent": sent_count}
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()


@app.get("/api/webhooks/auto-forward/config")
def get_auto_forward_config(server_id: str = Query("default")):
    """Получить настройки авто-форварда"""
    db = SessionLocal()
    try:
        server = db.query(Server).filter(Server.server_id == server_id).first()
        if server:
            config = db.query(ModuleConfig).filter(
                ModuleConfig.server_id == server.id,
                ModuleConfig.module_name == "auto_forward"
            ).first()
            if config:
                import json
                try:
                    return {"config": json.loads(config.config)}
                except Exception:
                    pass

        return {"config": {
            "enabled": False,
            "from_lolka_to_vk": True,
            "from_vk_to_lolka": True,
            "include_source": True,
            "filter_empty": True,
        }}
    finally:
        db.close()


@app.post("/api/webhooks/auto-forward/config")
def save_auto_forward_config(data: dict):
    """Сохранить настройки авто-форварда"""
    db = SessionLocal()
    try:
        server_id = data.get("server_id", "default")
        config_data = data.get("config", {})

        server = _get_server_or_error(db, server_id)
        if not server:
            return {"error": "Сервер не найден. Сначала добавьте его на странице /dashboard/servers."}

        existing = db.query(ModuleConfig).filter(
            ModuleConfig.server_id == server.id,
            ModuleConfig.module_name == "auto_forward"
        ).first()
        
        import json
        config_json = json.dumps(config_data)
        
        if existing:
            existing.config = config_json
        else:
            new_config = ModuleConfig(
                server_id=server.id,
                module_name="auto_forward",
                is_enabled=True,
                config=config_json
            )
            db.add(new_config)
        
        db.commit()
        return {"status": "saved"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


# ==================== Отчёты ====================

@app.get("/api/analytics/reports")
def get_reports_config(server_id: str = Query("default")):
    """Получить настройки отчётов"""
    db = SessionLocal()
    try:
        server = db.query(Server).filter(Server.server_id == server_id).first()
        if server:
            config = db.query(ModuleConfig).filter(
                ModuleConfig.server_id == server.id,
                ModuleConfig.module_name == "reports"
            ).first()
            if config:
                import json
                try:
                    return {"config": json.loads(config.config)}
                except Exception:
                    pass

        return {"config": {
            "enabled": False,
            "channel": "",
            "webhook_url": "",
            "daily_time": "09:00",
            "weekly_day": "monday",
            "weekly_time": "10:00",
            "monthly_day": 1,
            "monthly_time": "10:00",
            "include_servers": True,
            "include_users": True,
            "include_messages": True,
            "include_top_commands": True,
        }}
    finally:
        db.close()


@app.post("/api/analytics/reports")
def save_reports_config(data: dict):
    """Сохранить настройки отчётов"""
    db = SessionLocal()
    try:
        server_id = data.get("server_id", "default")
        config_data = data.get("config", {})

        server = _get_server_or_error(db, server_id)
        if not server:
            return {"error": "Сервер не найден. Сначала добавьте его на странице /dashboard/servers."}

        existing = db.query(ModuleConfig).filter(
            ModuleConfig.server_id == server.id,
            ModuleConfig.module_name == "reports"
        ).first()
        
        import json
        config_json = json.dumps(config_data)
        
        if existing:
            existing.config = config_json
        else:
            new_config = ModuleConfig(
                server_id=server.id,
                module_name="reports",
                is_enabled=True,
                config=config_json
            )
            db.add(new_config)
        
        db.commit()
        return {"status": "saved"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


@app.post("/api/analytics/reports/send")
def send_report(data: dict):
    """Отправить отчёт вручную (тест) или по крону"""
    webhook_url = data.get("webhook_url", "")
    report_type = data.get("type", "daily")
    
    if not webhook_url:
        return {"error": "webhook_url required"}
    
    db = SessionLocal()
    try:
        servers_count = db.query(Server).count()
        users_count = 0
        try:
            from models import Member
            users_count = db.query(Member).count()
        except:
            pass
        
        today = datetime.utcnow().strftime("%d.%m.%Y")
        
        if report_type == "daily":
            title = f"📊 Ежедневный отчёт • {today}"
        elif report_type == "weekly":
            title = f"📈 Еженедельный отчёт • {today}"
        else:
            title = f"📅 Ежемесячный отчёт • {today}"
        
        message = f"""**{title}**

🖥️ **Серверы:** {servers_count}
👥 **Пользователи:** {users_count}
💬 **Сообщений за период:** 0
⭐ **Новых пользователей:** 0

⚡ **Powered by Nova Bot**"""
        
        resp = requests.post(webhook_url, json={
            "content": message,
            "username": "Нова 📊"
        }, timeout=10)
        
        return {"status": "ok", "sent": resp.ok}
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()


# ==================== Музыкальные провайдеры ====================

RADIO_STATIONS = {
    "yandex_radio": {"name": "Яндекс.Радио", "icon": "📻", "url": "https://radio.yandex.ru", "stream": "https://radio.yandex.ru/radio"},
    "record": {"name": "Radio Record", "icon": "🎵", "url": "https://www.radiorecord.ru", "stream": "https://radiorecord.ru/player"},
    "dfm": {"name": "DFM", "icon": "📡", "url": "https://dfm.ru/online", "stream": "https://dfm.ru/player"},
    "europa_plus": {"name": "Европа Плюс", "icon": "📻", "url": "https://europaplus.ru", "stream": "https://europaplus.ru/player"},
    "nashe": {"name": "Наше Радио", "icon": "🎸", "url": "https://www.nashe.ru", "stream": "https://www.nashe.ru/player"},
    "relax_fm": {"name": "Relax FM", "icon": "🎧", "url": "https://relax-fm.ru", "stream": "https://relax-fm.ru/player"},
    "like_fm": {"name": "Like FM", "icon": "🔊", "url": "https://likefm.ru", "stream": "https://likefm.ru/player"},
    "shanson": {"name": "Радио Шансон", "icon": "🎹", "url": "https://radioshanson.ru", "stream": "https://radioshanson.ru/player"},
}


def _parse_channels(raw) -> list:
    """channels может прийти как JSON-строка из БД, список из фронта, или строка через запятую"""
    import json
    if isinstance(raw, list):
        return [c.strip() for c in raw if isinstance(c, str) and c.strip()]
    if isinstance(raw, str):
        if not raw:
            return []
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return [c.strip() for c in parsed if isinstance(c, str) and c.strip()]
        except Exception:
            pass
        return [c.strip() for c in raw.split(",") if c.strip()]
    return []


@app.get("/api/music/providers")
def get_music_providers(server_id: str = Query("default")):
    db = SessionLocal()
    try:
        providers = db.query(MusicProvider).filter(MusicProvider.server_id == server_id).all()
        return {
            "providers": [
                {
                    "id": p.id,
                    "type": p.provider_type,
                    "name": p.name,
                    "hasKey": bool(p.api_key),
                    "enabled": p.is_enabled,
                    "streamUrl": p.stream_url or "",
                    "channels": _parse_channels(p.channels),
                }
                for p in providers
            ],
            "available_types": [
                {"value": "youtube", "label": "YouTube Music", "icon": "▶️", "category": "search"},
                {"value": "yandex", "label": "Яндекс.Музыка", "icon": "🎧", "category": "search"},
                {"value": "vk", "label": "VK Музыка", "icon": "💙", "category": "search"},
                {"value": "soundcloud", "label": "SoundCloud", "icon": "☁️", "category": "search"},
                {"value": "yandex_radio", "label": "Яндекс.Радио", "icon": "📻", "category": "radio"},
                {"value": "record", "label": "Radio Record", "icon": "🎵", "category": "radio"},
                {"value": "dfm", "label": "DFM", "icon": "📡", "category": "radio"},
                {"value": "europa_plus", "label": "Европа Плюс", "icon": "📻", "category": "radio"},
                {"value": "nashe", "label": "Наше Радио", "icon": "🎸", "category": "radio"},
                {"value": "relax_fm", "label": "Relax FM", "icon": "🎧", "category": "radio"},
                {"value": "like_fm", "label": "Like FM", "icon": "🔊", "category": "radio"},
                {"value": "shanson", "label": "Радио Шансон", "icon": "🎹", "category": "radio"},
                {"value": "custom", "label": "Свой Webhook", "icon": "🔗", "category": "custom"}
            ]
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()


@app.post("/api/music/providers")
def add_music_provider(data: dict):
    import json
    db = SessionLocal()
    try:
        provider_type = data["type"]
        stream_url = data.get("stream_url", "")
        if provider_type in RADIO_STATIONS:
            stream_url = RADIO_STATIONS[provider_type]["stream"]

        channels = _parse_channels(data.get("channels", []))

        provider = MusicProvider(
            server_id=data.get("server_id", "default"),
            provider_type=provider_type,
            name=data.get("name", RADIO_STATIONS.get(provider_type, {}).get("name", "Мой провайдер")),
            api_key=data.get("api_key", ""),
            webhook_url=data.get("webhook_url", ""),
            stream_url=stream_url,
            channels=json.dumps(channels, ensure_ascii=False),
        )
        db.add(provider)
        db.commit()
        db.refresh(provider)
        return {"status": "created", "id": provider.id}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


@app.put("/api/music/providers/{provider_id}")
def update_music_provider(provider_id: int, data: dict):
    """Редактирование провайдера — например, замена каналов или API-ключа без пересоздания"""
    import json
    db = SessionLocal()
    try:
        provider = db.query(MusicProvider).filter(MusicProvider.id == provider_id).first()
        if not provider:
            return {"error": "Провайдер не найден"}

        if "name" in data:
            provider.name = data["name"]
        if "api_key" in data:
            provider.api_key = data["api_key"]
        if "webhook_url" in data:
            provider.webhook_url = data["webhook_url"]
        if "enabled" in data:
            provider.is_enabled = data["enabled"]
        if "channels" in data:
            provider.channels = json.dumps(_parse_channels(data["channels"]), ensure_ascii=False)

        db.commit()
        return {"status": "updated"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


@app.delete("/api/music/providers/{provider_id}")
def delete_music_provider(provider_id: int):
    db = SessionLocal()
    try:
        db.query(MusicProvider).filter(MusicProvider.id == provider_id).delete()
        db.commit()
        return {"status": "deleted"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


# ==================== События (Events) ====================

EVENT_TEMPLATES = {
    "raid": {"name": "⚔️ Рейд", "icon": "⚔️", "duration_hours": 2, "max_players": 20, "color": "#EF4444"},
    "farm": {"name": "🎯 Фарм", "icon": "🎯", "duration_hours": 1, "max_players": 10, "color": "#F59E0B"},
    "meeting": {"name": "🤝 Встреча", "icon": "🤝", "duration_hours": 1, "max_players": 0, "color": "#3B82F6"},
    "event": {"name": "🎉 Ивент", "icon": "🎉", "duration_hours": 3, "max_players": 0, "color": "#A855F7"},
    "tournament": {"name": "🏆 Турнир", "icon": "🏆", "duration_hours": 4, "max_players": 32, "color": "#F59E0B"},
    "custom": {"name": "📝 Своё", "icon": "📝", "duration_hours": 1, "max_players": 0, "color": "#00E5FF"},
}


@app.get("/api/events")
def get_events(server_id: str = Query("default")):
    """Список событий"""
    db = SessionLocal()
    try:
        events = db.query(Event).filter(
            Event.server_id == server_id,
            Event.event_date >= datetime.utcnow()
        ).order_by(Event.event_date.asc()).all()
        
        return {
            "events": [
                {
                    "id": e.id,
                    "title": e.title,
                    "description": e.description,
                    "event_date": e.event_date.isoformat(),
                    "template": e.template,
                    "channel": e.channel,
                    "max_participants": e.max_participants,
                    "created_by": e.created_by,
                    "participants": 0,
                }
                for e in events
            ],
            "templates": [
                {"value": k, "name": v["name"], "icon": v["icon"], "max_players": v["max_players"], "duration_hours": v["duration_hours"]}
                for k, v in EVENT_TEMPLATES.items()
            ]
        }
    finally:
        db.close()


@app.post("/api/events")
def create_event(data: dict):
    """Создать событие"""
    db = SessionLocal()
    try:
        event = Event(
            server_id=data.get("server_id", "default"),
            title=data["title"],
            description=data.get("description", ""),
            event_date=datetime.fromisoformat(data["event_date"].replace("Z", "+00:00")),
            template=data.get("template", "custom"),
            channel=data.get("channel", ""),
            webhook_url=data.get("webhook_url", ""),
            max_participants=data.get("max_participants", 0),
            created_by=data.get("created_by", "Admin"),
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return {"status": "created", "id": event.id}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


@app.delete("/api/events/{event_id}")
def delete_event(event_id: int):
    """Удалить событие"""
    db = SessionLocal()
    try:
        db.query(Event).filter(Event.id == event_id).delete()
        db.commit()
        return {"status": "deleted"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


@app.post("/api/events/{event_id}/notify")
def notify_event(event_id: int, data: dict):
    """Отправить уведомление о событии в канал"""
    db = SessionLocal()
    try:
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            return {"error": "Event not found"}
        
        webhook_url = data.get("webhook_url", event.webhook_url)
        if not webhook_url:
            return {"error": "webhook_url required"}
        
        template = EVENT_TEMPLATES.get(event.template, EVENT_TEMPLATES["custom"])
        date_str = event.event_date.strftime("%d.%m.%Y в %H:%M")
        
        message = f"""**{template['icon']} {event.title}**

📅 **Дата:** {date_str}
⏱️ **Длительность:** {template['duration_hours']} ч
{f"👥 **Мест:** {event.max_participants}" if event.max_participants > 0 else "👥 **Безлимит**"}
📋 **Канал:** {event.channel or 'Не указан'}

{event.description}

⚡ **Организатор:** {event.created_by}"""
        
        resp = requests.post(webhook_url, json={
            "content": message,
            "username": "Нова 🗓️"
        }, timeout=10)
        
        return {"status": "ok", "sent": resp.ok}
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()


# ==================== Статистика ====================

@app.get("/api/stats")
def get_public_stats():
    """Публичная статистика для лендинга — только реальные данные"""
    db = SessionLocal()
    try:
        servers_count = db.query(Server).count()
        users_count = 0
        
        try:
            from models import Member
            users_count = db.query(Member).count()
        except Exception:
            pass
        
        return {
            "servers": servers_count or 0,
            "users": users_count,
            "responseTime": 0.8,
            "webhooksOnline": True
        }
    except Exception as e:
        print(f"Stats error: {e}")
        return {
            "servers": 0,
            "users": 0,
            "responseTime": 0.8,
            "webhooksOnline": True
        }
    finally:
        db.close()


@app.get("/api/stats/dashboard")
def get_dashboard_stats():
    return {"totalMessages": 0, "activeUsers": 0, "commandsUsed": 0, "voiceHours": 0, "onlineNow": 0, "newUsers": 0, "messagesChart": [0,0,0,0,0,0,0], "recentActivity": [], "topCommands": [], "serversCount": 0}





# ==================== Вебхуки (CRUD) ====================

@app.get("/api/webhooks")
def get_webhooks(server_id: str = Query(...)):
    """Список вебхуков конкретного сервера."""
    db = SessionLocal()
    try:
        hooks = db.query(Webhook).filter(Webhook.server_id == server_id).order_by(Webhook.created_at.desc()).all()
        return {
            "webhooks": [
                {
                    "id": h.id,
                    "server_id": h.server_id,
                    "platform": h.platform,
                    "project": h.project,
                    "url": h.url,
                    "event": h.event,
                    "active": h.is_active,
                }
                for h in hooks
            ]
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()


@app.post("/api/webhooks")
def create_webhook(data: dict):
    """Создать вебхук. Обязательные поля: server_id, platform, project, url."""
    db = SessionLocal()
    try:
        server_id = data.get("server_id", "")
        url = data.get("url", "").strip()
        if not server_id or not url:
            return {"error": "server_id и url обязательны"}
        if not (url.startswith("http://") or url.startswith("https://")):
            return {"error": "URL должен начинаться с http:// или https://"}

        hook = Webhook(
            server_id=server_id,
            platform=data.get("platform", "vk"),
            project=data.get("project", ""),
            url=url,
            event=data.get("event", ""),
            is_active=True,
        )
        db.add(hook)
        db.commit()
        db.refresh(hook)
        return {
            "status": "created",
            "webhook": {
                "id": hook.id, "server_id": hook.server_id, "platform": hook.platform,
                "project": hook.project, "url": hook.url, "event": hook.event, "active": hook.is_active,
            },
        }
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


@app.put("/api/webhooks/{webhook_id}")
def update_webhook(webhook_id: int, data: dict):
    """Обновить вебхук — например, переключить active."""
    db = SessionLocal()
    try:
        hook = db.query(Webhook).filter(Webhook.id == webhook_id).first()
        if not hook:
            return {"error": "Вебхук не найден"}
        if "active" in data:
            hook.is_active = bool(data["active"])
        if "url" in data:
            hook.url = data["url"]
        if "project" in data:
            hook.project = data["project"]
        if "event" in data:
            hook.event = data["event"]
        db.commit()
        return {"status": "updated"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


@app.delete("/api/webhooks/{webhook_id}")
def delete_webhook(webhook_id: int):
    db = SessionLocal()
    try:
        db.query(Webhook).filter(Webhook.id == webhook_id).delete()
        db.commit()
        return {"status": "deleted"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


@app.get("/api/ranking/members")
def get_ranking_members():
    """Возвращает список участников рейтинга"""
    return {
        "members": [
            {"name": "🦊 Лисёнок", "level": 42, "xp": 15420, "rank": 1, "avatar": "🦊", "messages": 2400, "voiceHours": 120, "reactions": 856},
            {"name": "🐉 Dragon", "level": 38, "xp": 12800, "rank": 2, "avatar": "🐉", "messages": 1800, "voiceHours": 95, "reactions": 620},
            {"name": "⭐ StarUser", "level": 27, "xp": 7650, "rank": 3, "avatar": "⭐", "messages": 1200, "voiceHours": 60, "reactions": 340}
        ],
        "total": 3
    }


# ==================== Модерация (ТЗ №4) ====================

PERIOD_DELTAS = {
    "24h": timedelta(hours=24),
    "7d": timedelta(days=7),
    "30d": timedelta(days=30),
}


@app.get("/api/moderation/stats")
async def get_moderation_stats(
    server_id: int = Query(...),
    platform: str = Query("vk"),
    period: str = Query("7d")
):
    """
    Получить статистику модерации для сервера за период (24h/7d/30d, по умолчанию 7d).
    ЧЕСТНОЕ ПУСТОЕ СОСТОЯНИЕ: если событий нет — вернуть нули/пустые массивы.
    """
    db = SessionLocal()
    try:
        delta = PERIOD_DELTAS.get(period, PERIOD_DELTAS["7d"])
        since = datetime.utcnow() - delta

        events = db.query(ModerationEvent).filter(
            ModerationEvent.server_id == server_id,
            ModerationEvent.platform == platform,
            ModerationEvent.created_at >= since
        ).all()

        blocked = sum(1 for e in events if e.type == "blocked_message")
        warnings = sum(1 for e in events if e.type == "warning")
        captcha = sum(1 for e in events if e.type == "captcha_passed")

        recent_events = sorted(events, key=lambda x: x.created_at, reverse=True)[:5]

        return {
            "stats": {
                "blocked": blocked,
                "warnings": warnings,
                "captcha_solved": captcha,
                "total_events": len(events)
            },
            "recent_events": [
                {
                    "type": e.type,
                    "title": e.title,
                    "description": e.description,
                    "created_at": e.created_at.isoformat()
                }
                for e in recent_events
            ],
           "platform": platform,
            "period": period
        }
    finally:
        db.close()


# ═══════════════════════════════════════════════════════════════════════════════
# ══ ТЗ №5: VK Bot API интеграция + Движок автомодерации ═══════════════════════
# ═══════════════════════════════════════════════════════════════════════════════


# ── Moderation Config & Log ───────────────────────────────────────────────────

@app.get("/api/moderation/config")
def get_moderation_config(server_id: str = Query(...)):
    """Получить конфигурацию автомодерации для сервера (из ModuleConfig)."""
    db = SessionLocal()
    try:
        server = db.query(Server).filter(Server.server_id == server_id).first()
        if not server:
            return {"config": {}}
        mod = db.query(ModuleConfig).filter(
            ModuleConfig.server_id == server.id,
            ModuleConfig.module_name == "moderation"
        ).first()
        if mod and mod.config:
            import json
            try:
                return {"config": json.loads(mod.config)}
            except Exception:
                pass
        return {"config": {}}
    finally:
        db.close()


@app.post("/api/moderation/config")
def save_moderation_config(data: dict):
    """Сохранить конфигурацию автомодерации."""
    db = SessionLocal()
    try:
        server_id = data.get("server_id", "")
        config = data.get("config", {})

        server = _get_server_or_error(db, server_id)
        if not server:
            return {"error": "Сервер не найден"}

        import json
        existing = db.query(ModuleConfig).filter(
            ModuleConfig.server_id == server.id,
            ModuleConfig.module_name == "moderation"
        ).first()

        if existing:
            existing.config = json.dumps(config, ensure_ascii=False)
            existing.is_enabled = True
        else:
            db.add(ModuleConfig(
                server_id=server.id,
                module_name="moderation",
                is_enabled=True,
                config=json.dumps(config, ensure_ascii=False)
            ))
        db.commit()
        return {"status": "saved"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


@app.get("/api/moderation/log")
def get_moderation_log(server_id: str = Query(...), limit: int = Query(50)):
    """Журнал событий модерации из БД."""
    db = SessionLocal()
    try:
        server = db.query(Server).filter(Server.server_id == server_id).first()
        if not server:
            return {"entries": [], "total": 0}

        events = db.query(ModerationEvent).filter(
            ModerationEvent.server_id == server.id
        ).order_by(ModerationEvent.created_at.desc()).limit(limit).all()

        return {
            "entries": [
                {
                    "id": e.id,
                    "type": e.type,
                    "title": e.title,
                    "description": e.description,
                    "target_user_id": e.target_user_id or "",
                    "target_message_id": e.target_message_id or "",
                    "created_at": e.created_at.isoformat() if e.created_at else None,
                }
                for e in events
            ],
            "total": len(events)
        }
    finally:
        db.close()


# ── VK Connections (CRUD) ─────────────────────────────────────────────────────

@app.get("/api/vk/connections")
def get_vk_connections(server_id: str = Query(...)):
    """Список подключённых VK-сообществ для сервера."""
    db = SessionLocal()
    try:
        server = db.query(Server).filter(Server.server_id == server_id).first()
        if not server:
            return {"connections": []}

        connections = db.query(VKConnection).filter(
            VKConnection.server_id == server.id
        ).all()

        return {
            "connections": [
                {
                    "id": c.id,
                    "group_id": c.group_id,
                    "group_name": c.group_name,
                    "is_active": c.is_active,
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                }
                for c in connections
            ]
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()


@app.post("/api/vk/connections")
def create_vk_connection(data: VKConnectRequest):
    """
    Подключить VK-сообщество к серверу.
    Проверяет токен через groups.getById перед сохранением.
    """
    db = SessionLocal()
    try:
        server = db.query(Server).filter(Server.server_id == data.server_id).first()
        if not server:
            return {"error": "Сервер не найден"}

        # Нормализуем group_id
        group_id = data.group_id.strip().lstrip("-").replace("club", "").replace("public", "")
        if not group_id.isdigit():
            return {"error": "group_id должен быть числом (например 240082352)"}

        # Проверяем токен — вызываем VK API
        try:
            service = VKBotService(data.access_token)
            group_info = service.get_group_info(group_id)
            group_name = group_info.get("name", "")
        except VKAPIError as e:
            return {"error": f"Невалидный токен или group_id: {e.message}"}
        except Exception as e:
            return {"error": f"Ошибка проверки токена: {str(e)}"}

        # Проверяем, нет ли уже такого подключения
        existing = db.query(VKConnection).filter(
            VKConnection.server_id == server.id,
            VKConnection.group_id == group_id
        ).first()

        if existing:
            # Обновляем токен
            existing.access_token = data.access_token
            existing.webhook_secret = data.webhook_secret
            existing.confirmation_code = data.confirmation_code
            existing.group_name = group_name
            existing.is_active = True
            existing.updated_at = datetime.utcnow()
            db.commit()
            return {"status": "updated", "connection_id": existing.id, "group_name": group_name}

        # Создаём новое подключение
        conn = VKConnection(
            server_id=server.id,
            group_id=group_id,
            group_name=group_name,
            access_token=data.access_token,
            webhook_secret=data.webhook_secret,
            confirmation_code=data.confirmation_code,
            is_active=True,
        )
        db.add(conn)
        db.commit()
        db.refresh(conn)

        return {
            "status": "created",
            "connection_id": conn.id,
            "group_id": group_id,
            "group_name": group_name,
        }
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


@app.delete("/api/vk/connections/{connection_id}")
def delete_vk_connection(connection_id: int):
    """Отключить VK-сообщество от сервера."""
    db = SessionLocal()
    try:
        conn = db.query(VKConnection).filter(VKConnection.id == connection_id).first()
        if not conn:
            return {"error": "Подключение не найдено"}

        # Удаляем сервис из кэша
        clear_vk_service(conn.access_token)

        db.delete(conn)
        db.commit()
        return {"status": "deleted"}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


@app.post("/api/vk/connections/{connection_id}/test")
def test_vk_connection(connection_id: int):
    """Проверить, что токен всё ещё валиден."""
    db = SessionLocal()
    try:
        conn = db.query(VKConnection).filter(VKConnection.id == connection_id).first()
        if not conn:
            return {"error": "Подключение не найдено"}

        service = get_vk_service(conn.access_token)
        info = service.get_group_info(conn.group_id)

        return {
            "status": "ok",
            "group_name": info.get("name"),
            "members_count": info.get("members_count"),
            "is_active": True,
        }
    except VKAPIError as e:
        return {"status": "error", "error": e.message, "code": e.code}
    except Exception as e:
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


# ── Callback API Webhook ──────────────────────────────────────────────────────

@app.post("/api/vk/callback")
async def vk_callback(request: Request):
    """
    Callback API от VK.
    VK отправляет сюда события: confirmation, message_new, wall_reply_new и т.д.
    """
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"error": "invalid_json"})

    event_type = body.get("type", "")
    group_id = str(body.get("group_id", ""))

    # Находим подключение по group_id
    db = SessionLocal()
    try:
        conn = db.query(VKConnection).filter(
            VKConnection.group_id == group_id,
            VKConnection.is_active == True
        ).first()

        if not conn:
            if event_type == "confirmation":
                return PlainTextResponse("ok")
            return JSONResponse(status_code=404, content={"error": "group_not_found"})

        # Проверяем секрет (если настроен)
        secret = body.get("secret", "")
        if conn.webhook_secret and secret != conn.webhook_secret:
            return JSONResponse(status_code=403, content={"error": "invalid_secret"})

        # ── Confirmation ──────────────────────────────────────────────
        if event_type == "confirmation":
            return PlainTextResponse(conn.confirmation_code or "ok")

        # ── Message new (автомодерация) ─────────────────────────────
        if event_type == "message_new":
            obj = body.get("object", {})
            message = obj.get("message", {})

            msg_id = message.get("id")
            peer_id = message.get("peer_id")
            from_id = message.get("from_id")
            text = message.get("text", "")

            # Логируем получение
            log_event = ModerationEvent(
                server_id=conn.server_id,
                platform="vk",
                type="message_received",
                title=f"Сообщение от {from_id}",
                description=text[:200],
                target_user_id=str(from_id) if from_id else "",
                target_message_id=str(msg_id) if msg_id else "",
            )
            db.add(log_event)
            db.commit()

            # Загружаем конфиг автомодерации
            import json
            mod_config_row = db.query(ModuleConfig).filter(
                ModuleConfig.server_id == conn.server_id,
                ModuleConfig.module_name == "moderation"
            ).first()
            config = {}
            if mod_config_row and mod_config_row.config:
                try:
                    config = json.loads(mod_config_row.config)
                except Exception:
                    pass

            # Проверяем движком
            result = _moderation_engine.check_message(from_id, text, config)
            if result:
                service = get_vk_service(conn.access_token)
                action_result = service.moderate_message(
                    group_id=conn.group_id,
                    message_id=msg_id,
                    action=result.action,
                    user_id=from_id,
                    reason=result.reason,
                )

                # Логируем действие модерации
                action_event = ModerationEvent(
                    server_id=conn.server_id,
                    platform="vk",
                    type=f"{result.action}_message",
                    title=result.reason,
                    description=f"Правило: {result.rule}",
                    target_user_id=str(from_id) if from_id else "",
                    target_message_id=str(msg_id) if msg_id else "",
                )
                db.add(action_event)
                db.commit()

            return JSONResponse(content={"status": "ok"})

        # ── Group join / leave ────────────────────────────────────────
        if event_type == "group_join":
            user_id = body.get("object", {}).get("user_id")
            log_event = ModerationEvent(
                server_id=conn.server_id,
                platform="vk",
                type="user_joined",
                title=f"Пользователь {user_id} вступил в группу",
                description="",
                target_user_id=str(user_id) if user_id else "",
            )
            db.add(log_event)
            db.commit()
            return JSONResponse(content={"status": "ok"})

        if event_type == "group_leave":
            user_id = body.get("object", {}).get("user_id")
            log_event = ModerationEvent(
                server_id=conn.server_id,
                platform="vk",
                type="user_left",
                title=f"Пользователь {user_id} покинул группу",
                description="",
                target_user_id=str(user_id) if user_id else "",
            )
            db.add(log_event)
            db.commit()
            return JSONResponse(content={"status": "ok"})

        # Для всех остальных типов — просто ок
        return JSONResponse(content={"status": "ok"})

    except Exception as e:
        db.rollback()
        print(f"❌ VK Callback error: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
    finally:
        db.close()


# ── Прямые методы модерации (ручной вызов из дашборда) ───────────────────────

@app.post("/api/vk/moderate")
def vk_moderate(data: VKModerateRequest):
    """
    Ручная модерация: удалить сообщение, забанить, предупредить, замьютить.
    Вызывается из дашборда модерации (журнал).
    """
    db = SessionLocal()
    try:
        conn = db.query(VKConnection).filter(
            VKConnection.group_id == data.group_id,
            VKConnection.is_active == True
        ).first()

        if not conn:
            return {"error": "VK-сообщество не подключено"}

        service = get_vk_service(conn.access_token)
        result = service.moderate_message(
            group_id=data.group_id,
            message_id=data.message_id,
            action=data.action,
            user_id=data.user_id,
            reason=data.reason,
        )

        # Логируем действие модерации
        if result.get("success"):
            log_event = ModerationEvent(
                server_id=conn.server_id,
                platform="vk",
                type=f"{data.action}_message",
                title=f"{data.action.title()}: сообщение {data.message_id}",
                description=data.reason or "",
                target_user_id=str(data.user_id) if data.user_id else "",
                target_message_id=str(data.message_id),
            )
            db.add(log_event)
            db.commit()

        return result
    except VKAPIError as e:
        return {"error": e.message, "code": e.code}
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()


@app.post("/api/vk/send")
def vk_send_message(data: VKSendMessageRequest):
    """Отправить сообщение от имени бота в VK."""
    db = SessionLocal()
    try:
        conn = db.query(VKConnection).filter(
            VKConnection.group_id == data.group_id,
            VKConnection.is_active == True
        ).first()

        if not conn:
            return {"error": "VK-сообщество не подключено"}

        service = get_vk_service(conn.access_token)
        msg_id = service.send_message(data.peer_id, data.message)

        return {"status": "ok", "message_id": msg_id}
    except VKAPIError as e:
        return {"error": e.message, "code": e.code}
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()


@app.get("/api/vk/members")
def vk_get_members(group_id: str = Query(...), count: int = Query(100)):
    """Получить участников VK-сообщества."""
    db = SessionLocal()
    try:
        conn = db.query(VKConnection).filter(
            VKConnection.group_id == group_id,
            VKConnection.is_active == True
        ).first()

        if not conn:
            return {"error": "VK-сообщество не подключено"}

        service = get_vk_service(conn.access_token)
        members = service.get_members(group_id, count=count)

        return {"members": members, "total": len(members)}
    except VKAPIError as e:
        return {"error": e.message, "code": e.code}
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()
