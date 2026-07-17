'use client';
import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { api, DashboardServer } from '@/lib/api';
import { useServer } from '@/context/ServerProvider';
import { Plus, X } from 'lucide-react';
import { PlatformIcon, PLATFORM_LABEL } from '@/components/PlatformIcon';
import { ServerCard } from '@/components/ServerCard';

type Detection =
  | { status: 'ok'; platform: 'vk' | 'lolka'; id: string; label: string }
  | { status: 'plain'; id: string }
  | { status: 'unresolved'; message: string };

function detectServerLink(raw: string): Detection | null {
  const value = raw.trim();
  if (!value) return null;

  if (/^\d+$/.test(value)) {
    if (value.length < 4) return null;
    return { status: 'plain', id: value };
  }

  const looksLikeLink = /https?:\/\/|vk\.com|lolka\.app/i.test(value);

  const vkMatch = value.match(/vk\.com\/(club|public)(\d+)/i);
  if (vkMatch) {
    const kind = vkMatch[1].toLowerCase() === 'club' ? 'Сообщество' : 'Паблик';
    return { status: 'ok', platform: 'vk', id: vkMatch[2], label: `${kind} VK` };
  }

  const lolkaServerMatch = value.match(/lolka\.app\/servers\/(\d+)/i);
  if (lolkaServerMatch) {
    return { status: 'ok', platform: 'lolka', id: lolkaServerMatch[1], label: 'Сервер Lolka' };
  }

  const lolkaChannelMatch = value.match(/lolka\.app\/channels\/(\d+)/i);
  if (lolkaChannelMatch) {
    return { status: 'ok', platform: 'lolka', id: lolkaChannelMatch[1], label: 'Канал Lolka' };
  }

  if (looksLikeLink) {
    return {
      status: 'unresolved',
      message: 'Не нашли числовой ID в ссылке — введите его вручную (например club123456 → 123456).',
    };
  }

  return null;
}

export default function ServersPage() {
  const { servers, loading, selectedServerId, selectServer, refresh } = useServer();
  const [platformFilter, setPlatformFilter] = useState<'all' | 'vk' | 'lolka'>('all');

  const vkServers = useMemo(() => servers.filter(s => s.platform === 'vk'), [servers]);
  const lolkaServers = useMemo(() => servers.filter(s => s.platform === 'lolka'), [servers]);
  const filteredServers = useMemo(() => {
    if (platformFilter === 'vk') return vkServers;
    if (platformFilter === 'lolka') return lolkaServers;
    return servers;
  }, [platformFilter, servers, vkServers, lolkaServers]);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', server_id: '', platform: 'vk' as 'vk' | 'lolka', webhook_url: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [detection, setDetection] = useState<Detection | null>(null);

  const [botStatus, setBotStatus] = useState<{ configured: boolean; connected: boolean; bot: { username?: string } | null } | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api.lolkaBot.getStatus().then(setBotStatus).catch(() => { });
  }, []);

  async function inviteBot() {
    setInviteLoading(true);
    setInviteError(null);
    try {
      const res = await api.lolkaBot.getInviteUrl();
      if (res.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer');
      } else {
        setInviteError(res.error || 'Не удалось получить ссылку приглашения');
      }
    } catch {
      setInviteError('Не удалось получить ссылку приглашения');
    } finally {
      setInviteLoading(false);
    }
  }

  function openModal() {
    setForm({ name: '', server_id: '', platform: 'vk', webhook_url: '' });
    setFormError(null);
    setDetection(null);
    setShowModal(true);
  }

  function handleServerIdChange(raw: string) {
    const result = detectServerLink(raw);
    if (result?.status === 'ok') {
      setForm(f => ({ ...f, server_id: result.id, platform: result.platform }));
    } else {
      setForm(f => ({ ...f, server_id: raw }));
    }
    setDetection(result);
  }

  async function createServer() {
    if (!form.name.trim() || !form.server_id.trim()) {
      setFormError('Заполните название и ID сервера');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const res = await api.servers.create(form);
      if (res.error) {
        setFormError(res.error);
        return;
      }
      setShowModal(false);
      await refresh();
    } catch {
      setFormError('Не удалось создать сервер');
    } finally {
      setSaving(false);
    }
  }

  async function syncAllPlatforms() {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await api.servers.syncAll();
      if (res.status === 'error') {
        setSyncMessage({ type: 'error', text: 'Не удалось синхронизировать платформы' });
      } else {
        setSyncMessage({ type: 'ok', text: `Обновлено данных: ${res.synced} серверов` });
        await refresh();
      }
    } catch {
      setSyncMessage({ type: 'error', text: 'Не удалось синхронизировать платформы' });
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(null), 6000);
    }
  }

  async function removeServer(id: number) {
    if (!confirm('Удалить сервер из панели Nova? Сам сервер в VK/Lolka не пострадает.')) return;
    setDeletingId(id);
    setDeleteError(null);
    try {
      const res = await api.servers.remove(id);
      if (res && (res as { error?: string }).error) {
        setDeleteError((res as { error?: string }).error || 'Не удалось удалить сервер');
        return;
      }
      await refresh();
    } catch (e) {
      setDeleteError('Не удалось удалить сервер — проверьте, что бэкенд обновлён');
    } finally {
      setDeletingId(null);
      setTimeout(() => setDeleteError(null), 5000);
    }
  }

  return (
    <div className="min-h-screen pb-32 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[rgb(var(--text))]">Мои серверы</h2>
              <p className="text-[rgb(var(--text-secondary))] mt-1">
                {servers.length > 0 
                  ? `Всего подключено: ${servers.length} сервер${servers.length % 10 === 1 && servers.length % 100 !== 11 ? '' : 'ов'}`
                  : 'Пока нет подключённых серверов'}
              </p>
            </div>

            {syncMessage && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${
                syncMessage.type === 'ok'
                  ? 'text-green-400 bg-green-500/10 border-green-500/20'
                  : 'text-red-400 bg-red-500/10 border-red-500/20'
              }`}>
                {syncMessage.type === 'ok' ? '✅' : '⚠️'} {syncMessage.text}
              </div>
            )}

            {deleteError && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium text-red-400 bg-red-500/10 border-red-500/20">
                ⚠️ {deleteError}
              </div>
            )}
          </div>

          <div className="hidden md:flex gap-3 flex-wrap items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={platformFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setPlatformFilter('all')}
              >
                Все ({servers.length})
              </Button>
              <Button
                variant={platformFilter === 'vk' ? 'default' : 'outline'}
                onClick={() => setPlatformFilter('vk')}
                className={platformFilter === 'vk' ? 'bg-blue-500 hover:bg-blue-600' : ''}
              >
                VK ({vkServers.length})
              </Button>
              <Button
                variant={platformFilter === 'lolka' ? 'default' : 'outline'}
                onClick={() => setPlatformFilter('lolka')}
                className={platformFilter === 'lolka' ? 'bg-purple-500 hover:bg-purple-600' : ''}
              >
                Lolka ({lolkaServers.length})
              </Button>
            </div>

            <div className="flex gap-3">
              <Button onClick={syncAllPlatforms} disabled={syncing} variant="secondary">
                {syncing ? '🔄 Синхронизируем...' : '🔄 Синхронизировать'}
              </Button>
              <Button onClick={openModal}>
                <Plus className="w-4 h-4 mr-2" />
                Добавить сервер
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block">
              <div className="w-8 h-8 border-2 border-[rgb(var(--text-secondary))] border-t-primary rounded-full animate-spin"></div>
            </div>
            <p className="text-[rgb(var(--text-secondary))] mt-4">Загрузка серверов...</p>
          </div>
        ) : servers.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔗</div>
            <h3 className="text-xl font-semibold text-[rgb(var(--text))] mb-2">Нет подключённых серверов</h3>
            <p className="text-[rgb(var(--text-secondary))] mb-6">
              Добавьте сервер вручную по ID, чтобы начать управление
            </p>
            <Button onClick={openModal} className="inline-flex">
              <Plus className="w-4 h-4 mr-2" />
              Добавить сервер
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {platformFilter !== 'vk' && (
              <div className="flex flex-wrap items-center justify-end gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {botStatus && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                      botStatus.connected
                        ? 'bg-green-500/10 text-green-500 border border-green-500/30'
                        : botStatus.configured
                          ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30'
                          : 'bg-red-500/10 text-red-500 border border-red-500/30'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        botStatus.connected ? 'bg-green-400' : botStatus.configured ? 'bg-yellow-400' : 'bg-red-400'
                      }`}></span>
                      {botStatus.connected ? 'Бот подключён' : botStatus.configured ? 'Ждём соединения' : 'Не настроен'}
                    </span>
                  )}
                  <Button onClick={inviteBot} disabled={inviteLoading} size="sm" variant="outline">
                    {inviteLoading ? 'Открываем...' : '➕ Добавить бота Lolka на сервер'}
                  </Button>
                </div>
              </div>
            )}
            {inviteError && (
              <p className="text-red-400 text-xs">⚠️ {inviteError}</p>
            )}

            {filteredServers.length === 0 ? (
              <p className="text-[rgb(var(--text-secondary))] text-sm">
                {platformFilter === 'vk' && 'Нет подключённых сообществ VK'}
                {platformFilter === 'lolka' && 'Нет подключённых серверов Lolka'}
                {platformFilter === 'all' && 'Нет подключённых серверов'}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServers.map(s => (
                  <ServerCard
                    key={s.id}
                    server={s}
                    selected={s.server_id === selectedServerId}
                    onSelect={() => selectServer(s.server_id)}
                    onRemove={() => removeServer(s.id)}
                    deleting={deletingId === s.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="md:hidden fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        <Button
          onClick={syncAllPlatforms}
          disabled={syncing}
          variant="secondary"
          size="sm"
          className="rounded-full w-14 h-14 flex items-center justify-center p-0 shadow-lg"
          title="Синхронизировать"
        >
          <span className="text-xl">{syncing ? '⏳' : '🔄'}</span>
        </Button>
        <Button
          onClick={openModal}
          size="sm"
          className="rounded-full w-14 h-14 flex items-center justify-center p-0 shadow-lg"
          title="Добавить сервер"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-3xl p-8 max-w-md w-full relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 rounded-xl text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-2))] transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-6 text-[rgb(var(--text))]">Добавить сервер</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[rgb(var(--text-secondary))] mb-1.5">Платформа</label>
                <Select value={form.platform} onValueChange={(v: string) => setForm(f => ({ ...f, platform: v as 'vk' | 'lolka' }))}>
                  <SelectTrigger>
                    <span className="inline-flex items-center gap-2">
                      <PlatformIcon platform={form.platform} className="w-4 h-4 rounded" /> {PLATFORM_LABEL[form.platform]}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vk">
                      <span className="inline-flex items-center gap-2"><PlatformIcon platform="vk" className="w-4 h-4 rounded" /> VK</span>
                    </SelectItem>
                    <SelectItem value="lolka">
                      <span className="inline-flex items-center gap-2"><PlatformIcon platform="lolka" className="w-4 h-4 rounded" /> Lolka</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm text-[rgb(var(--text-secondary))] mb-1.5">Название</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Например, Моё сообщество" className="input w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] text-[rgb(var(--text))] placeholder:text-[rgb(var(--text-secondary))] outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block text-sm text-[rgb(var(--text-secondary))] mb-1.5">
                  ID {form.platform === 'vk' ? 'сообщества VK' : 'сервера Lolka'}
                </label>
                <input
                  type="text"
                  value={form.server_id}
                  onChange={e => handleServerIdChange(e.target.value)}
                  placeholder="123456789 или ссылка vk.com/club123456"
                  className="input w-full font-mono text-sm px-4 py-2.5 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] text-[rgb(var(--text))] placeholder:text-[rgb(var(--text-secondary))] outline-none focus:border-primary transition-colors"
                />
                {detection?.status === 'ok' && (
                  <p className="text-xs text-green-400 mt-1.5 flex items-center gap-1">
                    ✅ <PlatformIcon platform={detection.platform} className="w-3.5 h-3.5 rounded" /> {detection.label} · ID {detection.id} — подставлено автоматически
                  </p>
                )}
                {detection?.status === 'plain' && (
                  <p className="text-xs text-[rgb(var(--text-secondary))] mt-1.5">
                    🔢 Похоже на корректный числовой ID
                  </p>
                )}
                {detection?.status === 'unresolved' && (
                  <p className="text-xs text-amber-400 mt-1.5">⚠️ {detection.message}</p>
                )}
              </div>
              {formError && <p className="text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 px-5 py-2.5 border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] rounded-xl hover:bg-[rgb(var(--surface-2))] transition-colors font-medium">
                  Отмена
                </button>
                <Button onClick={createServer} disabled={saving} className="flex-1">
                  {saving ? 'Создаём...' : 'Добавить'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}