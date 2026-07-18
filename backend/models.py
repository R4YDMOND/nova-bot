from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, UniqueConstraint, ForeignKey
from datetime import datetime
from database import Base


class Server(Base):
    __tablename__ = "servers"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    server_id = Column(String, unique=True)
    webhook_url = Column(String, default="")
    is_active = Column(Boolean, default=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # nullable для миграции старых записей
    platform = Column(String, default="vk")      # "vk" | "lolka"
    icon_url = Column(String, default="")
    member_count = Column(Integer, default=0)
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
    platform = Column(String(20), default="vk", index=True)          # НОВОЕ
    user_id = Column(String(255), nullable=False)
    username = Column(String(255), nullable=False)
    avatar_url = Column(String(1024), nullable=True)
    level = Column(Integer, default=1)
    xp = Column(Integer, default=0)
    messages = Column(Integer, default=0)
    voice_minutes = Column(Integer, default=0)
    reactions = Column(Integer, default=0)
    last_active = Column(DateTime, default=datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.utcnow)         # НОВОЕ
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('server_id', 'platform', 'user_id', name='uq_member_entry'),
    )

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

    refresh_token = Column(String(1024), nullable=True)
    password_reset_token = Column(String(255), nullable=True, index=True)
    password_reset_expires = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)


class NotificationSettings(Base):
    """Настройки уведомлений сервера: VK, MAX, Email (заменяет Telegram)."""
    __tablename__ = "notification_settings"

    id = Column(Integer, primary_key=True)
    server_id = Column(Integer, unique=True, nullable=False)

    email_enabled = Column(Boolean, default=True)
    email_address = Column(String, default="")

    vk_enabled = Column(Boolean, default=False)
    vk_webhook_url = Column(String, default="")

    max_enabled = Column(Boolean, default=False)
    max_webhook_url = Column(String, default="")
    updated_at = Column(DateTime, default=datetime.utcnow)


class Webhook(Base):
    """Вебхук интеграции VK/Lolka, привязанный к конкретному серверу и платформе."""
    __tablename__ = "webhooks"

    id = Column(Integer, primary_key=True)
    server_id = Column(String(255), nullable=False, index=True)
    platform = Column(String(20), nullable=False, default="vk")  # "vk" | "lolka"
    project = Column(String(255), default="")
    url = Column(String(1024), nullable=False)
    event = Column(String(255), default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ----------------- Новая модель для модерации -----------------

class ModerationConfig(Base):
    __tablename__ = "moderation_config"

    id = Column(Integer, primary_key=True)
    server_id = Column(String(255), nullable=False, index=True)
    platform = Column(String(20), nullable=False)  # 'vk' | 'lolka'

    # Базовая защита
    antispam_enabled = Column(Boolean, default=False)
    antiraid_enabled = Column(Boolean, default=False)
    profanity_enabled = Column(Boolean, default=False)
    captcha_enabled = Column(Boolean, default=False)
    link_removal_enabled = Column(Boolean, default=False)

    # Дополнительные фильтры
    scam_links_enabled = Column(Boolean, default=False)
    invites_enabled = Column(Boolean, default=False)
    zalgo_enabled = Column(Boolean, default=False)
    caps_enabled = Column(Boolean, default=False)
    duplicate_enabled = Column(Boolean, default=False)
    mentions_enabled = Column(Boolean, default=False)
    banned_words_enabled = Column(Boolean, default=False)
    emoji_spam_enabled = Column(Boolean, default=False)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (UniqueConstraint('server_id', 'platform', name='uq_server_platform'),)


# ── Модель событий модерации (ТЗ №4) ─────────────────────────────────────────

class ModerationEvent(Base):
    """
    События модерации.
    Теперь включают target_user_id и target_message_id для ручной модерации из журнала.
    """
    __tablename__ = "moderation_events"

    id = Column(Integer, primary_key=True)
    server_id = Column(Integer, nullable=False, index=True)  # ссылка на Server.id
    platform = Column(String, default="vk")  # "vk" или "lolka"
    type = Column(String, nullable=False)    # "settings_updated", "blocked_message", "warning", "captcha_passed", "message_received", "delete_message", "ban_message" ...
    title = Column(String, default="")
    description = Column(String, default="")
    target_user_id = Column(String(50), default="", nullable=True)      # ID пользователя VK/Lolka
    target_message_id = Column(String(50), default="", nullable=True)    # ID сообщения VK/Lolka
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


# ═══════════════════════════════════════════════════════════════════════════════
# ══ ТЗ №5: VK Bot API интеграция ══════════════════════════════════════════════
# ═══════════════════════════════════════════════════════════════════════════════

class VKConnection(Base):
    """
    Подключение VK-сообщества к Nova Bot.
    Хранит токен сообщества (community access token) для вызовов
    методов Bot API: messages.delete, groups.banUser, messages.send и т.д.

    Отличается от VK ID (OAuth пользователя):
      - VK ID токен — для входа пользователя через /api/auth/vk
      - Community token — для модерации сообщества через Bot API
    """
    __tablename__ = "vk_connections"

    id = Column(Integer, primary_key=True)
    server_id = Column(Integer, ForeignKey("servers.id", ondelete="CASCADE"), nullable=False, index=True)
    group_id = Column(String(50), nullable=False, index=True)           # ID сообщества VK (без минуса)
    group_name = Column(String(255), default="")                        # Название сообщества (кэш)
    access_token = Column(String(1024), nullable=False)                 # Токен сообщества
    webhook_secret = Column(String(255), default="")                   # Секретный ключ Callback API
    confirmation_code = Column(String(255), default="")                # Код подтверждения Callback API
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (UniqueConstraint('server_id', 'group_id', name='uq_server_group'),)


    # ── Rev. 3: Система уровней ───────────────────────────────────────────────────

class RankingSettings(Base):
    __tablename__ = "ranking_settings"
    id = Column(Integer, primary_key=True)
    server_id = Column(Integer, ForeignKey("servers.id", ondelete="CASCADE"), nullable=False, index=True)
    platform = Column(String(20), nullable=False, default="vk")  # 'vk' | 'lolka'
    enabled = Column(Boolean, default=True)

    xp_per_message = Column(Integer, default=15)
    xp_per_voice_minute = Column(Integer, default=20)
    min_message_length = Column(Integer, default=3)
    cooldown_seconds = Column(Integer, default=60)
    multiplier = Column(Float, default=1.0)

    xp_formula = Column(Text, default='{"formula_type":"exponential","base_xp":15,"multiplier":1.0}')
    rewards = Column(Text, default="[]")

    notify_channel = Column(String(255), default="")
    notify_message = Column(Text, default="🎉 {user} достиг {level} уровня!")
    ping_user = Column(Boolean, default=True)

    decay_enabled = Column(Boolean, default=False)
    decay_days = Column(Integer, default=7)
    decay_percent = Column(Integer, default=10)

    blacklist_channels = Column(Text, default="[]")
    boost_channels = Column(Text, default="[]")
    boost_roles = Column(Text, default="[]")

    card_bg_color = Column(String(20), default="#111118")
    card_accent_color = Column(String(20), default="#00E5FF")
    card_style = Column(String(50), default="modern")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('server_id', 'platform', name='uq_ranking_settings'),
    )


# ═══════════════════════════════════════════════════════════════════════════
# ══ ТЗ №5: Система уровней ════════════════════════════════════════════════
# ═══════════════════════════════════════════════════════════════════════════

class RankingSettings(Base):
    """
    Настройки системы уровней для пары (server_id, platform).
    xp_formula хранится как JSON-строка (совместимо с SQLite и PostgreSQL).
    """
    __tablename__ = "ranking_settings"
    id = Column(Integer, primary_key=True)
    server_id = Column(Integer, ForeignKey("servers.id", ondelete="CASCADE"), nullable=False, index=True)
    platform = Column(String(20), nullable=False, default="vk")  # 'vk' | 'lolka'
    enabled = Column(Boolean, default=True)
    # Параметры начисления
    xp_per_message = Column(Integer, default=15)
    xp_per_voice_minute = Column(Integer, default=20)
    min_message_length = Column(Integer, default=3)
    cooldown_seconds = Column(Integer, default=60)
    multiplier = Column(Float, default=1.0)
    # Формула XP (JSON-строка)
    xp_formula = Column(Text, default='{"type":"exponential","base_xp":15,"multiplier":1.0}')
    # Награды (JSON-строка)
    rewards = Column(Text, default="[]")
    # Уведомления
    notify_channel = Column(String(255), default="")
    notify_message = Column(Text, default=" {user} достиг {level} уровня!")
    ping_user = Column(Boolean, default=True)
    # Decay (снижение XP за неактивность)
    decay_enabled = Column(Boolean, default=False)
    decay_days = Column(Integer, default=7)
    decay_percent = Column(Integer, default=10)
    # Ограничения
    blacklist_channels = Column(Text, default="[]")  # JSON-список
    boost_channels = Column(Text, default="[]")      # JSON-список
    boost_roles = Column(Text, default="[]")         # JSON-список
    # Карточка
    card_bg_color = Column(String(20), default="#111118")
    card_accent_color = Column(String(20), default="#00E5FF")
    card_style = Column(String(50), default="modern")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    __table_args__ = (
        UniqueConstraint('server_id', 'platform', name='uq_ranking_settings'),
    )