"""
Движок расчёта XP и уровней.
Формулы: linear, exponential, logarithmic, custom.
"""
import math
from typing import Dict, Optional, Callable
from pydantic import BaseModel, field_validator

# Базовое значение base_xp, относительно которого исторически откалиброван порог
# уровня (100 * level^2 при exponential и base_xp=15). Существующие сервера
# с дефолтным base_xp/multiplier не должны получить скачок требуемого XP при
# обновлении — поэтому кривая уровня масштабируется как (base_xp / DEFAULT_BASE_XP) * multiplier.
DEFAULT_BASE_XP = 15


class XPFormulaConfig(BaseModel):
    formula_type: str = "exponential"
    base_xp: int = 15
    multiplier: float = 1.0
    decay_factor: float = 0.0
    max_xp_per_message: int = 100
    custom_expression: Optional[str] = None
    # Блок №2 «Формула XP» (только Lolka — у VK нет голосовых каналов). Раньше
    # порог уровня при голосовом начислении ошибочно считался по текстовым
    # base_xp/multiplier (общий источник с сообщениями) — теперь у голоса свой,
    # независимый набор параметров. Дефолты совпадают с текстовыми, чтобы для
    # существующих серверов (где поле ещё не задано) кривая не менялась.
    voice_base_xp: int = 15
    voice_multiplier: float = 1.0

    @field_validator('formula_type')
    @classmethod
    def validate_formula_type(cls, v):
        allowed = ['linear', 'exponential', 'logarithmic', 'custom']
        if v not in allowed:
            raise ValueError(f'Formula type must be one of: {allowed}')
        return v


class XPFormulaEngine:
    FORMULAS: Dict[str, Callable] = {
        'linear': lambda base, level, mult: base * mult,
        'exponential': lambda base, level, mult: base * (1 + level * 0.1) * mult,
        'logarithmic': lambda base, level, mult: base * (1 + math.log10(level + 1)) * mult,
    }

    @staticmethod
    def calculate_xp(config: XPFormulaConfig, current_level: int, message_length: int, is_voice: bool = False) -> int:
        formula_func = XPFormulaEngine.FORMULAS.get(config.formula_type, XPFormulaEngine.FORMULAS['exponential'])
        xp = formula_func(config.base_xp, current_level, config.multiplier)

        if message_length > 100:
            xp *= 1.5
        elif message_length > 50:
            xp *= 1.2

        if is_voice:
            xp *= 1.5
        if config.decay_factor > 0:
            xp *= (1 - config.decay_factor)

        return max(1, int(min(xp, config.max_xp_per_message)))

    @staticmethod
    def calculate_level_xp(level: int, formula_type: str = 'exponential', base_xp: int = DEFAULT_BASE_XP, multiplier: float = 1.0) -> int:
        """Требуемый суммарный XP для level. Раньше base_xp/multiplier из «Формулы опыта»
        никак не влияли на порог уровня (только на XP за одно сообщение) — из-за этого
        график прогрессии и «ХР до N уровня» не менялись при правке этих полей (ТЗ №5,
        доработка). Теперь кривая масштабируется относительно них, оставаясь тождественной
        прежней формуле (100 * level^2 и т.д.) при дефолтных base_xp=15, multiplier=1.0."""
        if level <= 0:
            return 100
        scale = (base_xp / DEFAULT_BASE_XP) * (multiplier if multiplier > 0 else 1.0)
        if formula_type == 'linear':
            return max(1, int(100 * scale * level))
        elif formula_type == 'logarithmic':
            return max(1, int(100 * scale * level * math.log10(level + 1)))
        return max(1, int(100 * scale * (level ** 2)))  # exponential — дефолт


XP_PRESETS: Dict[str, XPFormulaConfig] = {
    'balanced': XPFormulaConfig(formula_type='exponential', base_xp=15, multiplier=1.0, max_xp_per_message=100),
    'fast_progression': XPFormulaConfig(formula_type='linear', base_xp=25, multiplier=1.5, max_xp_per_message=150),
    'hardcore': XPFormulaConfig(formula_type='logarithmic', base_xp=10, multiplier=0.8, decay_factor=0.05, max_xp_per_message=50),
}