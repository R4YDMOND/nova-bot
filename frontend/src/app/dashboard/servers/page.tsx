'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface Server {
  id: number;
  name: string;
}

export default function ServersPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', server_id: '', webhook_url: '' });
  const [saving, setSaving] = useState(false);

  function loadServers() {
    setLoading(true);
    setError(false);
    api.servers.list()
      .then((data) => setServers((data.servers as Server[]) || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadServers(); }, []);

  async function handleAdd() {
    if (!form.name.trim() || !form.server_id.trim()) return;
    setSaving(true);
    try {
      await api.servers.create(form);
      setShowModal(false);
      setForm({ name: '', server_id: '', webhook_url: '' });
      loadServers();
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
          <p className="text-[rgb(var(--text-secondary))]">Управляйте подключёнными серверами</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Добавить сервер</Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Всего серверов', value: loading ? '...' : servers.length, icon: '🌐' },
          { label: 'Активных', value: loading ? '...' : servers.length, icon: '✅' },
          { label: 'Модулей доступно', value: '9', icon: '🧩' },
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

      {/* Список серверов */}
      <Card>
        {loading ? (
          <div className="py-16 text-center text-[rgb(var(--text-secondary))]">
            <p>Загрузка серверов...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-[rgb(var(--text-secondary))] mb-4">Не удалось загрузить серверы</p>
            <Button variant="secondary" onClick={loadServers}>Попробовать снова</Button>
          </div>
        ) : servers.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-4">🌐</div>
            <p className="text-[rgb(var(--text-secondary))] mb-4">У вас пока нет подключённых серверов</p>
            <Button onClick={() => setShowModal(true)}>Добавить первый сервер</Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(var(--border))] text-left text-xs uppercase text-[rgb(var(--text-secondary))]">
                <th className="py-4 px-4">Сервер</th>
                <th className="py-4 px-4">ID</th>
                <th className="py-4 px-4">Статус</th>
                <th className="py-4 px-4">Действия</th>
              </tr>
            </thead>
            <tbody>
              {servers.map((s) => (
                <tr key={s.id} className="border-b border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-2))] transition-colors">
                  <td className="py-4 px-4 font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      {s.name}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-[rgb(var(--text-secondary))] text-xs font-mono">{s.id}</td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400">Активен</span>
                  </td>
                  <td className="py-4 px-4">
                    <Button variant="secondary" size="sm"
                      onClick={() => window.location.href = '/dashboard/commands'}>
                      Настроить
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Модальное окно добавления */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-2xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-semibold">Добавить сервер</h2>

            <div>
              <label className="text-sm font-medium mb-1 block">Название сервера</label>
              <input className="input w-full" placeholder="Мой сервер"
                value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">ID сервера</label>
              <input className="input w-full" placeholder="123456789012345678"
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