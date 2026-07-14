'use client';
import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { api } from '@/lib/api';
import { useServer } from '@/context/ServerProvider';
import { Plus, Trash2, X } from 'lucide-react';
import { PlatformIcon, PLATFORM_LABEL } from '@/components/PlatformIcon';

type PlatformFilter = 'all' | 'vk' | 'lolka';
const FILTER_TABS: { value: PlatformFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'vk', label: 'VK' },
  { value: 'lolka', label: 'Lolka' },
];

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

  // Фильтр платформ: серверы уже загружены один раз в ServerProvider (кэш в React state),
  // поэтому переключение вкладок — это чистая фильтрация на клиенте, без запросов к API.
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const filteredServers = useMemo(() => {
    if (platformFilter === 'all') return servers;
    return servers.filter(s => s.platform === platformFilter);
  }, [servers, platformFilter]);

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
      {/* Главный баннер — Nova Bot Status */}
      <div className="bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-gradient px-4 sm:px-8 py-12 sm:py-16 rounded-b-3xl shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center shrink-0 overflow-hidden p-4 sm:p-5">
              <PlatformIcon platform="lolka" className="w-full h-full rounded-xl" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Nova Bot в Lolka</h1>
              <p className="text-white/80 text-sm sm:text-base mb-4">
                Управляйте подключёнными сообществами VK и серверами Lolka
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                {botStatus && (
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                      botStatus.connected
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : botStatus.configured
                          ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        botStatus.connected ? 'bg-green-400' : botStatus.configured ? 'bg-yellow-400' : 'bg-red-400'
                      }`}></span>
                      {botStatus.connected ? 'Бот подключён' : botStatus.configured ? 'Ждём соединения' : 'Не настроен'}
                    </span>
                  </div>
                )}
                <Button 
                  onClick={inviteBot} 
                  disabled={inviteLoading}
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30 w-full sm:w-auto"
                  variant="outline"
                >
                  {inviteLoading ? 'Открываем...' : '➕ Добавить бота на сервер'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {/* Заголовок и кнопки управления */}
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

            {/* Сообщение синхронизации */}
            {syncMessage && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${
                syncMessage.type === 'ok'
                  ? 'text-green-400 bg-green-500/10 border-green-500/20'
                  : 'text-red-400 bg-red-500/10 border-red-500/20'
              }`}>
                {syncMessage.type === 'ok' ? '✅' : '⚠️'} {syncMessage.text}
              </div>
            )}

            {/* Сообщение об ошибке удаления */}
            {deleteError && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium text-red-400 bg-red-500/10 border-red-500/20">
                ⚠️ {deleteError}
              </div>
            )}
          </div>

          {/* Кнопки управления — сверху на Desktop, FAB на Mobile */}
          <div className="hidden md:flex gap-3 flex-wrap">
            <Button 
              onClick={syncAllPlatforms} 
              disabled={syncing}
              variant="secondary"
            >
              {syncing ? '🔄 Синхронизируем...' : '🔄 Синхронизировать'}
            </Button>
            <Button onClick={openModal} className="ml-auto">
              <Plus className="w-4 h-4 mr-2" />
              Добавить сервер
            </Button>
          </div>
        </div>

        {/* Фильтр платформ — данные уже в кэше (ServerProvider), переключение мгновенное */}
        {!loading && servers.length > 0 && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {FILTER_TABS.map(tab => {
              const count = tab.value === 'all' ? servers.length : servers.filter(s => s.platform === tab.value).length;
              const active = platformFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setPlatformFilter(tab.value)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md'
                      : 'bg-[rgb(var(--surface-2))] text-[rgb(var(--text-secondary))] border border-[rgb(var(--border))] hover:border-primary/40'
                  }`}
                >
                  {tab.value !== 'all' && <PlatformIcon platform={tab.value} className="w-4 h-4 rounded" />}
                  {tab.label} <span className={active ? 'text-white/80' : 'text-[rgb(var(--text-secondary))]'}>({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Сетка/список серверов — адаптивная */}
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
        ) : filteredServers.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-[rgb(var(--text))] mb-2">Нет серверов на этой платформе</h3>
            <p className="text-[rgb(var(--text-secondary))]">Попробуйте выбрать другую вкладку фильтра</p>
          </div>
        ) : (
          <>
            {/* Адаптивная сетка: 1 колонка mobile / 2 tablet / 3 desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServers.map(s => (
                <Card
                  key={s.id}
                  className={`group relative flex flex-col items-center text-center gap-4 p-6 min-h-[200px] cursor-pointer transition-all hover:shadow-lg ${
                    s.server_id === selectedServerId
                      ? 'border-2 border-primary bg-primary/5'
                      : 'border border-[rgb(var(--border))] hover:border-primary/40'
                  }`}
                  onClick={() => selectServer(s.server_id)}
                >
                  {/* Аватар: единый формат 64x64px, круглый. Значок платформы — бейдж поверх аватара */}
                  <div className="relative w-16 h-16 shrink-0">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center overflow-hidden">
                      {s.icon_url ? (
                        <img src={s.icon_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <PlatformIcon platform={s.platform} className="w-8 h-8 rounded-lg" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full ring-2 ring-[rgb(var(--surface))] overflow-hidden bg-[rgb(var(--surface))]">
                      <PlatformIcon platform={s.platform} className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Название и платформа */}
                  <div className="w-full">
                    <h3 className="font-bold text-base truncate text-[rgb(var(--text))]">{s.name}</h3>
                    <div className="flex justify-center mt-2">
                      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))]">
                        <PlatformIcon platform={s.platform} className="w-3.5 h-3.5 rounded" /> {PLATFORM_LABEL[s.platform]}
                      </span>
                    </div>
                  </div>

                  {/* Участники */}
                  <div className="text-sm text-[rgb(var(--text))] font-semibold">
                    👥 {s.member_count > 0 ? s.member_count.toLocaleString('ru-RU') : 'N/A'}
                  </div>

                  {/* ID */}
                  <div className="text-xs text-[rgb(var(--text-secondary))] font-mono">
                    ID: {s.server_id}
                  </div>

                  {/* Статус */}
                  {s.server_id === selectedServerId && (
                    <div className="text-xs text-primary font-bold">✓ Выбран</div>
                  )}

                  {/* Кнопка удаления */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeServer(s.id); }}
                    disabled={deletingId === s.id}
                    className="p-2 rounded-lg text-[rgb(var(--text-secondary))] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 md:opacity-0 md:group-hover:opacity-100"
                    title="Удалить из панели"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Плавающие кнопки на мобайле */}
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

      {/* Модалка добавления сервера */}
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