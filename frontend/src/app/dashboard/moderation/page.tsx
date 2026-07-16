'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { api, DashboardServer } from '@/lib/api';
import { useServer } from '@/context/ServerProvider';
import { NoServerSelected } from '@/components/NoServerSelected';
import { StatsPanel } from '@/components/moderation/StatsPanel';
import { cn } from '@/lib/utils';
import {
  Shield, Bot, Scale, ScrollText, UserCog, ClipboardList,
  Ban, ShieldAlert, Filter, Link as LinkIcon, Users, Smile,
  Type, Repeat, AlertTriangle, VolumeX, Gavel, Mail, FileText,
  MessageSquare, Sparkles, Search, Check, Save, BarChart3,
  Circle, Bell, Moon, Sun, TrendingUp, Lock, Eye, Swords,
  Hammer, CheckCircle, MessageSquareOff, ShieldCheck, ShieldOff,
  Plug, Unplug, Trash2, TestTube, Skull, Ghost, UserPlus
} from 'lucide-react';

const API_URL = 'https://nova-bot-rpsy.onrender.com';
const MODULE_NAME = 'moderation';

type Server = DashboardServer; // используем полный тип из API
type Platform = 'vk' | 'lolka';
type Tab = 'protection' | 'auto' | 'punish' | 'rules' | 'moderator' | 'log';
type LogFilter = 'all' | 'warn' | 'mute' | 'ban';

const TABS = [
  { id: 'protection' as Tab, label: 'Защита', icon: Shield },
  { id: 'auto' as Tab, label: 'Автомодерация', icon: Bot },
  { id: 'punish' as Tab, label: 'Наказания', icon: Scale },
  { id: 'rules' as Tab, label: 'Правила', icon: ScrollText },
  { id: 'moderator' as Tab, label: 'Модератор', icon: UserCog },
  { id: 'log' as Tab, label: 'Журнал', icon: ClipboardList },
];

const MOD_AVATARS = [
  { id: 'shield', icon: Shield, label: 'Щит', color: 'text-cyan-400' },
  { id: 'sword', icon: Swords, label: 'Меч', color: 'text-red-400' },
  { id: 'eye', icon: Eye, label: 'Око', color: 'text-purple-400' },
  { id: 'hammer', icon: Hammer, label: 'Молот', color: 'text-yellow-400' },
  { id: 'lock', icon: Lock, label: 'Замок', color: 'text-green-400' },
  { id: 'robot', icon: Bot, label: 'Робот', color: 'text-blue-400' },
];

type Settings = {
  antiSpam: boolean; antiRaid: boolean; badWordsFilter: boolean;
  captchaForNew: boolean; autoDeleteLinks: boolean;
  blockFraudLinks: boolean; blockZalgo: boolean; blockInviteLinks: boolean;
  autoModMentions: boolean; maxMentions: number;
  autoModEmoji: boolean; maxEmoji: number;
  autoModCaps: boolean; capsThreshold: number;
  autoModRepeats: boolean; repeatThreshold: number;
  maxWarnings: number; muteDuration: number; banDuration: number;
  logChannel: string; appealChannel: string;
  warnMessage: string; muteMessage: string; banMessage: string;
  rulesChannel: string; rulesUrl: string; rulesText: string;
  modBotName: string; modAvatarStyle: string; modAvatarUrl: string;
  useAIResponses: boolean; aiModel: string;
};

type LogEntry = {
  id: number;
  type: string;
  title: string;
  description: string;
  target_user_id?: string;
  target_message_id?: string;
  created_at: string;
};


// ── VK Connection (ТЗ №5) ──
type VKConnectionData = {
  id: number;
  group_id: string;
  group_name: string;
  is_active: boolean;
  created_at: string;
};

const DEFAULT_SETTINGS: Settings = {
  antiSpam: true, antiRaid: true, badWordsFilter: true,
  captchaForNew: true, autoDeleteLinks: false,
  blockFraudLinks: false, blockZalgo: false, blockInviteLinks: false,
  autoModMentions: true, maxMentions: 5,
  autoModEmoji: false, maxEmoji: 10,
  autoModCaps: true, capsThreshold: 70,
  autoModRepeats: true, repeatThreshold: 3,
  maxWarnings: 3, muteDuration: 10, banDuration: 1440,
  logChannel: '#логи-модерации', appealChannel: '',
  warnMessage: '{user}, вы нарушили правило {rule}. Предупреждение {count}/{max}.',
  muteMessage: '{user}, вы замьючены на {duration} минут. Причина: {reason}',
  banMessage: '{user}, вы забанены. Причина: {reason}. Апелляция: {appeal}',
  rulesChannel: '#правила', rulesUrl: '', rulesText: '1. Без спама\n2. Без оскорблений\n3. Без рекламы\n4. Уважать участников',
  modBotName: 'Nova Модератор', modAvatarStyle: 'shield', modAvatarUrl: '',
  useAIResponses: true, aiModel: 'auto',
};

export default function ModerationPage() {
  const { servers, selectedServer, selectedServerId, selectServer, loading: serverLoading } = useServer();
  const [platformFilter, setPlatformFilter] = useState<Platform>('vk');
  const [activeTab, setActiveTab] = useState<Tab>('protection');
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [stats, setStats] = useState({ blocked: 0, warnings: 0, captcha_solved: 0, total_events: 0 });
  const [statsPeriod, setStatsPeriod] = useState<'24h' | '7d' | '30d'>('7d');
  const [events, setEvents] = useState<Array<{ type: string; title: string; description: string; created_at: string }>>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  const [logFilter, setLogFilter] = useState<LogFilter>('all');
  const [logSearch, setLogSearch] = useState('');
  const [auditLog, setAuditLog] = useState<LogEntry[]>([]);
  const [logLoading, setLogLoading] = useState(true);

  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);



  const filteredServers = useMemo(() => servers.filter((s: Server) => s.platform === platformFilter), [servers, platformFilter]);

  const effectiveServer = useMemo(() => {
    if (selectedServer && selectedServer.platform === platformFilter) return selectedServer;
    return filteredServers[0] || null;
  }, [selectedServer, platformFilter, filteredServers]);

  const effectiveServerId = effectiveServer?.id ?? selectedServerId;

  // ── Синхронизация с глобальным ServerProvider (хедер + /dashboard/servers) ──
  // effectiveServer может отличаться от selectedServer (fallback на filteredServers[0]
  // при смене фильтра платформы) — без этого хедер и страница /dashboard/servers
  // показывают не тот сервер, что реально отображается/редактируется здесь.
  useEffect(() => {
    if (effectiveServer && effectiveServer.server_id !== selectedServerId) {
      selectServer(effectiveServer.server_id);
    }
  }, [effectiveServer, selectedServerId, selectServer]);

  // ── VK Connection state (ТЗ №5) ──
  const [vkConnections, setVkConnections] = useState<VKConnectionData[]>([]);
  const [vkLoading, setVkLoading] = useState(false);
  const [vkForm, setVkForm] = useState({ group_id: '', access_token: '', confirmation_code: '', webhook_secret: '' });
  const [vkTesting, setVkTesting] = useState<number | null>(null);

  useEffect(() => {
    if (!effectiveServer || platformFilter !== 'vk') { setVkConnections([]); return; }
    setVkLoading(true);
    api.vk.getConnections(effectiveServer.server_id)
      .then((d) => setVkConnections(d.connections || []))
      .catch(() => setVkConnections([]))
      .finally(() => setVkLoading(false));
  }, [effectiveServer, platformFilter]);

  const connectVK = async () => {
    if (!effectiveServer) return;
    setVkLoading(true);
    try {
      const data = await api.vk.createConnection({
        server_id: String(effectiveServer.server_id),
        group_id: vkForm.group_id,
        access_token: vkForm.access_token,
        confirmation_code: vkForm.confirmation_code,
        webhook_secret: vkForm.webhook_secret,
      });
      if (data.error) { alert(data.error); return; }
      setVkConnections(prev => [...prev, { id: data.connection_id!, group_id: vkForm.group_id, group_name: data.group_name || vkForm.group_id, is_active: true, created_at: new Date().toISOString() }]);
      setVkForm({ group_id: '', access_token: '', confirmation_code: '', webhook_secret: '' });
    } catch (e) {
      alert('Ошибка подключения VK');
    } finally {
      setVkLoading(false);
    }
  };

  const disconnectVK = async (id: number) => {
    if (!confirm('Отключить VK-сообщество?')) return;
    setVkLoading(true);
    try {
      await api.vk.deleteConnection(id);
      setVkConnections(prev => prev.filter(c => c.id !== id));
    } catch {
      alert('Ошибка отключения');
    } finally {
      setVkLoading(false);
    }
  };

  const testVK = async (id: number) => {
    setVkTesting(id);
    try {
      const data = await api.vk.testConnection(id);
      alert(data.status === 'ok' ? `Подключение активно: ${data.group_name}` : `Ошибка: ${data.error}`);
    } catch {
      alert('Ошибка тестирования');
    } finally {
      setVkTesting(null);
    }
  };

  useEffect(() => {
    if (!effectiveServer) { setSettingsLoading(false); return; }
    setSettingsLoading(true);
    api.modules.getConfig<Settings>(String(effectiveServerId), MODULE_NAME)
      .then((saved: Settings | null) => setSettings(saved ? { ...DEFAULT_SETTINGS, ...saved } : DEFAULT_SETTINGS))
      .catch(() => setSettings(DEFAULT_SETTINGS))
      .finally(() => setSettingsLoading(false));
  }, [effectiveServer, effectiveServerId]);

  useEffect(() => {
    if (!effectiveServer) return;
    setStatsLoading(true);
    api.moderation.getStats(effectiveServer.id, platformFilter, statsPeriod)
      .then(res => {
        setStats(res.stats);
        setEvents(res.recent_events);
      })
      .catch(() => {
        setStats({ blocked: 0, warnings: 0, captcha_solved: 0, total_events: 0 });
        setEvents([]);
      })
      .finally(() => setStatsLoading(false));
  }, [effectiveServer, platformFilter, statsPeriod]);

  useEffect(() => {
    if (!effectiveServer) { setAuditLog([]); setLogLoading(false); return; }
    setLogLoading(true);
    api.moderation.getLog(effectiveServer.server_id, 50)
      .then((d) => { setAuditLog(d.entries as LogEntry[] || []); setLogLoading(false); })
      .catch(() => setLogLoading(false));
  }, [effectiveServer]);

  const update = (key: keyof Settings, value: unknown) => setSettings(s => ({ ...s, [key]: value }));
  const toggle = (key: keyof Settings) => setSettings(s => ({ ...s, [key]: !s[key] }));

  const save = async () => {
    if (!effectiveServer) return;
    setSaving(true);
    try {
      const res: { error?: string } = await api.modules.saveConfig(String(effectiveServerId), effectiveServer.platform, MODULE_NAME, settings);
      if (res.error) throw new Error(res.error);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      alert('Не удалось сохранить настройки модерации');
    } finally {
      setSaving(false);
    }
  };

  const moderateVK = async (messageId: string, userId: string | undefined, action: 'delete' | 'ban' | 'warn') => {
    if (!effectiveServer || !vkConnections.length) {
      alert('VK-сообщество не подключено');
      return;
    }
    const conn = vkConnections[0];
    try {
      const data = await api.vk.moderate({
        group_id: conn.group_id,
        message_id: parseInt(messageId),
        action,
        user_id: userId ? parseInt(userId) : undefined,
        reason: 'Ручная модерация из журнала',
      });
      if (data.error) {
        alert(`Ошибка: ${data.error}`);
        return;
      }
      alert('Действие выполнено успешно');
      // Перезагружаем лог
      api.moderation.getLog(effectiveServer.server_id, 50)
        .then((d) => setAuditLog(d.entries as LogEntry[] || []));
    } catch {
      alert('Ошибка при выполнении действия');
    }
  };

  const filteredLog = auditLog.filter(e => {
    const matchType = logFilter === 'all'
      || (logFilter === 'warn' && e.type?.includes('warn'))
      || (logFilter === 'mute' && e.type?.includes('mute'))
      || (logFilter === 'ban' && e.type?.includes('ban'));
    const q = logSearch.toLowerCase();
    return matchType && (e.title?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q));
  });

  if (serverLoading || settingsLoading) {
    return <div className="p-8 text-[rgb(var(--text-secondary))]">Загрузка...</div>;
  }

  if (filteredServers.length === 0) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
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
    return <NoServerSelected title="Модерация" />;
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-[rgb(var(--text))] mb-1 flex items-center gap-2">
        <Shield className="w-6 h-6 text-cyan-400" />
        Модерация
      </h1>
      <p className="text-[rgb(var(--text-secondary))] text-sm mb-5">Защита, автомодерация, правила и журнал</p>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border mb-5 bg-[rgb(var(--surface-2))] border-[rgb(var(--border))]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-secondary))]">Платформа:</span>
          <div className="flex p-1 rounded-lg border bg-[rgb(var(--surface))] border-[rgb(var(--border))]">
            {[
              { id: 'vk' as Platform, label: 'VK', color: 'bg-blue-500' },
              { id: 'lolka' as Platform, label: 'Lolka', color: 'bg-purple-500' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPlatformFilter(p.id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold transition-all',
                  platformFilter === p.id
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))]'
                )}
              >
                <span className={cn("w-2 h-2 rounded-full", p.color)} />
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
        <Button onClick={save} disabled={saving} variant="gradient" className="flex items-center gap-1.5 text-sm">
          {saving ? 'Сохранение...' : saved ? <><Check className="w-4 h-4" /> Сохранено!</> : <><Save className="w-4 h-4" /> Сохранить настройки</>}
        </Button>
      </div>

      <div className="flex flex-wrap gap-1 mb-5">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                  : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-2))]'
              )}>
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        <div className={cn('space-y-5', activeTab === 'protection' ? 'lg:col-span-4' : 'lg:col-span-7')}>
          <div className={cn(
          "grid transition-all ease-out duration-500",
          platformFilter === 'vk' ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}>
          <div className="overflow-hidden">
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[rgb(var(--text))] mb-4 flex items-center gap-2">
              <Plug className="w-5 h-5 text-blue-400" />
              Подключение VK
            </h3>
            {vkLoading ? (
              <p className="text-[rgb(var(--text-secondary))] text-sm">Загрузка...</p>
            ) : vkConnections.length > 0 ? (
              <div className="space-y-3">
                {vkConnections.map(conn => (
                  <div key={conn.id} className="flex items-center justify-between p-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]">
                    <div>
                      <div className="text-[rgb(var(--text))] font-medium text-sm">{conn.group_name || `Сообщество ${conn.group_id}`}</div>
                      <div className="text-[rgb(var(--text-secondary))] text-xs">ID: {conn.group_id}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => testVK(conn.id)} disabled={vkTesting === conn.id}
                        className="p-2 rounded-lg border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface))] transition-colors disabled:opacity-50">
                        <TestTube className="w-4 h-4" />
                      </button>
                      <button onClick={() => disconnectVK(conn.id)}
                        className="p-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[rgb(var(--text-secondary))] text-xs block mb-1">ID сообщества</label>
                  <input type="text" value={vkForm.group_id} onChange={e => setVkForm(f => ({ ...f, group_id: e.target.value }))}
                    placeholder="240082352" className="w-full input text-sm" />
                </div>
                <div>
                  <label className="text-[rgb(var(--text-secondary))] text-xs block mb-1">Токен доступа</label>
                  <input type="password" value={vkForm.access_token} onChange={e => setVkForm(f => ({ ...f, access_token: e.target.value }))}
                    placeholder="vk1.a.xxx..." className="w-full input text-sm" />
                </div>
                <div>
                  <label className="text-[rgb(var(--text-secondary))] text-xs block mb-1">Код подтверждения Callback</label>
                  <input type="text" value={vkForm.confirmation_code} onChange={e => setVkForm(f => ({ ...f, confirmation_code: e.target.value }))}
                    placeholder="a1b2c3d4" className="w-full input text-sm" />
                </div>
                <div>
                  <label className="text-[rgb(var(--text-secondary))] text-xs block mb-1">Секретный ключ (опционально)</label>
                  <input type="password" value={vkForm.webhook_secret} onChange={e => setVkForm(f => ({ ...f, webhook_secret: e.target.value }))}
                    placeholder="secret_key" className="w-full input text-sm" />
                </div>
                <Button onClick={connectVK} disabled={vkLoading || !vkForm.group_id || !vkForm.access_token} variant="gradient" className="w-full text-sm">
                  <Plug className="w-4 h-4 mr-1.5" />
                  {vkLoading ? 'Подключение...' : 'Подключить сообщество'}
                </Button>
                <p className="text-[rgb(var(--text-secondary))] text-xs">
                  Токен берётся в настройках сообщества: Управление → Настройки → Работа с API → Ключи доступа
                </p>
              </div>
            )}
          </Card>
          </div>
        </div>

        {activeTab === 'protection' && (
            <Card className="p-5">
              <h3 className="text-lg font-semibold text-[rgb(var(--text))] mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                Базовая защита
              </h3>
              {([
                { key: 'antiSpam' as const, label: 'Антиспам', desc: 'Автоудаление спам-сообщений', icon: MessageSquareOff },
                { key: 'antiRaid' as const, label: 'Антирейд', desc: 'Защита от массовых атак', icon: ShieldAlert },
                { key: 'badWordsFilter' as const, label: 'Фильтр мата', desc: 'Удаление запрещённых слов', icon: Filter },
                { key: 'captchaForNew' as const, label: 'Капча для новых', desc: 'Проверка участников при входе', icon: Bot },
                { key: 'autoDeleteLinks' as const, label: 'Удаление ссылок', desc: 'Автоудаление всех ссылок', icon: LinkIcon },
              ] as const).map((item, i, arr) => (
                <div key={item.key} className={cn('flex justify-between items-center py-2.5', i < arr.length - 1 && 'border-b border-[rgb(var(--border))]')}>
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-[rgb(var(--text-secondary))]" />
                    <div>
                      <div className="text-[rgb(var(--text))] font-medium text-sm">{item.label}</div>
                      <div className="text-[rgb(var(--text-secondary))] text-xs">{item.desc}</div>
                    </div>
                  </div>
                  <Switch variant="gradient" checked={settings[item.key] as boolean} onCheckedChange={() => toggle(item.key)} />
                </div>
              ))}
            </Card>
          )}

          {activeTab === 'auto' && (
            <Card className="p-5">
              <h3 className="text-lg font-semibold text-[rgb(var(--text))] mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-400" />
                Автомодерация
              </h3>
              {([
                { toggleKey: 'autoModMentions' as const, label: 'Лимит упоминаний', numKey: 'maxMentions' as const, icon: Users },
                { toggleKey: 'autoModEmoji' as const, label: 'Лимит эмодзи', numKey: 'maxEmoji' as const, icon: Smile },
                { toggleKey: 'autoModCaps' as const, label: 'CAPS (порог %)', numKey: 'capsThreshold' as const, icon: Type },
                { toggleKey: 'autoModRepeats' as const, label: 'Повторы сообщений', numKey: 'repeatThreshold' as const, icon: Repeat },
              ] as const).map((item, i, arr) => (
                <div key={item.toggleKey} className={cn('flex justify-between items-center py-2.5', i < arr.length - 1 && 'border-b border-[rgb(var(--border))]')}>
                  <span className="flex items-center gap-2 text-[rgb(var(--text))] font-medium text-sm">
                    <item.icon className="w-4 h-4 text-[rgb(var(--text-secondary))]" />
                    {item.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <input type="number" value={settings[item.numKey]}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(item.numKey, parseInt(e.target.value) || 0)}
                      className="w-14 text-center px-2 py-1 input text-sm" />
                    <Switch variant="gradient" checked={settings[item.toggleKey] as boolean} onCheckedChange={() => toggle(item.toggleKey)} />
                  </div>
                </div>
              ))}
            </Card>
          )}

          {activeTab === 'punish' && (
            <div className="flex flex-col gap-4">
              <Card className="p-5">
                <h3 className="text-lg font-semibold text-[rgb(var(--text))] mb-4 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-yellow-400" />
                  Система наказаний
                </h3>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-[rgb(var(--text-secondary))] text-xs block mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Максимум предупреждений до мута
                    </label>
                    <input type="number" value={settings.maxWarnings} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('maxWarnings', parseInt(e.target.value) || 3)}
                      className="w-full input text-sm" />
                  </div>
                  <div>
                    <label className="text-[rgb(var(--text-secondary))] text-xs block mb-1 flex items-center gap-1">
                      <ClipboardList className="w-3 h-3" /> Канал логов
                    </label>
                    <input type="text" value={settings.logChannel} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('logChannel', e.target.value)}
                      className="w-full input text-sm" />
                  </div>
                  <div>
                    <label className="text-[rgb(var(--text-secondary))] text-xs block mb-1 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Канал для апелляций
                    </label>
                    <input type="text" value={settings.appealChannel} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('appealChannel', e.target.value)}
                      placeholder="#апелляции" className="w-full input text-sm" />
                  </div>
                  <div>
                    <label className="text-[rgb(var(--text-secondary))] text-xs block mb-1 flex items-center gap-1">
                      <VolumeX className="w-3 h-3" /> Длительность мута (минут): {settings.muteDuration}м
                    </label>
                    <input type="range" min="1" max="1440" step="5" value={settings.muteDuration}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('muteDuration', parseInt(e.target.value))} className="w-full accent-cyan-400" />
                  </div>
                  <div>
                    <label className="text-[rgb(var(--text-secondary))] text-xs block mb-1 flex items-center gap-1">
                      <Gavel className="w-3 h-3" /> Длительность бана: {settings.banDuration === 0 ? 'Навсегда' : `${Math.floor(settings.banDuration / 60)}ч`}
                    </label>
                    <input type="range" min="0" max="10080" step="60" value={settings.banDuration}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('banDuration', parseInt(e.target.value))} className="w-full accent-red-400" />
                  </div>
                </div>
              </Card>
              <Card className="p-5">
                <h3 className="text-lg font-semibold text-[rgb(var(--text))] mb-2 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  Шаблоны сообщений
                </h3>
                <p className="text-[rgb(var(--text-secondary))] text-xs mb-3">Переменные: {'{user}'}, {'{rule}'}, {'{count}'}, {'{max}'}, {'{duration}'}, {'{reason}'}, {'{appeal}'}</p>
                {([
                  { key: 'warnMessage' as const, label: 'Предупреждение', icon: AlertTriangle },
                  { key: 'muteMessage' as const, label: 'Мут', icon: VolumeX },
                  { key: 'banMessage' as const, label: 'Бан', icon: Gavel },
                ] as const).map(f => (
                  <div key={f.key} className="mb-3">
                    <label className="text-[rgb(var(--text-secondary))] text-xs block mb-1 flex items-center gap-1">
                      <f.icon className="w-3 h-3" /> {f.label}
                    </label>
                    <input type="text" value={settings[f.key]} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(f.key, e.target.value)}
                      className="w-full input text-sm" />
                  </div>
                ))}
              </Card>
            </div>
          )}

          {activeTab === 'rules' && (
            <Card className="p-5">
              <h3 className="text-lg font-semibold text-[rgb(var(--text))] mb-4 flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-amber-400" />
                Правила сервера
              </h3>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[rgb(var(--text-secondary))] text-xs block mb-1 flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" /> Ссылка на канал с правилами
                  </label>
                  <input type="text" value={settings.rulesUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('rulesUrl', e.target.value)}
                    placeholder="https://..." className="w-full input text-sm" />
                </div>
                <div>
                  <label className="text-[rgb(var(--text-secondary))] text-xs block mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Название канала
                  </label>
                  <input type="text" value={settings.rulesChannel} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('rulesChannel', e.target.value)}
                    className="w-full input text-sm" />
                </div>
                <div>
                  <label className="text-[rgb(var(--text-secondary))] text-xs block mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Текст правил
                  </label>
                  <textarea value={settings.rulesText} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update('rulesText', e.target.value)}
                    rows={6} className="w-full input text-sm font-mono resize-y" />
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'moderator' && (
            <div className="flex flex-col gap-4">
              <Card className="p-5">
                <h3 className="text-lg font-semibold text-[rgb(var(--text))] mb-4 flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-indigo-400" />
                  Бот-модератор
                </h3>
                <div className="mb-4">
                  <label className="text-[rgb(var(--text-secondary))] text-xs block mb-1">Имя бота-модератора</label>
                  <input type="text" value={settings.modBotName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('modBotName', e.target.value)}
                    className="w-full input text-sm" />
                </div>
                <label className="text-[rgb(var(--text-secondary))] text-xs block mb-2">Аватар модератора</label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {MOD_AVATARS.map(av => {
                    const Icon = av.icon;
                    return (
                      <button key={av.id} onClick={() => update('modAvatarStyle', av.id)}
                        className={cn('flex flex-col items-center p-3 rounded-xl border-2 transition-all',
                          settings.modAvatarStyle === av.id ? 'border-cyan-400 bg-cyan-400/10' : 'border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] hover:border-[rgb(var(--text-secondary))]'
                        )}>
                        <Icon className={cn('w-6 h-6 mb-1', settings.modAvatarStyle === av.id ? av.color : 'text-[rgb(var(--text-secondary))]')} />
                        <div className={cn('text-xs font-medium', settings.modAvatarStyle === av.id ? av.color : 'text-[rgb(var(--text-secondary))]')}>{av.label}</div>
                      </button>
                    );
                  })}
                </div>
                <div>
                  <label className="text-[rgb(var(--text-secondary))] text-xs block mb-1">Или укажите URL своего аватара</label>
                  <input type="text" value={settings.modAvatarUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('modAvatarUrl', e.target.value)}
                    placeholder="https://example.com/avatar.png" className="w-full input text-sm" />
                </div>
              </Card>
              <Card className="p-5">
                <h3 className="text-lg font-semibold text-[rgb(var(--text))] mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  AI-модератор
                </h3>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="text-[rgb(var(--text))] font-medium text-sm">Использовать AI для ответов</div>
                    <div className="text-[rgb(var(--text-secondary))] text-xs">Gemini/DeepSeek вместо шаблонов</div>
                  </div>
                  <Switch variant="gradient" checked={settings.useAIResponses} onCheckedChange={() => toggle('useAIResponses')} />
                </div>
                {settings.useAIResponses && (
                  <div>
                    <label className="text-[rgb(var(--text-secondary))] text-xs block mb-1">AI модель</label>
                    <select value={settings.aiModel} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => update('aiModel', e.target.value)}
                      className="w-full input cursor-pointer text-sm">
                      <option value="auto">Авто</option>
                      <option value="gemini">Gemini</option>
                      <option value="deepseek">DeepSeek</option>
                    </select>
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeTab === 'log' && (
            <Card className="p-5">
              <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                <h3 className="text-lg font-semibold text-[rgb(var(--text))] flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-amber-400" />
                  Журнал нарушений
                </h3>
                <div className="flex gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-secondary))]" />
                    <input type="text" value={logSearch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLogSearch(e.target.value)}
                      placeholder="Поиск..." className="pl-8 pr-3 py-1.5 input text-sm w-40" />
                  </div>
                  {[{ id: 'all' as LogFilter, label: 'Все' }, { id: 'warn' as LogFilter, label: 'Предупр.' }, { id: 'mute' as LogFilter, label: 'Мут' }, { id: 'ban' as LogFilter, label: 'Бан' }].map(f => (
                    <button key={f.id} onClick={() => setLogFilter(f.id)}
                      className={cn('px-3 py-1.5 rounded-lg border text-xs transition-colors',
                        logFilter === f.id ? 'bg-[rgb(var(--surface-2))] border-[rgb(var(--border))] text-[rgb(var(--text))]' : 'border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))]'
                      )}>{f.label}</button>
                  ))}
                </div>
              </div>
              {logLoading ? (
                <p className="text-[rgb(var(--text-secondary))] text-center py-10">Загрузка...</p>
              ) : auditLog.length === 0 ? (
                <p className="text-[rgb(var(--text-secondary))] text-center py-10">Записи не найдены</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[rgb(var(--border))]">
                        {['Событие', 'Тип', 'Описание', 'Время', 'Действия'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-[rgb(var(--text-secondary))] uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {auditLog.map((entry: LogEntry) => (
                        <tr key={entry.id} className="border-b border-[rgb(var(--border))]">
                          <td className="px-3 py-2 font-medium text-[rgb(var(--text))]">{entry.title}</td>
                          <td className="px-3 py-2">
                            <span className={cn('px-2 py-0.5 rounded-full text-xs',
                              entry.type?.includes('ban') ? 'bg-red-500/20 text-red-400' :
                              entry.type?.includes('mute') ? 'bg-yellow-500/20 text-yellow-400' :
                              entry.type?.includes('delete') ? 'bg-orange-500/20 text-orange-400' :
                              entry.type?.includes('received') ? 'bg-blue-500/20 text-blue-400' :
                              'bg-green-500/20 text-green-400'
                            )}>{entry.type}</span>
                          </td>
                          <td className="px-3 py-2 text-[rgb(var(--text-secondary))] max-w-xs truncate">{entry.description}</td>
                          <td className="px-3 py-2 text-[rgb(var(--text-secondary))] text-xs whitespace-nowrap">{entry.created_at ? new Date(entry.created_at).toLocaleString('ru-RU') : ''}</td>
                          <td className="px-3 py-2">
                            {platformFilter === 'vk' && entry.target_message_id && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => moderateVK(entry.target_message_id!, entry.target_user_id, 'delete')}
                                  title="Удалить сообщение"
                                  className="p-1.5 rounded-md border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => moderateVK(entry.target_message_id!, entry.target_user_id, 'ban')}
                                  title="Забанить пользователя"
                                  className="p-1.5 rounded-md border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </div>

        {activeTab === 'protection' && (
          <div className="lg:col-span-4 space-y-5">
            <Card className="p-5">
              <h3 className="text-lg font-semibold text-[rgb(var(--text))] mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-orange-400" />
                Доп. фильтры
              </h3>
              {([
                { key: 'blockFraudLinks' as const, label: 'Мошеннические ссылки', desc: 'Блокировка ссылок на скам/фишинг', icon: Skull },
                { key: 'blockZalgo' as const, label: 'Zalgo-текст', desc: 'Блокировка искажённого юникода', icon: Ghost },
                { key: 'blockInviteLinks' as const, label: 'Приглашения', desc: 'Блокировка инвайтов на другие сообщества', icon: UserPlus },
              ] as const).map((item, i, arr) => (
                <div key={item.key} className={cn('flex justify-between items-center py-2.5', i < arr.length - 1 && 'border-b border-[rgb(var(--border))]')}>
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-[rgb(var(--text-secondary))]" />
                    <div>
                      <div className="text-[rgb(var(--text))] font-medium text-sm">{item.label}</div>
                      <div className="text-[rgb(var(--text-secondary))] text-xs">{item.desc}</div>
                    </div>
                  </div>
                  <Switch variant="gradient" checked={settings[item.key] as boolean} onCheckedChange={() => toggle(item.key)} />
                </div>
              ))}
            </Card>
          </div>
        )}

        <div className={cn('space-y-5', activeTab === 'protection' ? 'lg:col-span-4' : 'lg:col-span-5')}>
          <StatsPanel
            server={effectiveServer}
            stats={stats}
            events={events}
            isLoading={statsLoading}
            platform={platformFilter}
            period={statsPeriod}
            onPeriodChange={setStatsPeriod}
          />
        </div>
      </div>

      {saved && (
        <div className="fixed bottom-6 right-6 bg-green-400 text-black px-5 py-3 rounded-2xl font-semibold shadow-xl z-50 animate-bounce flex items-center gap-2">
          <Check className="w-5 h-5" />
          Настройки модерации сохранены!
        </div>
      )}
    </div>
  );
}
