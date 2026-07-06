'use client';
import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';

const API_BASE = 'https://nova-bot-rpsy.onrender.com';
const VK_APP_ID = 54666725;

const FALLBACK_STATS = { servers: 1247, users: 87450, responseTime: 0.68 };

const FEATURES = [
  { icon: '🛡️', title: 'Модерация', desc: 'Авто-мод, фильтры, антиспам' },
  { icon: '🤖', title: 'AI-Помощник', desc: 'Умные ответы и генерация контента' },
  { icon: '🪪', title: 'Система уровней', desc: 'Ранги, награды, лидерборды' },
  { icon: '🎵', title: 'Музыка', desc: 'YouTube, Яндекс.Музыка, радио' },
  { icon: '🔗', title: 'Вебхуки', desc: 'Гибкие уведомления и интеграции' },
  { icon: '📊', title: 'Аналитика', desc: 'Подробная статистика сервера' },
];

function useCountUp(target: number, trigger: boolean, durationMs = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let raf = 0;
    const start = performance.now();
    function tick(now: number) {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * target);
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, trigger, durationMs]);
  return value;
}

declare global {
  interface Window { VKIDSDK?: any; }
}

export default function HomePage() {
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [loaded, setLoaded] = useState(false);
  const [vkReady, setVkReady] = useState(false);
  const [showLolkaModal, setShowLolkaModal] = useState(false);
  const vkContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/stats`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => setStats({
        servers: data.servers ?? data.total_servers ?? FALLBACK_STATS.servers,
        users: data.users ?? data.total_users ?? FALLBACK_STATS.users,
        responseTime: data.responseTime ?? data.response_time ?? FALLBACK_STATS.responseTime,
      }))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (document.getElementById('vkid-sdk')) { setVkReady(true); return; }
    const script = document.createElement('script');
    script.id = 'vkid-sdk';
    script.src = 'https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js';
    script.onload = () => setVkReady(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!vkReady || !window.VKIDSDK || !vkContainerRef.current) return;
    try {
      const VKID = window.VKIDSDK;
      VKID.Config.init({
        app: VK_APP_ID,
        redirectUrl: `${window.location.origin}/api/auth/vk/callback`,
        responseMode: VKID.ConfigResponseMode.Redirect,
        source: VKID.ConfigSource.LOWCODE,
        scope: 'email',
      });
      const oneTap = new VKID.OneTap();
      oneTap.render({ container: vkContainerRef.current, showAlternativeLogin: false });
    } catch (e) {
      console.error('VK ID SDK error:', e);
    }
  }, [vkReady]);

  const servers = Math.round(useCountUp(stats.servers, loaded));
  const users = useCountUp(stats.users, loaded);
  const responseTime = useCountUp(stats.responseTime, loaded);

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--text))]">
      {/* Hero */}
      <div className="pt-24 pb-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[rgb(var(--surface-2))] px-4 py-1.5 rounded-full mb-6">
            <span className="text-cyan-400">⚡</span>
            <span className="text-sm font-medium">Nova Bot v2.4.1 — Активен</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-6">
            Умный бот для
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Lolka-сообществ
            </span>
          </h1>

          <p className="text-xl text-[rgb(var(--text-secondary))] max-w-2xl mx-auto mb-10">
            Модерация, AI-помощник, уровни, музыка и вебхуки — всё в одном боте
          </p>

          <div className="flex flex-col items-center gap-4">
            {/* VK ID кнопка */}
            <div className="w-full max-w-sm">
              <div ref={vkContainerRef} className="w-full" />
              {!vkReady && (
                <div className="w-full h-12 bg-[#0077FF]/20 rounded-xl animate-pulse flex items-center justify-center text-white/40 text-sm">
                  Загрузка VK ID...
                </div>
              )}
            </div>

            {/* Lolka — заглушка */}
            <button
              onClick={() => setShowLolkaModal(true)}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-semibold text-white bg-[#5865F2] hover:bg-[#4752C4] transition-colors text-lg"
            >
              <span className="text-xl">🎮</span>
              Войти через Lolka
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-8 text-center">
            <div className="text-5xl font-bold text-cyan-400 mb-3">
              {loaded ? servers.toLocaleString('ru-RU') : '---'}+
            </div>
            <div className="text-[rgb(var(--text-secondary))]">Серверов подключено</div>
          </Card>
          <Card className="p-8 text-center">
            <div className="text-5xl font-bold text-cyan-400 mb-3">
              {loaded ? (users / 1000).toFixed(1) : '---'}K+
            </div>
            <div className="text-[rgb(var(--text-secondary))]">Активных пользователей</div>
          </Card>
          <Card className="p-8 text-center">
            <div className="text-5xl font-bold text-cyan-400 mb-3">
              {loaded ? responseTime.toFixed(2) : '---'}с
            </div>
            <div className="text-[rgb(var(--text-secondary))]">Среднее время ответа</div>
          </Card>
        </div>
      </div>

      {/* Features */}
      <div className="bg-[rgb(var(--surface))] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">Возможности Nova</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <Card key={i} className="p-8 hover:scale-[1.02] transition-transform cursor-default">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-[rgb(var(--text-secondary))]">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center py-12 text-[rgb(var(--text-secondary))]">
        Nova Bot © 2026 — Для Lolka-сообществ
      </div>

      {/* Lolka Modal */}
      {showLolkaModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowLolkaModal(false)}
        >
          <div
            className="bg-[rgb(var(--surface))] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center relative shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLolkaModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 bg-[#5865F2]/20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">
              🎮
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Lolka — скоро</h2>

            <p className="text-white/50 text-sm leading-relaxed mb-6">
              OAuth2-авторизация и публичные интеграции для сторонних сервисов.
            </p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-left space-y-2">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <span className="text-green-400">✓</span> Bot API — уже доступен
              </div>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <span className="text-yellow-400">⏳</span> OAuth2 для сторонних сервисов — в разработке
              </div>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <span className="text-yellow-400">⏳</span> Публичные интеграции — в разработке
              </div>
            </div>

            <button
              onClick={() => setShowLolkaModal(false)}
              className="w-full px-5 py-3 border border-white/20 text-white/70 rounded-xl hover:bg-white/10 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
