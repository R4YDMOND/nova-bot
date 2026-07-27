"""
Write-behind кэш пассивного начисления Nova Points за текстовые сообщения
(ТЗ №5 Rev.9, п.11 "Пассивный фарм" + п.15 "Инфраструктурные ограничения").

Не пишет в БД на каждое сообщение (Supabase free-tier) — накапливает очки в памяти
процесса и раз в несколько минут пачкой сбрасывает через nova_points.add_points_direct
(без транзакционного лога — см. комментарий там же). При засыпании/перезапуске
Render теряются только очки за последний интервал сброса — приемлемо (см. ТЗ).

Anti-farm: не чаще одного начисления в минуту на пользователя (та же логика,
что и у XP за сообщения — см. тултип "Опыт за сообщение" в текстовом наполнении).
"""
import asyncio
import random
import threading
import time
from typing import Dict, Tuple

from database import SessionLocal
from models import RankingSettings
from ranking.nova_points import add_points_direct

_FLUSH_INTERVAL_SECONDS = 180  # раз в 3 минуты, как указано в ТЗ №5 Rev.9, п.15
_PER_USER_COOLDOWN_SECONDS = 60

_lock = threading.Lock()
_pending: Dict[Tuple[str, str, str], float] = {}         # (server_id, platform, user_id) -> накопленные NP (дробные — голос начисляется по минутам от ставки "в час")
_last_award: Dict[Tuple[str, str, str], float] = {}       # anti-farm кулдаун (только для текста)


def register_message(server_id: str, platform: str, user_id: str, np_min: int, np_max: int) -> None:
    """Вызывается из обработчика сообщений (main.py/_process_vk_event, lolka_gateway.py)
    после того, как выяснено, что np_farm_enabled=True для сервера."""
    key = (str(server_id), platform, str(user_id))
    now = time.time()
    with _lock:
        last = _last_award.get(key, 0)
        if now - last < _PER_USER_COOLDOWN_SECONDS:
            return
        _last_award[key] = now
        lo, hi = min(np_min, np_max), max(np_min, np_max)
        amount = random.randint(lo, hi) if hi > 0 else 0
        if amount <= 0:
            return
        _pending[key] = _pending.get(key, 0) + amount


def register_voice_minute(server_id: str, platform: str, user_id: str, np_per_hour: int) -> None:
    """Вызывается раз в минуту из voice_tick_loop (lolka_gateway.py) для каждого участника
    голосового канала, в котором сейчас ≥2 активных участника. Без anti-farm кулдауна —
    тик уже ограничен интервалом в 1 минуту самим вызывающим циклом."""
    if np_per_hour <= 0:
        return
    key = (str(server_id), platform, str(user_id))
    with _lock:
        _pending[key] = _pending.get(key, 0) + (np_per_hour / 60.0)


def _drain() -> Dict[Tuple[str, str, str], int]:
    """Возвращает только ЦЕЛУЮ часть накопленных очков (для начисления в БД), дробный
    остаток (актуально для голоса — доли NP за минуту) оставляет в _pending до следующего сброса."""
    with _lock:
        drained: Dict[Tuple[str, str, str], int] = {}
        for key, value in list(_pending.items()):
            whole = int(value)
            if whole > 0:
                drained[key] = whole
                _pending[key] = value - whole
            if _pending[key] <= 0:
                del _pending[key]
    return drained


async def flush_loop() -> None:
    """Фоновая задача (запускается в main.py:startup(), asyncio.create_task) —
    раз в _FLUSH_INTERVAL_SECONDS сбрасывает накопленные очки в БД пачкой (UPSERT
    по факту через add_points_direct/_get_or_create_np)."""
    while True:
        await asyncio.sleep(_FLUSH_INTERVAL_SECONDS)
        pending = _drain()
        if not pending:
            continue
        db = SessionLocal()
        try:
            for (server_id, platform, user_id), points in pending.items():
                try:
                    add_points_direct(db, server_id, platform, user_id, points)
                except Exception as e:
                    print(f"NP FARM FLUSH: ошибка начисления {server_id}/{platform}/{user_id} — {e}")
        finally:
            db.close()
        print(f"NP FARM FLUSH: сброшено {len(pending)} записей")


def get_farm_settings(db, server_id: str, platform: str):
    """Загружает np_farm_enabled/np_farm_min/np_farm_max для сервера — тонкая обёртка,
    чтобы вызывающему коду (main.py/lolka_gateway.py) не импортировать RankingSettings напрямую."""
    try:
        server_id_int = int(server_id)
    except (TypeError, ValueError):
        return None
    return db.query(RankingSettings).filter(
        RankingSettings.server_id == server_id_int,
        RankingSettings.platform == platform,
    ).first()
