'use client';
import { useState, useEffect } from 'react';

const API_BASE = 'https://nova-bot-rpsy.onrender.com';

type Provider = { id: number; type: string; name: string; enabled: boolean; apiKey?: string };
type Track = { title: string; artist: string; url: string };

const TYPE_ICONS: Record<string, string> = {
  youtube: '▶️', yandex: '🎶', vk: '🎵', soundcloud: '☁️',
  yandex_radio: '📻', record: '🎵', dfm: '📡', europa_plus: '📻',
  nashe: '🎸', relax_fm: '🎶', like_fm: '🔠', shanson: '🎣', custom: '🔗',
};
const TYPE_LABELS: Record<string, string> = {
  youtube: 'YouTube Music', yandex: 'Яндекс.Музыка', vk: 'VK Музыка',
  soundcloud: 'SoundCloud', yandex_radio: 'Яндекс.Радио', record: 'Radio Record',
  dfm: 'DFM', europa_plus: 'Европа Плюс', nashe: 'Наше Радио',
  relax_fm: 'Relax FM', like_fm: 'Like FM', shanson: 'Радио Шансон', custom: 'Свой Webhook',
};
const RADIO_TYPES = ['yandex_radio', 'record', 'dfm', 'europa_plus', 'nashe', 'relax_fm', 'like_fm', 'shanson'];

export default function MusicPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [availableTypes, setAvailableTypes] = useState<{ value: string; label: string; icon: string }[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newProvider, setNewProvider] = useState({ type: 'youtube', name: '', api_key: '', webhook_url: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadProviders(); }, []);

  const loadProviders = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/music/providers?server_id=default`);
      const data = await res.json();
      setProviders(data.providers || []);
      setAvailableTypes(data.available_types || []);
    } catch {}
  };

  const addProvider = async () => {
    await fetch(`${API_BASE}/api/music/providers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        server_id: 'default',
        type: newProvider.type,
        name: newProvider.name || newProvider.type,
        api_key: newProvider.api_key,
        webhook_url: newProvider.webhook_url,
      }),
    }).catch(() => {});
    setShowAdd(false);
    setNewProvider({ type: 'youtube', name: '', api_key: '', webhook_url: '' });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    loadProviders();
  };

  const deleteProvider = async (id: number) => {
    await fetch(`${API_BASE}/api/music/providers/${id}`, { method: 'DELETE' }).catch(() => {});
    loadProviders();
  };

  const searchMusic = async () => {
    const provider = providers.find(p => p.id === selectedProviderId);
    if (!searchQuery.trim() || !provider) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/music/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: provider.type, query: searchQuery, api_key: provider.apiKey || '' }),
      });
      const data = await res.json();
      setSearchResults(data.tracks || []);
    } catch {}
    setLoading(false);
  };

  const needsKey = !RADIO_TYPES.includes(newProvider.type) && newProvider.type !== 'custom';

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">🎵 Музыка</h1>
        <p className="text-white/50 mt-1">Поиск треков и радиостанции для вашего сервера</p>
      </div>

      {/* Providers */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">🔌 Подключённые сервисы</h3>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
              showAdd ? 'bg-white/10 text-white' : 'bg-cyan-400 text-black hover:bg-cyan-300'
            }`}
          >
            {showAdd ? '✕ Отмена' : '+ Добавить'}
          </button>
        </div>

        {showAdd && (
          <div className="flex flex-wrap gap-2 mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
            <select
              value={newProvider.type}
              onChange={e => setNewProvider({ ...newProvider, type: e.target.value })}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
            >
              {availableTypes.length > 0
                ? availableTypes.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)
                : Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{TYPE_ICONS[k]} {v}</option>)
              }
            </select>
            <input
              type="text"
              placeholder="Название"
              value={newProvider.name}
              onChange={e => setNewProvider({ ...newProvider, name: e.target.value })}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm w-36"
            />
            {needsKey && (
              <input
                type="text"
                placeholder="API Ключ"
                value={newProvider.api_key}
                onChange={e => setNewProvider({ ...newProvider, api_key: e.target.value })}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm flex-1 min-w-40"
              />
            )}
            {newProvider.type === 'custom' && (
              <input
                type="text"
                placeholder="Webhook URL"
                value={newProvider.webhook_url}
                onChange={e => setNewProvider({ ...newProvider, webhook_url: e.target.value })}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm flex-1 min-w-40"
              />
            )}
            <button
              onClick={addProvider}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                saved ? 'bg-green-400 text-black' : 'bg-green-500 text-white hover:bg-green-400'
              }`}
            >
              {saved ? '✅' : '💾 Сохранить'}
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {providers.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
              <span className="text-xl">{TYPE_ICONS[p.type] || '🎵'}</span>
              <div className="flex-1">
                <div className="text-white font-medium text-sm">{p.name || TYPE_LABELS[p.type] || p.type}</div>
                <div className="text-white/40 text-xs">{TYPE_LABELS[p.type] || p.type}</div>
              </div>
              <span className={`text-xs font-medium ${p.enabled ? 'text-green-400' : 'text-red-400'}`}>
                {p.enabled ? '🟢 Активен' : '🔴 Выкл'}
              </span>
              <button
                onClick={() => deleteProvider(p.id)}
                className="px-2 py-1 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
              >✕</button>
            </div>
          ))}
          {providers.length === 0 && (
            <p className="text-white/30 text-center py-8">Нет подключённых сервисов. Добавьте первый!</p>
          )}
        </div>
      </div>

      {/* Search */}
      {providers.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">🔍 Поиск треков</h3>
          <div className="flex gap-2 mb-4 flex-wrap">
            <select
              value={selectedProviderId ?? ''}
              onChange={e => setSelectedProviderId(parseInt(e.target.value) || null)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
            >
              <option value="">Выберите сервис...</option>
              {providers.map(p => (
                <option key={p.id} value={p.id}>{TYPE_ICONS[p.type]} {p.name || TYPE_LABELS[p.type]}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Название трека..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchMusic()}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm flex-1 min-w-40"
            />
            <button
              onClick={searchMusic}
              disabled={loading}
              className="px-4 py-2 bg-cyan-400 text-black rounded-xl font-medium text-sm hover:bg-cyan-300 disabled:opacity-50 transition-colors"
            >
              {loading ? '⏳' : '🔍 Найти'}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {searchResults.map((track, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                <span className="text-white/30 text-sm w-6 text-center">{i + 1}</span>
                <div className="flex-1">
                  <div className="text-white font-medium text-sm">{track.title}</div>
                  <div className="text-white/40 text-xs">{track.artist}</div>
                </div>
                <a
                  href={track.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                >▶ Открыть</a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
