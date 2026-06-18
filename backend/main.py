from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, SessionLocal
from models import Server

app = FastAPI(title="Nova API", version="0.4.0")

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
    return {"status": "ok", "version": "0.4.0"}

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

@app.post("/api/webhook/lolka")
def lolka_webhook(data: dict):
    """
    Принимает вебхуки от Lolka.
    Обрабатывает входящие сообщения и команды.
    """
    print(f"📨 Получен вебхук: {data}")
    
    message = data.get("content", "")
    user = data.get("author", {}).get("username", "Неизвестный")
    channel = data.get("channel", "Неизвестный")
    
    response = None
    
    if message.startswith("/ping"):
        response = f"🏓 Понг, {user}!"
    
    elif message.startswith("/help") or message.startswith("/помощь"):
        response = f"""**🤖 Команды Нова:**
📊 `/stats` — статистика сервера
🎵 `/play` — включить музыку
🛡️ `/mod` — модерация
❓ `/help` — список команд"""
    
    elif message.startswith("/stats"):
        response = f"""**📊 Статистика сервера:**
👤 Пользователь: {user}
💬 Канал: {channel}
🤖 Бот: Нова v0.4.0
⚡ Статус: Работает"""
    
    elif message.startswith("/hello") or message.startswith("/привет"):
        response = f"✨ Привет, {user}! Я Нова — умный помощник этого сервера!"
    
    else:
        print(f"💬 {user} написал: {message}")
    
    if response:
        return {
            "status": "ok",
            "response": response,
            "reply_to": user
        }
    
    return {
        "status": "received",
        "message": "Сообщение получено"
    }
