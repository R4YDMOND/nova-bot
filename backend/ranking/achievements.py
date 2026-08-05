"""
Система достижений (ТЗ №5 Rev.10, п.4) — независимая от Nova Points сущность.
NP/магазин/валюта НЕ переименовываются и не мигрируются: сохранены как есть (открытый
вопрос по ТЗ согласован с заказчиком — см. чат). Достижения выдаются:
  1. Автоматически — при повышении уровня, если найдено Achievement.trigger_level == new_level
     (проверяется из ranking/xp_handler.py, award_xp_for_message/award_xp_for_voice_minutes).
  2. Вручную — кнопкой "Выдать достижения" в редакторе шаблонов (custom_id == ACTION_ACHV_GIVE,
     ranking/actions.py), аналогично механике Nova Points give, но без валюты/кулдауна/лимита —
     достижение выдаётся один раз (повторная выдача той же пары giver→receiver не дублируется).
"""
from datetime import datetime
from typing import List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from models import Achievement, UserAchievement


def check_level_triggers(db: Session, server_id: str, platform: str, user_id: str, new_level: int) -> List[Achievement]:
    """Вызывается при level-up (см. ranking/xp_handler.py). Выдаёт достижения с
    trigger_level == new_level, если у участника их ещё нет. Возвращает список
    только что выданных достижений (для уведомления, если понадобится в будущем)."""
    triggered = db.query(Achievement).filter(and_(
        Achievement.server_id == server_id,
        Achievement.platform == platform,
        Achievement.trigger_level == new_level,
    )).all()
    if not triggered:
        return []

    already_ids = {
        row[0] for row in db.query(UserAchievement.achievement_id).filter(and_(
            UserAchievement.server_id == server_id,
            UserAchievement.platform == platform,
            UserAchievement.user_id == user_id,
            UserAchievement.achievement_id.in_([a.id for a in triggered]),
        )).all()
    }
    newly_granted = [a for a in triggered if a.id not in already_ids]
    for a in newly_granted:
        db.add(UserAchievement(
            server_id=server_id, platform=platform, user_id=user_id,
            achievement_id=a.id, giver_id=None, granted_at=datetime.utcnow(),
        ))
    if newly_granted:
        db.commit()
    return newly_granted


def give_achievement(db: Session, server_id: str, platform: str, giver_id: str, receiver_id: str) -> dict:
    """Ручная выдача достижения кнопкой "Выдать достижения" (ACTION_ACHV_GIVE). В отличие от
    Nova Points, здесь нет валюты/кулдауна/лимита — фиксируется единичный факт признания
    (повторная попытка той же пары giver→receiver отклоняется, чтобы не накручивать список)."""
    if giver_id == receiver_id:
        return {"status": "error", "error": "Нельзя выдать достижение самому себе"}

    existing = db.query(UserAchievement).filter(and_(
        UserAchievement.server_id == server_id,
        UserAchievement.platform == platform,
        UserAchievement.user_id == receiver_id,
        UserAchievement.giver_id == giver_id,
        UserAchievement.achievement_id.is_(None),
    )).first()
    if existing:
        return {"status": "error", "error": "Вы уже выдавали достижение этому участнику"}

    db.add(UserAchievement(
        server_id=server_id, platform=platform, user_id=receiver_id,
        achievement_id=None, giver_id=giver_id, granted_at=datetime.utcnow(),
    ))
    db.commit()
    return {"status": "ok", "message": "🏆 Достижение выдано!"}


def list_achievements(db: Session, server_id: str, platform: str) -> List[Achievement]:
    return db.query(Achievement).filter(and_(
        Achievement.server_id == server_id,
        Achievement.platform == platform,
    )).order_by(Achievement.trigger_level.asc().nullslast()).all()


def get_user_achievements_count(db: Session, server_id: str, platform: str, user_id: str) -> int:
    return db.query(UserAchievement).filter(and_(
        UserAchievement.server_id == server_id,
        UserAchievement.platform == platform,
        UserAchievement.user_id == user_id,
    )).count()
