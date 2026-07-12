'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useServer } from '@/context/ServerProvider';

interface LolkaBotStatus {
  configured: boolean;
  connected: boolean;
  bot: { username?: string; avatar?: string } | null;
}

const PLATFORM_META: Record<string, { label: string; badge: string; icon: string }> = {
  vk: { label: 'VK', badge: 'bg-blue-500/15 text-blue-400', icon: '🔵' },
  lolka: { label: 'Lolka', badge: 'bg-purple-500/15 text-purple-400', icon: '🟣' },
};

export default function ServersPage() {
  const { servers, loading, refresh, syncLolka, syncing } = useServer();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', server_id: '', webhook_url: '' });
  const [saving, setSaving] = useState(false);

  const [botStatus, setBotStatus] = useState<LolkaBotStatus | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    api.lolkaBot.getStatus().then(setBotStatus).catch(() => {});
  }, []);

  const vkCount = servers.filter((s) => s.platform === 'vk').length;
  const lolkaCount = servers.filter((s) => s.platform === 'lolka').length;

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

  async function handleSyncLolka() {
    setSyncMessage(null);
    const res = await syncLolka();
    if (res.error) {
      setSyncMessage(`❌ ${res.error}`);
    } else {
      setSyncMessage(`✅ Синхронизировано серверов: ${res.synced ?? 0}`);
    }
    setTimeout(() => setSyncMessage(null), 5000);
  }

  async function handleAdd() {
    if (!form.name.trim() || !form.server_id.trim()) return;
    setSaving(true);
    try {
      await api.servers.create({ ...form, platform: 'vk' });
      setShowModal(false);
      setForm({ name: '', server_id: '', webhook_url: '' });
      refresh();
    } catch {
      alert('Не удалось добавить сервер');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">🌐 Мои серверы</h1>
          <p className="text-[rgb(var(--text-secondary))]">Серверы из VK и Lolka в одном месте</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleSyncLolka} disabled={syncing}>
            {syncing ? 'Синхронизация...' : '🔄 Синхронизировать с Lolka'}
          </Button>
          <Button onClick={() => setShowModal(true)}>+ Добавить сервер VK</Button>
        </div>
      </div>

      {syncMessage && (
        <div className="px-4 py-3 rounded-2xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] text-sm">
          {syncMessage}
        </div>
      )}

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
                    {botStatus.connected ? '🟢 Подключён' : '🟡 Токен задан, ждём соединения'}
                  </span>
                )}
                {botStatus && !botStatus.configured && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400">
                    🔴 Не настроен
                  </span>
                )}
              </div>
              <p className="text-sm text-[rgb(var(--text-secondary))] mt-0.5">
                {botStatus?.bot?.username
                  ? `@${botStatus.bot.username} — добавьте бота на нужные серверы, затем нажмите «Синхронизировать с Lolka»`
                  : 'Добавьте бота на свой сервер в Lolka, чтобы начать пользоваться модерацией, музыкой и командами'}
              </p>
              {inviteError && <p className="text-red-400 text-xs mt-1">{inviteError}</p>}
            </div>
          </div>
          <Button variant="secondary" onClick={inviteBot} disabled={inviteLoading} className="shrink-0">
            {inviteLoading ? 'Открываем...' : '🔗 Добавить бота на сервер'}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Всего серверов', value: loading ? '...' : servers.length, icon: '🌐' },
          { label: 'VK-сообществ', value: loading ? '...' : vkCount, icon: '🔵' },
          { label: 'Lolka-серверов', value: loading ? '...' : lolkaCount, icon: '🟣' },
          { label: 'Время ответа', value: '<0.8s', icon: '⚡' },
        ].map((s, i) => (
          <Card key={i} className="flex items-center gap-4 p-6">
            <span className="text-3xl">{s.icon}</span>
            <div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-sm text-[rgb(var(--text-secondary))]">{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        {loading ? (
          <div className="py-16 text-center text-[rgb(var(--text-secondary))]"><p>Загрузка серверов...</p></div>
        ) : servers.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-4">🌐</div>
            <p className="text-[rgb(var(--text-secondary))] mb-4">
              У вас пока нет подключённых серверов. Добавьте VK-сообщество вручную или синхронизируйте Lolka.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="secondary" onClick={handleSyncLolka}>🔄 Синхронизировать с Lolka</Button>
              <Button onClick={() => setShowModal(true)}>Добавить сервер VK</Button>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(var(--border))] text-left text-xs uppercase text-[rgb(var(--text-secondary))]">
                <th className="py-4 px-4">Сервер</th>
                <th className="py-4 px-4">Платформа</th>
                <th className="py-4 px-4">Участники</th>
                <th className="py-4 px-4">ID</th>
                <th className="py-4 px-4">Действия</th>
              </tr>
            </thead>
            <tbody>
              {servers.map((s) => {
                const m = PLATFORM_META[s.platform] || PLATFORM_META.vk;
                return (
                  <tr key={`${s.platform}-${s.id}`} className="border-b border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-2))] transition-colors">
                    <td className="py-4 px-4 font-medium">
                      <div className="flex items-center gap-3">
                        {s.icon_url ? (
                          <img src={s.icon_url} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {s.name}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${m.badge}`}>
                        {m.icon} {m.label}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[rgb(var(--text-secondary))]">
                      {s.member_count > 0 ? s.member_count.toLocaleString('ru-RU') : '—'}
                    </td>
                    <td className="py-4 px-4 text-[rgb(var(--text-secondary))] text-xs font-mono">{s.server_id}</td>
                    <td className="py-4 px-4">
                      <Button variant="secondary" size="sm" onClick={() => (window.location.href = '/dashboard/commands')}>
                        Настроить
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-semibold">Добавить сервер VK</h2>
            <p className="text-xs text-[rgb(var(--text-secondary))]">
              Серверы Lolka добавлять вручную не нужно — используйте кнопку «Синхронизировать с Lolka» выше, она подтянет их автоматически.
            </p>
            <div>
              <label className="text-sm font-medium mb-1 block">Название сообщества</label>
              <input className="input w-full" placeholder="Моё сообщество"
                value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">ID сообщества VK</label>
              <input className="input w-full" placeholder="123456789"
                value={form.server_id} onChange={(e) => setForm((f) => ({ ...f, server_id: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Webhook URL (необязательно)</label>
              <input className="input w-full" placeholder="https://..."
                value={form.webhook_url} onChange={(e) => setForm((f) => ({ ...f, webhook_url: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowModal(false)}>Отмена</Button>
              <Button onClick={handleAdd} disabled={saving || !form.name || !form.server_id}>
                {saving ? 'Добавление...' : 'Добавить'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
