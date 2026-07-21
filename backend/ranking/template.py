"""
Рендеринг шаблона уведомления о повышении уровня.
Общий для VK (main.py) и Lolka (lolka_gateway.py) обработчиков — единственное
место, где разбирается синтаксис плейсхолдеров (ТЗ №5 Rev.6, п.4.4).
"""
from typing import Optional


def _plural_level(n: int) -> str:
    """Склонение слова «уровень» под число (1 уровень, 2 уровня, 5 уровней)."""
    n_abs = abs(n) % 100
    n1 = n_abs % 10
    if 11 <= n_abs <= 14:
        return "уровней"
    if n1 == 1:
        return "уровень"
    if 2 <= n1 <= 4:
        return "уровня"
    return "уровней"


def _fmt_number(n: int) -> str:
    """Форматирование числа с разделителем тысяч (неразрывный пробел)."""
    return f"{n:,}".replace(",", "\u00A0")


def render_notify_template(
    template: str,
    *,
    user: str,
    level: int,
    guild: str = "",
    xp: Optional[int] = None,
    next_level_xp: Optional[int] = None,
    rank: Optional[int] = None,
) -> str:
    """Подставляет переменные в шаблон уведомления о level-up.

    Поддерживаемые плейсхолдеры:
    {user}, {level}, {level_word} (склонение — «уровень/уровня/уровней»),
    {guild}, {xp}, {next_level_xp}, {rank}.
    """
    replacements = {
        "{user}": user,
        "{level}": str(level),
        "{level_word}": _plural_level(level),
        "{guild}": guild or "",
        "{xp}": _fmt_number(xp) if xp is not None else "",
        "{next_level_xp}": _fmt_number(next_level_xp) if next_level_xp is not None else "",
        "{rank}": f"#{rank}" if rank is not None else "",
    }
    text = template
    for placeholder, value in replacements.items():
        text = text.replace(placeholder, value)
    return text
