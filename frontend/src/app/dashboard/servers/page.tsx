'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { api } from '@/lib/api';
import { useServer } from '@/context/ServerProvider';
import { RefreshCw, Plus, Trash2, X } from 'lucide-react';

const PLATFORM_ICON: Record<string, string> = { lolka: '🎮', vk: '🔵' };
const PLATFORM_LABEL: Record<string, string> = { lolka: 'Lolka', vk: 'VK' };

export default function ServersPage() {
  const { servers, loading, selectedServerId, selectServer, refresh, syncLolka } = useServer();

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', server_id: '', platform: 'vk' as 'vk' | 'lolka', webhook_url: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [botStatus, setBotStatus] = useState<{ configured: boolean; connected: boolean; bot: { username?: string } | null } | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    api.lolkaBot.getStatus().then(setBotStatus).catch(() => {});
  }, []);

  async function handleSync() {
    setSyncing(true);
    setSyncMsg(null);
    const res = await syncLolka();
    if (res.error) {
      setSyncMsg(`⚠️ ${res.error}`);
    } else {
      setSyncMsg(`✅ Синхронизировано серверов: ${res.synced ?? 0}`);
    }
    setSyncing(false);
    setTimeout(() => setSyncMsg(null), 5000);
  }

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
    setShowModal(true);
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

  async function removeServer(id: number) {
    if (!confirm('Удалить сервер из панели Nova? Сам сервер в VK/Lolka не пострадает.')) return;
    await api.servers.remove(id).catch(() => {});
    await refresh();
  }

  return (
    <div className="space-y-8 p-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[rgb(var(--text))]">Серверы</h1>
          <p className="text-[rgb(var(--text-secondary))] mt-1">Серверы Lolka и сообщества VK, подключённые к Nova</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Синхронизация...' : 'Синхронизировать с Lolka'}
          </Button>
          <Button onClick={openModal}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить вручную
          </Button>
        </div>
      </div>

      {syncMsg && <p className="text-sm text-[rgb(var(--text-secondary))]">{syncMsg}</p>}

      {/* Статус бота Lolka */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl shrink-0">
              🎮
            </div>
            <div>
              <div className="font-semibold flex items-center gap-2">
                Бот Nova в Lolka
                {botStatus?.configured && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    botStatus.connected ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'
                  }`}>
                    {botStatus.connected ? '🟢 Подключён' : '🟡 Ждём соединения'}
                  </span>
                )}
                {botStatus && !botStatus.configured && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400">🔴 Не настроен</span>
                )}
              </div>
              <p className="text-sm text-[rgb(var(--text-secondary))] mt-0.5">
                {botStatus?.bot?.username ? `@${botStatus.bot.username}` : 'Добавьте бота на сервер, чтобы он появился здесь автоматически'}
              </p>
              {inviteError && <p className="text-red-400 text-xs mt-1">{inviteError}</p>}
            </div>
          </div>
          <Button variant="secondary" onClick={inviteBot} disabled={inviteLoading} className="shrink-0">
            {inviteLoading ? 'Открываем...' : '🔗 Добавить бота на сервер'}
          </Button>
        </div>
      </Card>

      {/* Список серверов */}
      {loading ? (
        <p className="text-[rgb(var(--text-secondary))]">Загрузка...</p>
      ) : servers.length === 0 ? (
        <div className="text-center py-16 text-[rgb(var(--text-secondary))]">
          <p>Пока нет ни одного сервера. Добавьте бота в Lolka и нажмите «Синхронизировать» — или добавьте сервер вручную.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {servers.map(s => (
            <Card
              key={s.id}
              className={`p-5 flex items-center gap-4 cursor-pointer transition-colors ${
                s.server_id === selectedServerId ? 'border-primary' : 'hover:border-primary/40'
              }`}
              onClick={() => selectServer(s.server_id)}
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl shrink-0">
                {PLATFORM_ICON[s.platform] || '🔵'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{s.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] shrink-0">
                    {PLATFORM_LABEL[s.platform] || s.platform}
                  </span>
                </div>
                <p className="text-sm text-[rgb(var(--text-secondary))]">
                  {s.member_count > 0 ? `${s.member_count} участников` : `ID: ${s.server_id}`}
                </p>
              </div>
              {s.server_id === selectedServerId && (
                <span className="text-xs text-primary font-medium shrink-0">Выбран</span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); removeServer(s.id); }}
                className="p-2 rounded-xl text-[rgb(var(--text-secondary))] hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                title="Удалить из панели"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-3xl p-8 max-w-md w-full relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 rounded-xl text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-2))] transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-6">Добавить сервер вручную</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[rgb(var(--text-secondary))] mb-1.5">Платформа</label>
                <Select value={form.platform} onValueChange={(v: string) => setForm(f => ({ ...f, platform: v as 'vk' | 'lolka' }))}>
                  <SelectTrigger>
                    <span>{PLATFORM_ICON[form.platform]} {PLATFORM_LABEL[form.platform]}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vk">🔵 VK</SelectItem>
                    <SelectItem value="lolka">🎮 Lolka</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm text-[rgb(var(--text-secondary))] mb-1.5">Название</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Например, Моё сообщество" className="input w-full" />
              </div>
              <div>
                <label className="block text-sm text-[rgb(var(--text-secondary))] mb-1.5">
                  ID {form.platform === 'vk' ? 'сообщества VK' : 'сервера Lolka'}
                </label>
                <input type="text" value={form.server_id} onChange={e => setForm(f => ({ ...f, server_id: e.target.value }))} placeholder="123456789" className="input w-full font-mono text-sm" />
              </div>
              {formError && <p className="text-red-400 text-sm">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 px-5 py-2.5 border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] rounded-xl hover:bg-[rgb(var(--surface-2))] transition-colors">
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
