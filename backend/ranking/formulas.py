"""
Движок расчёта XP и уровней.
Формулы: linear, exponential, logarithmic, custom.
"""
import math
from typing import Dict, Optional, Callable
from pydantic import BaseModel, field_validator


class XPFormulaConfig(BaseModel):
    formula_type: str = "exponential"
    base_xp: int = 15
    multiplier: float = 1.0
    decay_factor: float = 0.0
    max_xp_per_message: int = 100
    custom_expression: Optional[str] = None

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
    def calculate_level_xp(level: int, formula_type: str = 'exponential') -> int:
        if level <= 0:
            return 100
        if formula_type == 'linear':
            return 100 * level
        elif formula_type == 'logarithmic':
            return int(100 * level * math.log10(level + 1))
        return 100 * (level ** 2)  # exponential — дефолт


XP_PRESETS: Dict[str, XPFormulaConfig] = {
    'balanced': XPFormulaConfig(formula_type='exponential', base_xp=15, multiplier=1.0, max_xp_per_message=100),
    'fast_progression': XPFormulaConfig(formula_type='linear', base_xp=25, multiplier=1.5, max_xp_per_message=150),
    'hardcore': XPFormulaConfig(formula_type='logarithmic', base_xp=10, multiplier=0.8, decay_factor=0.05, max_xp_per_message=50),
}