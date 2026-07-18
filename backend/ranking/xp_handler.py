"""
Обработчик начисления XP пользователям.
Интегрируется с Callback API и Long Poll событиями VK и Lolka.
"""
import asyncio
import logging
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from sqlalchemy.orm import Session
from sqlalchemy import and_

from database import SessionLocal
from models import RankingSettings, Member
from ranking.formulas import XPFormulaEngine, XPFormulaConfig
from ranking.cache import cache

logger = logging.getLogger(__name__)

# Кулдаун между начислениями XP (в секундах)
XP_COOLDOWN = 60

# Кэш последних начислений: {f"{server_id}:{user_id}": timestamp}
_last_xp_award: Dict[str, datetime] = {}


async def award_xp_for_message(
    server_id: str,
    platform: str,
    user_id: str,
    username: str,
    message_length: int = 0,
    is_voice: bool = False,
    channel_id: Optional[str] = None,
    user_roles: Optional[list] = None,
) -> Optional[Dict[str, Any]]:
    """Начислить XP за текстовое или голосовое сообщение."""
    # Проверка кулдауна
    cache_key = f"{server_id}:{user_id}"
    last_award = _last_xp_award.get(cache_key)
    if last_award and (datetime.utcnow() - last_award).total_seconds() < XP_COOLDOWN:
        return None
    
    db = SessionLocal()
    try:
        # Получаем настройки системы уровней для сервера
        settings = db.query(RankingSettings).filter(
            and_(
                RankingSettings.server_id == server_id,
                RankingSettings.platform == platform,
                RankingSettings.enabled == True
            )
        ).first()
        
        if not settings:
            return None
        
        # Проверка blacklist каналов (безопасный парсинг JSON)
        if channel_id and settings.blacklist_channels:
            try:
                blacklist = json.loads(settings.blacklist_channels) if isinstance(settings.blacklist_channels, str) else settings.blacklist_channels
                if channel_id in blacklist:
                    return None
            except Exception:
                pass
        
        # Проверка boost каналов и ролей
        multiplier = settings.multiplier or 1.0
        if channel_id and settings.boost_channels:
            try:
                boost_channels = json.loads(settings.boost_channels) if isinstance(settings.boost_channels, str) else settings.boost_channels
                if channel_id in boost_channels:
                    multiplier *= 1.5
            except Exception:
                pass
        
        if user_roles and settings.boost_roles:
            try:
                boost_roles = json.loads(settings.boost_roles) if isinstance(settings.boost_roles, str) else settings.boost_roles
                if any(role in boost_roles for role in user_roles):
                    multiplier *= 1.5
            except Exception:
                pass
        
        # Вычисляем XP по формуле
        xp_config = XPFormulaConfig(
            formula_type=settings.xp_formula.get('type', 'exponential') if isinstance(settings.xp_formula, dict) else 'exponential',
            base_xp=settings.xp_per_message or 15,
            multiplier=multiplier,
            decay_factor=settings.decay_factor or 0.0,
            max_xp_per_message=settings.max_xp_per_message or 100,
        )
        
        xp_amount = XPFormulaEngine.calculate_xp(
            config=xp_config,
            current_level=1,
            message_length=message_length,
            is_voice=is_voice
        )
        
        # Находим или создаём запись пользователя в таблице Member
        member = db.query(Member).filter(
            and_(
                Member.server_id == server_id,
                Member.platform == platform,
                Member.user_id == user_id
            )
        ).first()
        
        if not member:
            member = Member(
                server_id=server_id,
                platform=platform,
                user_id=user_id,
                username=username,
                level=1,
                xp=0,
                messages=0,
                voice_minutes=0,
                reactions=0,
                last_active=datetime.utcnow(),
                last_activity=datetime.utcnow()
            )
            db.add(member)
            db.flush()
        
        # Начисляем XP
        member.xp += xp_amount
        member.last_activity = datetime.utcnow()
        
        if is_voice:
            member.voice_minutes += 1
        else:
            member.messages += 1
        
        # Проверяем повышение уровня
        required_xp = XPFormulaEngine.calculate_level_xp(member.level, xp_config.formula_type)
        
        leveled_up = False
        if member.xp >= required_xp:
            member.level += 1
            member.xp -= required_xp
            leveled_up = True
            
            # Проверяем награды за уровень
            rewards = []
            try:
                rewards = json.loads(settings.rewards) if isinstance(settings.rewards, str) else settings.rewards
            except Exception:
                pass
                
            level_rewards = [r for r in rewards if r.get('level') == member.level]
            
            db.commit()
            _last_xp_award[cache_key] = datetime.utcnow()
            cache.delete(f"leaderboard:{server_id}:{platform}")
            
            return {
                'xp_awarded': xp_amount,
                'new_level': member.level,
                'leveled_up': leveled_up,
                'rewards': level_rewards,
                'total_xp': member.xp,
                'required_xp': XPFormulaEngine.calculate_level_xp(member.level, xp_config.formula_type)
            }
        
        db.commit()
        _last_xp_award[cache_key] = datetime.utcnow()
        cache.delete(f"leaderboard:{server_id}:{platform}")
        
        return {
            'xp_awarded': xp_amount,
            'new_level': member.level,
            'leveled_up': False,
            'rewards': [],
            'total_xp': member.xp,
            'required_xp': required_xp - member.xp
        }
        
    except Exception as e:
        logger.error(f"Error awarding XP: {e}")
        db.rollback()
        return None
    finally:
        db.close()


def cleanup_old_cooldowns():
    """Очистить старые записи кулдауна (старше 1 часа)."""
    cutoff = datetime.utcnow() - timedelta(hours=1)
    keys_to_remove = [
        key for key, timestamp in _last_xp_award.items()
        if timestamp < cutoff
    ]
    for key in keys_to_remove:
        del _last_xp_award[key]
    
    if keys_to_remove:
        logger.info(f"Cleaned up {len(keys_to_remove)} old cooldown entries")