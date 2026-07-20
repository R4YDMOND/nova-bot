'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/toggle';
import { useServer } from '@/context/ServerProvider';
import { NoServerSelected } from '@/components/NoServerSelected';
import {
  useRankingSettings,
  useSaveRankingSettings,
  useLeaderboard,
  useRankingPreview,
  useValidateFormula,
  useRankingChannels,
  useSyncMembers,
} from '@/hooks/useRanking';
import type { RankingReward, XPFormulaConfig } from '@/types/ranking';

const TABS = [
  { id: 'settings', label: '⚙️ Настройки' },
  { id: 'formula', label: '🧮 Формула XP' },
  { id: 'rewards', label: '🎁 Награды' },
  { id: 'leaderboard', label: '🏆 Лидерборд' },
  { id: 'card', label: '🪪 Карточка' },
];

const CARD_STYLES = [
  { value: 'gradient', label: 'Градиент' },
  { value: 'glass', label: 'Стекло' },
  { value: 'neon', label: 'Неон' },
  { value: 'flat', label: 'Плоский' },
];

// Пресеты палитры для быстрого выбора акцентного цвета (референс: превью палитры)
const PALETTE_PRESETS = ['#00E5FF', '#7B2FBE', '#F76FBE', '#FFA500', '#22C55E', '#94A3B8'];

const FORMULA_TYPES = [
  { value: 'linear', label: 'Линейная' },
  { value: 'exponential', label: 'Экспоненциальная' },
  { value: 'logarithmic', label: 'Логарифмическая' },
  { value: 'custom', label: 'Своя формула' },
];

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
const MEDAL_COLORS: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

// Зеркало backend XPFormulaEngine.calculate_level_xp (backend/ranking/formulas.py) —
// используется только для прогресс-бара в UI, источник истины остаётся на бэкенде.
function calcLevelXp(level: number, formulaType: string): number {
  if (level <= 0) return 100;
  if (formulaType === 'linear') return 100 * level;
  if (formulaType === 'logarithmic') return Math.round(100 * level * Math.log10(level + 1));
  return 100 * level * level; // exponential / custom — дефолт
}

export default function RankingPage() {
  const { selectedServer, selectedServerId, loading: serverLoading } = useServer();
  const [activeTab, setActiveTab] = useState('settings');
  const [viewPlatform, setViewPlatform] = useState<'vk' | 'lolka'>('vk');
  const [formData, setFormData] = useState<any>({});
  const [sort, setSort] = useState<'xp' | 'level' | 'messages'>('xp');
  const [formulaTest, setFormulaTest] = useState<{ valid: boolean; test_xp?: number; level_10_required_xp?: number; error?: string } | null>(null);

  const effectivePlatform = viewPlatform;

  const { data: settings, isLoading: settingsLoading } = useRankingSettings(selectedServerId, effectivePlatform);
  const saveMutation = useSaveRankingSettings();

  const [channelDropdownOpen, setChannelDropdownOpen] = useState(false);
  const { data: channelsData, isFetching: channelsLoading, refetch: refetchChannels } = useRankingChannels(selectedServerId, effectivePlatform);
  const syncMembersMutation = useSyncMembers();
  const [syncResultMsg, setSyncResultMsg] = useState<string | null>(null);

  const handleDetectChannels = async () => {
    setChannelDropdownOpen(true);
    await refetchChannels();
  };

  const handleSyncMembers = async () => {
    setSyncResultMsg(null);
    try {
      const res = await syncMembersMutation.mutateAsync({ serverId: selectedServerId, platform: effectivePlatform });
      setSyncResultMsg(res.error ? `❌ ${res.error}` : `✅ Синхронизировано участников: ${res.synced ?? 0}`);
    } catch (e: any) {
      setSyncResultMsg(`❌ ${e?.message || 'Ошибка синхронизации'}`);
    }
  };

  const { data: lbVk, isLoading: lbVkLoading } = useLeaderboard(selectedServerId, 'vk', sort, viewPlatform !== 'lolka');
  const { data: lbLolka, isLoading: lbLolkaLoading } = useLeaderboard(selectedServerId, 'lolka', sort, viewPlatform !== 'vk');

  const leaderboardEntries = useMemo(() => {
    const src = viewPlatform === 'lolka' ? lbLolka : lbVk;
    return (src?.entries || []).map(e => ({ ...e, _platform: viewPlatform }));
  }, [viewPlatform, lbVk, lbLolka]);

  const leaderboardLoading = viewPlatform === 'lolka' ? lbLolkaLoading : lbVkLoading;

  // Live Preview — реальные данные топ-1 участника лидерборда (см. Объяснение).
  const topEntry: any = leaderboardEntries[0];
  const { data: preview } = useRankingPreview(
    selectedServerId,
    (topEntry?._platform || effectivePlatform) as 'vk' | 'lolka',
    topEntry?.user_id || ''
  );

  const validateMutation = useValidateFormula();

  const updateField = (field: string, value: any) => setFormData((prev: any) => ({ ...prev, [field]: value }));

  const formula: XPFormulaConfig =
    formData.xp_formula ?? settings?.xp_formula ?? { formula_type: 'exponential', base_xp: 15, multiplier: 1.0, decay_factor: 0, max_xp_per_message: 100 };
  const updateFormula = (field: keyof XPFormulaConfig, value: any) => updateField('xp_formula', { ...formula, [field]: value });

  const rewards: RankingReward[] = formData.rewards ?? settings?.rewards ?? [];
  const updateRewards = (next: RankingReward[]) => updateField('rewards', next);
  const addReward = () => updateRewards([...rewards, { level: 5, role: '', color: '#00E5FF', message: '' }]);
  const updateReward = (i: number, field: keyof RankingReward, value: any) =>
    updateRewards(rewards.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  const removeReward = (i: number) => updateRewards(rewards.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!selectedServer) return;
    try {
      await saveMutation.mutateAsync({ serverId: selectedServerId, platform: effectivePlatform, settings: formData });
      alert('✅ Настройки сохранены!');
    } catch {
      alert('❌ Ошибка сохранения');
    }
  };

  const handleTestFormula = async () => {
    try {
      const result = await validateMutation.mutateAsync(formula);
      setFormulaTest(result);
    } catch {
      setFormulaTest({ valid: false, error: 'Не удалось проверить формулу' });
    }
  };

  if (serverLoading || settingsLoading) {
    return <div className="p-8 text-center text-[rgb(var(--text-secondary))]">⏳ Загрузка...</div>;
  }
  if (!selectedServer) {
    return <NoServerSelected title="🪪 Система уровней" />;
  }

  const cardBg = formData.card_bg_color ?? settings?.card_bg_color ?? '#111118';
  const cardAccent = formData.card_accent_color ?? settings?.card_accent_color ?? '#00E5FF';
  const cardGradient = formData.card_gradient_color ?? settings?.card_gradient_color ?? '#7B2FBE';
  const cardStyle = formData.card_style ?? settings?.card_style ?? 'gradient';
  const cardRadius = formData.card_radius ?? settings?.card_radius ?? 16;
  const cardGlass = formData.card_glass_intensity ?? settings?.card_glass_intensity ?? 70;
  const cardBgImageUrl = formData.card_bg_image_url ?? settings?.card_bg_image_url ?? '';
  const cardBgImageEnabled = formData.card_bg_image_enabled ?? settings?.card_bg_image_enabled ?? false;

  return (
    <div className="max-w-[1920px] mx-auto px-4 sm:px-8 py-8 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">🪪 Система уровней</h1>
          <p className="text-[rgb(var(--text-secondary))] text-sm mt-1">Настройки опыта, наград и рейтинга</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-xl border border-[rgb(var(--border))] overflow-hidden">
            {(['vk', 'lolka'] as const).map(p => (
              <button
                key={p}
                onClick={() => setViewPlatform(p)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewPlatform === p ? 'bg-cyan-400 text-black' : 'bg-[rgb(var(--surface-2))] hover:bg-[rgb(var(--surface-3))]'
                }`}
              >
                {p === 'vk' ? 'VK' : 'Lolka'}
              </button>
            ))}
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
      </div>

      <div className="flex gap-1 mb-6 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id ? 'bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))]' : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-2))]'
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
                <input type="number" value={formData.xp_per_message ?? settings?.xp_per_message ?? 15} onChange={e => updateField('xp_per_message', parseInt(e.target.value) || 0)} className="input w-full" />
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">XP за минуту голоса</label>
                <input type="number" value={formData.xp_per_voice_minute ?? settings?.xp_per_voice_minute ?? 20} onChange={e => updateField('xp_per_voice_minute', parseInt(e.target.value) || 0)} className="input w-full" />
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Минимальная длина сообщения</label>
                <input type="number" value={formData.min_message_length ?? settings?.min_message_length ?? 3} onChange={e => updateField('min_message_length', parseInt(e.target.value) || 0)} className="input w-full" />
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Кулдаун между начислениями (сек)</label>
                <input type="number" value={formData.cooldown_seconds ?? settings?.cooldown_seconds ?? 60} onChange={e => updateField('cooldown_seconds', parseInt(e.target.value) || 0)} className="input w-full" />
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm">Система уровней включена</span>
                <Switch checked={formData.enabled ?? settings?.enabled ?? true} onCheckedChange={val => updateField('enabled', val)} />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-3">🔔 Уведомления</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Канал уведомлений</label>
                <div className="flex gap-2">
                  <input type="text" value={formData.notify_channel ?? settings?.notify_channel ?? ''} onChange={e => updateField('notify_channel', e.target.value)} className="input w-full" />
                  <button
                    type="button"
                    onClick={handleDetectChannels}
                    disabled={channelsLoading}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap bg-[rgb(var(--surface-2))] text-[rgb(var(--text-secondary))] hover:bg-cyan-400 hover:text-black transition-colors disabled:opacity-50"
                  >
                    {channelsLoading ? '⏳' : '🔍 Автоопределение'}
                  </button>
                </div>
                {channelDropdownOpen && (
                  <div className="mt-2 border border-[rgb(var(--border))] rounded-lg max-h-48 overflow-y-auto bg-[rgb(var(--surface-2))]">
                    {channelsLoading ? (
                      <p className="text-xs text-center py-3 text-[rgb(var(--text-secondary))]">Поиск каналов...</p>
                    ) : channelsData?.error ? (
                      <p className="text-xs text-center py-3 text-red-400">{channelsData.error}</p>
                    ) : channelsData?.channels?.length ? (
                      channelsData.channels.map(ch => (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => { updateField('notify_channel', ch.id); setChannelDropdownOpen(false); }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-cyan-400/10 transition-colors flex items-center gap-2"
                        >
                          <span>{ch.type === 'voice' ? '🔊' : '💬'}</span>
                          <span>{ch.name}</span>
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-center py-3 text-[rgb(var(--text-secondary))]">Каналы не найдены</p>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Шаблон сообщения</label>
                <textarea value={formData.notify_message ?? settings?.notify_message ?? '🎉 {user} достиг {level} уровня!'} onChange={e => updateField('notify_message', e.target.value)} rows={2} className="input w-full font-mono resize-none" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Пинговать пользователя</span>
                <Switch checked={formData.ping_user ?? settings?.ping_user ?? true} onCheckedChange={val => updateField('ping_user', val)} />
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'formula' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 space-y-3">
            <h3 className="font-semibold mb-1">🧮 Конструктор формулы</h3>
            <div>
              <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Тип формулы</label>
              <select value={formula.formula_type} onChange={e => updateFormula('formula_type', e.target.value)} className="input w-full">
                {FORMULA_TYPES.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Базовый XP</label>
                <input type="number" value={formula.base_xp} onChange={e => updateFormula('base_xp', parseInt(e.target.value) || 0)} className="input w-full" />
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Множитель</label>
                <input type="number" step="0.1" value={formula.multiplier} onChange={e => updateFormula('multiplier', parseFloat(e.target.value) || 0)} className="input w-full" />
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Затухание</label>
                <input type="number" step="0.05" min="0" max="1" value={formula.decay_factor ?? 0} onChange={e => updateFormula('decay_factor', parseFloat(e.target.value) || 0)} className="input w-full" />
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Макс. XP за сообщение</label>
                <input type="number" value={formula.max_xp_per_message ?? 100} onChange={e => updateFormula('max_xp_per_message', parseInt(e.target.value) || 0)} className="input w-full" />
              </div>
            </div>
            {formula.formula_type === 'custom' && (
              <div>
                <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Своё выражение</label>
                <input type="text" value={formula.custom_expression ?? ''} onChange={e => updateFormula('custom_expression', e.target.value)} className="input w-full font-mono" />
              </div>
            )}

            <button
              onClick={handleTestFormula}
              disabled={validateMutation.isPending}
              className="w-full mt-2 px-4 py-2 rounded-xl font-semibold text-sm bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-3))] transition-colors disabled:opacity-60"
            >
              {validateMutation.isPending ? 'Проверка...' : '▶️ Проверить формулу'}
            </button>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-3">📈 Результат теста</h3>
            {formulaTest ? (
              formulaTest.valid ? (
                <div className="space-y-3">
                  <div className="flex justify-between p-3 rounded-xl bg-[rgb(var(--surface-2))]">
                    <span className="text-sm text-[rgb(var(--text-secondary))]">XP за тестовое сообщение (ур. 5, 50 симв.)</span>
                    <span className="font-bold text-cyan-400">{formulaTest.test_xp}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-xl bg-[rgb(var(--surface-2))]">
                    <span className="text-sm text-[rgb(var(--text-secondary))]">XP до 10 уровня</span>
                    <span className="font-bold text-cyan-400">{formulaTest.level_10_required_xp?.toLocaleString('ru-RU')}</span>
                  </div>
                </div>
              ) : (
                <p className="text-red-400 text-sm">❌ {formulaTest.error}</p>
              )
            ) : (
              <p className="text-center text-[rgb(var(--text-secondary))] py-8 text-sm">Нажмите «Проверить формулу», чтобы увидеть результат</p>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'rewards' && (
        <Card className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">🎁 Награды за уровни</h3>
            <button onClick={addReward} className="px-3 py-1.5 rounded-xl text-sm font-medium bg-cyan-400 text-black hover:bg-cyan-300 transition-colors">
              + Добавить
            </button>
          </div>
          {rewards.length > 0 ? (
            <div className="space-y-3">
              {rewards.map((reward, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-[80px_1fr_1fr_auto_auto] gap-2 items-center p-3 bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded-xl">
                  <input type="number" value={reward.level} onChange={e => updateReward(i, 'level', parseInt(e.target.value) || 1)} className="input text-center" title="Уровень" />
                  <input type="text" value={reward.role} onChange={e => updateReward(i, 'role', e.target.value)} placeholder="Роль/название" className="input" />
                  <input type="text" value={reward.message ?? ''} onChange={e => updateReward(i, 'message', e.target.value)} placeholder="Сообщение (необязательно)" className="input" />
                  <input type="color" value={reward.color} onChange={e => updateReward(i, 'color', e.target.value)} className="w-9 h-9 rounded-lg cursor-pointer" title="Цвет" />
                  <button onClick={() => removeReward(i)} className="px-2 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title="Удалить">🗑️</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[rgb(var(--text-secondary))] py-8">Награды не настроены</p>
          )}
        </Card>
      )}

      {activeTab === 'leaderboard' && (
        <div className="space-y-3">
          <div className="flex gap-2 items-center justify-between flex-wrap">
            <div className="flex gap-2">
              {(['xp', 'level', 'messages'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sort === s ? 'bg-cyan-400 text-black' : 'bg-[rgb(var(--surface-2))] text-[rgb(var(--text-secondary))]'}`}
                >
                  {s === 'xp' ? 'По XP' : s === 'level' ? 'По уровню' : 'По сообщениям'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {syncResultMsg && <span className="text-xs text-[rgb(var(--text-secondary))]">{syncResultMsg}</span>}
              <button
                onClick={handleSyncMembers}
                disabled={syncMembersMutation.isPending}
                className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap bg-[rgb(var(--surface-2))] text-[rgb(var(--text-secondary))] hover:bg-cyan-400 hover:text-black transition-colors disabled:opacity-50"
              >
                {syncMembersMutation.isPending ? '⏳ Синхронизация...' : '🔄 Синхронизировать участников'}
              </button>
            </div>
          </div>
          <Card>
            {leaderboardLoading ? (
              <p className="text-center py-12 text-[rgb(var(--text-secondary))]">⏳ Загрузка...</p>
            ) : leaderboardEntries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[rgb(var(--surface-2))]">
                    <tr>
                      {['#', 'Участник', 'Уровень', 'Прогресс', 'XP', 'Сообщения', 'Голос (мин)'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[rgb(var(--text-secondary))] uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgb(var(--border))]">
                    {leaderboardEntries.map((entry: any) => {
                      const required = calcLevelXp(entry.level, formula.formula_type);
                      const pct = Math.min(100, Math.round((entry.xp / required) * 100));
                      return (
                        <tr
                          key={`${entry._platform}-${entry.user_id}`}
                          className="hover:bg-[rgb(var(--surface-2))] transition-colors"
                          style={entry.rank <= 3 ? { background: `${MEDAL_COLORS[entry.rank]}0d`, borderLeft: `3px solid ${MEDAL_COLORS[entry.rank]}` } : undefined}
                        >
                          <td className="px-4 py-3 font-bold text-lg" style={entry.rank <= 3 ? { color: MEDAL_COLORS[entry.rank] } : undefined}>{MEDALS[entry.rank] || `#${entry.rank}`}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {entry.avatar_url ? (
                                <img
                                  src={entry.avatar_url}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover"
                                  style={entry.rank <= 3 ? { border: `2px solid ${MEDAL_COLORS[entry.rank]}` } : undefined}
                                />
                              ) : (
                                <span className="w-8 h-8 rounded-full bg-[rgb(var(--surface-3))] flex items-center justify-center" style={entry.rank <= 3 ? { border: `2px solid ${MEDAL_COLORS[entry.rank]}` } : undefined}>👤</span>
                              )}
                              <span className="font-medium">{entry.username}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3"><span className="bg-[rgb(var(--surface-3))] px-2 py-0.5 rounded-lg font-bold">{entry.level}</span></td>
                          <td className="px-4 py-3 w-32">
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-cyan-400" style={{ width: `${pct}%` }} />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[rgb(var(--text-secondary))]">{entry.xp.toLocaleString('ru-RU')}</td>
                          <td className="px-4 py-3 text-[rgb(var(--text-secondary))]">{entry.messages}</td>
                          <td className="px-4 py-3 text-[rgb(var(--text-secondary))]">{entry.voice_minutes}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-[rgb(var(--text-secondary))] py-12">👥 Нет данных в лидерборде</p>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-5 space-y-4">
            <h3 className="font-semibold">🎨 Дизайн карточки</h3>
            <div>
              <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Цвет фона</label>
              <input type="color" value={cardBg} onChange={e => updateField('card_bg_color', e.target.value)} className="w-full h-10 rounded-lg cursor-pointer" />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Акцентный цвет</label>
              <input type="color" value={cardAccent} onChange={e => updateField('card_accent_color', e.target.value)} className="w-full h-10 rounded-lg cursor-pointer" />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Градиент</label>
              <input type="color" value={cardGradient} onChange={e => updateField('card_gradient_color', e.target.value)} className="w-full h-10 rounded-lg cursor-pointer" />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Стиль</label>
              <select value={cardStyle} onChange={e => updateField('card_style', e.target.value)} className="input w-full">
                {CARD_STYLES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex justify-between text-xs text-[rgb(var(--text-secondary))] mb-1">
                <label>Радиус углов</label>
                <span>{cardRadius} px</span>
              </div>
              <input type="range" min={4} max={28} step={2} value={cardRadius} onChange={e => updateField('card_radius', parseInt(e.target.value))} className="w-full accent-cyan-400" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-[rgb(var(--text-secondary))] mb-1">
                <label>Интенсивность стекла</label>
                <span>{cardGlass}%</span>
              </div>
              <input type="range" min={0} max={100} step={5} value={cardGlass} onChange={e => updateField('card_glass_intensity', parseInt(e.target.value))} className="w-full accent-cyan-400" disabled={cardStyle !== 'glass'} />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--text-secondary))] block mb-2">Превью палитры</label>
              <div className="flex gap-2">
                {PALETTE_PRESETS.map(c => (
                  <button
                    key={c}
                    onClick={() => updateField('card_accent_color', c)}
                    className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${cardAccent.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-offset-2 ring-offset-[rgb(var(--surface-1))] ring-white' : ''}`}
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
            <div className="pt-3 border-t border-[rgb(var(--border))]">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-[rgb(var(--text-secondary))]">Пользовательский фон (по ссылке)</label>
                <Switch checked={cardBgImageEnabled} onCheckedChange={val => updateField('card_bg_image_enabled', val)} />
              </div>
              {cardBgImageEnabled && (
                <input
                  type="url"
                  value={cardBgImageUrl}
                  onChange={e => updateField('card_bg_image_url', e.target.value)}
                  placeholder="https://example.com/image.png"
                  className="input w-full"
                />
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-3">👁️ Live Preview {topEntry ? '' : '(тестовые данные)'}</h3>
            <div
              className="p-5 max-w-sm mx-auto"
              style={{
                borderRadius: `${cardRadius}px`,
                background: cardStyle === 'glass' ? `${cardBg}${Math.round((cardGlass / 100) * 255).toString(16).padStart(2, '0')}` : cardBg,
                backdropFilter: cardStyle === 'glass' ? `blur(${Math.round((cardGlass / 100) * 24)}px)` : undefined,
                border: cardStyle === 'flat' ? `1px solid ${cardAccent}40` : `2px solid ${cardAccent}`,
                boxShadow: cardStyle === 'neon' ? `0 0 24px ${cardAccent}80, 0 0 8px ${cardAccent}` : cardStyle === 'flat' ? 'none' : `0 0 20px ${cardAccent}30`,
                backgroundImage: cardBgImageEnabled && cardBgImageUrl
                  ? `linear-gradient(0deg, ${cardBg}cc, ${cardBg}66), url(${cardBgImageUrl})`
                  : cardStyle === 'gradient' ? `linear-gradient(135deg, ${cardBg}, ${cardGradient}80)` : undefined,
                backgroundSize: cardBgImageEnabled && cardBgImageUrl ? 'cover' : undefined,
                backgroundPosition: cardBgImageEnabled && cardBgImageUrl ? 'center' : undefined,
              }}
            >
              <div className="mb-3 flex justify-between">
                <span className="text-xs font-bold text-black px-2 py-0.5 rounded-lg" style={{ background: cardAccent }}>
                  🪪 #{preview?.ranking.rank ?? 1}
                </span>
                <span className="text-white/50 text-xs">Ур. {preview?.ranking.level ?? 42}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl overflow-hidden shrink-0 bg-[rgb(var(--surface-3))]" style={{ border: `2px solid ${cardAccent}` }}>
                  {preview?.user.avatar_url ? <img src={preview.user.avatar_url} alt="" className="w-full h-full object-cover" /> : '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-sm truncate">{preview?.user.username ?? 'Пользователь'}</div>
                  <div className="mt-1.5">
                    <div className="flex justify-between text-xs text-white/40 mb-1">
                      <span>XP</span>
                      <span>
                        {(preview?.ranking.current_xp ?? 15420).toLocaleString('ru-RU')} / {(preview?.ranking.xp_for_next_level ?? 20000).toLocaleString('ru-RU')}
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${preview ? Math.min(100, Math.round((preview.ranking.current_xp / preview.ranking.xp_for_next_level) * 100)) : 77}%`,
                          background: cardAccent,
                        }}
                      />
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