"""
Движок автомодерации — ТЗ №5 (этап 2)
Проверяет текст сообщений на спам, мат, капс, ссылки, упоминания, эмодзи, повторы.
Thread-safe (GIL), in-memory кэш последних сообщений.
"""

import re
import time
from typing import Optional, Dict, Any
from collections import defaultdict, deque

# ── Регулярки ────────────────────────────────────────────────────────────────
_URL_RE = re.compile(
    r'https?://\S+|www\.\S+|vk\.cc/\w+|t\.me/\S+|clck\.ru/\S+|bit\.ly/\S+|goo\.gl/\S+',
    re.IGNORECASE
)
_MENTION_RE = re.compile(r'\[id\d+\|[^\]]+\]|\*id\d+|@\w+', re.IGNORECASE)
_EMOJI_RE = re.compile(
    r'[😀-🙏]|[🌀-🗿]|[🚀-🛿]|'
    r'[🇠-🇿]|[✂-➰]|[Ⓜ-🉑]',
    re.UNICODE
)

# Список запрещённых слов (MVP — базовый русский мат)
_BAD_WORDS = [
    "бля", "блядь", "блять", "хуй", "хуя", "хуе", "хуи", "хуё", "пизд", "пизда",
    "пиздец", "пиздюк", "еба", "ебу", "еби", "ебал", "ебут", "ёб", "ёба", "ёбу",
    "ёбн", "ёбарь", "сука", "сучка", "сучар", "мудак", "мудил", "гандон", "гондон",
    "долбоеб", "долбоёб", "ублюдок", "шлюха", "проститутка", "пидор", "педик",
    "пидар", "чмо", "чмошник", "манда", "мандавошка", "залупа", "хер", "херня",
]
_BAD_WORDS_RE = re.compile(
    r'(?:^|[^а-яё])(' + '|'.join(re.escape(w) for w in _BAD_WORDS) + r')(?:[^а-яё]|$)',
    re.IGNORECASE
)


class ModerationResult:
    """Результат проверки движком."""
    __slots__ = ("action", "reason", "rule")

    def __init__(self, action: str, reason: str, rule: str):
        self.action = action      # "delete" | "ban" | "warn" | "mute"
        self.reason = reason
        self.rule = rule

    def to_dict(self) -> Dict[str, str]:
        return {"action": self.action, "reason": self.reason, "rule": self.rule}


class ModerationEngine:
    """
    Движок автомодерации.
    Хранит in-memory историю сообщений по user_id (TTL = 60 сек).
    """

    def __init__(self, message_ttl: int = 60, max_history: int = 20):
        self._message_ttl = message_ttl
        self._max_history = max_history
        # user_id -> deque[(timestamp, text)]
        self._history: Dict[Any, deque] = defaultdict(lambda: deque(maxlen=max_history))

    # ── Internal helpers ────────────────────────────────────────────────────

    def _cleanup_history(self, user_id: Any):
        now = time.time()
        dq = self._history[user_id]
        while dq and now - dq[0][0] > self._message_ttl:
            dq.popleft()

    def _save_message(self, user_id: Any, text: str):
        self._history[user_id].append((time.time(), text))

    # ── Rule checks ─────────────────────────────────────────────────────────

    def _check_links(self, text: str, config: Dict[str, Any]) -> Optional[ModerationResult]:
        if not config.get("autoDeleteLinks"):
            return None
        if _URL_RE.search(text):
            return ModerationResult("delete", "Автоудаление: запрещённая ссылка", "autoDeleteLinks")
        return None

    def _check_bad_words(self, text: str, config: Dict[str, Any]) -> Optional[ModerationResult]:
        if not config.get("badWordsFilter"):
            return None
        if _BAD_WORDS_RE.search(text):
            return ModerationResult("delete", "Автоудаление: запрещённое слово", "badWordsFilter")
        return None

    def _check_caps(self, text: str, config: Dict[str, Any]) -> Optional[ModerationResult]:
        if not config.get("autoModCaps"):
            return None
        threshold = config.get("capsThreshold", 70)
        letters = [c for c in text if c.isalpha()]
        if len(letters) < 5:
            return None
        caps_count = sum(1 for c in letters if c.isupper())
        if caps_count / len(letters) * 100 >= threshold:
            return ModerationResult("delete", f"Автоудаление: CAPS ({caps_count}/{len(letters)})", "autoModCaps")
        return None

    def _check_mentions(self, text: str, config: Dict[str, Any]) -> Optional[ModerationResult]:
        if not config.get("autoModMentions"):
            return None
        max_mentions = config.get("maxMentions", 5)
        mentions = len(_MENTION_RE.findall(text))
        if mentions > max_mentions:
            return ModerationResult(
                "delete",
                f"Автоудаление: слишком много упоминаний ({mentions}/{max_mentions})",
                "autoModMentions"
            )
        return None

    def _check_emoji(self, text: str, config: Dict[str, Any]) -> Optional[ModerationResult]:
        if not config.get("autoModEmoji"):
            return None
        max_emoji = config.get("maxEmoji", 10)
        emojis = len(_EMOJI_RE.findall(text))
        if emojis > max_emoji:
            return ModerationResult(
                "delete",
                f"Автоудаление: слишком много эмодзи ({emojis}/{max_emoji})",
                "autoModEmoji"
            )
        return None

    def _check_repeats(self, user_id: Any, text: str, config: Dict[str, Any]) -> Optional[ModerationResult]:
        if not config.get("autoModRepeats"):
            return None
        repeat_threshold = config.get("repeatThreshold", 3)
        history = self._history[user_id]
        same_count = sum(1 for ts, msg in history if msg == text)
        if same_count >= repeat_threshold - 1:
            return ModerationResult(
                "delete",
                f"Автоудаление: повтор сообщения ({same_count + 1}×)",
                "autoModRepeats"
            )
        return None

    def _check_spam(self, user_id: Any, config: Dict[str, Any]) -> Optional[ModerationResult]:
        if not config.get("antiSpam"):
            return None
        # >5 сообщений за 10 секунд = флуд
        now = time.time()
        recent = [ts for ts, msg in self._history[user_id] if now - ts < 10]
        if len(recent) >= 5:
            return ModerationResult(
                "ban",
                f"Автобан: флуд ({len(recent)} сообщений за 10 сек)",
                "antiSpam"
            )
        return None

    def _check_raid(self, user_id: Any, config: Dict[str, Any]) -> Optional[ModerationResult]:
        if not config.get("antiRaid"):
            return None
        # >10 сообщений за 60 секунд от одного пользователя = подозрение на рейд
        now = time.time()
        recent = [ts for ts, msg in self._history[user_id] if now - ts < 60]
        if len(recent) >= 10:
            return ModerationResult(
                "ban",
                f"Автобан: подозрение на рейд ({len(recent)} сообщений за 60 сек)",
                "antiRaid"
            )
        return None

    # ── Public API ──────────────────────────────────────────────────────────

    def check_message(self, user_id: Any, text: str, config: Dict[str, Any]) -> Optional[ModerationResult]:
        """
        Проверить сообщение по всем правилам.
        Возвращает ModerationResult при срабатывании первого правила
        (порядок: ссылки → мат → капс → упоминания → эмодзи → повторы → спам → рейд).
        """
        if not text or not isinstance(text, str):
            return None

        self._cleanup_history(user_id)

        # Проверки по порядку приоритета
        checks = [
            self._check_links(text, config),
            self._check_bad_words(text, config),
            self._check_caps(text, config),
            self._check_mentions(text, config),
            self._check_emoji(text, config),
            self._check_repeats(user_id, text, config),
            self._check_spam(user_id, config),
            self._check_raid(user_id, config),
        ]

        for result in checks:
            if result:
                # Не сохраняем сообщение, если оно нарушило правило (чтобы повторы не копились)
                return result

        # Сообщение чистое — сохраняем в историю
        self._save_message(user_id, text)
        return None
