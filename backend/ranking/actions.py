"""
Предустановленные действия кнопок сообщений уровней (редактор шаблонов, вкладка
«Компоненты»). Единственный реально обрабатываемый ботом функционал кнопок —
свободный custom_id намеренно убран из редактора (см. frontend/src/types/ranking.ts,
BUTTON_ACTIONS). Платформо-независимо: используется и VK-обработчиком (main.py),
и Lolka Gateway (lolka_gateway.py).
"""
from typing import Optional
from sqlalchemy import and_

from database import SessionLocal
from models import Member

ACTION_PROFILE = "nova_profile"
ACTION_LEADERBOARD = "nova_leaderboard"
ACTION_CLOSE = "nova_close"
ACTION_NP_GIVE = "nova_points_give"


def get_profile_summary(server_id: str, platform: str, user_id: str) -> str:
    """Короткая сводка по профилю участника. Умещается в 90 символов —
    лимит VK show_snackbar (см. VK - Документация.md, действие show_snackbar)."""
    db = SessionLocal()
    try:
        member = db.query(Member).filter(and_(
            Member.server_id == server_id,
            Member.platform == platform,
            Member.user_id == user_id,
        )).first()
        if not member:
            return "Профиль не найден — напишите сообщение, чтобы начать получать опыт"

        rank = db.query(Member).filter(and_(
            Member.server_id == server_id,
            Member.platform == platform,
            Member.xp > member.xp,
        )).count() + 1

        return f"Уровень {member.level} • {member.xp} XP • ранг #{rank}"
    finally:
        db.close()


def get_leaderboard_text(server_id: str, platform: str, limit: int = 10) -> str:
    """Топ-N участников — текст для обычного (не ephemeral) сообщения: у VK нет
    приватного ответа на клик, поэтому топ отправляется как реальное сообщение
    в чат на обеих платформах — единообразное поведение кнопки."""
    db = SessionLocal()
    try:
        rows = db.query(Member).filter(and_(
            Member.server_id == server_id,
            Member.platform == platform,
        )).order_by(Member.xp.desc()).limit(limit).all()

        if not rows:
            return "🏆 Топ участников пуст — пока никто не заработал опыт"

        medals = {0: "🥇", 1: "🥈", 2: "🥉"}
        lines = ["🏆 Топ участников:"]
        for i, m in enumerate(rows):
            prefix = medals.get(i, f"{i + 1}.")
            lines.append(f"{prefix} {m.username or m.user_id} — ур. {m.level} ({m.xp} XP)")
        return "\n".join(lines)
    finally:
        db.close()


def resolve_action(payload) -> Optional[str]:
    """Достаёт значение nova_action из payload кнопки (VK шлёт его JSON-строкой
    в message_event.payload, Lolka — как есть в data.custom_id, поэтому здесь
    обрабатывается только VK-случай; Lolka читает custom_id напрямую)."""
    import json
    if isinstance(payload, dict):
        return payload.get("nova_action")
    if isinstance(payload, str):
        try:
            return (json.loads(payload) or {}).get("nova_action")
        except (json.JSONDecodeError, AttributeError):
            return None
    return None


def resolve_receiver_id(payload) -> Optional[str]:
    """Достаёт receiver_id (кому выдаётся Nova Point), встроенный в payload кнопки
    при рендере шаблона для конкретного участника (см. ranking/template.py,
    render_message_template, параметр target_user_id) — только для ACTION_NP_GIVE."""
    import json
    if isinstance(payload, dict):
        return payload.get("receiver_id")
    if isinstance(payload, str):
        try:
            return (json.loads(payload) or {}).get("receiver_id")
        except (json.JSONDecodeError, AttributeError):
            return None
    return None
