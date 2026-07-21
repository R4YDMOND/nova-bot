'use client';

/**
 * Карточка уровня участника — единственное место в проекте, где описана её
 * разметка/стили. Используется как Live Preview в /dashboard/ranking и может
 * быть переиспользована где угодно ещё (модалка, публичная страница и т.д.)
 * без повторного ввода параметров или тестовых данных.
 */

export interface RankCardAppearance {
  bg: string;
  accent: string;
  gradient: string;
  style: string;
  radius: number;
  glass: number;
  bgImageUrl: string;
  bgImageEnabled: boolean;
  bgShade: number;
  bgFit: string;      // 'cover' | 'contain' | 'stretch'
  bgPosition: string; // 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export interface RankCardData {
  rank: number;
  level: number;
  username: string;
  avatar_url?: string | null;
  current_xp: number;
  xp_for_next_level: number;
}

/** Тестовые данные — единственное место, где они заданы. */
export const RANK_CARD_TEST_DATA: RankCardData = {
  rank: 1,
  level: 42,
  username: 'Пользователь',
  current_xp: 15420,
  xp_for_next_level: 20000,
};

/** Реальные пропорции карточки — совпадают с рекомендуемым размером
 * пользовательского фона, чтобы Live Preview соответствовал тому,
 * что увидят участники. */
export const RANK_CARD_ASPECT_RATIO = '2 / 1';
export const RANK_CARD_RECOMMENDED_SIZE = '800×400px';

export function RankCardPreview({ appearance, data, className }: { appearance: RankCardAppearance; data?: RankCardData; className?: string }) {
  const d = data ?? RANK_CARD_TEST_DATA;
  const { bg, accent, gradient, style, radius, glass, bgImageUrl, bgImageEnabled, bgShade, bgFit, bgPosition } = appearance;

  const shadeTop = Math.round((bgShade / 100) * 255).toString(16).padStart(2, '0');
  const shadeBottom = Math.round((bgShade / 100) * 0.5 * 255).toString(16).padStart(2, '0');
  const progress = Math.min(100, Math.round((d.current_xp / d.xp_for_next_level) * 100));

  // 'stretch' — не валидное CSS-значение background-size, растягиваем по обеим осям на 100%
  const cssBackgroundSize = bgFit === 'stretch' ? '100% 100%' : (bgFit || 'cover');
  const cssBackgroundPosition = (bgPosition || 'center').replace('-', ' ');

  return (
    <div
      className={`w-full p-5 flex flex-col justify-center ${className ?? ''}`}
      style={{
        aspectRatio: RANK_CARD_ASPECT_RATIO,
        borderRadius: `${radius}px`,
        background: style === 'glass' ? `${bg}${Math.round((glass / 100) * 255).toString(16).padStart(2, '0')}` : bg,
        backdropFilter: style === 'glass' ? `blur(${Math.round((glass / 100) * 24)}px)` : undefined,
        border: style === 'flat' ? `1px solid ${accent}40` : `2px solid ${accent}`,
        boxShadow: style === 'neon' ? `0 0 24px ${accent}80, 0 0 8px ${accent}` : style === 'flat' ? 'none' : `0 0 20px ${accent}30`,
        backgroundImage: bgImageEnabled && bgImageUrl
          ? `linear-gradient(0deg, ${bg}${shadeTop}, ${bg}${shadeBottom}), url(${bgImageUrl})`
          : style === 'gradient' ? `linear-gradient(135deg, ${bg}, ${gradient}80)` : undefined,
        backgroundSize: bgImageEnabled && bgImageUrl ? cssBackgroundSize : undefined,
        backgroundPosition: bgImageEnabled && bgImageUrl ? cssBackgroundPosition : undefined,
      }}
    >
      <div className="mb-3 flex justify-between">
        <span className="text-xs font-bold text-black px-2 py-0.5 rounded-lg" style={{ background: accent }}>
          🪪 #{d.rank}
        </span>
        <span className="text-white/50 text-xs">Ур. {d.level}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl overflow-hidden shrink-0 bg-[rgb(var(--surface-3))]" style={{ border: `2px solid ${accent}` }}>
          {d.avatar_url ? <img src={d.avatar_url} alt="" className="w-full h-full object-cover" /> : '👤'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-sm truncate">{d.username}</div>
          <div className="mt-1.5">
            <div className="flex justify-between text-xs text-white/40 mb-1">
              <span>XP</span>
              <span>{d.current_xp.toLocaleString('ru-RU')} / {d.xp_for_next_level.toLocaleString('ru-RU')}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${progress}%`, background: accent }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
