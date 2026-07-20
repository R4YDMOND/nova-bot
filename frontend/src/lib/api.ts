const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nova-bot-rpsy.onrender.com";

import { getAccessToken } from '@/lib/auth';

export type NotificationSettings = {
  email: { enabled: boolean; address: string };
  vk: { enabled: boolean; webhook_url: string };
  max: { enabled: boolean; webhook_url: string };
};

export type DashboardServer = {
  id: number;
  name: string;
  server_id: string;
  platform: "vk" | "lolka";
  icon_url: string;
  member_count: number;
  is_active?: boolean;
};

export type DashboardWebhook = {
  id: number;
  server_id: string;
  platform: "vk" | "lolka";
  project: string;
  url: string;
  event: string;
  active: boolean;
};

export type AuthUser = { id: number; email?: string; name?: string; avatar?: string };

// ── Типы модерации (ТЗ №4) ─────────────────────────────────────────────
export type ModerationEventItem = {
  type: string;
  title: string;
  description: string;
  created_at: string;
};

export type ModerationTimelinePoint = {
  date: string;
  count: number;
};

export type ModerationStatsResponse = {
  stats: {
    blocked: number;
    warnings: number;
    captcha_solved: number;
    total_events: number;
  };
  recent_events: ModerationEventItem[];
  timeline: ModerationTimelinePoint[];
  platform: string;
  period?: string;
};

// ── Типы системы уровней (ТЗ №5) ───────────────────────────────────────
export type XPFormulaConfig = {
  formula_type: "linear" | "exponential" | "logarithmic" | "custom";
  base_xp: number;
  multiplier: number;
  decay_factor?: number;
  max_xp_per_message?: number;
  custom_expression?: string;
};

export type RankingReward = {
  level: number;
  role: string;
  color: string;
  message?: string;
};

export type RankingSettings = {
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
};

export type LeaderboardEntry = {
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
};

export type LeaderboardResponse = {
  platform: "vk" | "lolka";
  total: number;
  entries: LeaderboardEntry[];
};

export type RankingPreview = {
  platform: "vk" | "lolka";
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  ranking: {
    rank: number;
    level: number;
    current_xp: number;
    xp_for_next_level: number;
    messages: number;
    voice_minutes: number;
    reactions: number;
  };
};

export type FormulaValidationResult = {
  valid: boolean;
  test_xp?: number;
  level_10_required_xp?: number;
  presets?: Record<string, XPFormulaConfig>;
  error?: string;
};

// ── Утилита для запросов ───────────────────────────────────────────────
const ACCESS_KEY = 'nova_access_token';
const REFRESH_KEY = 'nova_refresh_token';
const USER_KEY = 'nova_user';

// Эндпоинты auth, на которых 401 — не "токен истёк", а обычный неверный логин/просроченный refresh.
// Ретрай через /refresh для них не запускаем, чтобы не зациклиться.
const AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/refresh', '/api/auth/register'];

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        localStorage.setItem(ACCESS_KEY, data.access_token);
        localStorage.setItem(REFRESH_KEY, data.refresh_token);
        return data.access_token as string;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function clearSessionAndRedirect() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}, _isRetry = false): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const token = typeof getAccessToken === "function" ? getAccessToken() : "";
    
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (res.status === 401 && !_isRetry && !AUTH_ENDPOINTS.includes(path)) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        clearTimeout(timeout);
        return apiFetch<T>(path, options, true);
      }
      clearSessionAndRedirect();
    }

    if (!res.ok) {
      let detail = "";
      try {
        const body = await res.json();
        detail = body?.detail || body?.error || "";
      } catch {
        // тело не JSON
      }
      throw new Error(detail || `HTTP ${res.status}: ${res.statusText}`);
    }

    return (await res.json()) as T;
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new Error("Превышено время ожидания");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  servers: {
    list: (platform?: "vk" | "lolka") =>
      apiFetch<{ servers: DashboardServer[]; total: number }>(
        `/api/servers${platform ? `?platform=${platform}` : ""}`
      ),
    create: (data: {
      name: string;
      server_id: string;
      platform?: "vk" | "lolka";
      webhook_url?: string;
      icon_url?: string;
      member_count?: number;
    }) =>
      apiFetch<{ status: string; error?: string; server?: object }>("/api/servers", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          server_id: data.server_id,
          platform: data.platform || "vk",
          webhook_url: data.webhook_url || "",
          icon_url: data.icon_url || "",
          member_count: data.member_count || 0,
        }),
      }),
    remove: (id: number) =>
      apiFetch<{ status: string; error?: string }>(`/api/servers/${id}`, {
        method: "DELETE",
      }),
    syncLolka: () =>
      apiFetch<{ status: string; synced?: number; error?: string }>(
        "/api/servers/sync-lolka",
        { method: "POST" }
      ),
    syncVk: () =>
      apiFetch<{ status: string; synced?: number; error?: string }>(
        "/api/servers/sync-vk",
        { method: "POST" }
      ),
    syncAll: () =>
      apiFetch<{
        status: string;
        synced: number;
        lolka: object;
        vk: object;
        errors: string[];
      }>("/api/servers/sync-all", { method: "POST" }),
  },
  vk: {
    groups: (serverId?: string) =>
      apiFetch<{
        groups: { id: string; name: string; icon: string | null; member_count: number }[];
        total: number;
      }>(`/api/vk/groups${serverId ? `?server_id=${serverId}` : ""}`),
    getConnections: (serverId: string) =>
      apiFetch<{
        connections: {
          id: number;
          group_id: string;
          group_name: string;
          is_active: boolean;
          created_at: string;
        }[];
        error?: string;
      }>(`/api/vk/connections?server_id=${serverId}`),
    createConnection: (data: {
      server_id: string;
      group_id: string;
      access_token: string;
      webhook_secret?: string;
      confirmation_code?: string;
    }) =>
      apiFetch<{
        status: string;
        connection_id?: number;
        group_name?: string;
        error?: string;
      }>("/api/vk/connections", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    deleteConnection: (id: number) =>
      apiFetch<{ status: string; error?: string }>(`/api/vk/connections/${id}`, {
        method: "DELETE",
      }),
    testConnection: (id: number) =>
      apiFetch<{
        status: string;
        group_name?: string;
        members_count?: number;
        error?: string;
        code?: number;
      }>(`/api/vk/connections/${id}/test`, { method: "POST" }),
    moderate: (data: {
      group_id: string;
      message_id: number;
      action: string;
      user_id?: number;
      reason?: string;
    }) =>
      apiFetch<{ success?: boolean; error?: string; code?: number }>("/api/vk/moderate", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    sendMessage: (data: { group_id: string; peer_id: number; message: string }) =>
      apiFetch<{ status: string; message_id?: number; error?: string; code?: number }>(
        "/api/vk/send",
        { method: "POST", body: JSON.stringify(data) }
      ),
    getMembers: (groupId: string, count?: number) =>
      apiFetch<{ members: object[]; total: number; error?: string; code?: number }>(
        `/api/vk/members?group_id=${groupId}${count ? `&count=${count}` : ""}`
      ),
  },
  modules: {
    get: (serverId = "default") =>
      apiFetch<{ modules: { name: string; enabled: boolean; config: string }[] }>(
        `/api/settings/modules?server_id=${serverId}`
      ),
    save: (data: object) =>
      apiFetch<{ status: string }>("/api/settings/modules", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getConfig: async <T>(serverId: string, moduleName: string): Promise<T | null> => {
      const data = await apiFetch<{
        modules: { name: string; enabled: boolean; config: string }[];
      }>(`/api/settings/modules?server_id=${serverId}`);
      const found = data.modules?.find((m) => m.name === moduleName);
      if (!found?.config) return null;
      try {
        return JSON.parse(found.config) as T;
      } catch {
        return null;
      }
    },
    saveConfig: (serverId: string, platform: string, moduleName: string, config: unknown) =>
      apiFetch<{ status?: string; error?: string; modules_count?: number }>(
        "/api/settings/modules",
        {
          method: "POST",
          body: JSON.stringify({
            server_id: serverId,
            platform,
            modules: [{ name: moduleName, enabled: true, config: JSON.stringify(config) }],
          }),
        }
      ),
  },
  ai: {
    get: (serverId = "default") =>
      apiFetch<{ settings: object | null }>(`/api/settings/ai?server_id=${serverId}`),
    save: (data: object) =>
      apiFetch<{ status: string }>("/api/settings/ai", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  notifications: {
    get: (serverId = "default") =>
      apiFetch<{ settings: NotificationSettings }>(
        `/api/settings/notifications?server_id=${serverId}`
      ),
    save: (data: object) =>
      apiFetch<{ status: string }>("/api/settings/notifications", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    test: (data: object) =>
      apiFetch<{ status?: string; error?: string }>("/api/settings/notifications/test", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  music: {
    getProviders: (serverId = "default") =>
      apiFetch<{ providers: object[]; available_types: object[] }>(
        `/api/music/providers?server_id=${serverId}`
      ),
    addProvider: (data: object) =>
      apiFetch<{ status: string; id: number }>("/api/music/providers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateProvider: (id: number, data: object) =>
      apiFetch<{ status: string }>(`/api/music/providers/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteProvider: (id: number) =>
      apiFetch<{ status: string }>(`/api/music/providers/${id}`, { method: "DELETE" }),
  },
  events: {
    list: (serverId = "default") =>
      apiFetch<{ events: object[]; templates: object[] }>(`/api/events?server_id=${serverId}`),
    create: (data: object) =>
      apiFetch<{ status: string; id: number }>("/api/events", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      apiFetch<{ status: string }>(`/api/events/${id}`, { method: "DELETE" }),
    notify: (id: number, data: object) =>
      apiFetch<{ status: string }>(`/api/events/${id}/notify`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  webhooks: {
    getLogs: (webhookId = "", limit = 20) =>
      apiFetch<{ logs: object[]; total: number }>(
        `/api/webhooks/logs?webhook_id=${webhookId}&limit=${limit}`
      ),
    getStats: (webhookId = "") =>
      apiFetch<{ total_sent: number; today_sent: number; last_sent: string | null }>(
        `/api/webhooks/stats?webhook_id=${webhookId}`
      ),
    getAutoForwardConfig: (serverId = "default") =>
      apiFetch<{ config: object }>(`/api/webhooks/auto-forward/config?server_id=${serverId}`),
    saveAutoForwardConfig: (data: object) =>
      apiFetch<{ status: string }>("/api/webhooks/auto-forward/config", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    list: (serverId: string) =>
      apiFetch<{ webhooks: DashboardWebhook[]; error?: string }>(
        `/api/webhooks?server_id=${serverId}`
      ),
    create: (data: {
      server_id: string;
      platform: "vk" | "lolka";
      project: string;
      url: string;
      event: string;
    }) =>
      apiFetch<{ status?: string; error?: string; webhook?: DashboardWebhook }>("/api/webhooks", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (
      id: number,
      data: Partial<{ active: boolean; url: string; project: string; event: string }>
    ) =>
      apiFetch<{ status?: string; error?: string }>(`/api/webhooks/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    remove: (id: number) =>
      apiFetch<{ status?: string; error?: string }>(`/api/webhooks/${id}`, { method: "DELETE" }),
  },
  analytics: {
    getReportsConfig: (serverId = "default") =>
      apiFetch<{ config: object }>(`/api/analytics/reports?server_id=${serverId}`),
    saveReportsConfig: (data: object) =>
      apiFetch<{ status: string }>("/api/analytics/reports", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    sendReport: (data: object) =>
      apiFetch<{ status: string; sent: boolean }>("/api/analytics/reports/send", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  stats: {
    getPublic: () =>
      apiFetch<{ servers: number; users: number; responseTime: number }>("/api/stats"),
    getDashboard: () =>
      apiFetch<{
        totalMessages: number;
        activeUsers: number;
        commandsUsed: number;
        serversCount: number;
      }>("/api/stats/dashboard"),
  },
  moderation: {
    getLog: (serverId: string, limit?: number) =>
      apiFetch<{ entries: object[]; total: number }>(
        `/api/moderation/log?server_id=${serverId}${limit ? `&limit=${limit}` : ""}`
      ),
    getStats: (serverId: number, platform: "vk" | "lolka", period: "24h" | "7d" | "30d" = "7d") =>
      apiFetch<ModerationStatsResponse>(
        `/api/moderation/stats?server_id=${serverId}&platform=${platform}&period=${period}`
      ),
  },

  // ── ТЗ №5: Система уровней ───────────────────────────────────────
  ranking: {
    getSettings: (serverId: string, platform: "vk" | "lolka" = "vk") =>
      apiFetch<RankingSettings>(`/api/ranking/settings?server_id=${serverId}&platform=${platform}`),

    saveSettings: (serverId: string, platform: "vk" | "lolka", settings: Partial<RankingSettings>) =>
      apiFetch<{ status: string }>(
        `/api/ranking/settings?server_id=${serverId}&platform=${platform}`,
        { method: "POST", body: JSON.stringify(settings) }
      ),

    getLeaderboard: (
      serverId: string,
      platform: "vk" | "lolka" = "vk",
      sort: "xp" | "level" | "messages" = "xp",
      limit: number = 50,
      offset: number = 0
    ) =>
      apiFetch<LeaderboardResponse>(
        `/api/ranking/leaderboard?server_id=${serverId}&platform=${platform}&sort=${sort}&limit=${limit}&offset=${offset}`
      ),

    getPreview: (serverId: string, platform: "vk" | "lolka", userId: string) =>
      apiFetch<RankingPreview>(
        `/api/ranking/preview?server_id=${serverId}&platform=${platform}&user_id=${userId}`
      ),

    validateFormula: (formula: XPFormulaConfig) =>
      apiFetch<FormulaValidationResult>("/api/ranking/formulas/validate", {
        method: "POST",
        body: JSON.stringify(formula),
      }),

    getFormulaPresets: () =>
      apiFetch<{ presets: Record<string, XPFormulaConfig> }>("/api/ranking/formulas/presets"),

    getCacheStats: () =>
      apiFetch<{ total_keys: number; active_keys: number; expired_keys: number }>(
        "/api/ranking/cache/stats"
      ),

    clearCache: () =>
      apiFetch<{ status: string }>("/api/ranking/cache/clear", { method: "POST" }),

    getMembers: () =>
      apiFetch<{ members: object[]; total: number }>("/api/ranking/members"),
  },

  auth: {
    getLolkaUrl: () => apiFetch<{ error?: string; message?: string }>("/api/auth/lolka"),
    getVkUrl: () => apiFetch<{ url: string; state: string }>("/api/auth/vk"),
    register: (data: { email: string; password: string }) =>
      apiFetch<{ status: string; message: string; email_sent: boolean }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    login: (data: { email: string; password: string }) =>
      apiFetch<{ status: string; access_token: string; refresh_token: string; user: AuthUser }>(
        "/api/auth/login",
        { method: "POST", body: JSON.stringify(data) }
      ),
    refresh: (data: { refresh_token: string }) =>
      apiFetch<{ status: string; access_token: string; refresh_token: string }>(
        "/api/auth/refresh",
        { method: "POST", body: JSON.stringify(data) }
      ),
    logout: (data: { refresh_token: string }) =>
      apiFetch<{ status: string }>("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    forgotPassword: (data: { email: string }) =>
      apiFetch<{ status: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    resetPassword: (data: { token: string; new_password: string }) =>
      apiFetch<{ status: string }>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    resendVerification: (data: { email: string }) =>
      apiFetch<{ status: string; email_sent: boolean }>("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  lolkaBot: {
    getStatus: () =>
      apiFetch<{ configured: boolean; connected: boolean; bot: { username?: string; avatar?: string } | null }>(
        "/api/lolka/bot"
      ),
    getInviteUrl: (serverId = "") =>
      apiFetch<{ url?: string; error?: string }>(`/api/lolka/bot/invite?server_id=${serverId}`),
    getGuilds: () =>
      apiFetch<{
        guilds: { id: string; name: string; icon: string | null; member_count: number }[];
        error?: string;
      }>("/api/lolka/bot/guilds"),
    getAvailableGuilds: () =>
      apiFetch<{
        guilds: { id: string; name: string; icon: string | null; member_count: number }[];
        total?: number;
        error?: string;
      }>("/api/lolka/bot/guilds/available"),
  },
};