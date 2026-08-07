'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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
  useJoinVkChannelByLink,
  useRankingRoles,
  useSyncMembers,
  useNovaPointsTop,
  useShopItems,
  useCreateShopItem,
  useDeleteShopItem,
  useAchievements,
  useCreateAchievement,
  useDeleteAchievement,
} from '@/hooks/useRanking';
import type { RankingReward, XPFormulaConfig } from '@/types/ranking';
import { EMPTY_WELCOME_TEMPLATE, WELCOME_BUTTON_ACTIONS } from '@/types/ranking';
import { Hint, RoleMultiSelect } from '@/components/ranking/RankingFormControls';
import { ShopPurchaseTemplateModal } from '@/components/ranking/ShopPurchaseTemplateModal';
import { MessageTemplateModal, WELCOME_VARIABLES } from '@/components/MessageTemplateModal';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const TABS = [
  { id: 'settings', label: '⚙️ Общие' },
  { id: 'welcome', label: '💳 Визитка' },
  { id: 'formula', label: '🧮 Формула XP' },
  { id: 'rewards', label: '🎁 Награды' },
  { id: 'leaderboard', label: '🏆 Лидерборд' },
  { id: 'nova-points', label: '🌟 Nova Points' },
];

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
const MEDAL_COLORS: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

// Зеркало backend XPFormulaEngine.calculate_level_xp (backend/ranking/formulas.py) —
// используется только для прогресс-бара в UI, источник истины остаётся на бэкенде.
// Формула должна быть тождественна backend/ranking/formulas.py::calculate_level_xp —
// иначе клиентский график (draft, без запроса к бэку) разойдётся с «Проверить формулу».
const DEFAULT_BASE_XP = 15;

function calcLevelXp(level: number, formulaType: string, baseXp: number = DEFAULT_BASE_XP, multiplier: number = 1): number {
  if (level <= 0) return 100;
  const scale = (baseXp / DEFAULT_BASE_XP) * (multiplier > 0 ? multiplier : 1);
  if (formulaType === 'linear') return Math.max(1, Math.round(100 * scale * level));
  if (formulaType === 'logarithmic') return Math.max(1, Math.round(100 * scale * level * Math.log10(level + 1)));
  return Math.max(1, Math.round(100 * scale * level * level)); // exponential / custom — дефолт
}

const CHART_KEY_LEVELS = [1, 5, 10, 25, 50];

/** График кривой требуемого XP (ТЗ №5 Rev.10, п.4/6) — считается на клиенте из
 * draft-значений формулы (calcLevelXp), без запросов к бэкенду: обновляется мгновенно
 * при вводе, а не после «Сохранить» (Draft mode это не нарушает — график не пишет данные).
 * useMemo пересчитывает точки при смене типа формулы, base_xp и multiplier — все три
 * поля теперь влияют на порог уровня (раньше игнорировались, из-за чего график и
 * «ХР до N уровня» не реагировали на ввод — исправлено вместе с backend). decay_factor
 * и max_xp_per_message на порог уровня не влияют — это ограничения только на разовую
 * награду за сообщение, не на общую кривую. */
function FormulaProgressionChart({ formula }: { formula: XPFormulaConfig }) {
  const data = useMemo(() => {
    const points = [];
    for (let level = 1; level <= 50; level++) {
      points.push({ level, xp: calcLevelXp(level, formula.formula_type, formula.base_xp, formula.multiplier) });
    }
    return points;
  }, [formula.formula_type, formula.base_xp, formula.multiplier]);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
          <XAxis
            dataKey="level"
            ticks={CHART_KEY_LEVELS}
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            label={{ value: 'Уровень', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#94A3B8' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            tickFormatter={(v: number) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)}
          />
          <RechartsTooltip
            contentStyle={{ background: '#020617', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            labelFormatter={(level: number) => `Уровень ${level}`}
            formatter={(value: number) => [`${value.toLocaleString('ru-RU')} XP`, 'Требуется']}
          />
          <Line type="monotone" dataKey="xp" stroke="#00E5FF" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2 mt-3">
        {CHART_KEY_LEVELS.map(level => (
          <span key={level} className="text-xs px-2 py-1 rounded-lg bg-[rgb(var(--surface-2))] text-[rgb(var(--text-secondary))]">
            Ур. {level}: <span className="text-cyan-400 font-semibold">{calcLevelXp(level, formula.formula_type, formula.base_xp, formula.multiplier).toLocaleString('ru-RU')} XP</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function RankingPage() {
  const { servers, selectedServer, loading: serverLoading } = useServer();
  const [activeTab, setActiveTab] = useState('settings');
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [viewPlatform, setViewPlatform] = useState<'vk' | 'lolka' | 'max'>('vk');
  const [formData, setFormData] = useState<any>({});
  const [sort, setSort] = useState<'xp' | 'level' | 'messages'>('xp');
  const [formulaTest, setFormulaTest] = useState<{ valid: boolean; test_xp?: number; level_10_required_xp?: number; error?: string } | null>(null);
  const [formulaTestVoice, setFormulaTestVoice] = useState<{ valid: boolean; test_xp?: number; level_10_required_xp?: number; error?: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const effectivePlatform = viewPlatform;

  // server_id должен соответствовать выбранной на этой странице платформе (VK/Lolka/MAX),
  // а не глобально выбранному серверу на /dashboard/servers — иначе на вкладке Lolka
  // улетал server_id VK-сообщества (и наоборот), что ломало автоопределение каналов
  // и тихо создавало настройки не под тем сервером.
  const vkServer = servers.find(s => s.platform === 'vk');
  const lolkaServer = servers.find(s => s.platform === 'lolka');
  // MAX: "сервер" в БД = один чат бота (см. backend/max_gateway.py) — своих каналов
  // внутри у него нет, поэтому ниже канал-селекторы для MAX скрываются целиком.
  const maxServer = servers.find(s => s.platform === 'max');
  const effectiveServerId = (
    effectivePlatform === 'vk' ? vkServer : effectivePlatform === 'lolka' ? lolkaServer : maxServer
  )?.server_id ?? '';

  const { data: settings, isLoading: settingsLoading } = useRankingSettings(effectiveServerId, effectivePlatform);
  const saveMutation = useSaveRankingSettings();

  const [channelDropdownOpen, setChannelDropdownOpen] = useState(false);
  const { data: channelsData, isFetching: channelsLoading, refetch: refetchChannels } = useRankingChannels(effectiveServerId, effectivePlatform);
  const syncMembersMutation = useSyncMembers();
  const [syncResultMsg, setSyncResultMsg] = useState<string | null>(null);

  // Автоопределение ролей сервера для вкладки "Награды" — доступно только для Lolka
  const { data: rolesData, isFetching: rolesLoading } = useRankingRoles(effectiveServerId, effectivePlatform);
  const serverRoles = rolesData?.roles ?? [];

  // Роли для магазина — ВСЕГДА из Lolka (единственная платформа, где роли реально выдаются,
  // см. ranking/nova_points.py::buy_shop_item), даже если сейчас открыта вкладка VK.
  const { data: lolkaRolesForShop, isFetching: shopRolesLoading } = useRankingRoles(lolkaServer?.server_id ?? '', 'lolka');
  const shopRoles = lolkaRolesForShop?.roles ?? [];

  // Показываем название канала уведомлений вместо сырого ID, если он есть в списке.
  const currentNotifyChannel: string = formData.notify_channel ?? settings?.notify_channel ?? '';
  const resolvedNotifyChannel = channelsData?.channels?.find(ch => ch.id === currentNotifyChannel);
  const [manualChannelEdit, setManualChannelEdit] = useState(false);
  useEffect(() => { setManualChannelEdit(false); }, [effectiveServerId, effectivePlatform]);

  // Канал вкладки "Визитка" (приветственное сообщение) — тот же список каналов,
  // что уже подтягивается кнопкой "🔍 Автоопределение" в "⚙️ Общие". На MAX не
  // используется вовсе (см. maxServer выше).
  const currentWelcomeChannel: string = formData.welcome_channel ?? settings?.welcome_channel ?? '';
  const resolvedWelcomeChannel = channelsData?.channels?.find(ch => ch.id === currentWelcomeChannel);
  const [manualWelcomeChannelEdit, setManualWelcomeChannelEdit] = useState(false);
  useEffect(() => { setManualWelcomeChannelEdit(false); }, [effectiveServerId, effectivePlatform]);

  const handleDetectChannels = async () => {
    setChannelDropdownOpen(true);
    await refetchChannels();
  };

  // VK не показывает ID беседы нигде в интерфейсе — администратор видит только
  // пригласительную ссылку (vk.me/join/...). Автоопределение (messages.getConversations)
  // находит канал, только если бот уже в нём состоит; для новых бесед — join по ссылке.
  const joinVkChannelMutation = useJoinVkChannelByLink();
  const [vkInviteLink, setVkInviteLink] = useState('');
  const [vkInviteError, setVkInviteError] = useState<string | null>(null);

  const handleJoinVkChannelByLink = async () => {
    setVkInviteError(null);
    if (!vkInviteLink.trim()) {
      setVkInviteError('Вставьте пригласительную ссылку беседы');
      return;
    }
    try {
      const res = await joinVkChannelMutation.mutateAsync({ serverId: effectiveServerId, link: vkInviteLink.trim() });
      if (res.error || !res.id) {
        setVkInviteError(res.error || 'Не удалось подключить беседу по ссылке');
        return;
      }
      updateField('notify_channel', res.id);
      setManualChannelEdit(false);
      setVkInviteLink('');
      await refetchChannels();
    } catch {
      setVkInviteError('Не удалось подключить беседу по ссылке');
    }
  };

  const handleSyncMembers = async () => {
    setSyncResultMsg(null);
    try {
      const res = await syncMembersMutation.mutateAsync({ serverId: effectiveServerId, platform: effectivePlatform });
      setSyncResultMsg(res.error ? `❌ ${res.error}` : `✅ Синхронизировано участников: ${res.synced ?? 0}`);
    } catch (e: any) {
      setSyncResultMsg(`❌ ${e?.message || 'Ошибка синхронизации'}`);
    }
  };

  // При смене платформы (VK/Lolka) или сервера сбрасываем несохранённые локальные
  // правки и связанные транзиентные состояния — иначе значения одной платформы
  // "залипают" поверх настроек другой (formData имел приоритет над settings).
  useEffect(() => {
    setFormData({});
    setChannelDropdownOpen(false);
    setSyncResultMsg(null);
    setFormulaTest(null);
  }, [effectivePlatform, effectiveServerId]);

  const { data: lbVk, isLoading: lbVkLoading } = useLeaderboard(vkServer?.server_id ?? '', 'vk', sort, viewPlatform === 'vk');
  const { data: lbLolka, isLoading: lbLolkaLoading } = useLeaderboard(lolkaServer?.server_id ?? '', 'lolka', sort, viewPlatform === 'lolka');
  const { data: lbMax, isLoading: lbMaxLoading } = useLeaderboard(maxServer?.server_id ?? '', 'max', sort, viewPlatform === 'max');

  const leaderboardEntries = useMemo(() => {
    const src = viewPlatform === 'lolka' ? lbLolka : viewPlatform === 'max' ? lbMax : lbVk;
    return (src?.entries || []).map(e => ({ ...e, _platform: viewPlatform }));
  }, [viewPlatform, lbVk, lbLolka, lbMax]);

  const leaderboardLoading = viewPlatform === 'lolka' ? lbLolkaLoading : viewPlatform === 'max' ? lbMaxLoading : lbVkLoading;

  // Live Preview — реальные данные топ-1 участника лидерборда (см. Объяснение).
  const topEntry: any = leaderboardEntries[0];
  const { data: preview } = useRankingPreview(
    effectiveServerId,
    (topEntry?._platform || effectivePlatform) as 'vk' | 'lolka' | 'max',
    topEntry?.user_id || ''
  );

  const validateMutation = useValidateFormula();

  const [npPeriod, setNpPeriod] = useState<'all' | 'month' | 'week'>('all');
  const { data: npTopData, isLoading: npTopLoading } = useNovaPointsTop(
    effectiveServerId, effectivePlatform, npPeriod, activeTab === 'nova-points'
  );
  const npEntries = npTopData?.entries ?? [];

  // ── ТЗ №5 Rev.9, п.12: магазин ролей ──────────────────────────────────
  const { data: shopData, isFetching: shopLoading } = useShopItems(effectiveServerId, effectivePlatform, activeTab === 'nova-points');
  const shopItems = shopData?.items ?? [];
  const createShopItemMutation = useCreateShopItem();
  const deleteShopItemMutation = useDeleteShopItem();
  const [newShopRoleId, setNewShopRoleId] = useState('');
  const [newShopRoleName, setNewShopRoleName] = useState('');
  const [newShopPrice, setNewShopPrice] = useState('');
  const [shopFormError, setShopFormError] = useState<string | null>(null);
  const [shopTemplateOpen, setShopTemplateOpen] = useState(false);

  const handleAddShopItem = async () => {
    setShopFormError(null);
    const price = parseInt(newShopPrice, 10);
    if (!newShopRoleId.trim() || !price || price <= 0) {
      setShopFormError('Укажите роль и цену больше 0');
      return;
    }
    try {
      await createShopItemMutation.mutateAsync({
        serverId: effectiveServerId, platform: effectivePlatform,
        data: { role_id: newShopRoleId.trim(), role_name: newShopRoleName.trim(), price },
      });
      setNewShopRoleId(''); setNewShopRoleName(''); setNewShopPrice('');
    } catch {
      setShopFormError('Не удалось добавить товар');
    }
  };

  const handleDeleteShopItem = async (itemId: number) => {
    try {
      await deleteShopItemMutation.mutateAsync({ serverId: effectiveServerId, platform: effectivePlatform, itemId });
    } catch {
      alert('❌ Не удалось удалить товар');
    }
  };

  // ── ТЗ №5 Rev.10, п.4: достижения (независимая от Nova Points сущность) ─
  const { data: achievementsData, isFetching: achievementsLoading } = useAchievements(effectiveServerId, effectivePlatform, activeTab === 'rewards');
  const achievements = achievementsData?.items ?? [];
  const createAchievementMutation = useCreateAchievement();
  const deleteAchievementMutation = useDeleteAchievement();
  const [newAchvName, setNewAchvName] = useState('');
  const [newAchvIcon, setNewAchvIcon] = useState('🏆');
  const [newAchvTriggerLevel, setNewAchvTriggerLevel] = useState('');
  const [achvFormError, setAchvFormError] = useState<string | null>(null);

  const handleAddAchievement = async () => {
    setAchvFormError(null);
    if (!newAchvName.trim()) {
      setAchvFormError('Укажите название достижения');
      return;
    }
    try {
      await createAchievementMutation.mutateAsync({
        serverId: effectiveServerId, platform: effectivePlatform,
        data: {
          name: newAchvName.trim(),
          icon: newAchvIcon.trim() || '🏆',
          trigger_level: newAchvTriggerLevel.trim() ? parseInt(newAchvTriggerLevel, 10) : null,
        },
      });
      setNewAchvName(''); setNewAchvIcon('🏆'); setNewAchvTriggerLevel('');
    } catch {
      setAchvFormError('Не удалось добавить достижение');
    }
  };

  const handleDeleteAchievement = async (achievementId: number) => {
    try {
      await deleteAchievementMutation.mutateAsync({ serverId: effectiveServerId, platform: effectivePlatform, achievementId });
    } catch {
      alert('❌ Не удалось удалить достижение');
    }
  };

  const updateField = (field: string, value: any) => setFormData((prev: any) => ({ ...prev, [field]: value }));

  const formula: XPFormulaConfig =
    formData.xp_formula ?? settings?.xp_formula ?? { formula_type: 'exponential', base_xp: 15, multiplier: 1.0, decay_factor: 0, max_xp_per_message: 100, voice_base_xp: 15, voice_multiplier: 1.0 };
  const updateFormula = (field: keyof XPFormulaConfig, value: any) => updateField('xp_formula', { ...formula, [field]: value });

  const rewards: RankingReward[] = formData.rewards ?? settings?.rewards ?? [];
  const updateRewards = (next: RankingReward[]) => updateField('rewards', next);
  const addReward = () => updateRewards([...rewards, { level: 5, role: '', color: '#00E5FF', message: '' }]);
  const updateReward = (i: number, field: keyof RankingReward, value: any) =>
    updateRewards(rewards.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  const removeReward = (i: number) => updateRewards(rewards.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!effectiveServerId) return;
    try {
      await saveMutation.mutateAsync({ serverId: effectiveServerId, platform: effectivePlatform, settings: formData });
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

  const handleTestVoiceFormula = async () => {
    try {
      const result = await validateMutation.mutateAsync({
        formula_type: formula.formula_type,
        base_xp: formula.voice_base_xp ?? 15,
        multiplier: formula.voice_multiplier ?? 1,
        is_voice: true,
      });
      setFormulaTestVoice(result);
    } catch {
      setFormulaTestVoice({ valid: false, error: 'Не удалось проверить формулу' });
    }
  };

  // Вынесено выше early-return блока: хуки (useState/useEffect) не могут вызываться
  // после условных return — иначе порядок хуков "плывёт" между рендерами и React
  // падает с ошибкой #310 (Rendered fewer hooks than expected).

  // Онбординг-баннер (ТЗ №5 Rev.5, п.10.1) — показывается один раз в этом браузере,
  // пока участник явно не закроет/не начнёт настройку. Флаг хранится локально:
  // отдельного поля в RankingSettings под это не заводим (это подсказка для
  // конкретного пользователя дашборда, а не настройка сервера/платформы).
  const ONBOARDING_STORAGE_KEY = 'nova_ranking_onboarding_dismissed';
  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDING_STORAGE_KEY)) setShowOnboarding(true);
    } catch {
      // localStorage недоступен (приватный режим и т.п.) — просто не показываем баннер повторно за сессию
    }
  }, []);
  const dismissOnboarding = () => {
    setShowOnboarding(false);
    try { localStorage.setItem(ONBOARDING_STORAGE_KEY, '1'); } catch {}
  };

  if (serverLoading || settingsLoading) {
    return <div className="p-8 text-center text-[rgb(var(--text-secondary))]">⏳ Загрузка...</div>;
  }
  if (!selectedServer) {
    return <NoServerSelected title="🪪 Система уровней" />;
  }

  return (
    <TooltipProvider delayDuration={200}>
    <div className="max-w-[1920px] mx-auto px-4 sm:px-8 py-8 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">🪪 Система уровней</h1>
          <p className="text-[rgb(var(--text-secondary))] text-sm mt-1">Настройки опыта, наград и рейтинга</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-xl border border-[rgb(var(--border))] overflow-hidden">
            {(['vk', 'lolka', 'max'] as const).map(p => (
              <button
                key={p}
                onClick={() => setViewPlatform(p)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewPlatform === p ? 'bg-cyan-400 text-black' : 'bg-[rgb(var(--surface-2))] hover:bg-[rgb(var(--surface-3))]'
                }`}
              >
                {p === 'vk' ? 'VK' : p === 'lolka' ? 'Lolka' : 'MAX'}
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

      {showOnboarding && (
        <p className="text-sm text-[rgb(var(--text-secondary))] -mt-2">
          Участники получают XP за сообщения и голосовую активность («⚙️ Общие»), повышают уровень по формуле из «🧮 Формула XP»
          и автоматически получают награды — роли, валюту или значки («🎁 Награды»). Прогресс всех участников виден в «🏆 Лидерборд»,
          а внешний вид карточки профиля настраивается на вкладке «🪪 Карточка».
          {' '}
          <button type="button" onClick={dismissOnboarding} className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
            Понятно, скрыть
          </button>
        </p>
      )}

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

      {!effectiveServerId && (
        <p className="mb-4 text-sm text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-3">
          ⚠️ {effectivePlatform === 'vk' ? 'VK' : effectivePlatform === 'lolka' ? 'Lolka' : 'MAX'}-сервер не подключён. Добавьте его на странице{' '}
          <a href="/dashboard/servers" className="underline">/dashboard/servers</a>, чтобы настроить систему уровней для этой платформы.
        </p>
      )}

      {activeTab === 'settings' && (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 flex flex-col">
            <h3 className="font-semibold mb-3">⚙️ Параметры начисления опыта</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[rgb(var(--text-secondary))] mb-1 flex items-center gap-1.5">
                  Опыт за сообщение (XP)
                  <Hint text="Сколько очков получает участник за каждое текстовое сообщение. Оптимально: 10–25 XP — меньше замедлит прокачку, больше ускорит её слишком сильно" />
                </label>
                <input type="number" value={formData.xp_per_message ?? settings?.xp_per_message ?? 15} onChange={e => updateField('xp_per_message', parseInt(e.target.value) || 0)} className="input w-full" />
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--text-secondary))] mb-1 flex items-center gap-1.5">
                  Опыт за голосовую минуту (XP)
                  <Hint text="Количество опыта за 1 минуту в голосовом чате" />
                </label>
                <input type="number" value={formData.xp_per_voice_minute ?? settings?.xp_per_voice_minute ?? 20} onChange={e => updateField('xp_per_voice_minute', parseInt(e.target.value) || 0)} className="input w-full" />
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--text-secondary))] mb-1 flex items-center gap-1.5">
                  Минимальная длина сообщения
                  <Hint text="Сообщения короче этого значения не учитываются — защита от спама" />
                </label>
                <input type="number" value={formData.min_message_length ?? settings?.min_message_length ?? 3} onChange={e => updateField('min_message_length', parseInt(e.target.value) || 0)} className="input w-full" />
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--text-secondary))] mb-1 flex items-center gap-1.5">
                  Задержка между начислениями (сек)
                  <Hint text="Минимальное время между начислениями опыта одному пользователю. Защита от спама и накрутки" />
                </label>
                <input type="number" value={formData.cooldown_seconds ?? settings?.cooldown_seconds ?? 60} onChange={e => updateField('cooldown_seconds', parseInt(e.target.value) || 0)} className="input w-full" />
              </div>
              <div className="flex justify-between items-center pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">Включить систему уровней</span>
                  <Hint text="Когда включено: участники зарабатывают XP за сообщения и голосовую активность" />
                </div>
                <Switch checked={formData.enabled ?? settings?.enabled ?? true} onCheckedChange={val => updateField('enabled', val)} />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-3">🔔 Уведомления</h3>
            <div className="space-y-3">
              {effectivePlatform === 'max' && (
                <p className="text-xs text-[rgb(var(--text-secondary))]">
                  На MAX у бота один чат (сам подключённый сервер) — отдельный канал не выбирается, уведомления о повышении уровня уходят в тот же чат, где было получено сообщение.
                </p>
              )}
              <div className={effectivePlatform === 'max' ? 'hidden' : ''}>
                {/* VK не отдаёт числовой ID беседы нигде в интерфейсе — только
                    пригласительную ссылку (vk.me/join/...), поэтому для VK ручной
                    ввод ID и «Автоопределение» скрыты как вводящие в заблуждение;
                    единственный рабочий способ — подключение по ссылке ниже. */}
                {effectivePlatform === 'lolka' && (
                  <>
                    <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Канал уведомлений</label>
                    <div className="flex gap-2">
                      {resolvedNotifyChannel && !manualChannelEdit ? (
                        <div className="input w-full flex items-center gap-2 text-sm">
                          <span>{resolvedNotifyChannel.type === 'voice' ? '🔊' : '💬'}</span>
                          <span className="truncate">{resolvedNotifyChannel.name}</span>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={currentNotifyChannel}
                          onChange={e => updateField('notify_channel', e.target.value)}
                          placeholder="ID канала"
                          className="input w-full"
                        />
                      )}
                      {resolvedNotifyChannel && (
                        <button
                          type="button"
                          onClick={() => setManualChannelEdit(v => !v)}
                          title={manualChannelEdit ? 'Показать название канала' : 'Ввести ID вручную'}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap bg-[rgb(var(--surface-2))] text-[rgb(var(--text-secondary))] hover:bg-cyan-400 hover:text-black transition-colors"
                        >
                          ✏️
                        </button>
                      )}
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
                              onClick={() => { updateField('notify_channel', ch.id); setChannelDropdownOpen(false); setManualChannelEdit(false); }}
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
                  </>
                )}
                {effectivePlatform === 'vk' && resolvedNotifyChannel && (
                  <div className="mb-1.5">
                    <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Беседа для уведомлений</label>
                    <div className="input w-full flex items-center gap-2 text-sm">
                      <span>💬</span>
                      <span className="truncate">{resolvedNotifyChannel.name}</span>
                    </div>
                  </div>
                )}
                {effectivePlatform === 'vk' && (
                  <div className="mt-2 space-y-1.5">
                    <p className="text-xs text-[rgb(var(--text-secondary))] flex items-center gap-1.5">
                      Подключить беседу по ссылке
                      <Hint text="VK нигде не показывает числовой ID беседы — только пригласительную ссылку вида vk.me/join/... Вставьте ссылку — бот вступит в беседу и подключит её как канал уведомлений." />
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={vkInviteLink}
                        onChange={e => setVkInviteLink(e.target.value)}
                        placeholder="https://vk.me/join/..."
                        className="input w-full text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleJoinVkChannelByLink}
                        disabled={joinVkChannelMutation.isPending}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap bg-[rgb(var(--surface-2))] text-[rgb(var(--text-secondary))] hover:bg-cyan-400 hover:text-black transition-colors disabled:opacity-50"
                      >
                        {joinVkChannelMutation.isPending ? '⏳' : '🔗 Подключить по ссылке'}
                      </button>
                    </div>
                    {vkInviteError && <p className="text-xs text-red-400">{vkInviteError}</p>}
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">Пинговать пользователя</span>
                  <Hint text="Упоминать участника в сообщении (@username)" />
                </div>
                <Switch checked={formData.ping_user ?? settings?.ping_user ?? true} onCheckedChange={val => updateField('ping_user', val)} />
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--text-secondary))] mb-1 flex items-center gap-1.5">
                  Шаблон сообщения
                  <Hint text="Текст, панель (embed) и интерактивные кнопки сообщения о повышении уровня" />
                </label>
                <div className="flex items-center gap-2 p-3 bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded-xl">
                  <p className="flex-1 min-w-0 truncate font-mono text-xs text-[rgb(var(--text-secondary))]">
                    {formData.notify_template?.content || formData.notify_message || settings?.notify_message || '🎉 {user} достиг {level} уровня!'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setTemplateModalOpen(v => !v)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-400 text-black hover:bg-cyan-300 transition-colors whitespace-nowrap shrink-0"
                  >
                    {templateModalOpen ? '✕ Закрыть редактор' : '✏️ Открыть редактор шаблонов'}
                  </button>
                </div>
                {/* Правка.jpg: редактор раскрывается вниз прямо во вкладке "Настройки".
                    Вынесен за пределы grid-колонки карточки "Уведомления" (был зажат
                    в половину ширины страницы, неудобно для Embed/кнопок) — теперь
                    раскрывается на всю ширину страницы под обеими карточками. */}
              </div>
            </div>
          </Card>
        </div>
        <MessageTemplateModal
          open={templateModalOpen}
          onOpenChange={setTemplateModalOpen}
          value={formData.notify_template ?? settings?.notify_template}
          serverId={effectiveServerId}
          platform={effectivePlatform}
          onSave={tpl => {
            updateField('notify_template', tpl);
            updateField('notify_message', tpl.content);
          }}
        />
        </>
      )}

      {activeTab === 'formula' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 space-y-3">
            <h3 className="font-semibold mb-1 flex items-center gap-1.5">
              💬 Формула опыта — текст
              <Hint text="Начисление XP за текстовые сообщения и порог перехода на новый уровень" />
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Базовый XP</label>
                <input type="number" value={formula.base_xp} onChange={e => updateFormula('base_xp', parseInt(e.target.value) || 0)} className="input w-full" />
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--text-secondary))] mb-1 flex items-center gap-1.5">
                  Множитель скорости
                  <Hint text="Глобальный коэффициент. 1.5x = прокачка на 50% быстрее!" />
                </label>
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

            <button
              onClick={handleTestFormula}
              disabled={validateMutation.isPending}
              className="w-full mt-2 px-4 py-2 rounded-xl font-semibold text-sm bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-3))] transition-colors disabled:opacity-60"
            >
              {validateMutation.isPending ? 'Проверка...' : '▶️ Проверить формулу'}
            </button>
          </Card>

          {/* Блок №2 — только Lolka: у VK нет голосовых каналов, поэтому для VK
              остаётся один блок (текст). Своя, независимая от текстового блока,
              пара base_xp/multiplier — влияет на порог уровня при голосовом
              начислении (backend/ranking/xp_handler.py::award_xp_for_voice_minutes). */}
          {effectivePlatform === 'lolka' && (
            <Card className="p-5 space-y-3">
              <h3 className="font-semibold mb-1 flex items-center gap-1.5">
                🎙️ Формула опыта — голос
                <Hint text="Влияет на порог перехода на новый уровень при начислении опыта за голосовую активность. Сама ставка XP за минуту задаётся во вкладке «Общие»" />
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Базовый XP</label>
                  <input type="number" value={formula.voice_base_xp ?? 15} onChange={e => updateFormula('voice_base_xp', parseInt(e.target.value) || 0)} className="input w-full" />
                </div>
                <div>
                  <label className="text-xs text-[rgb(var(--text-secondary))] mb-1 flex items-center gap-1.5">
                    Множитель скорости
                    <Hint text="Коэффициент для голосовой активности. Независим от множителя текстовых сообщений" />
                  </label>
                  <input type="number" step="0.1" value={formula.voice_multiplier ?? 1} onChange={e => updateFormula('voice_multiplier', parseFloat(e.target.value) || 0)} className="input w-full" />
                </div>
              </div>

              <button
                onClick={handleTestVoiceFormula}
                disabled={validateMutation.isPending}
                className="w-full mt-2 px-4 py-2 rounded-xl font-semibold text-sm bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-3))] transition-colors disabled:opacity-60"
              >
                {validateMutation.isPending ? 'Проверка...' : '▶️ Проверить формулу'}
              </button>
            </Card>
          )}

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

          {effectivePlatform === 'lolka' && (
            <Card className="p-5">
              <h3 className="font-semibold mb-3">📈 Результат теста</h3>
              {formulaTestVoice ? (
                formulaTestVoice.valid ? (
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 rounded-xl bg-[rgb(var(--surface-2))]">
                      <span className="text-sm text-[rgb(var(--text-secondary))]">XP за тестовую голосовую минуту (ур. 5)</span>
                      <span className="font-bold text-cyan-400">{formulaTestVoice.test_xp}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-[rgb(var(--surface-2))]">
                      <span className="text-sm text-[rgb(var(--text-secondary))]">XP до 10 уровня</span>
                      <span className="font-bold text-cyan-400">{formulaTestVoice.level_10_required_xp?.toLocaleString('ru-RU')}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-red-400 text-sm">❌ {formulaTestVoice.error}</p>
                )
              ) : (
                <p className="text-center text-[rgb(var(--text-secondary))] py-8 text-sm">Нажмите «Проверить формулу», чтобы увидеть результат</p>
              )}
            </Card>
          )}

          <Card className="p-5 md:col-span-2">
            <h3 className="font-semibold mb-3">📈 График прогрессии XP</h3>
            <FormulaProgressionChart formula={formula} />
          </Card>
        </div>
      )}

      {activeTab === 'rewards' && (
        <Card className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold flex items-center gap-1.5">
              🎁 Награды за уровни
              <Hint text="Автоматическая выдача бонусов при достижении уровня. Поддерживаются: роли, валюта, значки" />
            </h3>
            <button onClick={addReward} className="px-3 py-1.5 rounded-xl text-sm font-medium bg-cyan-400 text-black hover:bg-cyan-300 transition-colors">
              + Добавить
            </button>
          </div>
          {rewards.length > 0 ? (
            <div className="space-y-3">
              {rewards.map((reward, i) => {
                const isLolka = effectivePlatform === 'lolka';
                return (
                  <div key={i} className="bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded-xl">
                    <div className={`grid grid-cols-1 sm:grid-cols-[80px_1fr_1fr_auto_auto] gap-2 items-center p-3 ${isLolka ? 'sm:!grid-cols-[80px_1fr_auto_auto]' : ''}`}>
                      <input type="number" value={reward.level} onChange={e => updateReward(i, 'level', parseInt(e.target.value) || 1)} className="input text-center" title="Уровень" />
                      {!isLolka && (
                        <input type="text" value={reward.role} onChange={e => updateReward(i, 'role', e.target.value)} placeholder="Роль/название" className="input" />
                      )}
                      <input type="text" value={reward.message ?? ''} onChange={e => updateReward(i, 'message', e.target.value)} placeholder="Сообщение (необязательно)" className="input" />
                      <input type="color" value={reward.color} onChange={e => updateReward(i, 'color', e.target.value)} className="w-9 h-9 rounded-lg cursor-pointer" title="Цвет" />
                      <button onClick={() => removeReward(i)} className="px-2 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title="Удалить">🗑️</button>
                    </div>
                    {isLolka && (
                      // Автоподтягивание ролей подключенного Lolka-сервера (аналог модерации ролей в lolka.app):
                      // выдача/снятие нескольких ролей на уровне, вместо одной текстовой "Роль/название" (VK).
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-3 pb-3">
                        <RoleMultiSelect
                          label="Добавить роли"
                          roles={serverRoles}
                          selected={reward.add_roles ?? []}
                          onChange={next => updateReward(i, 'add_roles' as keyof RankingReward, next)}
                          loading={rolesLoading}
                          error={rolesData?.error}
                        />
                        <RoleMultiSelect
                          label="Снять роли"
                          roles={serverRoles}
                          selected={reward.remove_roles ?? []}
                          onChange={next => updateReward(i, 'remove_roles' as keyof RankingReward, next)}
                          loading={rolesLoading}
                          error={rolesData?.error}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-[rgb(var(--text-secondary))] py-8">📭 Наград пока нет. Добавьте первую, чтобы мотивировать участников развиваться!</p>
          )}
        </Card>
      )}

      {activeTab === 'rewards' && (
        <Card className="p-5 space-y-4">
          <div>
            <h3 className="font-semibold flex items-center gap-1.5">
              🏆 Достижения {achievements.length > 0 && <span className="text-[rgb(var(--text-secondary))] font-normal">({achievements.length})</span>}
              <Hint text="Отдельная от наград за уровень система: выдаются автоматически по достижении уровня (если указан) или вручную кнопкой «Выдать достижения» в редакторе шаблонов. Не связаны с Nova Points и валютой." />
            </h3>
            <p className="text-xs text-[rgb(var(--text-secondary))] mt-1">
              Если уровень-триггер не указан, достижение выдаётся только вручную.
            </p>
          </div>

          {achievementsLoading ? (
            <p className="text-center py-8 text-[rgb(var(--text-secondary))]">⏳ Загрузка...</p>
          ) : achievements.length > 0 ? (
            <div className="space-y-2">
              {achievements.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-[rgb(var(--surface-2))]">
                  <div className="min-w-0 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-[rgb(var(--surface-3))] flex items-center justify-center text-lg shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-xs text-[rgb(var(--text-secondary))]">
                        {item.trigger_level != null ? `Автовыдача на уровне ${item.trigger_level}` : 'Только ручная выдача'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteAchievement(item.id)}
                    disabled={deleteAchievementMutation.isPending}
                    className="px-2 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                    title="Удалить достижение"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[rgb(var(--text-secondary))] py-6 text-sm">Достижений пока нет — добавьте первое ниже</p>
          )}

          <div className="pt-3 border-t border-[rgb(var(--border))] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-[88px_1fr_160px] gap-3">
              <div>
                <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">Иконка</label>
                <input
                  type="text"
                  value={newAchvIcon}
                  onChange={e => setNewAchvIcon(e.target.value)}
                  placeholder="🏆"
                  maxLength={8}
                  className="input w-full text-center text-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">Название</label>
                <input
                  type="text"
                  value={newAchvName}
                  onChange={e => setNewAchvName(e.target.value)}
                  placeholder="Название достижения"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">Уровень (необязательно)</label>
                <input
                  type="number"
                  min={1}
                  value={newAchvTriggerLevel}
                  onChange={e => setNewAchvTriggerLevel(e.target.value)}
                  placeholder="Только вручную"
                  className="input w-full"
                />
              </div>
            </div>
            <button
              onClick={handleAddAchievement}
              disabled={createAchievementMutation.isPending}
              className="px-3 py-1.5 rounded-xl text-sm font-medium bg-cyan-400 text-black hover:bg-cyan-300 transition-colors disabled:opacity-50"
            >
              {createAchievementMutation.isPending ? 'Добавление...' : '+ Добавить достижение'}
            </button>
            {achvFormError && <p className="text-xs text-red-400">{achvFormError}</p>}
          </div>
        </Card>
      )}

      {activeTab === 'leaderboard' && (
        <div className="space-y-3">
          <p className="text-sm text-[rgb(var(--text-secondary))] -mt-1">Публичный рейтинг самых активных участников вашего сообщества</p>
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
                      const required = calcLevelXp(entry.level, formula.formula_type, formula.base_xp, formula.multiplier);
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

      {activeTab === 'nova-points' && (
        <div className="space-y-6">
          <p className="text-sm text-[rgb(var(--text-secondary))] -mt-1">
            Отдельная система репутации. Nova Points позволяют участникам отмечать ценный вклад друг друга независимо от уровня и XP.
          </p>

          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-1.5">
                  🌟 Включить Nova Points
                  <Hint text="Выдача Nova Points невозможна, если система выключена" />
                </h3>
              </div>
              <Switch checked={formData.np_enabled ?? settings?.np_enabled ?? false} onCheckedChange={val => updateField('np_enabled', val)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
                  Название валюты
                  <Hint text="Своё название вместо «Nova Points» — отображается участникам в /daily, /shop, уведомлениях о начислении и на этой странице" />
                </label>
                <input
                  type="text"
                  maxLength={64}
                  placeholder="Nova Points"
                  value={formData.np_name ?? settings?.np_name ?? ''}
                  onChange={e => updateField('np_name', e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">Emoji для выдачи</label>
                <input
                  type="text"
                  maxLength={8}
                  value={formData.np_emoji ?? settings?.np_emoji ?? '🌟'}
                  onChange={e => updateField('np_emoji', e.target.value)}
                  className="input w-full text-center text-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
                  Кулдаун между парой участников: {formData.np_cooldown_minutes ?? settings?.np_cooldown_minutes ?? 10} мин
                </label>
                <input
                  type="range"
                  min={5}
                  max={60}
                  value={formData.np_cooldown_minutes ?? settings?.np_cooldown_minutes ?? 10}
                  onChange={e => updateField('np_cooldown_minutes', parseInt(e.target.value) || 10)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">Суточный лимит получения</label>
                <input
                  type="number"
                  min={1}
                  value={formData.np_daily_limit ?? settings?.np_daily_limit ?? 50}
                  onChange={e => updateField('np_daily_limit', parseInt(e.target.value) || 50)}
                  className="input w-full"
                />
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-1.5">
                  ✍️ Пассивный фарм за сообщения
                  <Hint text="Участники получают случайное количество очков за каждое сообщение (не чаще раза в минуту на человека). Начисление идёт пачками раз в несколько минут, а не мгновенно." />
                </h3>
              </div>
              <Switch checked={formData.np_farm_enabled ?? settings?.np_farm_enabled ?? false} onCheckedChange={val => updateField('np_farm_enabled', val)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">Минимум за сообщение</label>
                <input
                  type="number"
                  min={0}
                  value={formData.np_farm_min ?? settings?.np_farm_min ?? 1}
                  onChange={e => updateField('np_farm_min', parseInt(e.target.value) || 0)}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">Максимум за сообщение</label>
                <input
                  type="number"
                  min={0}
                  value={formData.np_farm_max ?? settings?.np_farm_max ?? 5}
                  onChange={e => updateField('np_farm_max', parseInt(e.target.value) || 0)}
                  className="input w-full"
                />
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-1.5">
                  🎁 Ежедневный бонус
                  <Hint text="Команда /daily на VK и !daily на Lolka (Lolka перехватывает ввод «/» своей панелью команд) — случайное количество очков раз в 24 часа на участника, с шансом джекпота." />
                </h3>
              </div>
              <Switch checked={formData.np_daily_enabled ?? settings?.np_daily_enabled ?? false} onCheckedChange={val => updateField('np_daily_enabled', val)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">Минимум</label>
                <input
                  type="number"
                  min={0}
                  value={formData.np_daily_min ?? settings?.np_daily_min ?? 5}
                  onChange={e => updateField('np_daily_min', parseInt(e.target.value) || 0)}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">Максимум</label>
                <input
                  type="number"
                  min={0}
                  value={formData.np_daily_max ?? settings?.np_daily_max ?? 20}
                  onChange={e => updateField('np_daily_max', parseInt(e.target.value) || 0)}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">
                  Шанс джекпота: {formData.np_daily_jackpot_chance ?? settings?.np_daily_jackpot_chance ?? 5}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={formData.np_daily_jackpot_chance ?? settings?.np_daily_jackpot_chance ?? 5}
                  onChange={e => updateField('np_daily_jackpot_chance', parseInt(e.target.value) || 0)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">Сумма джекпота</label>
                <input
                  type="number"
                  min={0}
                  value={formData.np_daily_jackpot_amount ?? settings?.np_daily_jackpot_amount ?? 50}
                  onChange={e => updateField('np_daily_jackpot_amount', parseInt(e.target.value) || 0)}
                  className="input w-full"
                />
              </div>
            </div>
          </Card>

          {effectivePlatform === 'lolka' && (
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold flex items-center gap-1.5">
                    🎙️ Голосовой фарм
                    <Hint text="Начисляется участникам голосового канала, пока в нём одновременно ≥2 активных человека (защита от фарма в одиночку). Доступно только на Lolka — у VK-сообществ нет голосовых каналов." />
                  </h3>
                </div>
                <Switch checked={formData.np_voice_enabled ?? settings?.np_voice_enabled ?? false} onCheckedChange={val => updateField('np_voice_enabled', val)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">Очков в час</label>
                <input
                  type="number"
                  min={0}
                  value={formData.np_voice_per_hour ?? settings?.np_voice_per_hour ?? 10}
                  onChange={e => updateField('np_voice_per_hour', parseInt(e.target.value) || 0)}
                  className="input w-full sm:w-48"
                />
              </div>
            </Card>
          )}

          <div className="flex gap-2">
            {(['all', 'month', 'week'] as const).map(p => (
              <button
                key={p}
                onClick={() => setNpPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${npPeriod === p ? 'bg-cyan-400 text-black' : 'bg-[rgb(var(--surface-2))] text-[rgb(var(--text-secondary))]'}`}
              >
                {p === 'all' ? 'За всё время' : p === 'month' ? 'За месяц' : 'За неделю'}
              </button>
            ))}
          </div>

          <Card>
            {npTopLoading ? (
              <p className="text-center py-12 text-[rgb(var(--text-secondary))]">⏳ Загрузка...</p>
            ) : npEntries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[rgb(var(--surface-2))]">
                    <tr>
                      {['#', 'Участник', formData.np_name ?? settings?.np_name ?? 'Nova Points'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[rgb(var(--text-secondary))] uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgb(var(--border))]">
                    {npEntries.map(entry => (
                      <tr key={entry.user_id} className="hover:bg-[rgb(var(--surface-2))] transition-colors">
                        <td className="px-4 py-3 font-bold">{MEDALS[entry.rank] || `#${entry.rank}`}</td>
                        <td className="px-4 py-3 font-medium">{entry.user_id}</td>
                        <td className="px-4 py-3 text-[rgb(var(--text-secondary))]">{formData.np_emoji ?? settings?.np_emoji ?? '🌟'} {entry.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-[rgb(var(--text-secondary))] py-12">🌟 Пока никто не получил {formData.np_name ?? settings?.np_name ?? 'Nova Points'}</p>
            )}
          </Card>

          <Card className="p-5 space-y-4">
            <div>
              <h3 className="font-semibold flex items-center gap-1.5">
                🛒 Магазин ролей
                <Hint text="Участники покупают роль за очки командой /shop на VK и !shop на Lolka. Роль всегда выдаётся в Lolka (у API VK-сообщества нет назначения ролей участникам). Если покупка сделана в VK, участник должен предварительно связать аккаунты командой /link (VK) / !link (Lolka) — иначе бот не будет знать, кому в Lolka выдавать роль." />
              </h3>
              <p className="text-xs text-[rgb(var(--text-secondary))] mt-1">
                {effectivePlatform === 'vk'
                  ? 'Списывается баланс VK, роль выдаётся в связанном аккаунте Lolka (команда /link на VK, !link на Lolka).'
                  : 'Роль выдаётся автоматически участнику сразу после покупки.'}
              </p>
            </div>

            {shopLoading ? (
              <p className="text-center py-8 text-[rgb(var(--text-secondary))]">⏳ Загрузка...</p>
            ) : shopItems.length > 0 ? (
              <div className="space-y-2">
                {shopItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-[rgb(var(--surface-2))]">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{item.role_name || item.role_id}</p>
                      <p className="text-xs text-[rgb(var(--text-secondary))]">
                        {item.price} {formData.np_name ?? settings?.np_name ?? 'Nova Points'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteShopItem(item.id)}
                      disabled={deleteShopItemMutation.isPending}
                      className="px-2 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                      title="Удалить товар"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-[rgb(var(--text-secondary))] py-6 text-sm">Магазин пуст — добавьте первый товар ниже</p>
            )}

            <div className="pt-3 border-t border-[rgb(var(--border))] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={newShopRoleId}
                  onChange={e => {
                    const role = shopRoles.find(r => r.id === e.target.value);
                    setNewShopRoleId(e.target.value);
                    setNewShopRoleName(role?.name ?? '');
                  }}
                  className="input sm:col-span-1"
                >
                  <option value="">{shopRolesLoading ? 'Загрузка ролей Lolka...' : 'Выберите роль (Lolka)'}</option>
                  {shopRoles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  placeholder={`Цена в ${formData.np_name ?? settings?.np_name ?? 'Nova Points'}`}
                  value={newShopPrice}
                  onChange={e => setNewShopPrice(e.target.value)}
                  className="input"
                />
                <button
                  onClick={handleAddShopItem}
                  disabled={createShopItemMutation.isPending}
                  className="px-3 py-1.5 rounded-xl text-sm font-medium bg-cyan-400 text-black hover:bg-cyan-300 transition-colors disabled:opacity-50"
                >
                  {createShopItemMutation.isPending ? 'Добавление...' : '+ Добавить товар'}
                </button>
              </div>
              {shopFormError && <p className="text-xs text-red-400">{shopFormError}</p>}
              {!lolkaServer && (
                <p className="text-xs text-amber-400">⚠️ Lolka-сервер не подключён — выдача ролей из магазина недоступна, пока он не добавлен на странице «Серверы».</p>
              )}
            </div>

            <div className="pt-3 border-t border-[rgb(var(--border))]">
              <button
                onClick={() => setShopTemplateOpen(true)}
                className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                ✏️ Настроить сообщение о покупке
              </button>
            </div>
          </Card>

          {shopTemplateOpen && effectivePlatform !== 'max' && (
            <ShopPurchaseTemplateModal
              open={shopTemplateOpen}
              onOpenChange={setShopTemplateOpen}
              serverId={effectiveServerId}
              platform={effectivePlatform}
              initialText={formData.shop_purchase_template ?? settings?.shop_purchase_template ?? ''}
              currencyName={formData.np_name ?? settings?.np_name ?? 'Nova Points'}
              onSave={(text) => updateField('shop_purchase_template', text)}
            />
          )}
        </div>
      )}

      {activeTab === 'welcome' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold flex items-center gap-1.5">
                💳 Визитка — приветственное сообщение
                <Hint text="Отправляется участнику при вступлении в сервер/сообщество/чат. Текст, панель (embed) и кнопки — как у шаблона повышения уровня, но переменные ограничены {user}/{guild}" />
              </h3>
              <Switch checked={formData.welcome_enabled ?? settings?.welcome_enabled ?? false} onCheckedChange={val => updateField('welcome_enabled', val)} />
            </div>
            {effectivePlatform === 'max' ? (
              <p className="text-xs text-[rgb(var(--text-secondary))]">
                На MAX у бота один чат (сам подключённый сервер) — отдельный канал не выбирается, сообщение уходит туда же, куда добавили участника.
              </p>
            ) : (
              <div>
                <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Канал приветствия</label>
                <div className="flex gap-2">
                  {resolvedWelcomeChannel && !manualWelcomeChannelEdit ? (
                    <div className="input w-full flex items-center gap-2 text-sm">
                      <span>{resolvedWelcomeChannel.type === 'voice' ? '🔊' : '💬'}</span>
                      <span className="truncate">{resolvedWelcomeChannel.name}</span>
                      <button type="button" onClick={() => setManualWelcomeChannelEdit(true)} className="ml-auto text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))]" title="Ввести ID вручную">✏️</button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={currentWelcomeChannel}
                      onChange={e => updateField('welcome_channel', e.target.value)}
                      placeholder="ID канала"
                      className="input w-full"
                      list="welcome-channels-list"
                    />
                  )}
                </div>
                {channelsData?.channels && channelsData.channels.length > 0 && (
                  <datalist id="welcome-channels-list">
                    {channelsData.channels.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                  </datalist>
                )}
                <p className="text-[10px] text-[rgb(var(--text-secondary))] mt-1">
                  Список каналов подтягивается автоматически (см. «⚙️ Общие» → 🔍 Автоопределение) — начните вводить ID или выберите канал из подсказки.
                </p>
              </div>
            )}
          </Card>
          <Card className="p-5 flex items-center justify-center text-center">
            <p className="text-xs text-[rgb(var(--text-secondary))]">
              Заполните текст/панель/кнопки ниже — превью появится справа в редакторе.
            </p>
          </Card>
        </div>
      )}

      {activeTab === 'welcome' && (
        <MessageTemplateModal
          key={`welcome-${effectivePlatform}-${effectiveServerId}`}
          open={true}
          hideCancel
          onOpenChange={() => {}}
          value={formData.welcome_template ?? settings?.welcome_template ?? EMPTY_WELCOME_TEMPLATE}
          serverId={effectiveServerId}
          platform={effectivePlatform}
          actions={WELCOME_BUTTON_ACTIONS}
          variableGroups={WELCOME_VARIABLES}
          onSave={tpl => updateField('welcome_template', tpl)}
        />
      )}


    </div>
    </TooltipProvider>
  );
}