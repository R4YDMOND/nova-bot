'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/toggle';
import { useServer } from '@/context/ServerProvider';
import { NoServerSelected } from '@/components/NoServerSelected';
import { useRankingSettings, useSaveRankingSettings, useLeaderboard } from '@/hooks/useRanking';

const TABS = [
  { id: 'settings', label: '⚙️ Настройки' },
  { id: 'rewards', label: '🎁 Награды' },
  { id: 'leaderboard', label: '🏆 Лидерборд' },
  { id: 'card', label: '🪪 Карточка' },
];

const CARD_STYLES = [
  { value: 'modern', label: 'Современный' },
  { value: 'minimal', label: 'Минимализм' },
  { value: 'gaming', label: 'Игровой' },
  { value: 'neon', label: 'Неон' },
];

export default function RankingPage() {
  const { selectedServer, selectedServerId, loading: serverLoading } = useServer();
  const [activeTab, setActiveTab] = useState('settings');
  const [formData, setFormData] = useState<any>({});

  const platform = selectedServer?.platform || 'vk';

  // TanStack Query хуки
  const { data: settings, isLoading: settingsLoading } = useRankingSettings(selectedServerId, platform);
  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard(selectedServerId, platform, 'xp');
  const saveMutation = useSaveRankingSettings();

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!selectedServer) return;
    try {
      await saveMutation.mutateAsync({
        serverId: selectedServerId,
        platform,
        settings: formData,
      });
      alert('✅ Настройки сохранены!');
    } catch {
      alert('❌ Ошибка сохранения');
    }
  };

  if (serverLoading || settingsLoading) {
    return <div className="p-8 text-center text-[rgb(var(--text-secondary))]">⏳ Загрузка...</div>;
  }

  if (!selectedServer) {
    return <NoServerSelected title="🪪 Система уровней" />;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">🪪 Система уровней</h1>
          <p className="text-[rgb(var(--text-secondary))] text-sm mt-1">Настройки опыта, наград и рейтинга</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saveMutation.isPending} 
          className={`px-5 py-2.5 rounded-xl font-semibold text-black transition-all disabled:opacity-60 ${
            saveMutation.isSuccess ? 'bg-green-400' : 'bg-cyan-400 hover:bg-cyan-300'
          }`}
        >
          {saveMutation.isPending ? 'Сохранение...' : '💾 Сохранить'}
        </button>
      </div>

      <div className="flex gap-1 mb-6 overflow-x-auto">
        {TABS.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id 
                ? 'bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))]' 
                : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-2))]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="font-semibold mb-3">📊 Основные параметры</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">XP за сообщение</label>
                <input 
                  type="number" 
                  value={formData.xp_per_message ?? settings?.xp_per_message ?? 15} 
                  onChange={e => updateField('xp_per_message', parseInt(e.target.value) || 0)} 
                  className="input w-full" 
                />
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">XP за минуту голоса</label>
                <input 
                  type="number" 
                  value={formData.xp_per_voice_minute ?? settings?.xp_per_voice_minute ?? 20} 
                  onChange={e => updateField('xp_per_voice_minute', parseInt(e.target.value) || 0)} 
                  className="input w-full" 
                />
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Минимальная длина сообщения</label>
                <input 
                  type="number" 
                  value={formData.min_message_length ?? settings?.min_message_length ?? 3} 
                  onChange={e => updateField('min_message_length', parseInt(e.target.value) || 0)} 
                  className="input w-full" 
                />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-3">🔔 Уведомления</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Канал уведомлений</label>
                <input 
                  type="text" 
                  value={formData.notify_channel ?? settings?.notify_channel ?? ''} 
                  onChange={e => updateField('notify_channel', e.target.value)} 
                  className="input w-full" 
                />
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Шаблон сообщения</label>
                <textarea 
                  value={formData.notify_message ?? settings?.notify_message ?? '🎉 {user} достиг {level} уровня!'} 
                  onChange={e => updateField('notify_message', e.target.value)} 
                  rows={2} 
                  className="input w-full font-mono resize-none" 
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Пинговать пользователя</span>
                <Switch 
                  checked={formData.ping_user ?? settings?.ping_user ?? true} 
                  onCheckedChange={val => updateField('ping_user', val)} 
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'rewards' && (
        <Card className="p-5">
          <h3 className="font-semibold mb-4">🎁 Награды за уровни</h3>
          {settings?.rewards && settings.rewards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {settings.rewards.map((reward: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded-xl">
                  <span className="px-3 py-1.5 rounded-xl font-bold text-black text-sm" style={{ background: reward.color }}>
                    Ур. {reward.level}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{reward.role}</div>
                    {reward.message && <div className="text-[rgb(var(--text-secondary))] text-xs mt-0.5">💬 {reward.message}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[rgb(var(--text-secondary))] py-8">Награды не настроены</p>
          )}
        </Card>
      )}

      {activeTab === 'leaderboard' && (
        <Card>
          {leaderboardLoading ? (
            <p className="text-center py-12 text-[rgb(var(--text-secondary))]">⏳ Загрузка...</p>
          ) : leaderboard?.entries && leaderboard.entries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[rgb(var(--surface-2))]">
                  <tr>
                    {['#', 'Участник', 'Уровень', 'XP', 'Сообщения', 'Голос (мин)'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[rgb(var(--text-secondary))] uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgb(var(--border))]">
                  {leaderboard.entries.map((entry: any) => (
                    <tr key={entry.user_id} className="hover:bg-[rgb(var(--surface-2))] transition-colors">
                      <td className="px-4 py-3 font-bold text-yellow-400">#{entry.rank}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {entry.avatar_url ? (
                            <img src={entry.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <span className="w-8 h-8 rounded-full bg-[rgb(var(--surface-3))] flex items-center justify-center">👤</span>
                          )}
                          <span className="font-medium">{entry.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-[rgb(var(--surface-3))] px-2 py-0.5 rounded-lg font-bold">{entry.level}</span>
                      </td>
                      <td className="px-4 py-3 text-[rgb(var(--text-secondary))]">{entry.xp.toLocaleString('ru-RU')}</td>
                      <td className="px-4 py-3 text-[rgb(var(--text-secondary))]">{entry.messages}</td>
                      <td className="px-4 py-3 text-[rgb(var(--text-secondary))]">{entry.voice_minutes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-[rgb(var(--text-secondary))] py-12">👥 Нет данных в лидерборде</p>
          )}
        </Card>
      )}

      {activeTab === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-5 space-y-4">
            <h3 className="font-semibold">🎨 Дизайн карточки</h3>
            <div>
              <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Цвет фона</label>
              <input 
                type="color" 
                value={formData.card_bg_color ?? settings?.card_bg_color ?? '#111118'} 
                onChange={e => updateField('card_bg_color', e.target.value)} 
                className="w-full h-10 rounded-lg cursor-pointer" 
              />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Акцентный цвет</label>
              <input 
                type="color" 
                value={formData.card_accent_color ?? settings?.card_accent_color ?? '#00E5FF'} 
                onChange={e => updateField('card_accent_color', e.target.value)} 
                className="w-full h-10 rounded-lg cursor-pointer" 
              />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Стиль</label>
              <select 
                value={formData.card_style ?? settings?.card_style ?? 'modern'} 
                onChange={e => updateField('card_style', e.target.value)} 
                className="input w-full"
              >
                {CARD_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-3">👁️ Предпросмотр</h3>
            <div 
              className="rounded-2xl p-5 max-w-sm mx-auto" 
              style={{ 
                background: formData.card_bg_color ?? settings?.card_bg_color ?? '#111118', 
                border: `2px solid ${formData.card_accent_color ?? settings?.card_accent_color ?? '#00E5FF'}`,
                boxShadow: `0 0 20px ${(formData.card_accent_color ?? settings?.card_accent_color ?? '#00E5FF')}30`
              }}
            >
              <div className="mb-3 flex justify-between">
                <span className="text-xs font-bold text-black px-2 py-0.5 rounded-lg" style={{ background: formData.card_accent_color ?? settings?.card_accent_color ?? '#00E5FF' }}>
                  🪪 #1
                </span>
                <span className="text-white/50 text-xs">Ур. 42</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl overflow-hidden shrink-0 bg-[rgb(var(--surface-3))]" style={{ border: `2px solid ${formData.card_accent_color ?? settings?.card_accent_color ?? '#00E5FF'}` }}>
                  👤
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-sm truncate">Пользователь</div>
                  <div className="mt-1.5">
                    <div className="flex justify-between text-xs text-white/40 mb-1"><span>XP</span><span>15,420 / 20,000</span></div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: '77%', background: formData.card_accent_color ?? settings?.card_accent_color ?? '#00E5FF' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}