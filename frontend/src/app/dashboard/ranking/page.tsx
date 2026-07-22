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
  useSyncMembers,
} from '@/hooks/useRanking';
import type { RankingReward, RewardCardDesign, XPFormulaConfig } from '@/types/ranking';
import { RankCardPreview, RANK_CARD_RECOMMENDED_SIZE, RANK_CARD_IMAGE_CONSTRAINTS, RANK_CARD_TEST_DATA } from '@/components/ranking/RankCardPreview';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const HEX_COLOR_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

/** Значок "?" со всплывающей подсказкой (ТЗ №5 Rev.5, п.3.2.2).
 *  Триггер — кнопка (фокусируемая), поэтому подсказка открывается и по наведению,
 *  и по тапу/фокусу на мобильных устройствах. */
function Hint({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Подсказка"
          className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] leading-none text-[rgb(var(--text-secondary))] border border-[rgb(var(--border))] hover:border-cyan-400 hover:text-cyan-400 transition-colors shrink-0"
        >
          ?
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[260px] text-xs">{text}</TooltipContent>
    </Tooltip>
  );
}

/** Текстовое HEX-поле рядом с color-пикером: держит локальный черновик ввода,
 *  чтобы промежуточные (пока невалидные) символы не затирались контролируемым value,
 *  и прокидывает наверх только валидные HEX-коды. */
function HexColorField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  return (
    <input
      type="text"
      value={draft}
      onChange={e => {
        const v = e.target.value;
        setDraft(v);
        if (HEX_COLOR_RE.test(v)) onChange(v);
      }}
      placeholder={placeholder}
      maxLength={7}
      className="input flex-1 font-mono text-sm"
    />
  );
}

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

const CARD_BG_FIT_OPTIONS = [
  { value: 'cover', label: 'Заполнить (обрезать края)' },
  { value: 'contain', label: 'Вписать целиком' },
  { value: 'stretch', label: 'Растянуть' },
];

const CARD_BG_POSITION_OPTIONS = [
  { value: 'center', label: 'По центру' },
  { value: 'top', label: 'Сверху' },
  { value: 'bottom', label: 'Снизу' },
  { value: 'left', label: 'Слева' },
  { value: 'right', label: 'Справа' },
  { value: 'top-left', label: 'Сверху слева' },
  { value: 'top-right', label: 'Сверху справа' },
  { value: 'bottom-left', label: 'Снизу слева' },
  { value: 'bottom-right', label: 'Снизу справа' },
];

// Пресеты палитры для быстрого выбора акцентного цвета (референс: превью палитры)
const PALETTE_PRESETS: { name: string; bg: string; accent: string; gradient: string }[] = [
  { name: 'Неон циан', bg: '#111118', accent: '#00E5FF', gradient: '#7B2FBE' },
  { name: 'Пурпур', bg: '#15111f', accent: '#A855F7', gradient: '#EC4899' },
  { name: 'Розовый', bg: '#1a0f14', accent: '#F76FBE', gradient: '#FF3D81' },
  { name: 'Янтарь', bg: '#1a1408', accent: '#FFA500', gradient: '#F59E0B' },
  { name: 'Изумруд', bg: '#0a1810', accent: '#22C55E', gradient: '#10B981' },
  { name: 'Ледяной', bg: '#0d1420', accent: '#38BDF8', gradient: '#818CF8' },
  { name: 'Огонь', bg: '#1a0a08', accent: '#F87171', gradient: '#FB923C' },
  { name: 'Монохром', bg: '#111114', accent: '#94A3B8', gradient: '#64748B' },
  { name: 'Лайм', bg: '#0f1408', accent: '#A3E635', gradient: '#4ADE80' },
  { name: 'Индиго', bg: '#0e0f1f', accent: '#818CF8', gradient: '#6366F1' },
];

/** Панель индивидуальной кастомизации карточки для конкретной строки наград.
 *  Повторяет набор контролов вкладки "Карточка", но применяется только к этому уровню (ТЗ №5 Rev.6, п.3.3.2). */
function RewardDesignPanel({
  level,
  role,
  design,
  onToggle,
  onChange,
}: {
  level: number;
  role: string;
  design?: RewardCardDesign;
  onToggle: (enabled: boolean) => void;
  onChange: (field: keyof RewardCardDesign, value: any) => void;
}) {
  return (
    <div className="border-t border-[rgb(var(--border))] p-4 bg-[rgb(var(--surface-1))]">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-[rgb(var(--text-secondary))]">Собственный дизайн карточки для уровня {level}</span>
        <Switch checked={!!design} onCheckedChange={onToggle} />
      </div>
      {design && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Цвет фона</label>
              <div className="flex gap-2">
                <input type="color" value={design.bg_color} onChange={e => onChange('bg_color', e.target.value)} className="h-9 w-9 shrink-0 rounded-lg cursor-pointer" />
                <HexColorField value={design.bg_color} onChange={v => onChange('bg_color', v)} placeholder="#111118" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Акцентный цвет</label>
              <div className="flex gap-2">
                <input type="color" value={design.accent_color} onChange={e => onChange('accent_color', e.target.value)} className="h-9 w-9 shrink-0 rounded-lg cursor-pointer" />
                <HexColorField value={design.accent_color} onChange={v => onChange('accent_color', v)} placeholder="#00E5FF" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Градиент</label>
              <div className="flex gap-2">
                <input type="color" value={design.gradient_color} onChange={e => onChange('gradient_color', e.target.value)} className="h-9 w-9 shrink-0 rounded-lg cursor-pointer" />
                <HexColorField value={design.gradient_color} onChange={v => onChange('gradient_color', v)} placeholder="#7B2FBE" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Стиль</label>
                <select value={design.style} onChange={e => onChange('style', e.target.value)} className="input w-full">
                  {CARD_STYLES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex justify-between text-xs text-[rgb(var(--text-secondary))] mb-1">
                  <label>Радиус</label>
                  <span>{design.radius} px</span>
                </div>
                <input type="range" min={4} max={28} step={2} value={design.radius} onChange={e => onChange('radius', parseInt(e.target.value))} className="w-full accent-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-[rgb(var(--text-secondary))] mb-1">
                <label>Интенсивность стекла</label>
                <span>{design.glass_intensity}%</span>
              </div>
              <input type="range" min={0} max={100} step={5} value={design.glass_intensity} onChange={e => onChange('glass_intensity', parseInt(e.target.value))} className="w-full accent-cyan-400" disabled={design.style !== 'glass'} />
            </div>
            <div className="flex flex-wrap gap-2">
              {PALETTE_PRESETS.map(p => (
                <button
                  key={p.name}
                  onClick={() => { onChange('bg_color', p.bg); onChange('accent_color', p.accent); onChange('gradient_color', p.gradient); }}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110 shrink-0"
                  style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.gradient})` }}
                  title={p.name}
                />
              ))}
            </div>
            <div className="pt-3 border-t border-[rgb(var(--border))]">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-[rgb(var(--text-secondary))]">Пользовательский фон (по ссылке)</label>
                <Switch checked={design.bg_image_enabled} onCheckedChange={val => onChange('bg_image_enabled', val)} />
              </div>
              {design.bg_image_enabled && (
                <>
                  <input type="url" value={design.bg_image_url} onChange={e => onChange('bg_image_url', e.target.value.trim())} placeholder="https://example.com/image.png" className="input w-full" />
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Масштабирование</label>
                      <select value={design.bg_fit} onChange={e => onChange('bg_fit', e.target.value)} className="input w-full">
                        {CARD_BG_FIT_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Позиция</label>
                      <select value={design.bg_position} onChange={e => onChange('bg_position', e.target.value)} className="input w-full">
                        {CARD_BG_POSITION_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-[rgb(var(--text-secondary))] mb-1">
                      <label>Затенение фона</label>
                      <span>{design.bg_shade}%</span>
                    </div>
                    <input type="range" min={0} max={100} step={5} value={design.bg_shade} onChange={e => onChange('bg_shade', parseInt(e.target.value))} className="w-full accent-cyan-400" />
                  </div>
                </>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs text-[rgb(var(--text-secondary))] block mb-2">Превью</label>
            <RankCardPreview
              appearance={{
                bg: design.bg_color,
                accent: design.accent_color,
                gradient: design.gradient_color,
                style: design.style,
                radius: design.radius,
                glass: design.glass_intensity,
                bgImageUrl: design.bg_image_url,
                bgImageEnabled: design.bg_image_enabled,
                bgShade: design.bg_shade,
                bgFit: design.bg_fit,
                bgPosition: design.bg_position,
              }}
              data={{ ...RANK_CARD_TEST_DATA, level, username: role || RANK_CARD_TEST_DATA.username }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

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
  const { servers, selectedServer, loading: serverLoading } = useServer();
  const [activeTab, setActiveTab] = useState('settings');
  const [expandedRewardIndex, setExpandedRewardIndex] = useState<number | null>(null);
  const [viewPlatform, setViewPlatform] = useState<'vk' | 'lolka'>('vk');
  const [formData, setFormData] = useState<any>({});
  const [sort, setSort] = useState<'xp' | 'level' | 'messages'>('xp');
  const [formulaTest, setFormulaTest] = useState<{ valid: boolean; test_xp?: number; level_10_required_xp?: number; error?: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingExpanded, setOnboardingExpanded] = useState(false);

  const effectivePlatform = viewPlatform;

  // server_id должен соответствовать выбранной на этой странице платформе (VK/Lolka),
  // а не глобально выбранному серверу на /dashboard/servers — иначе на вкладке Lolka
  // улетал server_id VK-сообщества (и наоборот), что ломало автоопределение каналов
  // и тихо создавало настройки не под тем сервером.
  const vkServer = servers.find(s => s.platform === 'vk');
  const lolkaServer = servers.find(s => s.platform === 'lolka');
  const effectiveServerId = (effectivePlatform === 'vk' ? vkServer : lolkaServer)?.server_id ?? '';

  const { data: settings, isLoading: settingsLoading } = useRankingSettings(effectiveServerId, effectivePlatform);
  const saveMutation = useSaveRankingSettings();

  const [channelDropdownOpen, setChannelDropdownOpen] = useState(false);
  const { data: channelsData, isFetching: channelsLoading, refetch: refetchChannels } = useRankingChannels(effectiveServerId, effectivePlatform);
  const syncMembersMutation = useSyncMembers();
  const [syncResultMsg, setSyncResultMsg] = useState<string | null>(null);

  // Показываем название канала уведомлений вместо сырого ID, если он есть в списке.
  const currentNotifyChannel: string = formData.notify_channel ?? settings?.notify_channel ?? '';
  const resolvedNotifyChannel = channelsData?.channels?.find(ch => ch.id === currentNotifyChannel);
  const [manualChannelEdit, setManualChannelEdit] = useState(false);
  useEffect(() => { setManualChannelEdit(false); }, [effectiveServerId, effectivePlatform]);

  const handleDetectChannels = async () => {
    setChannelDropdownOpen(true);
    await refetchChannels();
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

  const { data: lbVk, isLoading: lbVkLoading } = useLeaderboard(vkServer?.server_id ?? '', 'vk', sort, viewPlatform !== 'lolka');
  const { data: lbLolka, isLoading: lbLolkaLoading } = useLeaderboard(lolkaServer?.server_id ?? '', 'lolka', sort, viewPlatform !== 'vk');

  const leaderboardEntries = useMemo(() => {
    const src = viewPlatform === 'lolka' ? lbLolka : lbVk;
    return (src?.entries || []).map(e => ({ ...e, _platform: viewPlatform }));
  }, [viewPlatform, lbVk, lbLolka]);

  const leaderboardLoading = viewPlatform === 'lolka' ? lbLolkaLoading : lbVkLoading;

  // Live Preview — реальные данные топ-1 участника лидерборда (см. Объяснение).
  const topEntry: any = leaderboardEntries[0];
  const { data: preview } = useRankingPreview(
    effectiveServerId,
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
  const updateRewardDesign = (i: number, field: keyof RewardCardDesign, value: any) =>
    updateRewards(rewards.map((r, idx) => (idx === i && r.card_design ? { ...r, card_design: { ...r.card_design, [field]: value } } : r)));
  const toggleRewardDesign = (i: number, enabled: boolean) =>
    updateRewards(rewards.map((r, idx) => (idx === i ? { ...r, card_design: enabled ? makeDefaultRewardDesign() : undefined } : r)));

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

  // Вынесено выше early-return блока: хуки (useState/useEffect) не могут вызываться
  // после условных return — иначе порядок хуков "плывёт" между рендерами и React
  // падает с ошибкой #310 (Rendered fewer hooks than expected).
  const cardBgImageUrl = formData.card_bg_image_url ?? settings?.card_bg_image_url ?? '';
  const cardBgImageEnabled = formData.card_bg_image_enabled ?? settings?.card_bg_image_enabled ?? false;

  const [bgImageStatus, setBgImageStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [bgImageDimensions, setBgImageDimensions] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    if (!cardBgImageEnabled || !cardBgImageUrl.trim()) { setBgImageStatus('idle'); setBgImageDimensions(null); return; }
    setBgImageStatus('loading');
    const timer = setTimeout(() => {
      const img = new window.Image();
      img.onload = () => {
        setBgImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setBgImageStatus('ok');
      };
      img.onerror = () => { setBgImageDimensions(null); setBgImageStatus('error'); };
      img.src = cardBgImageUrl.trim();
    }, 500);
    return () => clearTimeout(timer);
  }, [cardBgImageUrl, cardBgImageEnabled]);

  // Предупреждение по фактическим размерам изображения относительно допустимого диапазона
  // (ТЗ №5 Rev.6, п.4.3.3) — только для валидно загруженного изображения.
  const bgImageSizeWarning = useMemo(() => {
    if (bgImageStatus !== 'ok' || !bgImageDimensions) return null;
    const { width, height } = bgImageDimensions;
    const { minWidth, minHeight, maxWidth, maxHeight } = RANK_CARD_IMAGE_CONSTRAINTS;
    if (width < minWidth || height < minHeight) {
      return `⚠️ Изображение меньше минимального размера (${minWidth}×${minHeight}px) — качество может пострадать`;
    }
    if (width > maxWidth || height > maxHeight) {
      return `⚠️ Изображение больше максимального размера (${maxWidth}×${maxHeight}px) — будет автоматически уменьшено`;
    }
    return null;
  }, [bgImageStatus, bgImageDimensions]);

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

  // Сворачивание баннера (slide-up) + скролл к настройкам после «▶️ Начать настройку»
  // (ТЗ №5 Rev.6, п.4.1.2). Framer Motion в проекте не используется ни в одном файле —
  // анимация на CSS-transition, по аналогии с остальными transition-* в этом компоненте.
  const [bannerCollapsing, setBannerCollapsing] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const handleStartSetup = () => {
    setBannerCollapsing(true);
    setTimeout(() => {
      dismissOnboarding();
      setBannerCollapsing(false);
      tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
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
  const cardBgShade = formData.card_bg_shade ?? settings?.card_bg_shade ?? 80;
  const cardBgFit = formData.card_bg_fit ?? settings?.card_bg_fit ?? 'cover';
  const cardBgPosition = formData.card_bg_position ?? settings?.card_bg_position ?? 'center';

  /** Дизайн карточки конкретной награды при первом включении — стартует от текущего глобального дизайна (ТЗ №5 Rev.6, п.3.3.2) */
  const makeDefaultRewardDesign = (): RewardCardDesign => ({
    bg_color: cardBg,
    accent_color: cardAccent,
    gradient_color: cardGradient,
    style: cardStyle,
    radius: cardRadius,
    glass_intensity: cardGlass,
    bg_image_enabled: cardBgImageEnabled,
    bg_image_url: cardBgImageUrl,
    bg_fit: cardBgFit,
    bg_position: cardBgPosition,
    bg_shade: cardBgShade,
  });

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

      {showOnboarding && (
        <div
          className="grid transition-[grid-template-rows,opacity] duration-[400ms] ease-out"
          style={{ gridTemplateRows: bannerCollapsing ? '0fr' : '1fr', opacity: bannerCollapsing ? 0 : 1 }}
        >
          <div className="overflow-hidden">
            <div className="relative overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-5 sm:p-6">
              <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-purple-500/20 blur-3xl" />
              <button
                type="button"
                onClick={dismissOnboarding}
                aria-label="Закрыть приветствие"
                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-3))] transition-colors"
              >
                ✕
              </button>
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 pr-8 sm:pr-0">
                <div className="flex-1">
                  <h2 className="text-lg font-bold">🎮 Добро пожаловать в систему уровней!</h2>
                  <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">
                    Настройте начисление опыта и мотивируйте участников вашего сообщества быть активнее.
                  </p>
                  {onboardingExpanded && (
                    <p className="text-sm text-[rgb(var(--text-secondary))] mt-3 pt-3 border-t border-[rgb(var(--border))]">
                      Участники получают XP за сообщения и голосовую активность («⚙️ Настройки»), повышают уровень по формуле из «🧮 Формула XP»
                      и автоматически получают награды — роли, валюту или значки («🎁 Награды»). Прогресс всех участников виден в «🏆 Лидерборд»,
                      а внешний вид карточки профиля настраивается на вкладке «🪪 Карточка».
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleStartSetup}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-cyan-400 text-black hover:bg-cyan-300 transition-colors whitespace-nowrap"
                  >
                    ▶️ Начать настройку
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnboardingExpanded(v => !v)}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-[rgb(var(--surface-3))] hover:bg-[rgb(var(--surface-2))] transition-colors whitespace-nowrap"
                  >
                    ℹ️ {onboardingExpanded ? 'Свернуть' : 'Узнать больше'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={tabsRef} className="flex gap-1 mb-6 overflow-x-auto">
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
          ⚠️ {effectivePlatform === 'vk' ? 'VK' : 'Lolka'}-сервер не подключён. Добавьте его на странице{' '}
          <a href="/dashboard/servers" className="underline">/dashboard/servers</a>, чтобы настроить систему уровней для этой платформы.
        </p>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5">
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
              <div>
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
              </div>
              <div>
                <label className="text-xs text-[rgb(var(--text-secondary))] mb-1 flex items-center gap-1.5">
                  Шаблон сообщения
                  <Hint text="Доступные переменные: {user} — упоминание, {level} — новый уровень, {level_word} — склонение слова «уровень», {guild} — название сервера, {xp} — текущий опыт, {next_level_xp} — опыт для следующего уровня, {rank} — место в рейтинге." />
                </label>
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
            <h3 className="font-semibold mb-1">🧮 Формула опыта</h3>
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
                const design = reward.card_design;
                const isExpanded = expandedRewardIndex === i;
                return (
                  <div key={i} className="bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded-xl overflow-hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-[80px_1fr_1fr_auto_auto_auto] gap-2 items-center p-3">
                      <input type="number" value={reward.level} onChange={e => updateReward(i, 'level', parseInt(e.target.value) || 1)} className="input text-center" title="Уровень" />
                      <input type="text" value={reward.role} onChange={e => updateReward(i, 'role', e.target.value)} placeholder="Роль/название" className="input" />
                      <input type="text" value={reward.message ?? ''} onChange={e => updateReward(i, 'message', e.target.value)} placeholder="Сообщение (необязательно)" className="input" />
                      <input type="color" value={reward.color} onChange={e => updateReward(i, 'color', e.target.value)} className="w-9 h-9 rounded-lg cursor-pointer" title="Цвет" />
                      <button
                        onClick={() => setExpandedRewardIndex(isExpanded ? null : i)}
                        className={`px-2 py-1.5 rounded-lg transition-colors ${design ? 'text-cyan-400 bg-cyan-400/10' : 'text-[rgb(var(--text-secondary))] hover:bg-white/5'}`}
                        title="Дизайн карточки для этого уровня"
                      >
                        🎨
                      </button>
                      <button onClick={() => removeReward(i)} className="px-2 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title="Удалить">🗑️</button>
                    </div>
                    {isExpanded && (
                      <RewardDesignPanel
                        level={reward.level}
                        role={reward.role}
                        design={design}
                        onToggle={enabled => toggleRewardDesign(i, enabled)}
                        onChange={(field, value) => updateRewardDesign(i, field, value)}
                      />
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
              <div className="flex gap-2">
                <input type="color" value={cardBg} onChange={e => updateField('card_bg_color', e.target.value)} className="h-10 w-10 shrink-0 rounded-lg cursor-pointer" />
                <HexColorField value={cardBg} onChange={v => updateField('card_bg_color', v)} placeholder="#111118" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Акцентный цвет</label>
              <div className="flex gap-2">
                <input type="color" value={cardAccent} onChange={e => updateField('card_accent_color', e.target.value)} className="h-10 w-10 shrink-0 rounded-lg cursor-pointer" />
                <HexColorField value={cardAccent} onChange={v => updateField('card_accent_color', v)} placeholder="#00E5FF" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Градиент</label>
              <div className="flex gap-2">
                <input type="color" value={cardGradient} onChange={e => updateField('card_gradient_color', e.target.value)} className="h-10 w-10 shrink-0 rounded-lg cursor-pointer" />
                <HexColorField value={cardGradient} onChange={v => updateField('card_gradient_color', v)} placeholder="#7B2FBE" />
              </div>
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
              <div className="flex flex-wrap gap-2">
                {PALETTE_PRESETS.map(p => {
                  const isActive = cardBg.toLowerCase() === p.bg.toLowerCase()
                    && cardAccent.toLowerCase() === p.accent.toLowerCase()
                    && cardGradient.toLowerCase() === p.gradient.toLowerCase();
                  return (
                    <button
                      key={p.name}
                      onClick={() => {
                        updateField('card_bg_color', p.bg);
                        updateField('card_accent_color', p.accent);
                        updateField('card_gradient_color', p.gradient);
                      }}
                      className={`w-8 h-8 rounded-full transition-transform hover:scale-110 shrink-0 ${isActive ? 'ring-2 ring-offset-2 ring-offset-[rgb(var(--surface-1))] ring-white' : ''}`}
                      style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.gradient})` }}
                      title={p.name}
                    />
                  );
                })}
              </div>
            </div>
            <div className="pt-3 border-t border-[rgb(var(--border))]">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-[rgb(var(--text-secondary))]">Пользовательский фон (по ссылке)</label>
                <Switch checked={cardBgImageEnabled} onCheckedChange={val => updateField('card_bg_image_enabled', val)} />
              </div>
              {cardBgImageEnabled && (
                <>
                  <input
                    type="url"
                    value={cardBgImageUrl}
                    onChange={e => updateField('card_bg_image_url', e.target.value.trim())}
                    placeholder="https://example.com/image.png"
                    className="input w-full"
                  />
                  {bgImageStatus === 'loading' && (
                    <p className="text-[10px] text-[rgb(var(--text-secondary))] mt-1">⏳ Проверяем ссылку…</p>
                  )}
                  {bgImageStatus === 'ok' && (
                    <>
                      <p className="text-[10px] text-emerald-400 mt-1">
                        ✅ Изображение загружается корректно{bgImageDimensions ? ` — ${bgImageDimensions.width}×${bgImageDimensions.height}px` : ''}
                      </p>
                      {bgImageSizeWarning && (
                        <p className="text-[10px] text-amber-400 mt-1">{bgImageSizeWarning}</p>
                      )}
                    </>
                  )}
                  {bgImageStatus === 'error' && (
                    <p className="text-[10px] text-red-400 mt-1">❌ Не удалось загрузить изображение по этой ссылке — проверьте, что она ведёт напрямую на файл и хостинг разрешает встраивание</p>
                  )}
                  <p className="text-[10px] text-[rgb(var(--text-secondary))] mt-1">Загрузите своё изображение: рекомендуемый размер {RANK_CARD_RECOMMENDED_SIZE}</p>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Масштабирование</label>
                      <select value={cardBgFit} onChange={e => updateField('card_bg_fit', e.target.value)} className="input w-full">
                        {CARD_BG_FIT_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Позиция</label>
                      <select value={cardBgPosition} onChange={e => updateField('card_bg_position', e.target.value)} className="input w-full">
                        {CARD_BG_POSITION_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-[rgb(var(--text-secondary))] mt-1">
                    Если изображение обрезается или растягивается — выберите подходящий режим масштабирования ниже.
                  </p>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-[rgb(var(--text-secondary))] mb-1">
                      <label>Затенение фона</label>
                      <span>{cardBgShade}%</span>
                    </div>
                    <input type="range" min={0} max={100} step={5} value={cardBgShade} onChange={e => updateField('card_bg_shade', parseInt(e.target.value))} className="w-full accent-cyan-400" />
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-3">👁️ Live Preview {topEntry ? '' : '(тестовые данные)'}</h3>
            <RankCardPreview
              appearance={{
                bg: cardBg,
                accent: cardAccent,
                gradient: cardGradient,
                style: cardStyle,
                radius: cardRadius,
                glass: cardGlass,
                bgImageUrl: cardBgImageUrl,
                bgImageEnabled: cardBgImageEnabled,
                bgShade: cardBgShade,
                bgFit: cardBgFit,
                bgPosition: cardBgPosition,
              }}
              data={preview ? {
                rank: preview.ranking.rank,
                level: preview.ranking.level,
                username: preview.user.username,
                avatar_url: preview.user.avatar_url,
                current_xp: preview.ranking.current_xp,
                xp_for_next_level: preview.ranking.xp_for_next_level,
              } : undefined}
            />
            <p className="text-[10px] text-[rgb(var(--text-secondary))] text-center mt-2">Реальный размер карточки: {RANK_CARD_RECOMMENDED_SIZE}</p>
            <div className="mt-3 pt-3 border-t border-[rgb(var(--border))] text-[10px] text-[rgb(var(--text-secondary))] space-y-0.5">
              <p className="font-semibold text-[rgb(var(--text))] mb-1">Технические требования к изображению:</p>
              <p>• Минимальный размер: {RANK_CARD_IMAGE_CONSTRAINTS.minWidth}×{RANK_CARD_IMAGE_CONSTRAINTS.minHeight}px</p>
              <p>• Максимальный размер: {RANK_CARD_IMAGE_CONSTRAINTS.maxWidth}×{RANK_CARD_IMAGE_CONSTRAINTS.maxHeight}px</p>
              <p>• Рекомендуемый размер: {RANK_CARD_IMAGE_CONSTRAINTS.recommendedWidth}×{RANK_CARD_IMAGE_CONSTRAINTS.recommendedHeight}px</p>
              <p>• Соотношение сторон: {RANK_CARD_IMAGE_CONSTRAINTS.aspectRatio}:1</p>
              <p>• Форматы: {RANK_CARD_IMAGE_CONSTRAINTS.allowedFormats.join(', ')}</p>
              <p>• Макс. размер файла: {RANK_CARD_IMAGE_CONSTRAINTS.maxFileSizeMb} MB</p>
            </div>
          </Card>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}