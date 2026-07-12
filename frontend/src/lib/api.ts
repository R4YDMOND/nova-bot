const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://nova-bot-rpsy.onrender.com';

export type NotificationSettings = {
  email: { enabled: boolean; address: string };
  vk: { enabled: boolean; webhook_url: string };
  max: { enabled: boolean; webhook_url: string };
};

export type DashboardServer = {
  id: number;
  name: string;
  server_id: string;
  platform: 'vk' | 'lolka';
  icon_url: string;
  member_count: number;
};

export type DashboardWebhook = {
  id: number;
  server_id: string;
  platform: 'vk' | 'lolka';
  project: string;
  url: string;
  event: string;
  active: boolean;
};

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return (await res.json()) as T;
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw new Error('Превышено время ожидания');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  servers: {
    list: (platform?: 'vk' | 'lolka') => apiFetch<{ servers: DashboardServer[]; total: number }>(`/api/servers${platform ? `?platform=${platform}` : ''}`),
    create: (data: { name: string; server_id: string; platform?: 'vk' | 'lolka'; webhook_url?: string }) => {
      const params = new URLSearchParams({ name: data.name, server_id: data.server_id, platform: data.platform || 'vk' });
      if (data.webhook_url) params.set('webhook_url', data.webhook_url);
      return apiFetch<{ status: string; error?: string; server?: object }>(`/api/servers?${params}`, { method: 'POST' });
    },
    remove: (id: number) => apiFetch<{ status: string; error?: string }>(`/api/servers/${id}`, { method: 'DELETE' }),
    syncLolka: () => apiFetch<{ status: string; synced?: number; error?: string }>('/api/servers/sync-lolka', { method: 'POST' }),
  },
  modules: {
    get: (serverId = 'default') => apiFetch<{ modules: { name: string; enabled: boolean; config: string }[] }>(`/api/settings/modules?server_id=${serverId}`),
    save: (data: object) => apiFetch<{ status: string }>('/api/settings/modules', { method: 'POST', body: JSON.stringify(data) }),
  },
  ai: {
    get: (serverId = 'default') => apiFetch<{ settings: object | null }>(`/api/settings/ai?server_id=${serverId}`),
    save: (data: object) => apiFetch<{ status: string }>('/api/settings/ai', { method: 'POST', body: JSON.stringify(data) }),
  },
  notifications: {
    get: (serverId = 'default') => apiFetch<{ settings: NotificationSettings }>(`/api/settings/notifications?server_id=${serverId}`),
    save: (data: object) => apiFetch<{ status: string }>('/api/settings/notifications', { method: 'POST', body: JSON.stringify(data) }),
    test: (data: object) => apiFetch<{ status?: string; error?: string }>('/api/settings/notifications/test', { method: 'POST', body: JSON.stringify(data) }),
  },
  music: {
    getProviders: (serverId = 'default') => apiFetch<{ providers: object[]; available_types: object[] }>(`/api/music/providers?server_id=${serverId}`),
    addProvider: (data: object) => apiFetch<{ status: string; id: number }>('/api/music/providers', { method: 'POST', body: JSON.stringify(data) }),
    updateProvider: (id: number, data: object) => apiFetch<{ status: string }>(`/api/music/providers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProvider: (id: number) => apiFetch<{ status: string }>(`/api/music/providers/${id}`, { method: 'DELETE' }),
  },
  events: {
    list: (serverId = 'default') => apiFetch<{ events: object[]; templates: object[] }>(`/api/events?server_id=${serverId}`),
    create: (data: object) => apiFetch<{ status: string; id: number }>('/api/events', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: number) => apiFetch<{ status: string }>(`/api/events/${id}`, { method: 'DELETE' }),
    notify: (id: number, data: object) => apiFetch<{ status: string }>(`/api/events/${id}/notify`, { method: 'POST', body: JSON.stringify(data) }),
  },
  webhooks: {
    getLogs: (webhookId = '', limit = 20) => apiFetch<{ logs: object[]; total: number }>(`/api/webhooks/logs?webhook_id=${webhookId}&limit=${limit}`),
    getStats: (webhookId = '') => apiFetch<{ total_sent: number; today_sent: number; last_sent: string | null }>(`/api/webhooks/stats?webhook_id=${webhookId}`),
    getAutoForwardConfig: (serverId = 'default') => apiFetch<{ config: object }>(`/api/webhooks/auto-forward/config?server_id=${serverId}`),
    saveAutoForwardConfig: (data: object) => apiFetch<{ status: string }>('/api/webhooks/auto-forward/config', { method: 'POST', body: JSON.stringify(data) }),
    list: (serverId: string) =>
      apiFetch<{ webhooks: DashboardWebhook[]; error?: string }>(`/api/webhooks?server_id=${serverId}`),
    create: (data: { server_id: string; platform: 'vk' | 'lolka'; project: string; url: string; event: string }) =>
      apiFetch<{ status?: string; error?: string; webhook?: DashboardWebhook }>('/api/webhooks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<{ active: boolean; url: string; project: string; event: string }>) =>
      apiFetch<{ status?: string; error?: string }>(`/api/webhooks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    remove: (id: number) =>
      apiFetch<{ status?: string; error?: string }>(`/api/webhooks/${id}`, { method: 'DELETE' }),
  },
  analytics: {
    getReportsConfig: (serverId = 'default') => apiFetch<{ config: object }>(`/api/analytics/reports?server_id=${serverId}`),
    saveReportsConfig: (data: object) => apiFetch<{ status: string }>('/api/analytics/reports', { method: 'POST', body: JSON.stringify(data) }),
    sendReport: (data: object) => apiFetch<{ status: string; sent: boolean }>('/api/analytics/reports/send', { method: 'POST', body: JSON.stringify(data) }),
  },
  stats: {
    getPublic: () => apiFetch<{ servers: number; users: number; responseTime: number }>('/api/stats'),
    getDashboard: () => apiFetch<{ totalMessages: number; activeUsers: number; commandsUsed: number; serversCount: number }>('/api/stats/dashboard'),
  },
  moderation: {
    getLog: () => apiFetch<{ entries: object[]; total: number; warns: number; mutes: number; bans: number }>('/api/moderation/log'),
  },
  ranking: {
    getMembers: () => apiFetch<{ members: object[]; total: number }>('/api/ranking/members'),
  },
  auth: {
    getLolkaUrl: () => apiFetch<{ url: string; state: string }>('/api/auth/lolka'),
    getVkUrl: () => apiFetch<{ url: string; state: string }>('/api/auth/vk'),
  },
  lolkaBot: {
    getStatus: () => apiFetch<{ configured: boolean; connected: boolean; bot: { username?: string; avatar?: string } | null }>('/api/lolka/bot'),
    getInviteUrl: (serverId = '') => apiFetch<{ url?: string; error?: string }>(`/api/lolka/bot/invite?server_id=${serverId}`),
    getGuilds: () => apiFetch<{ guilds: { id: string; name: string; icon: string | null; member_count: number }[]; error?: string }>('/api/lolka/bot/guilds'),
  },
};