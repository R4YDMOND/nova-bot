'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Zap, Search, Plus, Pencil, Trash2, Check, Eye, Save,
  Globe, Clock, Shield as ShieldIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/toggle';
import { api, DashboardServer } from '@/lib/api';
import { useServer } from '@/context/ServerProvider';
import { NoServerSelected } from '@/components/NoServerSelected';
import { PlatformIcon } from '@/components/PlatformIcon';
import { cn } from '@/lib/utils';
import { CommandModal } from './CommandModal';
import { RoleMultiSelect, ChannelMultiSelect } from '@/components/ranking/RankingFormControls';
import {
  BUILTIN_COMMANDS, BuiltinOverride, CATEGORY_LABELS, Category, CommandsConfig,
  CustomCommand, EMPTY_CONFIG, PERMISSION_LABELS, Permission, Platform,
  mergeBuiltinOverrides, defaultBuiltinOverride, normalizeCustomCommand, sanitizeImportedCommand,
} from '@/lib/commands-catalog';
import type { RankingRole, RankingChannel } from '@/lib/api';

// VK: реальные уровни руководителей сообщества. Lolka не показывается в этом списке —
// доступ на Lolka определяется ролями/каналами (см. ChannelMultiSelect/RoleMultiSelect ниже). ТЗ №7.1.
const VK_PERMISSION_OPTIONS: Permission[] = ['all', 'moderator', 'editor', 'administrator', 'advertiser', 'owner'];

const MODULE_NAME = 'commands';
type Server = DashboardServer;
type SortKey = 'name_asc' | 'name_desc' | 'created' | 'updated' | 'popularity' | 'cooldown';

// Единая карточка для рендера — и встроенная, и пользовательская команда.
interface ViewCommand {
  kind: 'builtin' | 'custom';
  key: string;
  icon: string;
  name: string;
  description: string;
  category: Category;
  platforms: Platform[];
  cooldown: number;
  permission: Permission;
  allowedRoles: string[];
  ignoredRoles: string[];
  allowedChannels: string[];
  ignoredChannels: string[];
  enabled: boolean;
  isFavorite: boolean;
  isDraft: boolean;
  createdAt?: string;
  updatedAt?: string;
  usageCount: number;
  custom?: CustomCommand;
  builtinOverride?: BuiltinOverride;
}

/** Есть ли ограничение доступа — под текущую платформу (VK: уровень; Lolka: роли/каналы). */
function hasAccessRestriction(c: ViewCommand, platform: Platform): boolean {
  if (platform === 'vk') return c.permission !== 'all';
  return c.allowedRoles.length > 0 || c.ignoredRoles.length > 0 || c.allowedChannels.length > 0 || c.ignoredChannels.length > 0;
}

export default function CommandsPage() {
  const { servers, selectedServer, selectedServerId, selectServer, loading: serverLoading } = useServer();
  const [platformFilter, setPlatformFilter] = useState<Platform>('vk');
  const [config, setConfig] = useState<CommandsConfig>(EMPTY_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('name_asc');

  const [modalCmd, setModalCmd] = useState<CustomCommand | null | 'new'>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomCommand | null>(null);
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  const filteredServers = useMemo(() => servers.filter((s: Server) => s.platform === platformFilter), [servers, platformFilter]);
  const effectiveServer = useMemo(() => {
    if (selectedServer && selectedServer.platform === platformFilter) return selectedServer;
    return filteredServers[0] || null;
  }, [selectedServer, platformFilter, filteredServers]);
  const effectiveServerId = effectiveServer?.id ?? selectedServerId;

  useEffect(() => {
    if (effectiveServer && effectiveServer.server_id !== selectedServerId) {
      selectServer(effectiveServer.server_id);
    }
  }, [effectiveServer, selectedServerId, selectServer]);

  useEffect(() => {
    if (!effectiveServer) { setLoading(false); return; }
    setLoading(true);
    api.modules.getConfig<CommandsConfig>(String(effectiveServerId), MODULE_NAME)
      .then(saved => {
        setConfig(saved
          ? { builtin: mergeBuiltinOverrides(saved.builtin || []), custom: (saved.custom || []).map(normalizeCustomCommand) }
          : { builtin: mergeBuiltinOverrides([]), custom: [] });
      })
      .catch(() => setConfig({ builtin: mergeBuiltinOverrides([]), custom: [] }))
      .finally(() => setLoading(false));
  }, [effectiveServer, effectiveServerId]);

  // ── Роли/каналы Lolka для гибкого доступа (allowedRoles/ignoredRoles/allowedChannels/
  // ignoredChannels) — переиспользуем эндпоинты, уже используемые вкладкой «Награды» рейтинга. ТЗ №7.1.
  const [lolkaRoles, setLolkaRoles] = useState<RankingRole[]>([]);
  const [lolkaChannels, setLolkaChannels] = useState<RankingChannel[]>([]);
  const [lolkaRolesLoading, setLolkaRolesLoading] = useState(false);
  const [lolkaChannelsLoading, setLolkaChannelsLoading] = useState(false);
  const [lolkaRolesError, setLolkaRolesError] = useState<string | undefined>();
  const [lolkaChannelsError, setLolkaChannelsError] = useState<string | undefined>();

  useEffect(() => {
    if (!effectiveServer || effectiveServer.platform !== 'lolka') return;
    // ВАЖНО: сюда нужен внешний guild_id Lolka (effectiveServer.server_id), а не внутренний
    // ID сервера в БД (effectiveServerId/effectiveServer.id) — /api/lolka/roles и
    // /api/lolka/channels пересылают server_id напрямую в реальный Lolka API как ID гильдии,
    // без резолва через БД (в отличие от /api/settings/modules).
    const guildId = effectiveServer.server_id;
    setLolkaRolesLoading(true);
    api.ranking.getRoles(guildId)
      .then(res => { if (res.error) setLolkaRolesError(res.error); else setLolkaRoles(res.roles || []); })
      .catch(() => setLolkaRolesError('Не удалось загрузить роли'))
      .finally(() => setLolkaRolesLoading(false));
    setLolkaChannelsLoading(true);
    api.ranking.getChannels(guildId, 'lolka')
      .then(res => { if (res.error) setLolkaChannelsError(res.error); else setLolkaChannels(res.channels || []); })
      .catch(() => setLolkaChannelsError('Не удалось загрузить каналы'))
      .finally(() => setLolkaChannelsLoading(false));
  }, [effectiveServer]);

  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingConfig = useRef<CommandsConfig | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const flushPersist = async () => {
    if (!effectiveServer || !pendingConfig.current) return;
    const next = pendingConfig.current;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await api.modules.saveConfig(String(effectiveServerId), effectiveServer.platform, MODULE_NAME, next);
      if (res.error) throw new Error(res.error);
      pendingConfig.current = null;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Не toast: пропадает сам через несколько секунд и легко теряется среди списка команд.
      // Постоянная плашка снизу — видна, пока пользователь явно не нажмёт "Повторить" (данные
      // при этом не теряются — pendingConfig.current сохраняет последнее изменение).
      setSaveError('Сервер бота не отвечает (уже после повторной попытки)');
    } finally {
      setSaving(false);
    }
  };

  // Тумблер переключается мгновенно (оптимистичный UI), а запрос на сервер уходит
  // одним пакетом через 800мс после последнего изменения — вместо запроса на каждый клик.
  const persist = (next: CommandsConfig) => {
    setConfig(next);
    pendingConfig.current = next;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(flushPersist, 800);
  };

  // ── Список команд для текущей платформы ────────────────────────────────
  const allCommands: ViewCommand[] = useMemo(() => {
    const builtins: ViewCommand[] = BUILTIN_COMMANDS
      .filter(c => c.platforms.includes(platformFilter))
      .map(c => {
        const override = config.builtin.find(o => o.name === c.name);
        return {
          kind: 'builtin', key: `builtin:${c.name}`, icon: c.icon, name: c.name,
          description: c.description, category: c.category, platforms: c.platforms,
          cooldown: override?.cooldown ?? c.defaultCooldown,
          permission: override?.permission ?? c.defaultPermission,
          allowedRoles: override?.allowedRoles ?? [], ignoredRoles: override?.ignoredRoles ?? [],
          allowedChannels: override?.allowedChannels ?? [], ignoredChannels: override?.ignoredChannels ?? [],
          enabled: override?.enabled ?? true,
          isFavorite: false, isDraft: false,
          usageCount: override?.usageCount ?? 0,
          builtinOverride: override,
        };
      });
    const customs: ViewCommand[] = config.custom
      .filter(c => c.platforms.includes(platformFilter))
      .map(c => ({
        kind: 'custom', key: `custom:${c.id}`, icon: '⚙️', name: c.name, description: c.description,
        category: c.category, platforms: c.platforms, cooldown: c.cooldown, permission: c.permission,
        allowedRoles: c.allowedRoles, ignoredRoles: c.ignoredRoles,
        allowedChannels: c.allowedChannels, ignoredChannels: c.ignoredChannels,
        enabled: c.enabled, isFavorite: c.isFavorite, isDraft: c.isDraft, createdAt: c.createdAt, updatedAt: c.updatedAt, usageCount: c.usageCount ?? 0, custom: c,
      }));
    return [...builtins, ...customs];
  }, [config, platformFilter]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let list = allCommands.filter(c =>
      (categoryFilter === 'all' || c.category === categoryFilter) &&
      (!favoritesOnly || c.isFavorite) &&
      (c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
    );
    list = [...list].sort((a, b) => {
      if (sortKey === 'name_asc') return a.name.localeCompare(b.name);
      if (sortKey === 'name_desc') return b.name.localeCompare(a.name);
      if (sortKey === 'popularity') return b.usageCount - a.usageCount;
      if (sortKey === 'cooldown') return a.cooldown - b.cooldown;
      if (sortKey === 'updated') return (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '');
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
    return list;
  }, [allCommands, searchQuery, categoryFilter, favoritesOnly, sortKey]);

  const previewCmd = filtered.find(c => c.key === previewKey) || filtered[0] || null;

  // ── Мутации ──────────────────────────────────────────────────────────
  const toggleBuiltin = (name: string) => {
    const base = BUILTIN_COMMANDS.find(c => c.name === name)!;
    const next = config.builtin.some(o => o.name === name)
      ? config.builtin.map(o => o.name === name ? { ...o, enabled: !o.enabled } : o)
      : [...config.builtin, { ...defaultBuiltinOverride(base), enabled: false }];
    persist({ ...config, builtin: next });
  };

  const updateBuiltin = (name: string, patch: Partial<BuiltinOverride>) => {
    const base = BUILTIN_COMMANDS.find(c => c.name === name)!;
    const next = config.builtin.some(o => o.name === name)
      ? config.builtin.map(o => o.name === name ? { ...o, ...patch } : o)
      : [...config.builtin, { ...defaultBuiltinOverride(base), ...patch }];
    persist({ ...config, builtin: next });
  };

  const toggleCustom = (id: string) =>
    persist({ ...config, custom: config.custom.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c) });

  const toggleFavorite = (id: string) =>
    persist({ ...config, custom: config.custom.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c) });

  const saveCustom = (cmd: CustomCommand) => {
    const exists = config.custom.some(c => c.id === cmd.id);
    const next = exists ? config.custom.map(c => c.id === cmd.id ? cmd : c) : [...config.custom, cmd];
    persist({ ...config, custom: next });
    setModalCmd(null);
  };

  const deleteCustom = (id: string) => {
    persist({ ...config, custom: config.custom.filter(c => c.id !== id) });
    setDeleteTarget(null);
  };

  // ── Экспорт/импорт (группа C, текстовое ТЗ раздел 12) — целиком на клиенте: команда уже
  // полностью представлена как JSON (CustomCommand), новый backend-эндпоинт не нужен.
  const downloadJson = (data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCommand = (cmd: CustomCommand) => downloadJson(cmd, `${cmd.name || 'command'}.nova-command.json`);
  const exportAllCustom = () => downloadJson(config.custom, `nova-commands-${platformFilter}.json`);

  const importFileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // разрешить повторный импорт того же файла
    if (!file) return;
    setImportError(null);
    const reader = new FileReader();
    reader.onload = () => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(reader.result));
      } catch {
        setImportError('Файл повреждён или не является JSON');
        return;
      }
      const items = Array.isArray(parsed) ? parsed : [parsed];
      const existingNames = new Set(config.custom.map(c => c.name.toLowerCase()));
      const imported: CustomCommand[] = [];
      const errors: string[] = [];
      for (const raw of items) {
        try {
          const cmd = sanitizeImportedCommand(raw, crypto.randomUUID());
          if (existingNames.has(cmd.name)) {
            errors.push(`«${cmd.name}» — команда с таким именем уже существует, пропущена`);
            continue;
          }
          existingNames.add(cmd.name);
          imported.push(cmd);
        } catch (err) {
          errors.push(err instanceof Error ? err.message : 'Неизвестная ошибка');
        }
      }
      if (imported.length === 0) {
        setImportError(errors[0] || 'Файл не содержит валидных команд');
        return;
      }
      persist({ ...config, custom: [...config.custom, ...imported] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (errors.length > 0) setImportError(`Импортировано ${imported.length}, пропущено: ${errors.join('; ')}`);
    };
    reader.onerror = () => setImportError('Не удалось прочитать файл');
    reader.readAsText(file);
  };

  const enabledCount = allCommands.filter(c => c.enabled).length;
  const builtinCount = allCommands.filter(c => c.kind === 'builtin').length;
  const customCount = allCommands.filter(c => c.kind === 'custom').length;

  // ── Статистика команд (группа C, текстовое ТЗ раздел 11 — блок в футере) ──────────────
  const pct = (n: number) => allCommands.length === 0 ? 0 : Math.round((n / allCommands.length) * 100);
  const disabledCount = allCommands.length - enabledCount;
  const categoryStats = useMemo(() => {
    const counts = new Map<Category, number>();
    for (const c of allCommands) counts.set(c.category, (counts.get(c.category) || 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([cat, count]) => ({ cat, count, pct: pct(count) }));
  }, [allCommands]);

  const platformPills = (
    <div className="flex p-1 rounded-lg border bg-[rgb(var(--surface))] border-[rgb(var(--border))]">
      {[
        { id: 'vk' as Platform, label: 'VK', color: 'bg-blue-500' },
        { id: 'lolka' as Platform, label: 'Lolka', color: 'bg-purple-500' },
      ].map(p => (
        <button
          key={p.id}
          onClick={() => setPlatformFilter(p.id)}
          title="Выберите платформу для управления командами"
          className={cn(
            'flex items-center gap-1.5 px-5 py-2.5 rounded-md text-sm font-bold transition-all',
            platformFilter === p.id
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))]'
          )}
        >
          <span className={cn('w-2 h-2 rounded-full', p.color)} />
          <span>{p.label}</span>
        </button>
      ))}
    </div>
  );

  if (serverLoading || loading) {
    return <div className="p-8 text-[rgb(var(--text-secondary))]">⏳ Загрузка...</div>;
  }

  if (filteredServers.length === 0) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-secondary))]">Платформа:</span>
          {platformPills}
        </div>
        <NoServerSelected
          heading={`Нет серверов ${platformFilter === 'vk' ? 'VK' : 'Lolka'}`}
          description={`Добавьте и настройте сервер ${platformFilter === 'vk' ? 'VK' : 'Lolka'} на странице управления серверами.`}
          link="/dashboard/servers"
          linkText="Перейти к серверам"
        />
      </div>
    );
  }

  if (!effectiveServer) {
    return <NoServerSelected title="⚡ Команды" />;
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Шапка */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text))] flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            Команды
          </h1>
          <p className="text-[rgb(var(--text-secondary))] text-sm mt-1">Управляйте доступными командами бота</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-secondary))] hidden sm:inline">Платформа:</span>
          {platformPills}
          <Button
            onClick={exportAllCustom}
            variant="outline"
            title="Скачать все пользовательские команды этой платформы одним JSON-файлом"
            disabled={config.custom.length === 0}
            className="flex items-center gap-1.5 text-sm px-4 py-2.5"
          >
            📤 Экспорт
          </Button>
          <Button onClick={() => importFileRef.current?.click()} variant="outline" className="flex items-center gap-1.5 text-sm px-4 py-2.5">
            📥 Импорт
          </Button>
          <input ref={importFileRef} type="file" accept="application/json,.json" onChange={handleImportFile} className="hidden" />
          <Button onClick={() => setModalCmd('new')} variant="gradient" className="flex items-center gap-1.5 text-sm px-5 py-2.5">
            <Plus className="w-4 h-4" /> Добавить команду
          </Button>
        </div>
      </div>

      {importError && (
        <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm rounded-xl px-4 py-3">
          <span>⚠️</span>
          <span className="flex-1">{importError}</span>
          <button onClick={() => setImportError(null)} className="opacity-70 hover:opacity-100" aria-label="Скрыть">✕</button>
        </div>
      )}

      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-[rgb(var(--text-secondary))] text-xs uppercase tracking-wider mb-1">Активных команд</div>
          <div className="text-2xl font-bold text-[rgb(var(--text))]">{enabledCount} / {allCommands.length}</div>
          <div className="text-xs text-green-400 mt-1">🟢 Все системы в норме</div>
        </Card>
        <Card className="p-5">
          <div className="text-[rgb(var(--text-secondary))] text-xs uppercase tracking-wider mb-1">Встроенных команд</div>
          <div className="text-2xl font-bold text-[rgb(var(--text))]">{builtinCount}</div>
          <div className="text-xs text-[rgb(var(--text-secondary))] mt-1">Системные команды</div>
        </Card>
        <Card className="p-5">
          <div className="text-[rgb(var(--text-secondary))] text-xs uppercase tracking-wider mb-1">Пользовательских команд</div>
          <div className="text-2xl font-bold text-[rgb(var(--text))]">{customCount}</div>
          <div className="text-xs text-[rgb(var(--text-secondary))] mt-1">Создано вами</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          {/* Поиск и фильтры */}
          <div className="flex gap-3 flex-wrap items-center">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-secondary))]" />
              <input
                type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Поиск команд..." className="input pl-9 w-64"
              />
            </div>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as Category | 'all')} className="input cursor-pointer text-sm">
              <option value="all">Все категории</option>
              {(Object.keys(CATEGORY_LABELS) as Category[]).map(c => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
            <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)} className="input cursor-pointer text-sm">
              <option value="name_asc">По имени (А-Я)</option>
              <option value="name_desc">По имени (Я-А)</option>
              <option value="popularity">По популярности</option>
              <option value="cooldown">По кулдауну</option>
              <option value="created">По дате создания</option>
              <option value="updated">По дате изменения</option>
            </select>
            <button
              type="button"
              onClick={() => setFavoritesOnly(v => !v)}
              title="Только избранное"
              className={cn(
                'input flex items-center gap-1.5 px-3 cursor-pointer text-sm whitespace-nowrap',
                favoritesOnly && 'border-amber-400 text-amber-500 bg-amber-500/10'
              )}
            >
              {favoritesOnly ? '⭐' : '☆'} Избранное
            </button>
          </div>

          {/* Список команд */}
          <Card className="p-0">
            {filtered.length === 0 ? (
              searchQuery ? (
                <div className="py-16 text-center">
                  <div className="text-4xl mb-3">🔍</div>
                  <h3 className="text-[rgb(var(--text))] font-semibold mb-1">Ничего не найдено</h3>
                  <p className="text-[rgb(var(--text-secondary))] text-sm mb-4">По запросу «{searchQuery}» команды не найдены</p>
                  <Button variant="outline" onClick={() => { setSearchQuery(''); setCategoryFilter('all'); }}>🔄 Сбросить фильтр</Button>
                </div>
              ) : (
                <div className="py-16 text-center">
                  <div className="text-4xl mb-3">📭</div>
                  <h3 className="text-[rgb(var(--text))] font-semibold mb-1">Команды не найдены</h3>
                  <p className="text-[rgb(var(--text-secondary))] text-sm mb-4">
                    Пока нет созданных команд для {platformFilter === 'vk' ? 'VK' : 'Lolka'}
                  </p>
                  <Button variant="gradient" onClick={() => setModalCmd('new')} className="flex items-center gap-1.5 mx-auto">
                    <Plus className="w-4 h-4" /> Создать первую команду
                  </Button>
                </div>
              )
            ) : (
              <div className="divide-y divide-[rgb(var(--border))]">
                {filtered.map(cmd => (
                  <div
                    key={cmd.key}
                    onClick={() => setPreviewKey(cmd.key)}
                    className={cn(
                      'p-4 cursor-pointer transition-colors hover:bg-[rgb(var(--surface-2))]',
                      previewCmd?.key === cmd.key && 'bg-[rgb(var(--surface-2))]'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="text-xl leading-none mt-0.5">{cmd.icon}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="bg-[rgb(var(--surface-2))] px-2 py-0.5 rounded-lg text-primary font-mono text-xs">/{cmd.name}</code>
                            {cmd.isDraft ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-400">📝 Черновик</span>
                            ) : (
                              <span className={cn('text-xs px-2 py-0.5 rounded-full', cmd.enabled ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400')}>
                                {cmd.enabled ? '🟢 Активна' : '🔴 Неактивна'}
                              </span>
                            )}
                            {hasAccessRestriction(cmd, platformFilter) && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                                🔒 {platformFilter === 'vk' ? PERMISSION_LABELS[cmd.permission] : 'Ограничен доступ'}
                              </span>
                            )}
                          </div>
                          <p className="text-[rgb(var(--text-secondary))] text-sm mt-0.5 truncate">{cmd.description}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-[rgb(var(--text-secondary))]">
                            <span>{CATEGORY_LABELS[cmd.category]}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {cmd.cooldown > 0 ? `${cmd.cooldown} сек.` : '—'}</span>
                            <span className="flex items-center gap-1">
                              {cmd.platforms.map(p => <PlatformIcon key={p} platform={p} className="w-3.5 h-3.5 rounded" />)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        {cmd.kind === 'custom' && cmd.custom && (
                          <>
                            <button title={cmd.isFavorite ? 'Убрать из избранного' : 'В избранное'} onClick={() => toggleFavorite(cmd.custom!.id)}
                              className={cn(
                                'p-1.5 rounded-md border transition-colors',
                                cmd.isFavorite
                                  ? 'border-amber-400 text-amber-400 bg-amber-500/10'
                                  : 'border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] hover:text-amber-400 hover:bg-amber-500/10'
                              )}>
                              {cmd.isFavorite ? '⭐' : '☆'}
                            </button>
                            <button title="Экспортировать команду" onClick={() => exportCommand(cmd.custom!)}
                              className="p-1.5 rounded-md border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-2))] transition-colors">
                              📤
                            </button>
                            <button title="Редактировать команду" onClick={() => setModalCmd(cmd.custom!)}
                              className="p-1.5 rounded-md border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-2))] transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button title="Удалить команду" onClick={() => setDeleteTarget(cmd.custom!)}
                              className="p-1.5 rounded-md border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] hover:text-red-400 hover:bg-red-500/10 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <Switch
                          checked={cmd.enabled}
                          onCheckedChange={() => cmd.kind === 'builtin' ? toggleBuiltin(cmd.name) : toggleCustom(cmd.custom!.id)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Превью */}
        <div className="lg:col-span-4">
          <Card className="p-5 sticky top-6">
            <h3 className="text-sm font-semibold text-[rgb(var(--text))] mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" /> Предпросмотр
            </h3>
            {!previewCmd ? (
              <p className="text-[rgb(var(--text-secondary))] text-sm">Выберите команду из списка слева</p>
            ) : (
              <div className="space-y-3">
                <code className="block bg-[rgb(var(--surface-2))] px-3 py-2 rounded-lg text-primary font-mono text-sm">/{previewCmd.name}</code>
                <p className="text-[rgb(var(--text-secondary))] text-sm">{previewCmd.description}</p>

                <div className="space-y-1.5 text-sm">
                  <div className={cn('flex items-center gap-1.5', previewCmd.enabled ? 'text-green-400' : 'text-red-400')}>
                    {previewCmd.enabled ? '🟢 Активна' : '🔴 Неактивна'}
                  </div>
                  {hasAccessRestriction(previewCmd, platformFilter) && (
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <ShieldIcon className="w-3.5 h-3.5" />
                      {platformFilter === 'vk' ? PERMISSION_LABELS[previewCmd.permission] : 'Ограничен доступ (роли/каналы)'}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[rgb(var(--text-secondary))]"><Clock className="w-3.5 h-3.5" /> Кулдаун: {previewCmd.cooldown > 0 ? `${previewCmd.cooldown} секунд` : 'нет'}</div>
                  <div className="flex items-center gap-1.5 text-[rgb(var(--text-secondary))]">
                    <Globe className="w-3.5 h-3.5" /> Платформы: {previewCmd.platforms.map(p => p === 'vk' ? 'VK' : 'Lolka').join(', ')}
                  </div>
                  {previewCmd.usageCount > 0 && (
                    <div className="flex items-center gap-1.5 text-[rgb(var(--text-secondary))]">📊 Использований: {previewCmd.usageCount}</div>
                  )}
                </div>

                {previewCmd.custom?.params && (
                  <div className="pt-2 border-t border-[rgb(var(--border))]">
                    <div className="text-xs text-[rgb(var(--text-secondary))] mb-1">Использование:</div>
                    <code className="text-xs text-[rgb(var(--text))]">/{previewCmd.name} {previewCmd.custom.params}</code>
                  </div>
                )}
                {previewCmd.custom?.response && (
                  <div className="pt-2 border-t border-[rgb(var(--border))]">
                    <div className="text-xs text-[rgb(var(--text-secondary))] mb-1">Ответ бота:</div>
                    <div className="text-sm text-[rgb(var(--text))] whitespace-pre-wrap">{previewCmd.custom.response}</div>
                  </div>
                )}

                {previewCmd.kind === 'builtin' && (
                  <div className="pt-2 border-t border-[rgb(var(--border))] space-y-3">
                    <div>
                      <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Кулдаун (секунды)</label>
                      <input
                        type="number" min={0} max={86400} value={previewCmd.cooldown}
                        onChange={e => updateBuiltin(previewCmd.name, { cooldown: Number(e.target.value) })}
                        className="input w-full text-sm"
                      />
                    </div>
                    {platformFilter === 'vk' ? (
                      <div>
                        <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Права доступа</label>
                        <select
                          value={previewCmd.permission}
                          onChange={e => updateBuiltin(previewCmd.name, { permission: e.target.value as Permission })}
                          className="input w-full cursor-pointer text-sm"
                        >
                          {VK_PERMISSION_OPTIONS.map(p => (
                            <option key={p} value={p}>{PERMISSION_LABELS[p]}</option>
                          ))}
                        </select>
                        <p className="text-[10px] text-[rgb(var(--text-secondary))] mt-1">
                          По уровню руководителя сообщества VK (groups.getMembers)
                        </p>
                      </div>
                    ) : (
                      <>
                        <RoleMultiSelect
                          label="Разрешённые роли" roles={lolkaRoles} loading={lolkaRolesLoading} error={lolkaRolesError}
                          selected={previewCmd.allowedRoles}
                          onChange={next => updateBuiltin(previewCmd.name, { allowedRoles: next })}
                        />
                        <RoleMultiSelect
                          label="Игнорируемые роли" roles={lolkaRoles} loading={lolkaRolesLoading} error={lolkaRolesError}
                          selected={previewCmd.ignoredRoles}
                          onChange={next => updateBuiltin(previewCmd.name, { ignoredRoles: next })}
                        />
                        <ChannelMultiSelect
                          label="Разрешённые каналы" channels={lolkaChannels} loading={lolkaChannelsLoading} error={lolkaChannelsError}
                          selected={previewCmd.allowedChannels}
                          onChange={next => updateBuiltin(previewCmd.name, { allowedChannels: next })}
                        />
                        <ChannelMultiSelect
                          label="Игнорируемые каналы" channels={lolkaChannels} loading={lolkaChannelsLoading} error={lolkaChannelsError}
                          selected={previewCmd.ignoredChannels}
                          onChange={next => updateBuiltin(previewCmd.name, { ignoredChannels: next })}
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Статистика команд (footer, текстовое ТЗ раздел 11) */}
      {allCommands.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-[rgb(var(--text))] flex items-center gap-2 mb-4">📊 Статистика команд</h3>
          <div className="grid sm:grid-cols-2 gap-6 text-sm">
            <div className="space-y-1.5">
              <p className="text-[rgb(var(--text-secondary))]">Всего команд: <span className="text-[rgb(var(--text))] font-medium">{allCommands.length}</span></p>
              <p className="text-[rgb(var(--text-secondary))]">• Встроенных: <span className="text-[rgb(var(--text))] font-medium">{builtinCount} ({pct(builtinCount)}%)</span></p>
              <p className="text-[rgb(var(--text-secondary))]">• Пользовательских: <span className="text-[rgb(var(--text))] font-medium">{customCount} ({pct(customCount)}%)</span></p>
              <p className="text-[rgb(var(--text-secondary))]">• Отключённых: <span className="text-[rgb(var(--text))] font-medium">{disabledCount} ({pct(disabledCount)}%)</span></p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[rgb(var(--text-secondary))] mb-1">Популярные категории:</p>
              {categoryStats.map(({ cat, count, pct: p }) => (
                <p key={cat} className="text-[rgb(var(--text-secondary))]">
                  {CATEGORY_LABELS[cat]} — <span className="text-[rgb(var(--text))] font-medium">{count} {count === 1 ? 'команда' : 'команд'} ({p}%)</span>
                </p>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Модалка создания/редактирования */}
      {modalCmd !== null && (
        <CommandModal
          initial={modalCmd === 'new' ? null : modalCmd}
          existing={config.custom}
          onClose={() => setModalCmd(null)}
          onSave={saveCustom}
          lolkaRoles={lolkaRoles}
          lolkaChannels={lolkaChannels}
          lolkaRolesLoading={lolkaRolesLoading}
          lolkaChannelsLoading={lolkaChannelsLoading}
          lolkaRolesError={lolkaRolesError}
          lolkaChannelsError={lolkaChannelsError}
        />
      )}

      {/* Подтверждение удаления */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-3xl p-7 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[rgb(var(--text))] mb-2">🗑️ Удалить команду?</h3>
            <p className="text-[rgb(var(--text-secondary))] text-sm mb-6">
              Вы уверены, что хотите удалить команду «{deleteTarget.name}»? Это действие нельзя отменить.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>❌ Отмена</Button>
              <Button variant="destructive" onClick={() => deleteCustom(deleteTarget.id)}>✅ Удалить</Button>
            </div>
          </div>
        </div>
      )}

      {(saving || saved || saveError) && (
        <div
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50 px-6 py-4 flex flex-wrap items-center justify-center gap-3 shadow-2xl border-t text-sm sm:text-base',
            saveError
              ? 'bg-red-500 border-red-600 text-white'
              : saved
              ? 'bg-emerald-500 border-emerald-600 text-black'
              : 'bg-[rgb(var(--surface-2))] border-[rgb(var(--border))] text-[rgb(var(--text))]'
          )}
        >
          {saveError ? (
            <>
              <span className="flex items-center gap-2 font-medium">❌ Не удалось сохранить изменения: {saveError}</span>
              <Button size="sm" variant="outline" className="!bg-white !text-red-600 hover:!bg-red-50" onClick={flushPersist}>
                🔄 Повторить
              </Button>
              <button onClick={() => setSaveError(null)} className="ml-1 opacity-80 hover:opacity-100 text-lg leading-none" aria-label="Скрыть">✕</button>
            </>
          ) : saved ? (
            <span className="flex items-center gap-2 font-semibold"><Check className="w-5 h-5" /> Изменения сохранены</span>
          ) : (
            <span className="flex items-center gap-2 font-medium"><Save className="w-4 h-4 animate-pulse" /> Сохранение...</span>
          )}
        </div>
      )}
    </div>
  );
}
