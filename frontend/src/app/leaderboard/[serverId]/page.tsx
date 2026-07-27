'use client';

import { Suspense, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { usePublicLeaderboard } from '@/hooks/useRanking';

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
const MEDAL_COLORS: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

function PublicLeaderboardContent() {
  const params = useParams<{ serverId: string }>();
  const searchParams = useSearchParams();
  const platform = (searchParams.get('platform') === 'lolka' ? 'lolka' : 'vk') as 'vk' | 'lolka';
  const [sort, setSort] = useState<'xp' | 'level' | 'messages'>('xp');

  const { data, isLoading, isError } = usePublicLeaderboard(params.serverId, platform, sort);
  const entries = data?.entries ?? [];

  return (
    <div className="relative min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
      <div className="animated-bg" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          {data?.server_icon_url ? (
            <img src={data.server_icon_url} alt="" className="w-12 h-12 rounded-2xl object-cover shadow-md" />
          ) : (
            <span className="w-12 h-12 rounded-2xl bg-[rgb(var(--surface-2))] flex items-center justify-center text-xl">🏆</span>
          )}
          <div>
            <h1 className="text-xl font-bold">{data?.server_name ?? 'Топ-100'}</h1>
            <p className="text-sm text-[rgb(var(--text-secondary))]">
              Рейтинг участников · {platform === 'vk' ? 'VK' : 'Lolka'} · Nova Bot
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {([
            { id: 'xp', label: 'По опыту' },
            { id: 'level', label: 'По уровню' },
            { id: 'messages', label: 'По сообщениям' },
          ] as const).map(s => (
            <button
              key={s.id}
              onClick={() => setSort(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sort === s.id ? 'bg-cyan-400 text-black' : 'bg-[rgb(var(--surface-2))] text-[rgb(var(--text-secondary))] hover:bg-white/10'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <Card className="p-0 overflow-hidden">
          {isLoading ? (
            <p className="text-center py-12 text-[rgb(var(--text-secondary))]">⏳ Загрузка...</p>
          ) : isError ? (
            <p className="text-center py-12 text-[rgb(var(--text-secondary))]">⚠️ Не удалось загрузить рейтинг</p>
          ) : entries.length === 0 ? (
            <p className="text-center py-12 text-[rgb(var(--text-secondary))]">Пока нет данных</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[rgb(var(--surface-2))]">
                  <tr>
                    {['#', 'Участник', 'Уровень', 'XP', 'Сообщения'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[rgb(var(--text-secondary))] uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgb(var(--border))]">
                  {entries.map(entry => (
                    <tr
                      key={entry.user_id}
                      className="hover:bg-[rgb(var(--surface-2))] transition-colors"
                      style={entry.rank <= 3 ? { background: `${MEDAL_COLORS[entry.rank]}0d`, borderLeft: `3px solid ${MEDAL_COLORS[entry.rank]}` } : undefined}
                    >
                      <td className="px-4 py-3 font-bold text-lg" style={entry.rank <= 3 ? { color: MEDAL_COLORS[entry.rank] } : undefined}>
                        {MEDALS[entry.rank] || `#${entry.rank}`}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {entry.avatar_url ? (
                            <img src={entry.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <span className="w-8 h-8 rounded-full bg-[rgb(var(--surface-2))] flex items-center justify-center">👤</span>
                          )}
                          <span className="font-medium">{entry.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="bg-[rgb(var(--surface-2))] px-2 py-0.5 rounded-lg font-bold">{entry.level}</span></td>
                      <td className="px-4 py-3 text-[rgb(var(--text-secondary))]">{entry.xp.toLocaleString('ru-RU')}</td>
                      <td className="px-4 py-3 text-[rgb(var(--text-secondary))]">{entry.messages}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <p className="text-center text-xs text-[rgb(var(--text-secondary))] mt-6">
          Обновляется автоматически раз в 10 минут · Nova Bot
        </p>
      </div>
    </div>
  );
}

export default function PublicLeaderboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[rgb(var(--bg))]" />}>
      <PublicLeaderboardContent />
    </Suspense>
  );
}
