'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

type Provider = { id: number; type: string; name: string; enabled: boolean; streamUrl: string };
type AvailableType = { value: string; label: string; icon: string; category: string };

export default function MusicPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [availableTypes, setAvailableTypes] = useState<AvailableType[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newProvider, setNewProvider] = useState({ type: 'youtube', name: '', api_key: '', webhook_url: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadProviders(); }, []);

  async function loadProviders() {
    try {
      const data = await api.music.getProviders();
      setProviders((data.providers as Provider[]) || []);
      setAvailableTypes((data.available_types as AvailableType[]) || []);
    } catch {}
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
      });
      setShowAdd(false);
      setNewProvider({ type: 'youtube', name: '', api_key: '', webhook_url: '' });
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
          <div className="flex flex-wrap gap-2 mb-4 p-4 bg-[rgb(var(--surface-2))] rounded-xl border border-[rgb(var(--border))]">
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
            <button
              onClick={addProvider}
              disabled={saving}
              className="px-4 py-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-colors"
            >
              {saving ? 'Сохранение...' : '💾 Сохранить'}
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {providers.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-3 bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] rounded-xl">
              <span className="text-xl">{availableTypes.find(t => t.value === p.type)?.icon || '🎵'}</span>
              <div className="flex-1">
                <div className="font-medium text-sm">{p.name || p.type}</div>
                <div className="text-[rgb(var(--text-secondary))] text-xs">{p.type}</div>
              </div>
              <span className={`text-xs font-medium ${p.enabled ? 'text-green-400' : 'text-red-400'}`}>
                {p.enabled ? '🟢 Активен' : '🔴 Выкл'}
              </span>
              {p.streamUrl && (
                <a href={p.streamUrl} target="_blank" rel="noreferrer"
                  className="px-2 py-1 text-cyan-400 hover:bg-cyan-400/10 rounded-lg text-xs transition-colors">
                  ▶ Слушать
                </a>
              )}
              <button
                onClick={() => deleteProvider(p.id)}
                className="px-2 py-1 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
              >✕</button>
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