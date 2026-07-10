'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

type Provider = { id: number; type: string; name: string; enabled: boolean; streamUrl: string; channels?: string[] };
type AvailableType = { value: string; label: string; icon: string; category: string };

export default function MusicPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [availableTypes, setAvailableTypes] = useState<AvailableType[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newProvider, setNewProvider] = useState({ type: 'youtube', name: '', api_key: '', webhook_url: '', channels: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState({ name: '', api_key: '', webhook_url: '', channels: '' });
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => { loadProviders(); }, []);

  async function loadProviders() {
    try {
      const data = await api.music.getProviders();
      setProviders((data.providers as Provider[]) || []);
      setAvailableTypes((data.available_types as AvailableType[]) || []);
    } catch {}
  }

  function parseChannelsInput(raw: string): string[] {
    return raw.split(',').map(c => c.trim()).filter(Boolean);
  }

  async function addProvider() {
    setSaving(true);
    try {
      await api.music.addProvider({
        server_id: 'default',
        type: newProvider.type,
        name: newProvider.name || newProvider.type,
        api_key: newProvider.api_key,
        webhook_url: newProvider.webhook_url,
        channels: parseChannelsInput(newProvider.channels),
      });
      setShowAdd(false);
      setNewProvider({ type: 'youtube', name: '', api_key: '', webhook_url: '', channels: '' });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      loadProviders();
    } catch {} finally { setSaving(false); }
  }

  async function deleteProvider(id: number) {
    if (!confirm('Удалить провайдер?')) return;
    await api.music.deleteProvider(id).catch(() => {});
    loadProviders();
  }

  function startEdit(p: Provider) {
    setEditingId(p.id);
    setEditDraft({
      name: p.name || '',
      api_key: '',
      webhook_url: '',
      channels: (p.channels || []).join(', '),
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: number) {
    setEditSaving(true);
    try {
      const payload: any = {
        name: editDraft.name,
        channels: parseChannelsInput(editDraft.channels),
      };
      if (editDraft.api_key) payload.api_key = editDraft.api_key;
      if (editDraft.webhook_url) payload.webhook_url = editDraft.webhook_url;

      await api.music.updateProvider(id, payload);
      setEditingId(null);
      loadProviders();
    } catch {} finally { setEditSaving(false); }
  }

  async function toggleEnabled(p: Provider) {
    await api.music.updateProvider(p.id, { enabled: !p.enabled }).catch(() => {});
    loadProviders();
  }

  const RADIO = ['yandex_radio', 'record', 'dfm', 'europa_plus', 'nashe', 'relax_fm', 'like_fm', 'shanson'];
  const needsKey = !RADIO.includes(newProvider.type) && newProvider.type !== 'custom';
  const selectedType = availableTypes.find(t => t.value === newProvider.type);

  const searchTypes = availableTypes.filter(t => t.category === 'search');
  const radioTypes = availableTypes.filter(t => t.category === 'radio');
  const customTypes = availableTypes.filter(t => t.category === 'custom');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🎵 Музыка</h1>
        <p className="text-[rgb(var(--text-secondary))] mt-1">Поиск треков и радиостанции для вашего сервера</p>
      </div>

      {saved && (
        <div className="px-4 py-3 rounded-2xl bg-green-500/15 border border-green-500/30 text-green-400 text-sm">
          ✅ Провайдер добавлен
        </div>
      )}

      <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">🔌 Подключённые сервисы</h3>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
              showAdd ? 'bg-[rgb(var(--surface-2))] text-[rgb(var(--text))]' : 'bg-cyan-400 text-black hover:bg-cyan-300'
            }`}
          >
            {showAdd ? '✕ Отмена' : '+ Добавить'}
          </button>
        </div>

        {showAdd && (
          <div className="flex flex-col gap-3 mb-4 p-4 bg-[rgb(var(--surface-2))] rounded-xl border border-[rgb(var(--border))]">
            <div className="flex flex-wrap gap-2">
              <select
                value={newProvider.type}
                onChange={e => setNewProvider({ ...newProvider, type: e.target.value })}
                className="px-3 py-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-xl text-sm"
              >
                {searchTypes.length > 0 && <optgroup label="Поиск треков">
                  {searchTypes.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                </optgroup>}
                {radioTypes.length > 0 && <optgroup label="Радио">
                  {radioTypes.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                </optgroup>}
                {customTypes.length > 0 && <optgroup label="Своё">
                  {customTypes.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                </optgroup>}
              </select>
              <input
                type="text"
                placeholder={`Название (по умолч. ${selectedType?.label || newProvider.type})`}
                value={newProvider.name}
                onChange={e => setNewProvider({ ...newProvider, name: e.target.value })}
                className="px-3 py-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-xl text-sm w-48"
              />
              {needsKey && (
                <input
                  type="text"
                  placeholder="API Ключ"
                  value={newProvider.api_key}
                  onChange={e => setNewProvider({ ...newProvider, api_key: e.target.value })}
                  className="px-3 py-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-xl text-sm flex-1 min-w-40"
                />
              )}
              {newProvider.type === 'custom' && (
                <input
                  type="text"
                  placeholder="Webhook URL"
                  value={newProvider.webhook_url}
                  onChange={e => setNewProvider({ ...newProvider, webhook_url: e.target.value })}
                  className="px-3 py-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-xl text-sm flex-1 min-w-40"
                />
              )}
            </div>

            <input
              type="text"
              placeholder="Каналы для воспроизведения (через запятую, например: general, музыка)"
              value={newProvider.channels}
              onChange={e => setNewProvider({ ...newProvider, channels: e.target.value })}
              className="px-3 py-2 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-xl text-sm w-full"
            />

            <button
              onClick={addProvider}
              disabled={saving}
              className="self-start px-4 py-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-colors"
            >
              {saving ? 'Сохранение...' : '💾 Сохранить'}
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {providers.map(p => (
            <div key={p.id} className="flex flex-col gap-2 p-3 bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-xl">{availableTypes.find(t => t.value === p.type)?.icon || '🎵'}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{p.name || p.type}</div>
                  <div className="text-[rgb(var(--text-secondary))] text-xs">
                    {p.type}
                    {p.channels && p.channels.length > 0 && (
                      <span> · каналы: {p.channels.join(', ')}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleEnabled(p)}
                  className={`text-xs font-medium ${p.enabled ? 'text-green-400' : 'text-red-400'}`}
                  title="Переключить статус"
                >
                  {p.enabled ? '🟢 Активен' : '🔴 Выкл'}
                </button>
                {p.streamUrl && (
                  <a href={p.streamUrl} target="_blank" rel="noreferrer"
                    className="px-2 py-1 text-cyan-400 hover:bg-cyan-400/10 rounded-lg text-xs transition-colors">
                    ▶ Слушать
                  </a>
                )}
                <button
                  onClick={() => editingId === p.id ? cancelEdit() : startEdit(p)}
                  className="px-2 py-1 text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors text-sm"
                >✎</button>
                <button
                  onClick={() => deleteProvider(p.id)}
                  className="px-2 py-1 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
                >✕</button>
              </div>

              {editingId === p.id && (
                <div className="flex flex-col gap-2 p-3 bg-[rgb(var(--surface))] rounded-xl border border-[rgb(var(--border))]">
                  <input
                    type="text"
                    placeholder="Название"
                    value={editDraft.name}
                    onChange={e => setEditDraft({ ...editDraft, name: e.target.value })}
                    className="px-3 py-2 bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded-xl text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Новый API Ключ (оставьте пустым, чтобы не менять)"
                    value={editDraft.api_key}
                    onChange={e => setEditDraft({ ...editDraft, api_key: e.target.value })}
                    className="px-3 py-2 bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded-xl text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Каналы для воспроизведения (через запятую)"
                    value={editDraft.channels}
                    onChange={e => setEditDraft({ ...editDraft, channels: e.target.value })}
                    className="px-3 py-2 bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded-xl text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(p.id)}
                      disabled={editSaving}
                      className="px-4 py-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-colors"
                    >
                      {editSaving ? 'Сохранение...' : '💾 Сохранить'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 bg-[rgb(var(--surface-2))] rounded-xl font-medium text-sm"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {providers.length === 0 && (
            <div className="py-12 text-center">
              <div className="text-4xl mb-3">🎵</div>
              <p className="text-[rgb(var(--text-secondary))]">Нет подключённых сервисов. Добавьте первый!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}