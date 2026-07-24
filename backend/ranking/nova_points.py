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
import random

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from models import NovaPoint, NovaPointTransaction, RankingSettings, ShopItem


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


def add_points_direct(db: Session, server_id: str, platform: str, user_id: str, points: int) -> None:
    """
    Начисление NP напрямую в агрегаты (без записи в NovaPointTransaction) —
    используется для пассивного фарма (ranking/np_farm_cache.py, write-behind пачка
    раз в несколько минут). Транзакционный лог здесь намеренно не ведётся: при частоте
    "за каждое сообщение" он быстро раздует БД на free-tier (см. ТЗ №5 Rev.9, п.15).
    Кулдаун/лимиты выдачи (give_nova_point) к пассивному фарму не применяются — это
    отдельный источник очков.
    """
    if points <= 0:
        return
    np_row = _get_or_create_np(db, server_id, platform, user_id)
    np_row.total_points += points
    np_row.monthly_points += points
    np_row.weekly_points += points
    db.commit()


def claim_daily(db: Session, server_id: str, platform: str, user_id: str) -> dict:
    """
    Ежедневный бонус (/daily на Lolka, "ежедневный бонус" на VK) — ТЗ №5 Rev.9, п.11.
    Случайное количество NP в диапазоне [np_daily_min, np_daily_max] с шансом джекпота
    np_daily_jackpot_chance% на np_daily_jackpot_amount. Раз в 24 часа на пользователя.
    """
    try:
        server_id_int = int(server_id)
    except (TypeError, ValueError):
        return {"status": "error", "error": "Некорректный server_id"}

    settings = db.query(RankingSettings).filter(and_(
        RankingSettings.server_id == server_id_int,
        RankingSettings.platform == platform,
    )).first()
    if not settings or not settings.np_enabled or not settings.np_daily_enabled:
        return {"status": "error", "error": "Ежедневный бонус отключён на этом сервере"}

    np_row = _get_or_create_np(db, server_id, platform, user_id)
    now = datetime.utcnow()
    if np_row.last_daily_claim and (now - np_row.last_daily_claim) < timedelta(hours=24):
        wait = timedelta(hours=24) - (now - np_row.last_daily_claim)
        hours = int(wait.total_seconds() // 3600)
        minutes = int((wait.total_seconds() % 3600) // 60)
        return {"status": "error", "error": f"Следующий бонус через {hours} ч {minutes} мин"}

    jackpot = random.randint(1, 100) <= max(0, min(100, settings.np_daily_jackpot_chance or 0))
    if jackpot:
        amount = settings.np_daily_jackpot_amount or 50
    else:
        lo, hi = settings.np_daily_min or 5, settings.np_daily_max or 20
        amount = random.randint(min(lo, hi), max(lo, hi))

    np_row.total_points += amount
    np_row.monthly_points += amount
    np_row.weekly_points += amount
    np_row.last_daily_claim = now
    db.commit()
    return {"status": "ok", "amount": amount, "jackpot": jackpot, "total_points": np_row.total_points}


# ── Магазин ролей (ТЗ №5 Rev.9, п.12) ────────────────────────────────────────

def list_shop_items(db: Session, server_id: str, platform: str):
    return db.query(ShopItem).filter(and_(
        ShopItem.server_id == server_id,
        ShopItem.platform == platform,
    )).order_by(ShopItem.price.asc()).all()


def buy_shop_item(db: Session, server_id: str, platform: str, user_id: str, item_id: int) -> dict:
    """
    Списывает баланс и возвращает товар для последующей выдачи роли платформой
    (Lolka: PUT .../members/{user}/roles/{role} в вызывающем коде — lolka_gateway.py;
    VK: API сообщества не даёт назначать роли участникам, поэтому на VK покупка
    только подтверждается списанием очков).
    """
    item = db.query(ShopItem).filter(and_(
        ShopItem.id == item_id,
        ShopItem.server_id == server_id,
        ShopItem.platform == platform,
    )).first()
    if not item:
        return {"status": "error", "error": "Товар не найден"}

    np_row = _get_or_create_np(db, server_id, platform, user_id)
    if np_row.total_points < item.price:
        return {"status": "error", "error": f"Недостаточно Nova Points (нужно {item.price}, у вас {np_row.total_points})"}

    np_row.total_points -= item.price
    db.commit()
    return {"status": "ok", "item_id": item.id, "role_id": item.role_id, "role_name": item.role_name, "price": item.price}
