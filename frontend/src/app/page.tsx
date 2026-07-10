'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Mail,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Bot,
  Music2,
  Webhook as WebhookIcon,
  BarChart3,
  Trophy,
} from 'lucide-react';

const API_BASE = 'https://nova-bot-rpsy.onrender.com';
const FALLBACK_STATS = { servers: 1247, users: 87450, responseTime: 0.68 };

const FEATURES = [
  { icon: ShieldCheck, title: 'Модерация', desc: 'Авто-мод, фильтры, антиспам' },
  { icon: Bot, title: 'AI-помощник', desc: 'Умные ответы и генерация контента' },
  { icon: Trophy, title: 'Система уровней', desc: 'Ранги, награды, лидерборды' },
  { icon: Music2, title: 'Музыка', desc: 'YouTube, VK, Lolka, радио' },
  { icon: WebhookIcon, title: 'Вебхуки', desc: 'Гибкие уведомления и интеграции' },
  { icon: BarChart3, title: 'Аналитика', desc: 'Подробная статистика сервера' },
];

type NewsType = 'fix' | 'feature' | 'update' | 'improvement';

const NEWS_BADGES: Record<NewsType, { label: string; variant: 'destructive' | 'success' | 'default' | 'warning' }> = {
  fix: { label: 'ИСПРАВЛЕНИЕ', variant: 'destructive' },
  feature: { label: 'НОВАЯ ФУНКЦИЯ', variant: 'success' },
  update: { label: 'ОБНОВЛЕНИЕ', variant: 'default' },
  improvement: { label: 'УЛУЧШЕНИЕ', variant: 'warning' },
};

const NEWS = [
  {
    type: 'feature' as NewsType,
    date: '10 июля 2026',
    title: 'Вход через VK и Lolka',
    desc: 'Теперь авторизация в панели управления доступна через VK ID и Lolka OAuth2 — без паролей и лишних форм.',
  },
  {
    type: 'fix' as NewsType,
    date: '8 июля 2026',
    title: 'Исправлена тема оформления',
    desc: 'Устранена проблема с нечитаемым текстом при переключении между светлой и тёмной темой на всех страницах.',
  },
  {
    type: 'update' as NewsType,
    date: '5 июля 2026',
    title: 'Полный переход на VK и Lolka',
    desc: 'Discord и Telegram больше не используются — все уведомления и интеграции теперь работают через VK, Lolka и Email.',
  },
  {
    type: 'improvement' as NewsType,
    date: '2 июля 2026',
    title: 'Новая система уведомлений',
    desc: 'Колокольчик в шапке панели теперь показывает реальные уведомления с историей и статусом прочтения.',
  },
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

function NewsCarousel() {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => setIndex(i => (i + 1) % NEWS.length), []);
  const prev = useCallback(() => setIndex(i => (i - 1 + NEWS.length) % NEWS.length), []);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const item = NEWS[index];
  const badge = NEWS_BADGES[item.type];

  return (
    <Card className="relative p-8 md:p-10 max-w-3xl mx-auto overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Badge variant={badge.variant}>{badge.label}</Badge>
          <span className="text-sm text-[rgb(var(--text-secondary))]">{item.date}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            aria-label="Предыдущее обновление"
            className="p-2 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface))] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            aria-label="Следующее обновление"
            className="p-2 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface))] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
      <p className="text-[rgb(var(--text-secondary))] leading-relaxed">{item.desc}</p>

      <div className="flex items-center justify-center gap-2 mt-8">
        {NEWS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Обновление ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? 'w-6 bg-primary' : 'w-1.5 bg-[rgb(var(--border))]'
            }`}
          />
        ))}
      </div>
    </Card>
  );
}

function BotIllustration() {
  return (
    <svg viewBox="0 0 420 420" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-w-md mx-auto">
      <defs>
        <linearGradient id="botGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgb(var(--primary))" />
          <stop offset="100%" stopColor="rgb(var(--secondary))" />
        </linearGradient>
        <radialGradient id="botGlow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="rgb(var(--primary))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="rgb(var(--primary))" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="210" cy="200" r="180" fill="url(#botGlow)" />

      {/* antenna */}
      <line x1="210" y1="70" x2="210" y2="100" stroke="url(#botGrad)" strokeWidth="6" strokeLinecap="round" />
      <circle cx="210" cy="60" r="12" fill="url(#botGrad)" />

      {/* head */}
      <rect x="110" y="100" width="200" height="150" rx="36" fill="rgb(var(--surface))" stroke="url(#botGrad)" strokeWidth="4" />
      <rect x="140" y="140" width="55" height="55" rx="16" fill="url(#botGrad)" />
      <rect x="225" y="140" width="55" height="55" rx="16" fill="url(#botGrad)" />
      <rect x="165" y="215" width="90" height="10" rx="5" fill="url(#botGrad)" opacity="0.6" />

      {/* body */}
      <rect x="90" y="260" width="240" height="130" rx="32" fill="rgb(var(--surface))" stroke="url(#botGrad)" strokeWidth="4" />
      <circle cx="210" cy="300" r="26" fill="none" stroke="url(#botGrad)" strokeWidth="4" />
      <path d="M198 300 L207 309 L224 289" stroke="url(#botGrad)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="115" y="345" width="60" height="14" rx="7" fill="url(#botGrad)" opacity="0.5" />
      <rect x="245" y="345" width="60" height="14" rx="7" fill="url(#botGrad)" opacity="0.5" />

      {/* arms */}
      <rect x="55" y="280" width="30" height="90" rx="15" fill="rgb(var(--surface))" stroke="url(#botGrad)" strokeWidth="4" />
      <rect x="335" y="280" width="30" height="90" rx="15" fill="rgb(var(--surface))" stroke="url(#botGrad)" strokeWidth="4" />
    </svg>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [loaded, setLoaded] = useState(false);
  const [showLolkaModal, setShowLolkaModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

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
    <div className="relative min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))] overflow-hidden">
      <div className="animated-bg" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div className="relative z-10">
        {/* Header / nav */}
        <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            Nova Bot
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-[rgb(var(--text-secondary))]">
            <a href="#features" className="hover:text-[rgb(var(--text))] transition-colors">Возможности</a>
            <a href="#news" className="hover:text-[rgb(var(--text))] transition-colors">Что нового</a>
            <Link href="/docs" className="hover:text-[rgb(var(--text))] transition-colors">Документация</Link>
          </nav>
          <Link
            href="/login"
            className="px-5 py-2 rounded-xl text-sm font-medium border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-2))] transition-colors"
          >
            Войти
          </Link>
        </header>

        {/* Hero — horizontal layout */}
        <div className="max-w-7xl mx-auto px-6 pt-8 pb-20">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 w-full lg:max-w-xl">
              <div className="inline-flex items-center gap-2 bg-[rgb(var(--surface-2))] px-4 py-1.5 rounded-full mb-6">
                <span className="text-primary">⚡</span>
                <span className="text-sm font-medium">Nova Bot v2.4.1 — Активен</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-6 leading-[1.05]">
                Умный ассистент
                <br />
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  для VK и Lolka
                </span>
              </h1>

              <p className="text-lg text-[rgb(var(--text-secondary))] mb-8">
                Модерация, AI-помощник, уровни, музыка и вебхуки — всё в одном боте
              </p>

              <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-4">
                <a
                  href="/api/auth/vk"
                  className="inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl font-semibold text-white bg-[#0077FF] hover:bg-[#006CE0] transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C5.21 11.336 4.8 9.726 4.8 9.317c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V11.79c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.34-.491.78-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.202 1.253.745.847 1.32 1.558 1.473 2.05.17.491-.085.745-.576.745z"/>
                  </svg>
                  Войти через VK
                </a>

                <button
                  onClick={() => setShowLolkaModal(true)}
                  className="inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl font-semibold text-white bg-[#5865F2] hover:bg-[#4752C4] transition-colors"
                >
                  <span className="text-xl">🎮</span>
                  Войти через Lolka
                </button>
              </div>

              <button
                onClick={() => setShowEmailModal(true)}
                className="inline-flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))] transition-colors mb-10"
              >
                <Mail className="w-4 h-4" />
                Регистрация по e-mail
              </button>

              <div className="flex flex-wrap gap-3">
                {[
                  { value: loaded ? `${servers.toLocaleString('ru-RU')}+` : '—', label: 'серверов' },
                  { value: loaded ? `${(users / 1000).toFixed(1)}K+` : '—', label: 'пользователей' },
                  { value: loaded ? `${responseTime.toFixed(2)}с` : '—', label: 'время ответа' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded-full px-4 py-2">
                    <span className="font-bold text-primary">{s.value}</span>
                    <span className="text-xs text-[rgb(var(--text-secondary))]">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full flex justify-center">
              <BotIllustration />
            </div>
          </div>
        </div>

        {/* What's new carousel */}
        <div id="news" className="px-6 pb-20">
          <h2 className="text-3xl font-bold text-center mb-10">Что нового</h2>
          <NewsCarousel />
        </div>

        {/* Features */}
        <div id="features" className="bg-[rgb(var(--surface))] py-16">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-10">Возможности Nova</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <Card key={i} className="p-6 hover:scale-[1.02] transition-transform cursor-default">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">{f.title}</h3>
                    <p className="text-sm text-[rgb(var(--text-secondary))]">{f.desc}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        <div className="text-center py-12 text-[rgb(var(--text-secondary))]">
          Nova Bot © 2026 — Умный ассистент для VK и Lolka
        </div>

        {showLolkaModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowLolkaModal(false)}>
            <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-3xl p-8 max-w-md w-full text-center relative shadow-2xl" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowLolkaModal(false)} className="absolute top-4 right-4 p-2 rounded-xl text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-2))] transition-colors">
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 bg-[#5865F2]/20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">🎮</div>
              <h2 className="text-2xl font-bold text-[rgb(var(--text))] mb-2">Lolka — скоро</h2>
              <p className="text-[rgb(var(--text-secondary))] text-sm leading-relaxed mb-6">
                OAuth2-авторизация и публичные интеграции для сторонних сервисов.
              </p>
              <div className="bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded-2xl p-4 mb-6 text-left space-y-2">
                <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]"><span className="text-success">✓</span> Bot API — уже доступен</div>
                <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]"><span className="text-warning">⏳</span> OAuth2 для сторонних сервисов — в разработке</div>
                <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]"><span className="text-warning">⏳</span> Публичные интеграции — в разработке</div>
              </div>
              <button onClick={() => setShowLolkaModal(false)} className="w-full px-5 py-3 border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] rounded-xl hover:bg-[rgb(var(--surface-2))] transition-colors">
                Закрыть
              </button>
            </div>
          </div>
        )}

        {showEmailModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEmailModal(false)}>
            <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-3xl p-8 max-w-md w-full text-center relative shadow-2xl" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowEmailModal(false)} className="absolute top-4 right-4 p-2 rounded-xl text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-2))] transition-colors">
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-[rgb(var(--text))] mb-2">Вход по e-mail — скоро</h2>
              <p className="text-[rgb(var(--text-secondary))] text-sm leading-relaxed mb-6">
                Регистрация и вход по e-mail и паролю сейчас в разработке. Пока используйте VK.
              </p>
              <button onClick={() => setShowEmailModal(false)} className="w-full px-5 py-3 border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] rounded-xl hover:bg-[rgb(var(--surface-2))] transition-colors">
                Закрыть
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
