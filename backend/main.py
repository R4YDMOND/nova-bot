from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, SessionLocal
from models import Server, ModuleConfig, AISettings
import requests
import random

app = FastAPI(title="Nova API", version="0.5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

@app.get("/")
def root():
    return {"status": "ok", "version": "0.5.0"}

@app.get("/api/servers")
def get_servers():
    db = SessionLocal()
    try:
        servers = db.query(Server).all()
        result = [{"id": s.id, "name": s.name} for s in servers]
        return {"servers": result, "total": len(result)}
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()

@app.post("/api/servers")
def create_server(
    name: str = Query(...),
    server_id: str = Query(...),
    webhook_url: str = Query("")
):
    db = SessionLocal()
    try:
        server = Server(name=name, server_id=server_id, webhook_url=webhook_url)
        db.add(server)
        db.commit()
        db.refresh(server)
        return {"status": "created", "server": {"id": server.id, "name": server.name}}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


def send_to_lolka(webhook_url: str, message: str):
    """
    Отправляет сообщение в чат Lolka через вебхук.
    """
    payload = {"content": message}
    try:
        resp = requests.post(webhook_url, json=payload, timeout=5)
        return {"status_code": resp.status_code, "ok": resp.ok}
    except requests.RequestException as e:
        raise Exception(f"Ошибка соединения: {str(e)}")


@app.post("/api/webhook/lolka")
def lolka_webhook(data: dict):
    """
    Принимает вебхуки от Lolka.
    Обрабатывает входящие сообщения и команды.
    Отправляет ответ обратно в чат.
    """
    print(f"📨 Получен вебхук: {data}")
    
    message = data.get("content", "")
    user = data.get("author", {}).get("username", "Неизвестный")
    channel = data.get("channel", "Неизвестный")
    server_id = data.get("server_id", "")
    webhook_url = data.get("webhook_url", "")
    
    response = None
    
    if message.startswith("/ping"):
        response = f"🏓 Понг, {user}!"
    
    elif message.startswith("/help") or message.startswith("/помощь"):
        response = f"""**🤖 Команды Нова:**
📊 `/stats` — статистика сервера
🎵 `/play` — включить музыку
🛡️ `/mod` — модерация
❓ `/help` — список команд
💡 `/hello` — приветствие"""
    
    elif message.startswith("/stats"):
        response = f"""**📊 Статистика:**
👤 Пользователь: {user}
💬 Канал: {channel}
🤖 Бот: Нова v0.5.0
⚡ Статус: Работает
🌐 Сервер: {server_id or 'Неизвестный'}"""
    
    elif message.startswith("/hello") or message.startswith("/привет"):
        greetings = [
            f"✨ Привет, {user}! Я Нова — умный помощник этого сервера!",
            f"🚀 Здравствуй, {user}! Готов помочь!",
            f"💫 Приветствую, {user}! Чем могу быть полезна?",
        ]
        response = random.choice(greetings)
    
    else:
        print(f"💬 {user} написал: {message}")
    
    # Отправляем ответ через вебхук если есть URL
    if response and webhook_url:
        try:
            send_result = send_to_lolka(webhook_url, response)
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
    """Получить настройки модулей для сервера"""
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
    """Сохранить настройки модулей"""
    db = SessionLocal()
    try:
        server_id = data.get("server_id", "default")
        modules = data.get("modules", [])
        
        server = db.query(Server).filter(Server.server_id == server_id).first()
        if not server:
            server = Server(name="Auto-created", server_id=server_id)
            db.add(server)
            db.commit()
            db.refresh(server)
        
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
        return {"status": "saved", "modules_count": len(modules)}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


# ==================== API для AI-настроек ====================

@app.get("/api/settings/ai")
def get_ai_settings(server_id: str = Query("default")):
    """Получить AI-настройки сервера"""
    db = SessionLocal()
    try:
        server = db.query(Server).filter(Server.server_id == server_id).first()
        if not server:
            return {"settings": None, "message": "Сервер не найден"}
        
        ai = db.query(AISettings).filter(AISettings.server_id == server.id).first()
        if not ai:
            return {"settings": {
                "botName": "Нова",
                "personality": "friendly",
                "temperature": 0.7,
                "maxLength": 500,
                "useEmoji": True,
                "systemPrompt": "Ты — дружелюбный AI-помощник."
            }}
        
        return {"settings": {
            "botName": ai.bot_name,
            "personality": ai.personality,
            "temperature": ai.temperature,
            "systemPrompt": ai.system_prompt or ""
        }}
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()


@app.post("/api/settings/ai")
def save_ai_settings(data: dict):
    """Сохранить AI-настройки"""
    db = SessionLocal()
    try:
        server_id = data.get("server_id", "default")
        
        server = db.query(Server).filter(Server.server_id == server_id).first()
        if not server:
            server = Server(name="Auto-created", server_id=server_id)
            db.add(server)
            db.commit()
            db.refresh(server)
        
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
