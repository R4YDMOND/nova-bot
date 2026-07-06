'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';

const API_BASE = 'https://nova-bot-rpsy.onrender.com';
const FALLBACK_STATS = { servers: 1247, users: 87450, responseTime: 0.68 };
const FEATURES = [
  { icon: '🛡️', title: 'Модерация', desc: 'Авто-мод, фильтры, антиспам' },
  { icon: '🤖', title: 'AI-Помощник', desc: 'Умные ответы и генерация контента' },
  { icon: '🏆', title: 'Система уровней', desc: 'Ранги, награды, лидерборды' },
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

export default function HomePage() {
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [loaded, setLoaded] = useState(false);
  const [showLolkaModal, setShowLolkaModal] = useState(false);

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

  const servers = Math.round(useCountUp(stats.servers, loaded));
  const users = useCountUp(stats.users, loaded);
  const responseTime = useCountUp(stats.responseTime, loaded);

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--text))]">
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
            
            <a
              href="/api/auth/vk"
              className="w-full max-w-sm flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-semibold text-white bg-[#0077FF] hover:bg-[#006CE0] transition-colors text-lg"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C5.21 11.336 4.8 9.726 4.8 9.317c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V11.79c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.34-.491.78-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.202 1.253.745.847 1.32 1.558 1.473 2.05.17.491-.085.745-.576.745z"/>
              </svg>
              Войти через VK
            </a>

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

      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { value: loaded ? `${servers.toLocaleString('ru-RU')}+` : '---', label: 'Серверов подключено' },
            { value: loaded ? `${(users / 1000).toFixed(1)}K+` : '---', label: 'Активных пользователей' },
            { value: loaded ? `${responseTime.toFixed(2)}с` : '---', label: 'Среднее время ответа' },
          ].map((s, i) => (
            <Card key={i} className="p-8 text-center">
              <div className="text-5xl font-bold text-cyan-400 mb-3">{s.value}</div>
              <div className="text-[rgb(var(--text-secondary))]">{s.label}</div>
            </Card>
          ))}
        </div>
      </div>

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

      {showLolkaModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowLolkaModal(false)}>
          <div className="bg-[rgb(var(--surface))] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowLolkaModal(false)} className="absolute top-4 right-4 p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-[#5865F2]/20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">🎮</div>
            <h2 className="text-2xl font-bold text-white mb-2">Lolka — скоро</h2>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              OAuth2-авторизация и публичные интеграции для сторонних сервисов.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-left space-y-2">
              <div className="flex items-center gap-2 text-sm text-white/60"><span className="text-green-400">✓</span> Bot API — уже доступен</div>
              <div className="flex items-center gap-2 text-sm text-white/60"><span className="text-yellow-400">⏳</span> OAuth2 для сторонних сервисов — в разработке</div>
              <div className="flex items-center gap-2 text-sm text-white/60"><span className="text-yellow-400">⏳</span> Публичные интеграции — в разработке</div>
            </div>
            <button onClick={() => setShowLolkaModal(false)} className="w-full px-5 py-3 border border-white/20 text-white/70 rounded-xl hover:bg-white/10 transition-colors">
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
