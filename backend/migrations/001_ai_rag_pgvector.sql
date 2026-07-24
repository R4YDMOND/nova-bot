-- ТЗ №9: Доработка страницы AI — RAG / семантический кэш / лимиты API.
--
-- ⚠️ Начиная с backend/database.py::_ensure_pgvector_extension() (см. коммит "fix: автосоздание
-- расширения pgvector на старте"), расширение включается автоматически при каждом старте backend'а.
-- Этот файл больше не обязателен к ручному запуску — оставлен как справочный/аварийный вариант
-- (например, если у роли БД в Supabase нет прав на CREATE EXTENSION и нужно попросить это сделать
-- администратора вручную через SQL Editor).
--
-- Таблицы ai_memory / ai_semantic_cache / ai_usage_limits создаются автоматически
-- backend'ом при старте (SQLAlchemy Base.metadata.create_all в database.py).

CREATE EXTENSION IF NOT EXISTS vector;

-- Индекс для быстрого поиска по косинусному расстоянию (создаётся после того, как backend
-- создаст таблицу ai_semantic_cache; если таблицы ещё нет — сначала запустите backend один раз).
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_semantic_cache') THEN
        CREATE INDEX IF NOT EXISTS ai_semantic_cache_embedding_idx
            ON ai_semantic_cache USING ivfflat (prompt_embedding vector_cosine_ops) WITH (lists = 100);
    END IF;
END $$;

-- Cron-задача на удаление старых записей ai_memory (>7 дней). В Supabase — Database > Cron Jobs,
-- либо pg_cron, если расширение доступно на вашем плане:
-- SELECT cron.schedule('ai_memory_cleanup', '0 3 * * *',
--   $$DELETE FROM ai_memory WHERE timestamp < NOW() - INTERVAL '7 days'$$);
