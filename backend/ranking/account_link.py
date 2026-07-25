"""
Связка аккаунтов VK↔Lolka одного человека — единый кошелёк Nova Points (ТЗ №5 Rev.9, п.13).

Механизм — команда /link в боте:
  1. Участник пишет /link на платформе A → бот генерирует 6-значный код (действует 10 минут).
  2. Участник пишет /link <код> на платформе B → аккаунты связываются.

Скоуп связки — server_owner_id (User.id администратора дашборда), а не конкретный Server.id:
VK- и Lolka-подключения одного проекта — это две РАЗНЫЕ строки в таблице Server (см.
Server.platform), с разными id, поэтому пары "VK-сервер + Lolka-сервер одного проекта"
сопоставляются через общего владельца (админ подключил оба на дашборде под одним аккаунтом).
"""
import random
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from models import Server, LinkCode, AccountLink


def _get_owner_id(db: Session, server_internal_id: str) -> Optional[int]:
    try:
        server = db.query(Server).filter(Server.id == int(server_internal_id)).first()
    except (TypeError, ValueError):
        return None
    return server.owner_id if server else None


def generate_link_code(db: Session, server_internal_id: str, platform: str, user_id: str) -> dict:
    owner_id = _get_owner_id(db, server_internal_id)
    if not owner_id:
        return {"status": "error", "error": "Сервер не найден"}

    # Один активный код на пользователя/платформу — старые для этой пары удаляем
    db.query(LinkCode).filter(and_(
        LinkCode.server_owner_id == owner_id,
        LinkCode.platform == platform,
        LinkCode.user_id == user_id,
    )).delete()

    code = f"{random.randint(0, 999999):06d}"
    db.add(LinkCode(
        server_owner_id=owner_id, platform=platform, user_id=user_id,
        code=code, expires_at=datetime.utcnow() + timedelta(minutes=10),
    ))
    db.commit()
    return {"status": "ok", "code": code}


def confirm_link_code(db: Session, server_internal_id: str, platform: str, user_id: str, code: str) -> dict:
    owner_id = _get_owner_id(db, server_internal_id)
    if not owner_id:
        return {"status": "error", "error": "Сервер не найден"}

    other_platform = "lolka" if platform == "vk" else "vk"
    code = (code or "").strip()
    pending = db.query(LinkCode).filter(and_(
        LinkCode.server_owner_id == owner_id,
        LinkCode.platform == other_platform,
        LinkCode.code == code,
    )).first()
    if not pending or pending.expires_at < datetime.utcnow():
        return {"status": "error", "error": "Код неверный или истёк — запросите новый командой /link"}

    vk_user_id = user_id if platform == "vk" else pending.user_id
    lolka_user_id = user_id if platform == "lolka" else pending.user_id

    existing = db.query(AccountLink).filter(and_(
        AccountLink.server_owner_id == owner_id,
        or_(AccountLink.vk_user_id == vk_user_id, AccountLink.lolka_user_id == lolka_user_id),
    )).first()
    if existing:
        existing.vk_user_id = vk_user_id
        existing.lolka_user_id = lolka_user_id
        existing.linked_at = datetime.utcnow()
    else:
        db.add(AccountLink(server_owner_id=owner_id, vk_user_id=vk_user_id, lolka_user_id=lolka_user_id))

    db.delete(pending)
    db.commit()
    return {"status": "ok", "vk_user_id": vk_user_id, "lolka_user_id": lolka_user_id}


def get_linked_user_id(db: Session, server_internal_id: str, platform: str, user_id: str) -> Optional[str]:
    """Возвращает user_id на ДРУГОЙ платформе, если аккаунты связаны, иначе None."""
    owner_id = _get_owner_id(db, server_internal_id)
    if not owner_id:
        return None
    if platform == "vk":
        link = db.query(AccountLink).filter(and_(
            AccountLink.server_owner_id == owner_id, AccountLink.vk_user_id == user_id,
        )).first()
        return link.lolka_user_id if link else None
    link = db.query(AccountLink).filter(and_(
        AccountLink.server_owner_id == owner_id, AccountLink.lolka_user_id == user_id,
    )).first()
    return link.vk_user_id if link else None


def resolve_lolka_guild_for_server(db: Session, server_internal_id: str) -> Optional[str]:
    """Для VK Server.id находит Lolka guild_id того же проекта (тот же владелец дашборда)."""
    owner_id = _get_owner_id(db, server_internal_id)
    if not owner_id:
        return None
    lolka_server = db.query(Server).filter(and_(
        Server.owner_id == owner_id, Server.platform == "lolka",
    )).first()
    return lolka_server.server_id if lolka_server else None
