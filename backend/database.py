import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./nova.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=300)
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
    которые есть в моделях, но отсутствуют в реальной БД (на Render)."""
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    with engine.begin() as conn:
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
                        default_clause = f" DEFAULT {1 if val else 0}"
                    elif isinstance(val, (int, float)):
                        default_clause = f" DEFAULT {val}"
                try:
                    conn.execute(text(
                        f'ALTER TABLE {table.name} ADD COLUMN {column.name} {col_type}{default_clause}'
                    ))
                    print(f"MIGRATE: added column {table.name}.{column.name}")
                except Exception as e:
                    print(f"MIGRATE WARNING: {table.name}.{column.name} — {e}")


def init_db():
    Base.metadata.create_all(bind=engine)
    _run_light_migrations()
    db_type = "PostgreSQL" if DATABASE_URL.startswith("postgresql") else "SQLite"
    print(f"OK: Database ready — using {db_type} ({DATABASE_URL[:40]}...)")