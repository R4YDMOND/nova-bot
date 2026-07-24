"""
backend/ai_engine.py — ТЗ №9: Доработка страницы AI.

Ядро: мультипровайдерный LLM-роутер с failover (YandexGPT / DeepSeek / OpenRouter),
контекстная память (RAG), семантический кэш (эмбеддинги через OpenRouter), Function Calling
(выдача ролей), AI-оценка токсичности (для двухуровневой автомодерации), парсинг и перевод
контента по URL.

Стиль: синхронные HTTP-запросы через `requests`, как и остальной backend (main.py уже
использует этот подход для Gemini/DeepSeek в generate_ai_comment) — httpx из ТЗ не добавляется,
чтобы не плодить вторую HTTP-библиотеку без необходимости.
"""

import os
import re
import json
import math
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple

import requests
from bs4 import BeautifulSoup
from sqlalchemy import text as sql_text
from sqlalchemy.orm import Session

from database import DATABASE_URL
from models import AIMemory, AISemanticCache, AIUsageLimits

_IS_POSTGRES = DATABASE_URL.startswith("postgresql")

# ==================== Безопасность (ТЗ п.10.2, жёстко, не переопределяется настройками) ====================

BASE_SAFETY_PROMPT = (
    "You are a text-only AI. You are strictly prohibited from generating images, links to "
    "images, or discussing image generation. You are also prohibited from discussing 18+ "
    "content, politics, religion, or criminal topics."
)

# Локальный фильтр тематик для URL-перевода (ТЗ, этап 3.5) — отдельно от мата в moderation_engine.py
_FORBIDDEN_TOPICS_RE = re.compile(
    r'порно|секс[- ]?шоп|эротик|казино|ставки на спорт|наркотик|суицид|терроризм|экстремизм',
    re.IGNORECASE
)

PROVIDERS = ["yandexgpt", "deepseek", "openrouter"]


class LLMError(Exception):
    def __init__(self, message: str, status_code: Optional[int] = None):
        super().__init__(message)
        self.status_code = status_code


# ==================== Переменные промпта (ТЗ, этап 3.1) ====================

def render_prompt(template: str, user_name: str = "", server_name: str = "",
                   channel_name: str = "", current_time: Optional[str] = None) -> str:
    """Заменяет {user_name}, {server_name}, {current_time}, {channel_name} в промпте."""
    if current_time is None:
        current_time = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    return (template or "") \
        .replace("{user_name}", user_name or "") \
        .replace("{server_name}", server_name or "") \
        .replace("{channel_name}", channel_name or "") \
        .replace("{current_time}", current_time)


def build_system_prompt(user_system_prompt: str, **variables) -> str:
    rendered = render_prompt(user_system_prompt, **variables)
    return f"{BASE_SAFETY_PROMPT}\n\n{rendered}".strip()


# ==================== Адаптеры провайдеров (интерфейс AIProvider: chat / generate_json) ====================

def _call_yandexgpt(messages: List[Dict[str, str]], temperature: float, max_tokens: int) -> str:
    api_key = os.getenv("YANDEXGPT_API_KEY", "")
    folder_id = os.getenv("YANDEXGPT_FOLDER_ID", "")
    if not api_key or not folder_id:
        raise LLMError("YANDEXGPT_API_KEY/YANDEXGPT_FOLDER_ID не настроены")

    yandex_messages = [{"role": m["role"], "text": m["content"]} for m in messages]
    resp = requests.post(
        "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
        headers={"Authorization": f"Api-Key {api_key}", "Content-Type": "application/json"},
        json={
            "modelUri": f"gpt://{folder_id}/yandexgpt/latest",
            "completionOptions": {"stream": False, "temperature": temperature, "maxTokens": str(max_tokens)},
            "messages": yandex_messages,
        },
        timeout=20,
    )
    if not resp.ok:
        raise LLMError(f"YandexGPT error: {resp.status_code}", status_code=resp.status_code)
    return resp.json()["result"]["alternatives"][0]["message"]["text"].strip()


def _call_deepseek(messages: List[Dict[str, str]], temperature: float, max_tokens: int) -> str:
    api_key = os.getenv("DEEPSEEK_API_KEY", "")
    if not api_key:
        raise LLMError("DEEPSEEK_API_KEY не настроен")
    resp = requests.post(
        "https://api.deepseek.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={"model": "deepseek-chat", "messages": messages, "temperature": temperature, "max_tokens": max_tokens},
        timeout=20,
    )
    if not resp.ok:
        raise LLMError(f"DeepSeek error: {resp.status_code}", status_code=resp.status_code)
    return resp.json()["choices"][0]["message"]["content"].strip()


def _call_openrouter(messages: List[Dict[str, str]], temperature: float, max_tokens: int) -> str:
    api_key = os.getenv("OPENROUTER_API_KEY", "")
    if not api_key:
        raise LLMError("OPENROUTER_API_KEY не настроен")
    model = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
    resp = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={"model": model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens},
        timeout=20,
    )
    if not resp.ok:
        raise LLMError(f"OpenRouter error: {resp.status_code}", status_code=resp.status_code)
    return resp.json()["choices"][0]["message"]["content"].strip()


_ADAPTERS = {
    "yandexgpt": _call_yandexgpt,
    "deepseek": _call_deepseek,
    "openrouter": _call_openrouter,
}


class LLMRouter:
    """Маршрутизатор с автопереключением: при 429/403 (или недоступности ключа) — следующий провайдер."""

    def __init__(self, preferred_provider: str = "yandexgpt"):
        if preferred_provider not in PROVIDERS:
            preferred_provider = "yandexgpt"
        self.pool = [preferred_provider] + [p for p in PROVIDERS if p != preferred_provider]

    def chat(self, messages: List[Dict[str, str]], temperature: float = 0.7,
             max_tokens: int = 500) -> Tuple[str, str]:
        """Возвращает (текст_ответа, имя_использованного_провайдера)."""
        last_error: Optional[Exception] = None
        for provider in self.pool:
            adapter = _ADAPTERS[provider]
            try:
                text = adapter(messages, temperature, max_tokens)
                return text, provider
            except LLMError as e:
                last_error = e
                if e.status_code in (429, 403):
                    print(f"AI_ROUTER: {provider} -> {e.status_code}, переключаюсь на резервный провайдер")
                else:
                    print(f"AI_ROUTER: {provider} недоступен ({e}), пробую следующий")
                continue
            except Exception as e:
                last_error = e
                print(f"AI_ROUTER: {provider} неожиданная ошибка: {e}")
                continue
        raise LLMError(f"Все провайдеры недоступны. Последняя ошибка: {last_error}")

    def generate_json(self, messages: List[Dict[str, str]], temperature: float = 0.2,
                       max_tokens: int = 400) -> Tuple[Dict[str, Any], str]:
        """Просит модель ответить строго JSON, парсит с фоллбэком на очистку markdown-обёртки."""
        text, provider = self.chat(messages, temperature, max_tokens)
        cleaned = re.sub(r"^```json|^```|```$", "", text.strip(), flags=re.MULTILINE).strip()
        try:
            return json.loads(cleaned), provider
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(0)), provider
                except json.JSONDecodeError:
                    pass
            raise LLMError(f"{provider} вернул невалидный JSON: {text[:200]}")


# ==================== Эмбеддинги (OpenRouter, для семантического кэша) ====================

def get_embedding(text: str) -> Optional[List[float]]:
    api_key = os.getenv("OPENROUTER_API_KEY", "")
    if not api_key:
        return None
    try:
        resp = requests.post(
            "https://openrouter.ai/api/v1/embeddings",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"model": "openai/text-embedding-3-small", "input": text[:8000]},
            timeout=15,
        )
        if not resp.ok:
            print(f"AI_EMBEDDING: ошибка {resp.status_code}")
            return None
        return resp.json()["data"][0]["embedding"]
    except Exception as e:
        print(f"AI_EMBEDDING: {e}")
        return None


def _cosine_similarity(a: List[float], b: List[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


# ==================== Семантический кэш (ТЗ, этап 2/3) ====================

_CACHE_SIMILARITY_THRESHOLD = 0.90
_CACHE_TTL = timedelta(days=7)


def semantic_cache_lookup(db: Session, server_id: str, embedding: List[float]) -> Optional[str]:
    if not embedding:
        return None
    cutoff = datetime.utcnow() - _CACHE_TTL
    if _IS_POSTGRES:
        row = db.execute(sql_text(
            "SELECT response_text, 1 - (prompt_embedding <=> CAST(:emb AS vector)) AS similarity "
            "FROM ai_semantic_cache WHERE server_id = :sid AND created_at > :cutoff "
            "ORDER BY prompt_embedding <=> CAST(:emb AS vector) LIMIT 1"
        ), {"emb": json.dumps(embedding), "sid": server_id, "cutoff": cutoff}).first()
        if row and row.similarity is not None and row.similarity >= _CACHE_SIMILARITY_THRESHOLD:
            return row.response_text
        return None
    # SQLite fallback: считаем cosine в Python (таблица небольшая — 7-дневное окно)
    rows = db.query(AISemanticCache).filter(
        AISemanticCache.server_id == server_id, AISemanticCache.created_at > cutoff
    ).all()
    best_sim, best_response = 0.0, None
    for row in rows:
        try:
            row_embedding = json.loads(row.prompt_embedding) if row.prompt_embedding else None
        except (json.JSONDecodeError, TypeError):
            row_embedding = None
        if not row_embedding:
            continue
        sim = _cosine_similarity(embedding, row_embedding)
        if sim > best_sim:
            best_sim, best_response = sim, row.response_text
    return best_response if best_sim >= _CACHE_SIMILARITY_THRESHOLD else None


def semantic_cache_store(db: Session, server_id: str, prompt_text: str,
                          embedding: List[float], response_text: str) -> None:
    if not embedding:
        return
    entry = AISemanticCache(
        server_id=server_id, prompt_text=prompt_text[:2000],
        prompt_embedding=json.dumps(embedding) if not _IS_POSTGRES else embedding,
        response_text=response_text,
    )
    db.add(entry)
    db.commit()


# ==================== Контекстная память / RAG (ТЗ, этап 2/3) ====================

def get_recent_memory(db: Session, server_id: str, channel_id: str, limit: int) -> List[Dict[str, str]]:
    if limit <= 0:
        return []
    rows = db.query(AIMemory).filter(
        AIMemory.server_id == server_id, AIMemory.channel_id == channel_id
    ).order_by(AIMemory.timestamp.desc()).limit(limit).all()
    rows.reverse()
    return [{"role": r.role, "content": r.message_text} for r in rows]


def save_memory(db: Session, server_id: str, channel_id: str, user_id: str, role: str, text: str) -> None:
    db.add(AIMemory(server_id=server_id, channel_id=channel_id, user_id=user_id, role=role, message_text=text))
    db.commit()


def cleanup_old_memory(db: Session) -> int:
    """Удаляет записи ai_memory старше 7 дней. На Postgres/Supabase рекомендуется дополнительно
    настроить pg_cron (см. backend/migrations/001_ai_rag_pgvector.sql) — эта функция вызывается
    как fallback при обращении к боту, чтобы работать и без внешнего планировщика."""
    cutoff = datetime.utcnow() - timedelta(days=7)
    deleted = db.query(AIMemory).filter(AIMemory.timestamp < cutoff).delete()
    db.commit()
    return deleted


# ==================== Лимиты API (ТЗ, этап 2) ====================

def get_usage_today(db: Session, server_id: str) -> int:
    today = datetime.utcnow().date()
    row = db.query(AIUsageLimits).filter(
        AIUsageLimits.server_id == server_id, AIUsageLimits.date == today
    ).first()
    return row.requests_count if row else 0


def increment_usage(db: Session, server_id: str) -> int:
    today = datetime.utcnow().date()
    row = db.query(AIUsageLimits).filter(
        AIUsageLimits.server_id == server_id, AIUsageLimits.date == today
    ).first()
    if not row:
        row = AIUsageLimits(server_id=server_id, date=today, requests_count=0)
        db.add(row)
    row.requests_count += 1
    db.commit()
    return row.requests_count


# ==================== Оценка токсичности (для двухуровневой автомодерации) ====================

def check_toxicity(text: str, provider: str = "yandexgpt") -> Dict[str, Any]:
    """Возвращает {"score": 0-100, "topics": [...]}. При ошибке провайдера — score=0 (не блокируем)."""
    router = LLMRouter(provider)
    prompt = (
        "Оцени токсичность следующего сообщения по шкале от 0 до 100 (0 — нейтрально, "
        "100 — крайне токсично/оскорбительно) и укажи, затрагивает ли оно запрещённые темы "
        "(18+, политика, религия, криминал). Ответь СТРОГО в формате JSON без пояснений: "
        '{"score": <число>, "topics": [<список тем, если есть>]}\n\n'
        f"Сообщение: {text[:1000]}"
    )
    try:
        result, _ = router.generate_json(
            [{"role": "system", "content": "Ты — модератор чата."}, {"role": "user", "content": prompt}],
            temperature=0.1, max_tokens=150,
        )
        score = int(result.get("score", 0))
        topics = result.get("topics", [])
        return {"score": max(0, min(100, score)), "topics": topics if isinstance(topics, list) else []}
    except Exception as e:
        print(f"AI_TOXICITY: ошибка оценки — {e}")
        return {"score": 0, "topics": []}


# ==================== URL-парсинг и перевод/пересказ (ТЗ, этап 3.5) ====================

_BROWSER_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
               "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")


def fetch_page_text(url: str) -> Optional[str]:
    try:
        resp = requests.get(url, headers={"User-Agent": _BROWSER_UA}, timeout=10)
        if not resp.ok:
            return None
        soup = BeautifulSoup(resp.text, "lxml")
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()
        text = " ".join(soup.get_text(separator=" ").split())
        return text[:6000] if text else None
    except Exception as e:
        print(f"AI_URL_PARSE: {e}")
        return None


def contains_forbidden_topics(text: str) -> bool:
    return bool(_FORBIDDEN_TOPICS_RE.search(text or ""))


def translate_or_summarize(page_text: str, provider: str = "yandexgpt") -> str:
    router = LLMRouter(provider)
    prompt = (
        "Переведи на русский язык (если текст не на русском) и кратко перескажи содержимое "
        "страницы ниже (3-5 предложений). Не добавляй ссылки на изображения, не обсуждай "
        "запрещённые темы.\n\nТекст страницы:\n" + page_text
    )
    text, _ = router.chat(
        [{"role": "system", "content": BASE_SAFETY_PROMPT}, {"role": "user", "content": prompt}],
        temperature=0.5, max_tokens=400,
    )
    return text


# ==================== Function Calling: доступные инструменты (ТЗ, этап 3.4) ====================

TOOL_SCHEMAS = [
    {
        "name": "grant_role",
        "description": "Выдать роль участнику сервера (только платформа Lolka).",
        "parameters": {
            "user_id": "string — ID участника, которому выдаётся роль",
            "role_id": "string — ID роли",
        },
    },
]


def execute_tool(name: str, arguments: Dict[str, Any], platform: str, server_platform_id: str) -> Dict[str, Any]:
    """Валидирует и выполняет вызов инструмента. Строгая проверка перед реальным API-вызовом (ТЗ, риски)."""
    if name != "grant_role":
        return {"success": False, "error": f"Неизвестный инструмент: {name}"}

    user_id = str(arguments.get("user_id", "")).strip()
    role_id = str(arguments.get("role_id", "")).strip()
    if not user_id or not role_id or not re.match(r"^[a-zA-Z0-9_-]+$", user_id) or not re.match(r"^[a-zA-Z0-9_-]+$", role_id):
        return {"success": False, "error": "Невалидные user_id/role_id"}

    if platform != "lolka":
        return {"success": False, "error": f"Выдача ролей не поддерживается на платформе {platform}"}

    token = os.getenv("LOLKA_BOT_TOKEN", "")
    if not token:
        return {"success": False, "error": "LOLKA_BOT_TOKEN не настроен"}

    try:
        resp = requests.put(
            f"https://lolka.app/api/bot/v10/guilds/{server_platform_id}/members/{user_id}/roles/{role_id}",
            headers={"Authorization": f"Bot {token}"}, timeout=10,
        )
        if resp.status_code == 204:
            return {"success": True, "message": f"Роль {role_id} выдана участнику {user_id}"}
        return {"success": False, "error": f"Lolka API вернул {resp.status_code}"}
    except requests.RequestException as e:
        return {"success": False, "error": str(e)}
