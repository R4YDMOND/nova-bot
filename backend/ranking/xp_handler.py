"""
Обработчик начисления XP. Интегрируется с Callback API VK (и Lolka Gateway — по аналогии).
"""
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any

from sqlalchemy import and_

from database import SessionLocal
from models import RankingSettings, Member, Server
from ranking.formulas import XPFormulaEngine, XPFormulaConfig

logger = logging.getLogger(__name__)

XP_COOLDOWN = 60  # секунд, дефолт — реальное значение берётся из settings.cooldown_seconds
_last_xp_award: Dict[str, datetime] = {}  # in-memory, сбрасывается при рестарте — это ок для кулдауна


async def award_xp_for_message(
    server_id: str,
    platform: str,
    user_id: str,
    username: str,
    message_text: str = "",
    channel_id: Optional[str] = None,
    avatar_url: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    db = SessionLocal()
    try:
        try:
            server_id_int = int(server_id)
        except (TypeError, ValueError):
            return None

        settings = db.query(RankingSettings).filter(and_(
            RankingSettings.server_id == server_id_int,
            RankingSettings.platform == platform,
            RankingSettings.enabled == True,
        )).first()
        if not settings:
            return None

        cache_key = f"{server_id}:{platform}:{user_id}"
        last_award = _last_xp_award.get(cache_key)
        cooldown = settings.cooldown_seconds or 60
        if last_award and (datetime.utcnow() - last_award).total_seconds() < cooldown:
            return None

        if len(message_text) < (settings.min_message_length or 0):
            return None

        try:
            blacklist = json.loads(settings.blacklist_channels or "[]")
        except json.JSONDecodeError:
            blacklist = []
        if channel_id and channel_id in blacklist:
            return None

        try:
            formula_data = json.loads(settings.xp_formula or "{}")
        except json.JSONDecodeError:
            formula_data = {}
        config = XPFormulaConfig(
            formula_type=formula_data.get("formula_type", "exponential"),
            base_xp=settings.xp_per_message or 15,
            multiplier=settings.multiplier or 1.0,
            decay_factor=formula_data.get("decay_factor", 0.0),
            max_xp_per_message=formula_data.get("max_xp_per_message", 100),
        )

        member = db.query(Member).filter(and_(
            Member.server_id == server_id,
            Member.platform == platform,
            Member.user_id == user_id,
        )).first()
        if not member:
            member = Member(server_id=server_id, platform=platform, user_id=user_id, username=username, avatar_url=avatar_url)
            db.add(member)
            db.flush()

        xp_gained = XPFormulaEngine.calculate_xp(config, member.level, len(message_text))
        member.xp += xp_gained
        member.messages += 1
        member.username = username
        member.last_activity = datetime.utcnow()

        leveled_up = False
        required = XPFormulaEngine.calculate_level_xp(member.level, config.formula_type)
        while member.xp >= required:
            member.level += 1
            leveled_up = True
            required = XPFormulaEngine.calculate_level_xp(member.level, config.formula_type)

        db.commit()
        _last_xp_award[cache_key] = datetime.utcnow()

        result: Dict[str, Any] = {
            "xp_gained": xp_gained,
            "new_level": member.level,
            "leveled_up": leveled_up,
            # Данные для уведомления о повышении уровня — отправка реализована на стороне
            # платформенного обработчика (main.py), т.к. этот модуль платформо-независим.
            "notify_channel": settings.notify_channel,
            "notify_message": settings.notify_message,
            "notify_template": settings.notify_template,
            "ping_user": settings.ping_user,
        }

        # Переменные расширенного шаблона (ТЗ №5 Rev.6, п.4.4) — считаем только
        # при реальном level-up, чтобы не нагружать БД лишними запросами на каждое сообщение.
        if leveled_up:
            server = db.query(Server).filter(Server.id == server_id_int).first()
            rank = db.query(Member).filter(and_(
                Member.server_id == server_id,
                Member.platform == platform,
                Member.xp > member.xp,
            )).count() + 1
            result.update({
                "guild": server.name if server else "",
                "xp": member.xp,
                "next_level_xp": required,
                "rank": rank,
            })

        return result
    except Exception as e:
        logger.error(f"award_xp_for_message error: {e}")
        db.rollback()
        return None
    finally:
        db.close()