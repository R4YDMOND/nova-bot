# Nova Bot

Бот-платформа для VK и Lolka: модерация, ранги/XP, музыка, форвард контента, AI-ассистент.

**Стек:** FastAPI (Python) · Next.js 14 (TypeScript, Tailwind CSS, Radix UI, shadcn/ui) · Supabase (PostgreSQL + pgvector)

## Быстрый старт

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env   # заполнить своими ключами
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## AI-ассистент: настройка LLM-провайдеров

Раздел `/dashboard/ai` использует мультипровайдерный роутер (`backend/ai_engine.py`) с автоматическим
переключением между GigaChat, YandexGPT, DeepSeek и OpenRouter при достижении лимитов (`429`) или
блокировке (`403`). Активный провайдер выбирается в UI, резервные — заполняются по мере доступности
ключей в `.env`.

| Провайдер | Переменные | Где получить |
|---|---|---|
| GigaChat | `GIGACHAT_AUTH_KEY`, `GIGACHAT_SCOPE` | [developers.sber.ru/portal/products/gigachat-api](https://developers.sber.ru/portal/products/gigachat-api) — создать проект, скопировать Authorization key (Base64) из личного кабинета |
| YandexGPT | `YANDEXGPT_API_KEY`, `YANDEXGPT_FOLDER_ID` | [Yandex Cloud Console](https://console.cloud.yandex.ru/) → сервисный аккаунт с ролью `ai.languageModels.user` → API-ключ; `folder_id` — из настроек каталога |
| DeepSeek | `DEEPSEEK_API_KEY` | [platform.deepseek.com](https://platform.deepseek.com/api_keys) |
| OpenRouter | `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` | [openrouter.ai/keys](https://openrouter.ai/keys). Используется также для эмбеддингов (семантический кэш) — модель `openai/text-embedding-3-small` (1536 dim), отдельного ключа для этого не нужно |

Полный список переменных окружения — в `backend/.env.example`.

### Семантический кэш и RAG (pgvector)

На проде (Supabase) перед первым запуском нужно один раз включить расширение `pgvector` —
см. `backend/migrations/001_ai_rag_pgvector.sql`. Таблицы `ai_memory`, `ai_semantic_cache`,
`ai_usage_limits` создаются автоматически при старте backend'а. На локальной SQLite-БД эти
функции тоже работают (эмбеддинги хранятся как TEXT, cosine similarity считается в Python).
