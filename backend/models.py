from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float
from datetime import datetime
from database import Base


class Server(Base):
    __tablename__ = "servers"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    server_id = Column(String, unique=True)
    webhook_url = Column(String, default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ModuleConfig(Base):
    __tablename__ = "module_configs"

    id = Column(Integer, primary_key=True)
    server_id = Column(Integer)
    module_name = Column(String)
    is_enabled = Column(Boolean, default=False)
    config = Column(Text, default="")


class AISettings(Base):
    __tablename__ = "ai_settings"

    id = Column(Integer, primary_key=True)
    server_id = Column(Integer, unique=True)
    bot_name = Column(String, default="Nova")
    personality = Column(String, default="friendly")
    temperature = Column(Float, default=0.7)
    system_prompt = Column(Text, default="")


class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)
    server_id = Column(String(255), nullable=False, index=True)
    user_id = Column(String(255), nullable=False)
    username = Column(String(255), nullable=False)
    avatar_url = Column(String(1024), nullable=True)
    level = Column(Integer, default=1)
    xp = Column(Integer, default=0)
    messages = Column(Integer, default=0)
    voice_minutes = Column(Integer, default=0)
    reactions = Column(Integer, default=0)
    last_active = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


class MusicProvider(Base):
    __tablename__ = "music_providers"

    id = Column(Integer, primary_key=True)
    server_id = Column(String(255), nullable=False, index=True)
    provider_type = Column(String(50), nullable=False)
    name = Column(String(255), default="Мой провайдер")
    api_key = Column(String(1024), default="")
    webhook_url = Column(String(1024), default="")
    stream_url = Column(String(1024), default="")
    channels = Column(Text, default="[]")  # JSON-строка со списком ссылок на каналы воспроизведения
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True)
    server_id = Column(String(255), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    event_date = Column(DateTime, nullable=False)
    template = Column(String(50), default="custom")
    channel = Column(String(255), default="")
    webhook_url = Column(String(1024), default="")
    max_participants = Column(Integer, default=0)
    created_by = Column(String(255), default="")
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Новые модели из ТЗ (P2: Events participants, Polls, Notifications) ────────

class EventParticipant(Base):
    """Участник события. Один участник — одна строка."""
    __tablename__ = "event_participants"

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, nullable=False, index=True)
    user_id = Column(String(255), nullable=False)
    vote = Column(String(20), default="going")  # going | maybe | not_going
    joined_at = Column(DateTime, default=datetime.utcnow)


class EventPoll(Base):
    """Голосование, привязанное к событию."""
    __tablename__ = "event_polls"

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, nullable=False, index=True)
    question = Column(String(512), nullable=False)
    options = Column(Text, default="")   # JSON-строка: ["Пойду", "Не пойду", "Может быть"]
    votes = Column(Text, default="")     # JSON-строка: {"userId": "optionIndex"}
    created_at = Column(DateTime, default=datetime.utcnow)


class EventNotification(Base):
    """Запланированное уведомление к событию."""
    __tablename__ = "event_notifications"

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, nullable=False, index=True)
    channel = Column(String(100), nullable=False)   # vk | lolka | max | email
    offset_minutes = Column(Integer, default=60)    # за сколько минут до события
    message = Column(Text, default="")
    is_sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    """Пользователь, зарегистрированный по e-mail и паролю."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True, index=True)
    verification_token_expires = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)