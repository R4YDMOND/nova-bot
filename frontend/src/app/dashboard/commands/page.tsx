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
import {
  BUILTIN_COMMANDS, BuiltinOverride, CATEGORY_LABELS, Category, CommandsConfig,
  CustomCommand, EMPTY_CONFIG, PERMISSION_LABELS, Permission, Platform,
  mergeBuiltinOverrides,
} from '@/lib/commands-catalog';

const MODULE_NAME = 'commands';
type Server = DashboardServer;
type SortKey = 'name_asc' | 'name_desc' | 'created';

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
  enabled: boolean;
  createdAt?: string;
  custom?: CustomCommand;
  builtinOverride?: BuiltinOverride;
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
          ? { builtin: mergeBuiltinOverrides(saved.builtin || []), custom: saved.custom || [] }
          : { builtin: mergeBuiltinOverrides([]), custom: [] });
      })
      .catch(() => setConfig({ builtin: mergeBuiltinOverrides([]), custom: [] }))
      .finally(() => setLoading(false));
  }, [effectiveServer, effectiveServerId]);

  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingConfig = useRef<CommandsConfig | null>(null);

  const flushPersist = async () => {
    if (!effectiveServer || !pendingConfig.current) return;
    const next = pendingConfig.current;
    setSaving(true);
    try {
      const res = await api.modules.saveConfig(String(effectiveServerId), effectiveServer.platform, MODULE_NAME, next);
      if (res.error) throw new Error(res.error);
      pendingConfig.current = null;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert('❌ Не удалось сохранить изменения\n🌐 Сервер бота мог «заснуть» (free-план) — подождите немного и повторите переключение');
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
          enabled: override?.enabled ?? true,
          builtinOverride: override,
        };
      });
    const customs: ViewCommand[] = config.custom
      .filter(c => c.platforms.includes(platformFilter))
      .map(c => ({
        kind: 'custom', key: `custom:${c.id}`, icon: '⚙️', name: c.name, description: c.description,
        category: c.category, platforms: c.platforms, cooldown: c.cooldown, permission: c.permission,
        enabled: c.enabled, createdAt: c.createdAt, custom: c,
      }));
    return [...builtins, ...customs];
  }, [config, platformFilter]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let list = allCommands.filter(c =>
      (categoryFilter === 'all' || c.category === categoryFilter) &&
      (c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
    );
    list = [...list].sort((a, b) => {
      if (sortKey === 'name_asc') return a.name.localeCompare(b.name);
      if (sortKey === 'name_desc') return b.name.localeCompare(a.name);
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
    return list;
  }, [allCommands, searchQuery, categoryFilter, sortKey]);

  const previewCmd = filtered.find(c => c.key === previewKey) || filtered[0] || null;

  // ── Мутации ──────────────────────────────────────────────────────────
  const toggleBuiltin = (name: string) => {
    const base = BUILTIN_COMMANDS.find(c => c.name === name)!;
    const next = config.builtin.some(o => o.name === name)
      ? config.builtin.map(o => o.name === name ? { ...o, enabled: !o.enabled } : o)
      : [...config.builtin, { name, enabled: false, cooldown: base.defaultCooldown, permission: base.defaultPermission }];
    persist({ ...config, builtin: next });
  };

  const updateBuiltin = (name: string, patch: Partial<BuiltinOverride>) => {
    const base = BUILTIN_COMMANDS.find(c => c.name === name)!;
    const next = config.builtin.some(o => o.name === name)
      ? config.builtin.map(o => o.name === name ? { ...o, ...patch } : o)
      : [...config.builtin, { name, enabled: true, cooldown: base.defaultCooldown, permission: base.defaultPermission, ...patch }];
    persist({ ...config, builtin: next });
  };

  const toggleCustom = (id: string) =>
    persist({ ...config, custom: config.custom.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c) });

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

  const enabledCount = allCommands.filter(c => c.enabled).length;
  const builtinCount = allCommands.filter(c => c.kind === 'builtin').length;
  const customCount = allCommands.filter(c => c.kind === 'custom').length;

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
          <Button onClick={() => setModalCmd('new')} variant="gradient" className="flex items-center gap-1.5 text-sm px-5 py-2.5">
            <Plus className="w-4 h-4" /> Добавить команду
          </Button>
        </div>
      </div>

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
              <option value="created">По дате создания</option>
            </select>
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
                            <span className={cn('text-xs px-2 py-0.5 rounded-full', cmd.enabled ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400')}>
                              {cmd.enabled ? '🟢 Активна' : '🔴 Неактивна'}
                            </span>
                            {cmd.permission !== 'all' && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">🔒 {PERMISSION_LABELS[cmd.permission]}</span>
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
                  {previewCmd.permission !== 'all' && (
                    <div className="flex items-center gap-1.5 text-amber-400"><ShieldIcon className="w-3.5 h-3.5" /> {PERMISSION_LABELS[previewCmd.permission]}</div>
                  )}
                  <div className="flex items-center gap-1.5 text-[rgb(var(--text-secondary))]"><Clock className="w-3.5 h-3.5" /> Кулдаун: {previewCmd.cooldown > 0 ? `${previewCmd.cooldown} секунд` : 'нет'}</div>
                  <div className="flex items-center gap-1.5 text-[rgb(var(--text-secondary))]">
                    <Globe className="w-3.5 h-3.5" /> Платформы: {previewCmd.platforms.map(p => p === 'vk' ? 'VK' : 'Lolka').join(', ')}
                  </div>
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
                    <div>
                      <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">Права доступа</label>
                      <select
                        value={previewCmd.permission}
                        onChange={e => updateBuiltin(previewCmd.name, { permission: e.target.value as Permission })}
                        className="input w-full cursor-pointer text-sm"
                      >
                        {(Object.keys(PERMISSION_LABELS) as Permission[]).map(p => (
                          <option key={p} value={p}>{PERMISSION_LABELS[p]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Модалка создания/редактирования */}
      {modalCmd !== null && (
        <CommandModal
          initial={modalCmd === 'new' ? null : modalCmd}
          existing={config.custom}
          onClose={() => setModalCmd(null)}
          onSave={saveCustom}
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

      {saved && (
        <div className="fixed bottom-6 right-6 bg-green-400 text-black px-5 py-3 rounded-2xl font-semibold shadow-xl z-50 animate-bounce flex items-center gap-2">
          <Check className="w-5 h-5" /> Команда сохранена
        </div>
      )}
      {saving && !saved && (
        <div className="fixed bottom-6 right-6 bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] text-[rgb(var(--text))] px-5 py-3 rounded-2xl font-medium shadow-xl z-50 flex items-center gap-2">
          <Save className="w-4 h-4 animate-pulse" /> Сохранение...
        </div>
      )}
    </div>
  );
}
