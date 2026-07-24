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
переключением между YandexGPT, DeepSeek и OpenRouter при достижении лимитов (`429`) или блокировке
(`403`). Активный провайдер выбирается в UI, резервные — заполняются по мере доступности ключей в
`.env`. GigaChat в пул намеренно не включён: его API требует отключения проверки TLS-сертификата
(сертификат НУЦ Минцифры не входит в системные доверенные корни) — риск MITM и нестабильности на
хостинге вне РФ перевешивает выгоду ещё одного бесплатного провайдера.

| Провайдер | Переменные | Где получить |
|---|---|---|
| YandexGPT | `YANDEXGPT_API_KEY`, `YANDEXGPT_FOLDER_ID` | [Yandex Cloud Console](https://console.cloud.yandex.ru/) → сервисный аккаунт с ролью `ai.languageModels.user` → API-ключ; `folder_id` — из настроек каталога |
| DeepSeek | `DEEPSEEK_API_KEY` | [platform.deepseek.com](https://platform.deepseek.com/api_keys) |
| OpenRouter | `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` | [openrouter.ai/keys](https://openrouter.ai/keys). Используется также для эмбеддингов (семантический кэш) — модель `openai/text-embedding-3-small` (1536 dim), отдельного ключа для этого не нужно |

Полный список переменных окружения — в `backend/.env.example`.

## Настройка VK Bot API

Community-токен сообщества (`VK_ACCESS_TOKEN` для форвард-функций или токен, задаваемый
при подключении сообщества в дашборде) даёт боту право вызывать `messages.send`,
`groups.banUser` и т.д. Получение событий (сообщения, клики по кнопкам, вход/выход
участников) настраивается одним из двух способов — они взаимоисключающие для одного
сообщества.

### Способ А — Callback API (продакшн, нужен публичный HTTPS URL)

1. [vk.ru](https://vk.ru/) → сообщество → **Управление → Работа с API → Callback API → Добавить сервер.**
2. Адрес: `https://<ваш-домен>/api/vk/callback`. Нажмите «Подтвердить» — backend отвечает
   строкой подтверждения автоматически (`vk_connections.confirmation_code`).
3. Вкладка **Типы событий** → включите «Новое сообщение», «Нажатие на кнопку callback API»,
   «Вход/выход из сообщества».
4. Задайте **Секретный ключ** и укажите его при подключении сообщества в дашборде
   (`/dashboard/vk`) — backend сверяет его с `vk_connections.webhook_secret`.

### Способ Б — Bots Long Poll API (тестирование, без публичного URL)

Не требует HTTPS-адреса, который смотрит наружу — удобно для локальной разработки и
тестового сообщества (например `vk.ru/nova_bot_official`).

1. **Управление → Работа с API → Long Poll API → Включено**, включите те же типы событий.
2. Подключите сообщество в дашборде, **не указывая** секретный ключ Callback API.
3. При старте backend для такого сообщества автоматически поднимается фоновая задача
   `VKLongPollListener` (`backend/vk_bot_service.py`) — опрашивает `groups.getLongPollServer`
   и передаёт события в тот же обработчик, что и Callback API-вебхук (`_process_vk_event`
   в `main.py`), так что логика XP/модерации/команд не дублируется между способами.
   В логе появится `OK: VK Long Poll task запущена для group_id=<ID>`.

> Пока для сообщества задан секретный ключ Callback API, Long Poll для него не запускается.

## Настройка Lolka Bot

1. Зарегистрируйте приложение в портале разработчика Lolka, включите привилегированные
   интенты (Server Members, Message Content).
2. Задайте `LOLKA_BOT_TOKEN` (токен бота) и `LOLKA_CLIENT_ID` (`application_id` —
   используется и для OAuth, и для followup-ответов на интеракции — `PATCH
   /webhooks/{app.id}/{token}/messages/@original`, см. `backend/lolka_gateway.py`).
3. При старте backend поднимает Gateway-соединение (`LolkaGateway.run_forever()`) с
   автопереподключением.

### Семантический кэш и RAG (pgvector)

На проде (Supabase) расширение `pgvector` включается автоматически при старте backend'а
(`_ensure_pgvector_extension()` в `backend/database.py`); ручной шаг из
`backend/migrations/001_ai_rag_pgvector.sql` больше не обязателен. Таблицы `ai_memory`,
`ai_semantic_cache`, `ai_usage_limits` тоже создаются автоматически. На локальной SQLite-БД
эти функции работают в упрощённом режиме (эмбеддинги хранятся как TEXT, cosine similarity
считается в Python).

## Nova Points: пассивный фарм, ежедневный бонус, магазин ролей

Настройки — поля `np_farm_*`/`np_daily_*` в `RankingSettings` (пока без своей вкладки в
дашборде — включаются/настраиваются напрямую через `/api/ranking/settings`).

- **Пассивный фарм** (`np_farm_enabled`) — случайное количество NP (`np_farm_min`..`np_farm_max`)
  за сообщение, не чаще раза в минуту на пользователя. Накопление идёт в памяти процесса
  (`backend/ranking/np_farm_cache.py`) и сбрасывается в БД пачкой раз в 3 минуты (write-behind,
  без записи в лог транзакций — иначе при частоте «за каждое сообщение» БД быстро раздувается
  на free-tier).
- **Ежедневный бонус** — команда `/daily` (Lolka) и «ежедневный бонус» / `/daily` (VK),
  случайная сумма `np_daily_min`..`np_daily_max` раз в 24 часа, с шансом джекпота
  (`np_daily_jackpot_chance`% на `np_daily_jackpot_amount`).
- **Магазин ролей** — команда `/shop` на обеих платформах. Товары — CRUD через
  `/api/nova-points/shop` (`role_id`, `role_name`, `price`). На Lolka роль реально выдаётся
  участнику (`PUT /guilds/{guild}/members/{user}/roles/{role}`); на VK у сообщества нет
  API для назначения ролей участникам, поэтому покупка на VK только списывает баланс и
  подтверждается сообщением.

Не реализовано в этой итерации (см. ТЗ №5 Rev.9, пп.11-15): фарм NP за голосовую активность
(нет инфраструктуры отслеживания голосовых каналов), временные роли с истечением срока,
кастомизация профиля, единый кошелёк между VK/Lolka аккаунтами одного пользователя (OAuth-связка).

