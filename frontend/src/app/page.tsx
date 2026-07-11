'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/components/ThemeProvider';
import {
  X,
  Mail,
  Sparkles,
  ShieldCheck,
  Bot,
  Music2,
  Webhook as WebhookIcon,
  BarChart3,
  Trophy,
  ChevronRight,
  Server,
  Users,
  Zap,
  Bell,
  Moon,
  Sun,
} from 'lucide-react';

const API_BASE = 'https://nova-bot-rpsy.onrender.com';
const FALLBACK_STATS = { servers: 0, users: 0, responseTime: 0.8 };

const FEATURES = [
  { icon: ShieldCheck, title: 'Модерация', desc: 'Гибкие инструменты модерации и защита от спама.' },
  { icon: Bot, title: 'AI-помощник', desc: 'Умный AI-ассистент отвечает и помогает участникам.' },
  { icon: Trophy, title: 'Система уровней', desc: 'Мотивируйте участников с помощью уровней и опыта.' },
  { icon: Music2, title: 'Музыка', desc: 'Встроенный музыкальный плеер для ваших серверов.' },
  { icon: WebhookIcon, title: 'Вебхуки', desc: 'Интеграция и автоматизация через мощные вебхуки.' },
  { icon: BarChart3, title: 'Аналитика', desc: 'Подробная статистика и аналитика активности сервера.' },
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

/**
 * Геометрический логотип N — фирменный знак Nova Bot: левая грань голубая,
 * правая фиолетовая, между ними диагональная перемычка (как в брендбуке,
 * вариация "02. Упрощённый знак"). Сплошная заливка + лёгкий теневой facet
 * для эффекта гранёного кристалла.
 */
function NovaLogo({ size = 320 }: { size?: number }) {
  return (
    <svg viewBox="0 0 300 300" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="nCyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
        <linearGradient id="nPurple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#7B2FBE" />
        </linearGradient>
        <linearGradient id="nDiag" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <radialGradient id="nGlow" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor="#7B2FBE" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#7B2FBE" stopOpacity="0" />
        </radialGradient>
        <filter id="nBlur"><feGaussianBlur stdDeviation="10" /></filter>
      </defs>

      {/* фоновое свечение */}
      <ellipse cx="150" cy="290" rx="110" ry="16" fill="url(#nGlow)" filter="url(#nBlur)" />
      <circle cx="150" cy="150" r="150" fill="url(#nGlow)" opacity="0.4" />

      {/* диагональная перемычка N (рисуется первой, снизу) */}
      <polygon points="210,20 280,20 90,280 20,280" fill="url(#nDiag)" />

      {/* левая нога (голубая) */}
      <polygon points="20,20 90,20 90,280 20,280" fill="url(#nCyan)" />
      <polygon points="90,20 90,280 20,280" fill="#0B0F19" opacity="0.18" />

      {/* правая нога (фиолетовая) */}
      <polygon points="210,20 280,20 280,280 210,280" fill="url(#nPurple)" />
      <polygon points="280,20 280,280 210,280" fill="#0B0F19" opacity="0.18" />

      {/* блики */}
      <line x1="35" y1="35" x2="35" y2="140" stroke="white" strokeOpacity="0.45" strokeWidth="4" strokeLinecap="round" />
      <line x1="225" y1="35" x2="225" y2="140" stroke="white" strokeOpacity="0.3" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** Компактная версия того же логотипа для шапки */
function NovaLogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 300 300" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="nCyanSm" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
        <linearGradient id="nPurpleSm" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#7B2FBE" />
        </linearGradient>
        <linearGradient id="nDiagSm" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <polygon points="210,20 280,20 90,280 20,280" fill="url(#nDiagSm)" />
      <polygon points="20,20 90,20 90,280 20,280" fill="url(#nCyanSm)" />
      <polygon points="210,20 280,20 280,280 210,280" fill="url(#nPurpleSm)" />
    </svg>
  );
}

function LolkaAvatarIcon() {
  return (
    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
      <Bot className="w-3.5 h-3.5 text-white" />
    </span>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [loaded, setLoaded] = useState(false);
  const [showLolkaModal, setShowLolkaModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const { theme, toggleTheme } = useTheme();

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

  const statItems = [
    { icon: Server, value: loaded ? `${servers}+` : '0+', label: 'серверов' },
    { icon: Users, value: loaded ? `${(users / 1000).toFixed(1)}K+` : '0.0K+', label: 'пользователей' },
    { icon: Zap, value: loaded ? `${responseTime.toFixed(2)}с` : '0.80с', label: 'среднее время ответа' },
  ];

  return (
    <div className="relative min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))] overflow-hidden">
      <div className="animated-bg" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-12 pb-24">
        {/* Logo + theme toggle */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2 font-bold text-xl mx-auto lg:mx-0">
            <div className="w-9 h-9 rounded-xl bg-[rgb(var(--surface-2))] flex items-center justify-center">
              <NovaLogoMark size={22} />
            </div>
            NOVA <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">BOT</span>
          </div>

          <button
            onClick={toggleTheme}
            aria-label="Переключить тему"
            className="hidden lg:flex w-9 h-9 rounded-xl border border-[rgb(var(--border))] items-center justify-center hover:bg-[rgb(var(--surface-2))] transition-colors shrink-0"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* mobile theme toggle (под логотипом, по центру) */}
        <div className="flex lg:hidden justify-center mb-6 -mt-6">
          <button
            onClick={toggleTheme}
            aria-label="Переключить тему"
            className="w-9 h-9 rounded-xl border border-[rgb(var(--border))] flex items-center justify-center hover:bg-[rgb(var(--surface-2))] transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Hero */}
        <div className="flex flex-col lg:flex-row items-center gap-12 mb-16">
          <div className="flex-1 w-full text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] px-4 py-1.5 rounded-full mb-6">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-medium">Умный бот нового поколения</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.1]">
              Умный ассистент<br />
              для <span className="text-[#2b8fff]">VK</span> и{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Lolka</span>
            </h1>

            <p className="text-[rgb(var(--text-secondary))] mb-8 max-w-md mx-auto lg:mx-0">
              Модерация, AI, уровни, музыка, аналитика и вебхуки в одном современном боте.
            </p>

            <div className="flex flex-col gap-3 mb-8 max-w-md mx-auto lg:mx-0">
              <a
                href="/api/auth/vk"
                className="inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-[#0077FF] to-[#2b8fff] hover:opacity-90 transition-opacity"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
                  <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C5.21 11.336 4.8 9.726 4.8 9.317c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V11.79c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.34-.491.78-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.202 1.253.745.847 1.32 1.558 1.473 2.05.17.491-.085.745-.576.745z"/>
                </svg>
                Войти через VK
              </a>

              <button
                onClick={() => setShowLolkaModal(true)}
                className="inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl font-semibold border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-2))] transition-colors"
              >
                <LolkaAvatarIcon />
                Войти через Lolka
              </button>

              <button
                onClick={() => setShowEmailModal(true)}
                className="inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl font-semibold border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-2))] transition-colors"
              >
                <Mail className="w-5 h-5" />
                Регистрация по e-mail
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto lg:mx-0 lg:flex lg:gap-8 lg:divide-x lg:divide-[rgb(var(--border))]">
              {statItems.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded-2xl p-4 text-center lg:bg-transparent lg:border-0 lg:rounded-none lg:p-0 lg:pl-8 lg:first:pl-0 lg:text-left">
                    <Icon className="w-4 h-4 text-primary mx-auto lg:mx-0 mb-1.5 lg:hidden" />
                    <div className="text-xl font-bold text-primary">{s.value}</div>
                    <div className="text-xs text-[rgb(var(--text-secondary))] mt-0.5">{s.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-1 w-full flex justify-center">
            <NovaLogo />
          </div>
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-6">
            Возможности <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Nova</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <Card key={i} className="p-5 flex items-center gap-4 hover:border-primary/40 transition-colors cursor-default">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="text-sm text-[rgb(var(--text-secondary))]">{f.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[rgb(var(--text-secondary))] shrink-0" />
                </Card>
              );
            })}
          </div>
        </div>

        {/* What's new */}
        <div>
          <h2 className="text-2xl font-bold mb-5">Что нового</h2>
          <Card className="p-6 flex items-center justify-between gap-6 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="default">✦ Улучшения</Badge>
                <span className="text-sm text-[rgb(var(--text-secondary))]">2 июля 2026</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">Новая система уведомлений</h3>
              <p className="text-sm text-[rgb(var(--text-secondary))] max-w-md">
                Колокольчик в панели теперь показывает реальные уведомления с историей.
              </p>
            </div>
            <div className="relative shrink-0 w-14 h-14 rounded-2xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] flex items-center justify-center">
              <Bell className="w-6 h-6 text-primary" />
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary text-white text-xs font-bold flex items-center justify-center">3</span>
            </div>
          </Card>
        </div>
      </div>

      {showLolkaModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowLolkaModal(false)}>
          <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-3xl p-8 max-w-md w-full text-center relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowLolkaModal(false)} className="absolute top-4 right-4 p-2 rounded-xl text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-2))] transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LolkaAvatarIcon />
            </div>
            <h2 className="text-2xl font-bold text-[rgb(var(--text))] mb-2">Вход через Lolka — скоро</h2>
            <p className="text-[rgb(var(--text-secondary))] text-sm leading-relaxed mb-6">
              Пользовательская OAuth2-авторизация через Lolka пока не открыта самой платформой
              (раздел «Приложения» в портале разработчика помечен как «скоро»). Как только Lolka
              включит эту функцию, кнопка заработает автоматически.
            </p>
            <div className="bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded-2xl p-4 mb-6 text-left space-y-2">
              <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]"><span className="text-green-400">✓</span> Bot API и Gateway — уже подключены и работают</div>
              <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]"><span className="text-yellow-400">⏳</span> OAuth2-вход пользователей — в разработке у Lolka</div>
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
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-[rgb(var(--text))] mb-2">Вход по e-mail — скоро</h2>
            <p className="text-[rgb(var(--text-secondary))] text-sm leading-relaxed mb-6">
              Полноценная регистрация и вход по e-mail и паролю в разработке. Пока используйте VK.
            </p>
            <button onClick={() => setShowEmailModal(false)} className="w-full px-5 py-3 border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] rounded-xl hover:bg-[rgb(var(--surface-2))] transition-colors">
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
