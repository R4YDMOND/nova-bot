"""
Рендеринг шаблона уведомления о повышении уровня.
Общий для VK (main.py) и Lolka (lolka_gateway.py) обработчиков — единственное
место, где разбирается синтаксис плейсхолдеров (ТЗ №5 Rev.6, п.4.4).
"""
import json
from datetime import datetime
from typing import Any, Dict, Optional


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


# ── Рендер структурированного шаблона (текст+embed+компоненты) под платформу ──
# ТЗ №5 Rev.6, п.3.2 (редактор шаблонов) + открытый вопрос "бэкенд-рендер embed'ов".
# Lolka Discord-совместим → embed/components передаются как есть в REST-запрос.
# VK нативных embed'ов не имеет → панель сворачивается в форматированный текст,
# кнопки конвертируются в inline-клавиатуру VK. Select-меню в VK не поддерживаются
# платформой и в рендер не попадают.

_LOLKA_BUTTON_STYLE = {"primary": 1, "secondary": 2, "success": 3, "danger": 4, "link": 5}
_VK_BUTTON_COLOR = {"primary": "primary", "secondary": "secondary", "success": "positive", "danger": "negative", "link": "primary"}

# Действие "Выдать Nova Point" (frontend/src/types/ranking.ts, BUTTON_ACTIONS) — единственное
# действие кнопки/select-опции, которому нужен получатель (см. ranking/actions.py, ACTION_NP_GIVE).
_ACTION_NP_GIVE = "nova_points_give"


def render_message_template(
    template: Dict[str, Any],
    *,
    platform: str,
    user: str,
    level: int,
    guild: str = "",
    xp: Optional[int] = None,
    next_level_xp: Optional[int] = None,
    rank: Optional[int] = None,
    target_user_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Рендерит структурированный MessageTemplate (см. frontend/src/types/ranking.ts)
    под конкретную платформу.

    Lolka → {"content": str, "embeds": [...], "components": [...]} (Discord-формат).
    VK    → {"message": str, "keyboard": Optional[str]} (JSON-строка клавиатуры VK).
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

    def sub(text: Optional[str]) -> str:
        text = text or ""
        for placeholder, value in replacements.items():
            text = text.replace(placeholder, value)
        return text

    content = sub(template.get("content", ""))
    embed = template.get("embed") or {}
    embed_enabled = bool(template.get("embed_enabled")) and bool(embed)
    buttons = template.get("buttons") or []
    select_menus = template.get("select_menus") or []

    if platform == "lolka":
        result: Dict[str, Any] = {"content": content, "embeds": [], "components": []}

        if embed_enabled:
            rendered_embed: Dict[str, Any] = {}
            if embed.get("title"):
                rendered_embed["title"] = sub(embed["title"])
            if embed.get("description"):
                rendered_embed["description"] = sub(embed["description"])
            if embed.get("url"):
                rendered_embed["url"] = embed["url"]
            color = embed.get("color")
            if color:
                try:
                    rendered_embed["color"] = int(str(color).lstrip("#"), 16)
                except ValueError:
                    pass
            author = embed.get("author") or {}
            if author.get("name"):
                rendered_embed["author"] = {
                    "name": sub(author["name"]),
                    "url": author.get("url", ""),
                    "icon_url": author.get("icon_url", ""),
                }
            if embed.get("image_url"):
                rendered_embed["image"] = {"url": embed["image_url"]}
            if embed.get("thumbnail_url"):
                rendered_embed["thumbnail"] = {"url": embed["thumbnail_url"]}
            footer = embed.get("footer") or {}
            if footer.get("text"):
                rendered_embed["footer"] = {"text": sub(footer["text"]), "icon_url": footer.get("icon_url", "")}
            if footer.get("timestamp"):
                rendered_embed["timestamp"] = datetime.utcnow().isoformat()
            fields = [f for f in (embed.get("fields") or []) if f.get("name") or f.get("value")]
            if fields:
                rendered_embed["fields"] = [
                    {"name": sub(f.get("name", "")), "value": sub(f.get("value", "")), "inline": bool(f.get("inline"))}
                    for f in fields
                ]
            result["embeds"] = [rendered_embed]

        rows: Dict[int, list] = {}
        for b in buttons:
            btn: Dict[str, Any] = {
                "type": 2,
                "style": _LOLKA_BUTTON_STYLE.get(b.get("style", "primary"), 1),
                "label": sub(b.get("label", "")),
            }
            if b.get("emoji"):
                btn["emoji"] = {"name": b["emoji"]}
            if b.get("style") == "link" and b.get("url"):
                btn["url"] = b["url"]
            else:
                custom_id = b.get("custom_id") or b.get("id", "")
                if custom_id == _ACTION_NP_GIVE and target_user_id:
                    custom_id = f"{_ACTION_NP_GIVE}:{target_user_id}"
                btn["custom_id"] = custom_id
            rows.setdefault(int(b.get("row", 0)), []).append(btn)
        for row_key in sorted(rows):
            result["components"].append({"type": 1, "components": rows[row_key]})

        for sm in select_menus:
            options = sm.get("options") or []
            if not options:
                continue
            result["components"].append({
                "type": 1,
                "components": [{
                    "type": 3,
                    "custom_id": sm.get("id", ""),
                    "placeholder": sub(sm.get("placeholder", "")),
                    "min_values": sm.get("min_values", 1),
                    "max_values": sm.get("max_values", 1),
                    "options": [
                        {
                            "label": sub(o.get("label", "")),
                            "value": (
                                f"{_ACTION_NP_GIVE}:{target_user_id}"
                                if o.get("value") == _ACTION_NP_GIVE and target_user_id
                                else o.get("value", "")
                            ),
                            "description": sub(o.get("description", "")) or None,
                        }
                        for o in options
                    ],
                }],
            })
        return result

    # VK: панель сворачивается в текст, кнопки → inline-клавиатура
    lines = [content] if content else []
    if embed_enabled:
        if embed.get("title"):
            lines.append(f"📌 {sub(embed['title'])}")
        if embed.get("description"):
            lines.append(sub(embed["description"]))
        for f in (embed.get("fields") or []):
            if f.get("name") or f.get("value"):
                lines.append(f"• {sub(f.get('name', ''))}: {sub(f.get('value', ''))}")
        footer = embed.get("footer") or {}
        if footer.get("text"):
            lines.append(f"— {sub(footer['text'])}")
    message = "\n".join(line for line in lines if line)

    keyboard: Optional[str] = None
    if buttons:
        vk_rows: Dict[int, list] = {}
        for b in buttons:
            label = sub(b.get("label", ""))[:40]
            if b.get("style") == "link" and b.get("url"):
                action = {"type": "open_link", "link": b["url"], "label": label}
            else:
                # callback (а не text) — клик придёт как message_event, который
                # реально обрабатывается ботом (см. ranking/actions.py); "text"
                # просто отправил бы payload как обычное сообщение от пользователя.
                custom_id = b.get("custom_id") or "nova_profile"
                vk_payload: Dict[str, Any] = {"nova_action": custom_id}
                if custom_id == _ACTION_NP_GIVE and target_user_id:
                    vk_payload["receiver_id"] = target_user_id
                action = {"type": "callback", "label": label, "payload": json.dumps(vk_payload)}
            vk_rows.setdefault(int(b.get("row", 0)), []).append({
                "action": action,
                "color": _VK_BUTTON_COLOR.get(b.get("style", "primary"), "primary"),
            })
        keyboard = json.dumps({"inline": True, "buttons": [vk_rows[k] for k in sorted(vk_rows)]}, ensure_ascii=False)

    return {"message": message, "keyboard": keyboard}
