"""
Логика Nova Points (ТЗ №5 Rev.7, п.3.1) — независимая от XP система репутации.
+1 NP выдаётся действием (реакция/команда — источник события не входит в этот
модуль, сюда попадает уже разрешённая пара giver_id/receiver_id).

Проверки при выдаче:
  1. giver_id != receiver_id
  2. Кулдаун между парой giver→receiver (settings.np_cooldown_minutes, дефолт 10 мин)
  3. Суточный лимит получения на receiver_id (settings.np_daily_limit, дефолт 50 NP/сутки)
"""
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from models import NovaPoint, NovaPointTransaction, RankingSettings


def _get_or_create_np(db: Session, server_id: str, platform: str, user_id: str) -> NovaPoint:
    np = db.query(NovaPoint).filter(and_(
        NovaPoint.server_id == server_id,
        NovaPoint.platform == platform,
        NovaPoint.user_id == user_id,
    )).first()
    if not np:
        np = NovaPoint(server_id=server_id, platform=platform, user_id=user_id)
        db.add(np)
        db.flush()
    return np


def give_nova_point(
    db: Session,
    server_id: str,
    platform: str,
    giver_id: str,
    receiver_id: str,
    reason: Optional[str] = None,
    message_id: Optional[str] = None,
) -> dict:
    """Пытается выдать +1 NP. Возвращает {"status": "ok", ...} либо {"status": "error", "error": "..."}."""
    try:
        server_id_int = int(server_id)
    except (TypeError, ValueError):
        return {"status": "error", "error": "Некорректный server_id"}

    settings = db.query(RankingSettings).filter(and_(
        RankingSettings.server_id == server_id_int,
        RankingSettings.platform == platform,
    )).first()
    if not settings or not settings.np_enabled:
        return {"status": "error", "error": "Nova Points отключены на этом сервере"}

    if giver_id == receiver_id:
        return {"status": "error", "error": "Нельзя выдать Nova Point самому себе"}

    cooldown_minutes = settings.np_cooldown_minutes or 10
    daily_limit = settings.np_daily_limit or 50
    now = datetime.utcnow()

    last_tx = db.query(NovaPointTransaction).filter(and_(
        NovaPointTransaction.server_id == server_id,
        NovaPointTransaction.platform == platform,
        NovaPointTransaction.giver_id == giver_id,
        NovaPointTransaction.receiver_id == receiver_id,
    )).order_by(NovaPointTransaction.created_at.desc()).first()
    if last_tx and (now - last_tx.created_at) < timedelta(minutes=cooldown_minutes):
        wait_seconds = int((timedelta(minutes=cooldown_minutes) - (now - last_tx.created_at)).total_seconds())
        return {"status": "error", "error": f"Кулдаун: подождите ещё {max(wait_seconds, 1)} сек."}

    day_ago = now - timedelta(hours=24)
    received_today = db.query(func.coalesce(func.sum(NovaPointTransaction.points), 0)).filter(and_(
        NovaPointTransaction.server_id == server_id,
        NovaPointTransaction.platform == platform,
        NovaPointTransaction.receiver_id == receiver_id,
        NovaPointTransaction.created_at >= day_ago,
    )).scalar() or 0
    if received_today + 1 > daily_limit:
        return {"status": "error", "error": f"Достигнут суточный лимит получения NP ({daily_limit})"}

    tx = NovaPointTransaction(
        server_id=server_id, platform=platform,
        giver_id=giver_id, receiver_id=receiver_id,
        points=1, reason=reason, message_id=message_id,
    )
    db.add(tx)

    receiver = _get_or_create_np(db, server_id, platform, receiver_id)
    receiver.total_points += 1
    receiver.monthly_points += 1
    receiver.weekly_points += 1
    receiver.last_received = now
    _get_or_create_np(db, server_id, platform, giver_id)  # чтобы giver тоже появился в системе с 0 очков

    db.commit()
    return {"status": "ok", "total_points": receiver.total_points}


def get_top(db: Session, server_id: str, platform: str, period: str = "all", limit: int = 10):
    column = {"week": NovaPoint.weekly_points, "month": NovaPoint.monthly_points}.get(period, NovaPoint.total_points)
    return db.query(NovaPoint).filter(and_(
        NovaPoint.server_id == server_id,
        NovaPoint.platform == platform,
    )).order_by(column.desc()).limit(limit).all()
