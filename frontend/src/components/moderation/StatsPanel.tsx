import { Card } from '@/components/ui/card';
import { EventItem } from './EventItem';
import { cn } from '@/lib/utils';

type Platform = 'vk' | 'lolka';

type ModerationEvent = {
  type: string;
  title: string;
  description: string;
  created_at: string;
};

type ModerationStats = {
  blocked: number;
  warnings: number;
  captcha_solved: number;
  total_events: number;
};

type Server = {
  id: number;
  platform: Platform;
  member_count: number;
};

type StatsPeriod = '24h' | '7d' | '30d';

interface StatsPanelProps {
  server: Server | null;
  stats: ModerationStats;
  events: ModerationEvent[];
  isLoading: boolean;
  platform: Platform;
  period: StatsPeriod;
  onPeriodChange: (period: StatsPeriod) => void;
}

export function StatsPanel({
  server,
  stats,
  events,
  isLoading,
  platform,
  period,
  onPeriodChange,
}: StatsPanelProps) {
  return (
    <div className="space-y-6">
      {/* Sync Status */}
      <Card className="p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl border bg-indigo-500/10 border-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <div>
          <h4 className="text-xs font-bold text-[rgb(var(--text-secondary))]">Последняя синхронизация</h4>
          <p className="text-sm font-extrabold text-[rgb(var(--text))]">
            Сегодня, {new Date().toTimeString().slice(0, 5)}
          </p>
          <p className="text-[10px] text-emerald-500 font-semibold mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{' '}
            Синхронизировано
          </p>
        </div>
      </Card>

      {/* Security Status */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-500 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-bold text-[rgb(var(--text-secondary))]">Статус защиты</h4>
            <p className="text-sm font-extrabold text-emerald-500">Активна</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[rgb(var(--border))]">
          {[
            {
              name: 'Участников',
              value: server?.member_count ?? 0,
              color: 'text-emerald-500',
            },
            {
              name: 'Платформа',
              value: platform.toUpperCase(),
              color: platform === 'vk' ? 'text-blue-500' : 'text-purple-500',
            },
          ].map((ind, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 text-[10px] font-bold text-[rgb(var(--text-secondary))]"
            >
              <span className={cn('w-1.5 h-1.5 rounded-full bg-emerald-500', ind.color)} />
              <span>
                {ind.name}: <span className={ind.color}>{ind.value}</span>
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Stats */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--text))]">
            Статистика
          </h4>
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value as StatsPeriod)}
            className="px-3 py-1.5 border text-[10px] font-bold rounded-lg bg-[rgb(var(--surface-2))] border-[rgb(var(--border))] text-[rgb(var(--text-secondary))]"
          >
            <option value="24h">24ч</option>
            <option value="7d">7 дней</option>
            <option value="30d">30 дней</option>
          </select>
        </div>
        {isLoading ? (
          <div className="py-6 text-center text-xs text-[rgb(var(--text-secondary))]">
            Загрузка...
          </div>
        ) : stats.total_events === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs font-bold text-[rgb(var(--text))] mb-1">
              Статистика пока не собирается
            </p>
            <p className="text-[10px] text-[rgb(var(--text-secondary))]">
              События модерации отсутствуют для этой платформы.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Заблокировано', value: stats.blocked, color: 'text-rose-500' },
              { label: 'Предупреждения', value: stats.warnings, color: 'text-amber-500' },
              { label: 'Капча решено', value: stats.captcha_solved, color: 'text-blue-500' },
              { label: 'Всего событий', value: stats.total_events, color: 'text-indigo-500' },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="border p-3 rounded-xl bg-[rgb(var(--surface-2))] border-[rgb(var(--border))]"
              >
                <span className="text-[9px] font-bold text-[rgb(var(--text-secondary))] block">
                  {stat.label}
                </span>
                <span className={cn('text-sm font-extrabold', stat.color)}>{stat.value}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Events */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--text))]">
            Последние события
          </h4>
        </div>
        {events.length === 0 ? (
          <div className="text-center py-8 text-[rgb(var(--text-secondary))]">
            <p className="text-xs">Событий пока нет</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event, idx) => (
              <EventItem key={idx} event={event} platform={platform} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}