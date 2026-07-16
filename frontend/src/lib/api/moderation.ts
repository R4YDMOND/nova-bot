export type ModerationSettings = Record<string, any>;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_BASE || '';
  const res = await fetch(base + path, {
    credentials: 'include',
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export async function getModerationSettings(serverId: string, platform: 'vk' | 'lolka') {
  const q = `?server_id=${encodeURIComponent(serverId)}&platform=${encodeURIComponent(platform)}`;
  return request<{ settings: ModerationSettings; updated_at: string | null }>(`/api/moderation/settings${q}`);
}

export async function saveModerationSettings(payload: { server_id: string; platform: 'vk' | 'lolka' | 'both'; settings: ModerationSettings; }) {
  return request<{ status: string }>(`/api/moderation/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getModerationStats(serverId: string, period: '24h' | '7d' | '30d' = '7d') {
  const q = `?server_id=${encodeURIComponent(serverId)}&period=${encodeURIComponent(period)}`;
  return request<any>(`/api/moderation/stats${q}`);
}

export async function getModerationLogs(serverId: string, platform?: 'vk'|'lolka', limit = 50) {
  const params = new URLSearchParams({ server_id: serverId, limit: String(limit) });
  if (platform) params.set('platform', platform);
  return request<{ entries: any[]; total: number }>(`/api/moderation/logs?${params.toString()}`);
}