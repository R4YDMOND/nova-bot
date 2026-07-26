import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./nova.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # Supabase Connection Pooler (порт 6543) — SSL обязателен
    # pool_size не задаём: Supabase Pooler сам управляет лимитом соединений
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args={"sslmode": "require"}
    )
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _run_light_migrations():
    """Без Alembic: досоздаёт в уже существующих таблицах колонки,
    которые есть в моделях, но отсутствуют в реальной БД (на Render).

    Каждая ALTER TABLE выполняется в СВОЕЙ отдельной транзакции. Раньше весь цикл был
    в одной with engine.begin(): одна неудачная миграция (например, "DEFAULT 1" для
    BOOLEAN-колонки — валидно на SQLite, но не на Postgres) переводила транзакцию в
    aborted-состояние, и ВСЕ последующие ALTER TABLE в этом же деплое падали с
    (psycopg2.errors.InFailedSqlTransaction), хотя сами по себе были корректны.
    """
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    for table in Base.metadata.sorted_tables:
        if table.name not in existing_tables:
            continue  # новую таблицу create_all уже создал целиком
        existing_columns = {c["name"] for c in inspector.get_columns(table.name)}
        for column in table.columns:
            if column.name in existing_columns:
                continue
            col_type = column.type.compile(dialect=engine.dialect)
            default_clause = ""
            if column.default is not None and getattr(column.default, "is_scalar", False):
                val = column.default.arg
                if isinstance(val, str):
                    default_clause = f" DEFAULT '{val}'"
                elif isinstance(val, bool):
                    # TRUE/FALSE — валидно и на Postgres (BOOLEAN), и на SQLite (алиасы 1/0
                    # начиная с 3.23). "DEFAULT 1"/"DEFAULT 0" ломает Postgres:
                    # (psycopg2.errors.DatatypeMismatch) column is of type boolean but
                    # default expression is of type integer.
                    default_clause = f" DEFAULT {'TRUE' if val else 'FALSE'}"
                elif isinstance(val, (int, float)):
                    default_clause = f" DEFAULT {val}"
            try:
                with engine.begin() as conn:
                    conn.execute(text(
                        f'ALTER TABLE {table.name} ADD COLUMN {column.name} {col_type}{default_clause}'
                    ))
                print(f"MIGRATE: added column {table.name}.{column.name}")
            except Exception as e:
                print(f"MIGRATE WARNING: {table.name}.{column.name} — {e}")


def _ensure_pgvector_extension():
    """
    ТЗ №9 (AI RAG/семантический кэш): столбцы ai_memory.message_embedding и
    ai_semantic_cache.prompt_embedding используют тип pgvector VECTOR(1536).
    Supabase не включает расширение pgvector по умолчанию — раньше это требовало
    ручного 'CREATE EXTENSION vector;' в Supabase SQL Editor ДО деплоя (см.
    migrations/001_ai_rag_pgvector.sql), из-за чего Base.metadata.create_all() ниже
    падал с (psycopg2.errors.UndefinedObject) type "vector" does not exist и бэкенд
    не запускался вообще. Теперь создаём расширение автоматически при каждом старте.
    """
    if not DATABASE_URL.startswith("postgresql"):
        return
    try:
        with engine.begin() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        print("OK: pgvector extension готово")
    except Exception as e:
        print(f"MIGRATE WARNING: не удалось создать расширение pgvector — {e}")


def init_db():
    _ensure_pgvector_extension()
    Base.metadata.create_all(bind=engine)
    _run_light_migrations()
    db_type = "PostgreSQL" if DATABASE_URL.startswith("postgresql") else "SQLite"
    print(f"OK: Database ready — using {db_type} ({DATABASE_URL[:40]}...)")