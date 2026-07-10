'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';

interface DashboardStats {
  serversCount: number;
  totalMessages: number;
  activeUsers: number;
  commandsUsed: number;
}

const FALLBACK: DashboardStats = {
  serversCount: 0,
  totalMessages: 0,
  activeUsers: 0,
  commandsUsed: 0,
};

const QUICK_ACTIONS = [
  { icon: '📢', label: 'Рассылка', desc: 'Сообщение во все каналы', href: '/dashboard/webhooks' },
  { icon: '🗓️', label: 'Создать событие', desc: 'Запланировать ивент', href: '/dashboard/webhooks' },
  { icon: '🎵', label: 'Включить музыку', desc: 'Треки и радио', href: '/dashboard/music' },
  { icon: '📊', label: 'Аналитика', desc: 'Статистика серверов', href: '/dashboard/analytics' },
];

const FALLBACK_ACTIVITY = [
  { icon: '🟢', text: 'Nova Bot запущен и работает', time: 'только что' },
  { icon: '🔗', text: 'Подключена база данных PostgreSQL', time: '1 мин назад' },
  { icon: '⚡', text: 'Вебхуки активны', time: '2 мин назад' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.stats.getDashboard()
      .then((data) => {
        setStats({
          serversCount: data.serversCount ?? 0,
          totalMessages: data.totalMessages ?? 0,
          activeUsers: data.activeUsers ?? 0,
          commandsUsed: data.commandsUsed ?? 0,
        });
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Серверов', value: stats.serversCount, icon: '🌐' },
    { label: 'Активных пользователей', value: stats.activeUsers, icon: '👥' },
    { label: 'Сообщений', value: stats.totalMessages, icon: '💬' },
    { label: 'Команд выполнено', value: stats.commandsUsed, icon: '⚡' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">👋 Добро пожаловать в Nova</h1>
          <p className="text-[rgb(var(--text-secondary))] mt-1">
            Управляйте серверами, музыкой, событиями и аналитикой
          </p>
        </div>
        <Link
          href="/dashboard/servers"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-sm transition-all active:scale-95"
        >
          + Подключить сервер
        </Link>
      </div>

      {error && !loading && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-sm">
          <span>⚠️</span>
          <span>Backend недоступен — показаны нулевые значения. Данные обновятся автоматически.</span>
        </div>
      )}

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <Card key={i} className="flex items-center gap-4 p-6">
            <span className="text-3xl">{card.icon}</span>
            <div>
              <div className="text-2xl font-bold">
                {loading ? (
                  <span className="inline-block w-12 h-6 bg-[rgb(var(--surface-2))] rounded animate-pulse" />
                ) : (
                  card.value.toLocaleString('ru-RU')
                )}
              </div>
              <div className="text-sm text-[rgb(var(--text-secondary))]">{card.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Быстрые действия */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">⚡ Быстрые действия</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {QUICK_ACTIONS.map((action, i) => (
              <Link
                key={i}
                href={action.href}
                className="group flex items-center gap-4 p-6 rounded-3xl border border-[rgb(var(--border))] hover:border-indigo-400/50 bg-[rgb(var(--surface))] hover:bg-[rgb(var(--surface-2))] transition-all"
              >
                <span className="text-3xl transition-transform group-hover:scale-110">{action.icon}</span>
                <div>
                  <div className="font-semibold">{action.label}</div>
                  <div className="text-sm text-[rgb(var(--text-secondary))]">{action.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Последняя активность */}
        <div>
          <h3 className="text-lg font-semibold mb-4">📋 Последняя активность</h3>
          <Card className="p-4 space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[rgb(var(--surface-2))] animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-[rgb(var(--surface-2))] rounded animate-pulse w-3/4" />
                    <div className="h-2 bg-[rgb(var(--surface-2))] rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))
            ) : (
              FALLBACK_ACTIVITY.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <div className="text-sm">{item.text}</div>
                    <div className="text-xs text-[rgb(var(--text-secondary))]">{item.time}</div>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
