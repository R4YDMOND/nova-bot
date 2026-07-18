"""
In-memory кэш с TTL для снижения нагрузки на БД.
Поддерживает как sync, так и async функции.
"""
from datetime import datetime, timedelta
from typing import Any, Optional, Dict, Callable
import hashlib
import asyncio
from functools import wraps


class CacheLayer:
    """In-memory cache с TTL"""

    def __init__(self):
        self._cache: Dict[str, Any] = {}
        self._ttl: Dict[str, datetime] = {}

    def get(self, key: str) -> Optional[Any]:
        """Получить значение из cache"""
        if key in self._cache:
            if datetime.utcnow() < self._ttl.get(key, datetime.utcnow()):
                return self._cache[key]
            else:
                self.delete(key)
        return None

    def set(self, key: str, value: Any, ttl_seconds: int = 60):
        """Установить значение в cache"""
        self._cache[key] = value
        self._ttl[key] = datetime.utcnow() + timedelta(seconds=ttl_seconds)

    def delete(self, key: str):
        """Удалить значение из cache"""
        self._cache.pop(key, None)
        self._ttl.pop(key, None)

    def clear(self):
        """Очистить весь cache"""
        self._cache.clear()
        self._ttl.clear()

    def get_stats(self) -> Dict[str, int]:
        """Получить статистику кэша"""
        now = datetime.utcnow()
        active = sum(1 for ttl in self._ttl.values() if now < ttl)
        return {
            'total_keys': len(self._cache),
            'active_keys': active,
            'expired_keys': len(self._cache) - active
        }


# Global cache instance
cache = CacheLayer()


def cached(ttl: int = 60, key_prefix: str = ""):
    """
    Decorator для кэширования результатов функции (поддерживает sync и async)
    """
    def decorator(func: Callable):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            key_data = f"{key_prefix}:{func.__name__}:{args}:{kwargs}"
            key_hash = hashlib.md5(key_data.encode()).hexdigest()

            cached_value = cache.get(key_hash)
            if cached_value is not None:
                return cached_value

            result = await func(*args, **kwargs)
            cache.set(key_hash, result, ttl)
            return result

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            key_data = f"{key_prefix}:{func.__name__}:{args}:{kwargs}"
            key_hash = hashlib.md5(key_data.encode()).hexdigest()

            cached_value = cache.get(key_hash)
            if cached_value is not None:
                return cached_value

            result = func(*args, **kwargs)
            cache.set(key_hash, result, ttl)
            return result

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator


def invalidate_cache(key_prefix: str):
    """Инвалидировать кэш по префиксу"""
    keys_to_delete = [
        key for key in cache._cache.keys()
        if key.startswith(key_prefix)
    ]
    for key in keys_to_delete:
        cache.delete(key)