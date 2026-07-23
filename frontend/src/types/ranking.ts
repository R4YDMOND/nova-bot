export type Platform = "vk" | "lolka";

export interface XPFormulaConfig {
  formula_type: "linear" | "exponential" | "logarithmic" | "custom";
  base_xp: number;
  multiplier: number;
  decay_factor?: number;
  max_xp_per_message?: number;
  custom_expression?: string;
}

export interface RewardCardDesign {
  bg_color: string;
  accent_color: string;
  gradient_color: string;
  style: string;
  radius: number;
  glass_intensity: number;
  bg_image_enabled: boolean;
  bg_image_url: string;
  bg_fit: string;
  bg_position: string;
  bg_shade: number;
}

export interface RankingReward {
  level: number;
  role: string;
  color: string;
  message?: string;
  /** Роли, выдаваемые на этом уровне (только Lolka, ID ролей сервера) */
  add_roles?: string[];
  /** Роли, снимаемые на этом уровне (только Lolka, ID ролей сервера) */
  remove_roles?: string[];
  /** Индивидуальный дизайн карточки для этого уровня (переопределяет глобальный, ТЗ №5 Rev.6, п.3.3.2) */
  card_design?: RewardCardDesign;
}

export interface RankingSettings {
  enabled: boolean;
  xp_per_message: number;
  xp_per_voice_minute: number;
  min_message_length: number;
  cooldown_seconds: number;
  multiplier: number;
  xp_formula: XPFormulaConfig;
  rewards: RankingReward[];
  notify_channel: string;
  notify_message: string;
  /** Структурированный шаблон (текст + embed + компоненты), заполняется редактором шаблонов (ТЗ №5 Rev.6, п.3.2). Необязателен для обратной совместимости с простым notify_message. */
  notify_template?: MessageTemplate;
  ping_user: boolean;
  decay_enabled: boolean;
  decay_days: number;
  decay_percent: number;
  blacklist_channels: string[];
  boost_channels: string[];
  boost_roles: string[];
  card_bg_color: string;
  card_accent_color: string;
  card_gradient_color: string;
  card_style: string;
  card_radius: number;
  card_glass_intensity: number;
  card_bg_image_url: string;
  card_bg_image_enabled: boolean;
  card_bg_shade: number;
  card_bg_fit: string;
  card_bg_position: string;
  /** Nova Points (ТЗ №5 Rev.7, п.3.1) — независимая от XP система репутации. */
  np_enabled: boolean;
  np_emoji: string;
  np_cooldown_minutes: number;
  np_daily_limit: number;
}

export interface NovaPointEntry {
  user_id: string;
  total_points: number;
  monthly_points: number;
  weekly_points: number;
  last_received: string | null;
}

export interface NovaPointTopEntry {
  rank: number;
  user_id: string;
  points: number;
}

export interface EmbedField {
  name: string;
  value: string;
  inline: boolean;
}

export interface EmbedAuthor {
  name: string;
  url: string;
  icon_url: string;
}

export interface EmbedFooter {
  text: string;
  icon_url: string;
  timestamp: boolean;
}

export interface MessageEmbed {
  title: string;
  description: string;
  url: string;
  color: string;
  author: EmbedAuthor;
  image_url: string;
  thumbnail_url: string;
  footer: EmbedFooter;
  fields: EmbedField[];
}

export type ButtonStyle = 'primary' | 'secondary' | 'success' | 'danger' | 'link';

// Предустановленные действия кнопки (не-Link стили) — единственное, что реально
// обрабатывается ботом на VK/Lolka. Свободный custom_id убран умышленно: бот не
// выполняет произвольный код по нажатию, только эти три безопасных действия.
export type ButtonAction = 'nova_profile' | 'nova_leaderboard' | 'nova_close';

export const BUTTON_ACTIONS: { value: ButtonAction; label: string }[] = [
  { value: 'nova_profile', label: '👤 Профиль' },
  { value: 'nova_leaderboard', label: '🏆 Топ участников' },
  { value: 'nova_close', label: '✕ Закрыть сообщение' },
];

export interface MessageButton {
  id: string;
  label: string;
  style: ButtonStyle;
  emoji: string;
  url: string;
  custom_id: string; // для style !== 'link' — одно из значений ButtonAction (см. BUTTON_ACTIONS)
  row: number; // 0-4, максимум 5 кнопок в ряд (ТЗ п.3.2.2)
}

export interface SelectOption {
  label: string;
  value: string;
  description: string;
  emoji: string;
}

export interface MessageSelectMenu {
  id: string;
  placeholder: string;
  min_values: number;
  max_values: number;
  options: SelectOption[];
  row: number;
}

export interface MessageTemplate {
  content: string;
  embed_enabled: boolean;
  embed: MessageEmbed;
  buttons: MessageButton[];
  select_menus: MessageSelectMenu[];
}

export const EMPTY_MESSAGE_TEMPLATE: MessageTemplate = {
  content: '🎉 {user} достиг {level} уровня!',
  embed_enabled: false,
  embed: {
    title: '',
    description: '',
    url: '',
    color: '#00E5FF',
    author: { name: '', url: '', icon_url: '' },
    image_url: '',
    thumbnail_url: '',
    footer: { text: '', icon_url: '', timestamp: false },
    fields: [],
  },
  buttons: [],
  select_menus: [],
};
/** Сохранённый пользовательский шаблон (ТЗ №5 Rev.6, п.3.2.4) */
export interface SavedMessageTemplate {
  id: number;
  name: string;
  data: MessageTemplate;
  updated_at?: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  messages: number;
  voice_minutes: number;
  reactions: number;
  last_active: string | null;
}

export interface LeaderboardResponse {
  platform: Platform;
  total: number;
  entries: LeaderboardEntry[];
}