export type Platform = "vk" | "lolka";

export interface XPFormulaConfig {
  formula_type: "linear" | "exponential" | "logarithmic" | "custom";
  base_xp: number;
  multiplier: number;
  decay_factor?: number;
  max_xp_per_message?: number;
  custom_expression?: string;
}

export interface RankingReward {
  level: number;
  role: string;
  color: string;
  message?: string;
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