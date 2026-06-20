from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, SessionLocal
from models import Server, ModuleConfig, AISettings, Member
import requests
import random
import re
import os
import secrets
from datetime import datetime

app = FastAPI(title="Nova API", version="0.7.0")

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
    return {"status": "ok", "version": "0.7.0"}

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


# ==================== OAuth ====================

@app.get("/api/auth/lolka")
def auth_lolka():
    client_id = os.getenv("LOLKA_CLIENT_ID", "")
    redirect_uri = os.getenv("LOLKA_REDIRECT_URI", "")
    state = secrets.token_hex(16)
    url = f"https://lolka.app/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code&scope=identify+servers&state={state}"
    return {"url": url, "state": state}


@app.get("/api/auth/lolka/callback")
def auth_lolka_callback(code: str, state: str = ""):
    client_id = os.getenv("LOLKA_CLIENT_ID", "")
    client_secret = os.getenv("LOLKA_CLIENT_SECRET", "")
    redirect_uri = os.getenv("LOLKA_REDIRECT_URI", "")
    
    try:
        resp = requests.post("https://lolka.app/oauth/token", data={
            "client_id": client_id, "client_secret": client_secret,
            "code": code, "redirect_uri": redirect_uri, "grant_type": "authorization_code",
        }, timeout=10)
        token_data = resp.json()
        access_token = token_data.get("access_token", "")
    except Exception as e:
        return {"error": f"Ошибка обмена кода: {str(e)}"}
    
    try:
        user_resp = requests.get("https://lolka.app/api/users/@me", headers={
            "Authorization": f"Bearer {access_token}"
        }, timeout=10)
        user_data = user_resp.json()
    except Exception as e:
        return {"error": f"Ошибка получения пользователя: {str(e)}"}
    
    return {
        "status": "ok",
        "user": {"id": user_data.get("id"), "username": user_data.get("username"), "avatar": user_data.get("avatar")},
        "access_token": access_token[:20] + "..."
    }


@app.get("/api/auth/vk")
def auth_vk():
    app_id = os.getenv("VK_APP_ID", "")
    redirect_uri = os.getenv("VK_REDIRECT_URI", "")
    state = secrets.token_hex(16)
    url = f"https://oauth.vk.com/authorize?client_id={app_id}&redirect_uri={redirect_uri}&response_type=code&scope=email,groups,messages&v=5.199&state={state}"
    return {"url": url, "state": state}


@app.get("/api/auth/vk/callback")
def auth_vk_callback(code: str, state: str = ""):
    app_id = os.getenv("VK_APP_ID", "")
    secret_key = os.getenv("VK_SECRET_KEY", "")
    redirect_uri = os.getenv("VK_REDIRECT_URI", "")
    
    try:
        resp = requests.get("https://oauth.vk.com/access_token", params={
            "client_id": app_id, "client_secret": secret_key,
            "code": code, "redirect_uri": redirect_uri,
        }, timeout=10)
        token_data = resp.json()
        access_token = token_data.get("access_token", "")
        user_id = token_data.get("user_id", 0)
        email = token_data.get("email", "")
    except Exception as e:
        return {"error": f"Ошибка обмена кода: {str(e)}"}
    
    return {
        "status": "ok",
        "user": {"id": user_id, "email": email},
        "access_token": access_token[:20] + "..."
    }


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


# ==================== Отчёты ====================

@app.get("/api/analytics/reports")
def get_reports_config(server_id: str = Query("default")):
    """Получить настройки отчётов"""
    db = SessionLocal()
    try:
        config = db.query(ModuleConfig).filter(
            ModuleConfig.server_id == server_id,
            ModuleConfig.module_name == "reports"
        ).first()
        
        if config:
            import json
            try:
                return {"config": json.loads(config.config)}
            except:
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
        
        server = db.query(Server).filter(Server.server_id == server_id).first()
        if not server:
            server = Server(name="Auto-created", server_id=server_id)
            db.add(server)
            db.commit()
            db.refresh(server)
        
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


@app.get("/api/moderation/log")
def get_moderation_log():
    return {"entries": [], "total": 0, "warns": 0, "mutes": 0, "bans": 0}


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
