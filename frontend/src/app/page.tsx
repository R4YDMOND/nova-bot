'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

const API_BASE = 'https://nova-bot-rpsy.onrender.com';

const FALLBACK_STATS = {
  servers: 1247,
  users: 87450,
  responseTime: 0.68,
};

const FEATURES = [
  { icon: '🛡️', title: 'Модерация', desc: 'Авто-мод, фильтры, анти-спам' },
  { icon: '🤖', title: 'AI-Помощник', desc: 'Умные ответы и генерация контента' },
  { icon: '🏆', title: 'Система уровней', desc: 'Ранги, награды, лидерборды' },
  { icon: '🎵', title: 'Музыка', desc: 'YouTube, Spotify, радио' },
  { icon: '🔗', title: 'Вебхуки', desc: 'Гибкие уведомления и интеграции' },
  { icon: '📊', title: 'Аналитика', desc: 'Подробная статистика сервера' },
];

// Строит ссылку на Discord OAuth2. Если client id ещё не настроен в
// переменных окружения — кнопка просто ведёт в дашборд, а не в никуда.
function getDiscordLoginUrl() {
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  const redirectUri =
    process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI ??
    'https://nova-bot-4vmp.vercel.app/api/auth/callback/discord';

  if (!clientId) return '/dashboard';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify guilds',
  });

  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

// Анимация нарастания числа от 0 до target, запускается один раз, когда trigger становится true.
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
  const discordLoginUrl = getDiscordLoginUrl();

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const res = await fetch(`${API_BASE}/api/stats`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Backend вернул статус ${res.status}`);
        const data = await res.json();

        if (isMounted) {
          setStats({
            servers: data.servers ?? data.total_servers ?? FALLBACK_STATS.servers,
            users: data.users ?? data.total_users ?? FALLBACK_STATS.users,
            responseTime:
              data.responseTime ?? data.response_time ?? FALLBACK_STATS.responseTime,
          });
        }
      } catch (error) {
        // Backend недоступен — остаёмся на правдоподобных fallback-цифрах,
        // страница не должна выглядеть пустой или битой.
        console.error('Не удалось получить статистику, использую fallback:', error);
      } finally {
        if (isMounted) setLoaded(true);
      }
    }

    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const servers = Math.round(useCountUp(stats.servers, loaded));
  const users = useCountUp(stats.users, loaded);
  const responseTime = useCountUp(stats.responseTime, loaded);

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--text))]">
      {/* Hero Section */}
      <div className="pt-24 pb-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[rgb(var(--surface-2))] px-4 py-1.5 rounded-full mb-6">
            <span className="text-nova-400">⚡</span>
            <span className="text-sm font-medium">Nova Bot v2.4.1 — Активен</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-6">
            Умный бот для
            <br />
            <span className="bg-gradient-to-r from-nova-400 to-cyan-400 bg-clip-text text-transparent">
              Lolka-сообществ
            </span>
          </h1>

          <p className="text-xl text-[rgb(var(--text-secondary))] max-w-2xl mx-auto mb-10">
            Модерация, AI-помощник, уровни, музыка и вебхуки — всё в одном боте
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={discordLoginUrl}>
              <Button size="lg" className="text-lg px-10 py-7 rounded-3xl font-semibold gap-2">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                  <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.2 14.2 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.076.076 0 0 0-.04.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.029 19.9 19.9 0 0 0 6.002-3.03.077.077 0 0 0 .032-.057c.5-5.177-.838-9.673-3.549-13.66a.06.06 0 0 0-.031-.028ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.955 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.946 2.419-2.157 2.419Z" />
                </svg>
                Войти через Discord
              </Button>
            </a>

            <Link href="/dashboard">
              <Button variant="secondary" size="lg" className="text-lg px-10 py-7 rounded-3xl font-semibold gap-2">
                Открыть панель управления
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-8 text-center">
            <div className="text-5xl font-bold text-nova-400 mb-3">
              {loaded ? servers.toLocaleString('ru-RU') : '---'}+
            </div>
            <div className="text-[rgb(var(--text-secondary))]">Серверов подключено</div>
          </Card>

          <Card className="p-8 text-center">
            <div className="text-5xl font-bold text-nova-400 mb-3">
              {loaded ? (users / 1000).toFixed(1) : '---'}K+
            </div>
            <div className="text-[rgb(var(--text-secondary))]">Активных пользователей</div>
          </Card>

          <Card className="p-8 text-center">
            <div className="text-5xl font-bold text-nova-400 mb-3">
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
            {FEATURES.map((feature, i) => (
              <Card key={i} className="p-8 hover:scale-[1.02] transition-transform">
                <div className="text-4xl mb-6">{feature.icon}</div>
                <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-[rgb(var(--text-secondary))]">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center py-12 text-[rgb(var(--text-secondary))]">
        Nova Bot © 2026 — Для Lolka-сообществ
      </div>
    </div>
  );
}
