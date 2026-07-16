'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useServer } from '@/context/ServerProvider';
import { NoServerSelected } from '@/components/NoServerSelected';
import { StatsPanel } from '@/components/moderation/StatsPanel';
import { cn } from '@/lib/utils';

const API_URL = 'https://nova-bot-rpsy.onrender.com';
const MODULE_NAME = 'moderation';

type Server = { id: number; platform: 'vk' | 'lolka'; member_count: number };
type Platform = 'vk' | 'lolka';
type Tab = 'protection' | 'auto' | 'punish' | 'rules' | 'moderator' | 'log';
type LogFilter = 'all' | 'warn' | 'mute' | 'ban';

const TABS = [
  { id: 'protection' as Tab, label: '\uD83D\uDEE1\uFE0F Защита' },
  { id: 'auto' as Tab, label: '\uD83E\uDD16 Автомодерация' },
  { id: 'punish' as Tab, label: '\u2696\uFE0F Наказания' },
  { id: 'rules' as Tab, label: '\uD83D\uDCDC Правила' },
  { id: 'moderator' as Tab, label: '\uD83D\uDC6E Модератор' },
  { id: 'log' as Tab, label: '\uD83D\uDCCB Журнал' },
];

const MOD_AVATARS = [
  { id: 'shield', icon: '\uD83D\uDEE1\uFE0F', label: 'Щит', color: 'text-cyan-400' },
  { id: 'sword', icon: '\u2694\uFE0F', label: 'Меч', color: 'text-red-400' },
  { id: 'eye', icon: '\uD83D\uDC41\uFE0F', label: 'Око', color: 'text-purple-400' },
  { id: 'hammer', icon: '\uD83D\uDD28', label: 'Молот', color: 'text-yellow-400' },
  { id: 'lock', icon: '\uD83D\uDD12', label: 'Замок', color: 'text-green-400' },
  { id: 'robot', icon: '\uD83E\uDD16', label: 'Робот', color: 'text-blue-400' },
];

type Settings = {
  antiSpam: boolean; antiRaid: boolean; badWordsFilter: boolean;
  captchaForNew: boolean; autoDeleteLinks: boolean;
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

type LogEntry = { user: string; action: string; reason: string; moderator: string; time: string };

const DEFAULT_SETTINGS: Settings = {
  antiSpam: true, antiRaid: true, badWordsFilter: true,
  captchaForNew: true, autoDeleteLinks: false,
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
  modBotName: 'Nova Модератор \uD83E\uDD16', modAvatarStyle: 'shield', modAvatarUrl: '',
  useAIResponses: true, aiModel: 'auto',
};

export default function ModerationPage() {
  const { servers, selectedServer, selectedServerId, loading: serverLoading } = useServer();
  const [platformFilter, setPlatformFilter] = useState<Platform>('vk');
  const [activeTab, setActiveTab] = useState<Tab>('protection');
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [stats, setStats] = useState({ blocked: 0, warnings: 0, captcha_solved: 0, total_events: 0 });
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
    api.moderation.getStats(effectiveServer.id, platformFilter)
      .then(res => {
        setStats(res.stats);
        setEvents(res.recent_events);
      })
      .catch(() => {
        setStats({ blocked: 0, warnings: 0, captcha_solved: 0, total_events: 0 });
        setEvents([]);
      })
      .finally(() => setStatsLoading(false));
  }, [effectiveServer, platformFilter]);

  useEffect(() => {
    fetch(`${API_URL}/api/moderation/log`)
      .then((r: Response) => r.json())
      .then((d: { entries?: LogEntry[] }) => { setAuditLog(d.entries || []); setLogLoading(false); })
      .catch(() => setLogLoading(false));
  }, []);

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

  const filteredLog = auditLog.filter(e => {
    const matchType = logFilter === 'all'
      || (logFilter === 'warn' && e.action?.includes('Предупреждение'))
      || (logFilter === 'mute' && e.action?.includes('Мут'))
      || (logFilter === 'ban' && e.action?.includes('Бан'));
    const q = logSearch.toLowerCase();
    return matchType && (e.user?.toLowerCase().includes(q) || e.reason?.toLowerCase().includes(q));
  });

  if (serverLoading || settingsLoading) {
    return <div className="p-8 text-[rgb(var(--text-secondary))]">\u23F3 Загрузка...</div>;
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
    return <NoServerSelected title="\uD83D\uDEE1\uFE0F Модерация" />;
  }

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-[rgb(var(--text))] mb-1">\uD83D\uDEE1\uFE0F Модерация</h1>
      <p className="text-[rgb(var(--text-secondary))] text-lg mb-6">Защита, автомодерация, правила и журнал</p>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border mb-6 bg-[rgb(var(--surface-2))] border-[rgb(var(--border))]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-secondary))]">Платформа:</span>
          <div className="flex p-1 rounded-xl border bg-[rgb(var(--surface))] border-[rgb(var(--border))]">
            {[
              { id: 'vk' as Platform, label: 'VK', icon: '\uD83D\uDD35' },
              { id: 'lolka' as Platform, label: 'Lolka', icon: '\uD83D\uDFE3' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPlatformFilter(p.id)}
                className={cn(
                  'flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold transition-all',
                  platformFilter === p.id
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))]'
                )}
              >
                <span>{p.icon}</span><span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
        <Button onClick={save} disabled={saving} variant="gradient">
          {saving ? 'Сохранение...' : saved ? '\u2705 Сохранено!' : '\uD83D\uDCBE Сохранить настройки'}
        </Button>
      </div>

      <div className="flex flex-wrap gap-1 mb-6">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-2))]'
            )}>{tab.label}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        <div className="lg:col-span-7 space-y-6">
          {activeTab === 'protection' && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-[rgb(var(--text))] mb-4">\uD83D\uDEE1\uFE0F Базовая защита</h3>
              {([
                { key: 'antiSpam' as const, label: '\uD83D\uDEAB Антиспам', desc: 'Автоудаление спам-сообщений' },
                { key: 'antiRaid' as const, label: '\uD83D\uDEE1\uFE0F Антирейд', desc: 'Защита от массовых атак' },
                { key: 'badWordsFilter' as const, label: '\uD83D\uDD07 Фильтр мата', desc: 'Удаление запрещённых слов' },
                { key: 'captchaForNew' as const, label: '\uD83E\uDD16 Капча для новых', desc: 'Проверка участников при входе' },
                { key: 'autoDeleteLinks' as const, label: '\uD83D\uDD17 Удаление ссылок', desc: 'Автоудаление всех ссылок' },
              ] as const).map((item, i, arr) => (
                <div key={item.key} className={cn('flex justify-between items-center py-3', i < arr.length - 1 && 'border-b border-[rgb(var(--border))]')}>
                  <div>
                    <div className="text-[rgb(var(--text))] font-medium">{item.label}</div>
                    <div className="text-[rgb(var(--text-secondary))] text-sm">{item.desc}</div>
                  </div>
                  <Switch variant="gradient" checked={settings[item.key] as boolean} onCheckedChange={() => toggle(item.key)} />
                </div>
              ))}
            </Card>
          )}

          {activeTab === 'auto' && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-[rgb(var(--text))] mb-4">\uD83E\uDD16 Автомодерация</h3>
              {([
                { toggleKey: 'autoModMentions' as const, label: '\uD83D\uDC65 Лимит упоминаний', numKey: 'maxMentions' as const },
                { toggleKey: 'autoModEmoji' as const, label: '\uD83D\uDE00 Лимит эмодзи', numKey: 'maxEmoji' as const },
                { toggleKey: 'autoModCaps' as const, label: '\uD83D\uDD20 CAPS (порог %)', numKey: 'capsThreshold' as const },
                { toggleKey: 'autoModRepeats' as const, label: '\uD83D\uDD01 Повторы сообщений', numKey: 'repeatThreshold' as const },
              ] as const).map((item, i, arr) => (
                <div key={item.toggleKey} className={cn('flex justify-between items-center py-3', i < arr.length - 1 && 'border-b border-[rgb(var(--border))]')}>
                  <span className="text-[rgb(var(--text))] font-medium">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <input type="number" value={settings[item.numKey]}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(item.numKey, parseInt(e.target.value) || 0)}
                      className="w-16 text-center px-2 py-1 input" />
                    <Switch variant="gradient" checked={settings[item.toggleKey] as boolean} onCheckedChange={() => toggle(item.toggleKey)} />
                  </div>
                </div>
              ))}
            </Card>
          )}

          {activeTab === 'punish' && (
            <div className="flex flex-col gap-4">
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-[rgb(var(--text))] mb-4">\u2696\uFE0F Система наказаний</h3>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-[rgb(var(--text-secondary))] text-sm block mb-1">\u26A0\uFE0F Максимум предупреждений до мута</label>
                    <input type="number" value={settings.maxWarnings} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('maxWarnings', parseInt(e.target.value) || 3)}
                      className="w-full input" />
                  </div>
                  <div>
                    <label className="text-[rgb(var(--text-secondary))] text-sm block mb-1">\uD83D\uDCCB Канал логов</label>
                    <input type="text" value={settings.logChannel} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('logChannel', e.target.value)}
                      className="w-full input" />
                  </div>
                  <div>
                    <label className="text-[rgb(var(--text-secondary))] text-sm block mb-1">\uD83D\uDCE9 Канал для апелляций</label>
                    <input type="text" value={settings.appealChannel} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('appealChannel', e.target.value)}
                      placeholder="#апелляции" className="w-full input" />
                  </div>
                  <div>
                    <label className="text-[rgb(var(--text-secondary))] text-sm block mb-1">\uD83D\uDD07 Длительность мута (минут): {settings.muteDuration}м</label>
                    <input type="range" min="1" max="1440" step="5" value={settings.muteDuration}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('muteDuration', parseInt(e.target.value))} className="w-full accent-cyan-400" />
                  </div>
                  <div>
                    <label className="text-[rgb(var(--text-secondary))] text-sm block mb-1">
                      \uD83D\uDD28 Длительность бана: {settings.banDuration === 0 ? 'Навсегда' : `${Math.floor(settings.banDuration / 60)}ч`}
                    </label>
                    <input type="range" min="0" max="10080" step="60" value={settings.banDuration}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('banDuration', parseInt(e.target.value))} className="w-full accent-red-400" />
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-[rgb(var(--text))] mb-2">\uD83D\uDCAC Шаблоны сообщений</h3>
                <p className="text-[rgb(var(--text-secondary))] text-xs mb-4">Переменные: {'{user}'}, {'{rule}'}, {'{count}'}, {'{max}'}, {'{duration}'}, {'{reason}'}, {'{appeal}'}</p>
                {([
                  { key: 'warnMessage' as const, label: '\u26A0\uFE0F Предупреждение' },
                  { key: 'muteMessage' as const, label: '\uD83D\uDD07 Мут' },
                  { key: 'banMessage' as const, label: '\uD83D\uDD28 Бан' },
                ] as const).map(f => (
                  <div key={f.key} className="mb-3">
                    <label className="text-[rgb(var(--text-secondary))] text-sm block mb-1">{f.label}</label>
                    <input type="text" value={settings[f.key]} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update(f.key, e.target.value)}
                      className="w-full input text-sm" />
                  </div>
                ))}
              </Card>
            </div>
          )}

          {activeTab === 'rules' && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-[rgb(var(--text))] mb-4">\uD83D\uDCDC Правила сервера</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[rgb(var(--text-secondary))] text-sm block mb-1">\uD83D\uDD17 Ссылка на канал с правилами</label>
                  <input type="text" value={settings.rulesUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('rulesUrl', e.target.value)}
                    placeholder="https://..." className="w-full input" />
                </div>
                <div>
                  <label className="text-[rgb(var(--text-secondary))] text-sm block mb-1">\uD83D\uDCAC Название канала</label>
                  <input type="text" value={settings.rulesChannel} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('rulesChannel', e.target.value)}
                    className="w-full input" />
                </div>
                <div>
                  <label className="text-[rgb(var(--text-secondary))] text-sm block mb-1">\uD83D\uDCDD Текст правил</label>
                  <textarea value={settings.rulesText} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update('rulesText', e.target.value)}
                    rows={6} className="w-full input text-sm font-mono resize-y" />
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'moderator' && (
            <div className="flex flex-col gap-4">
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-[rgb(var(--text))] mb-4">\uD83D\uDC6E Бот-модератор</h3>
                <div className="mb-4">
                  <label className="text-[rgb(var(--text-secondary))] text-sm block mb-1">Имя бота-модератора</label>
                  <input type="text" value={settings.modBotName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('modBotName', e.target.value)}
                    className="w-full input" />
                </div>
                <label className="text-[rgb(var(--text-secondary))] text-sm block mb-2">Аватар модератора</label>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {MOD_AVATARS.map(av => (
                    <button key={av.id} onClick={() => update('modAvatarStyle', av.id)}
                      className={cn('p-3 rounded-xl border-2 transition-all text-center',
                        settings.modAvatarStyle === av.id ? 'border-cyan-400 bg-cyan-400/10' : 'border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] hover:border-[rgb(var(--text-secondary))]'
                      )}>
                      <div className="text-2xl mb-1">{av.icon}</div>
                      <div className={cn('text-xs font-medium', settings.modAvatarStyle === av.id ? av.color : 'text-[rgb(var(--text-secondary))]')}>{av.label}</div>
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-[rgb(var(--text-secondary))] text-sm block mb-1">Или укажите URL своего аватара</label>
                  <input type="text" value={settings.modAvatarUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('modAvatarUrl', e.target.value)}
                    placeholder="https://example.com/avatar.png" className="w-full input" />
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-[rgb(var(--text))] mb-4">\uD83E\uDD16 AI-модератор</h3>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="text-[rgb(var(--text))] font-medium">Использовать AI для ответов</div>
                    <div className="text-[rgb(var(--text-secondary))] text-sm">Gemini/DeepSeek вместо шаблонов</div>
                  </div>
                  <Switch variant="gradient" checked={settings.useAIResponses} onCheckedChange={() => toggle('useAIResponses')} />
                </div>
                {settings.useAIResponses && (
                  <div>
                    <label className="text-[rgb(var(--text-secondary))] text-sm block mb-1">AI модель</label>
                    <select value={settings.aiModel} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => update('aiModel', e.target.value)}
                      className="w-full input cursor-pointer">
                      <option value="auto">\uD83D\uDD01 Авто</option>
                      <option value="gemini">\u2728 Gemini</option>
                      <option value="deepseek">\uD83E\uDD85 DeepSeek</option>
                    </select>
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeTab === 'log' && (
            <Card className="p-6">
              <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                <h3 className="text-xl font-semibold text-[rgb(var(--text))]">\uD83D\uDCCB Журнал нарушений</h3>
                <div className="flex gap-2 flex-wrap">
                  <input type="text" value={logSearch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLogSearch(e.target.value)}
                    placeholder="\uD83D\uDD0D Поиск..." className="px-3 py-1.5 input text-sm w-40" />
                  {[{ id: 'all' as LogFilter, label: 'Все' }, { id: 'warn' as LogFilter, label: '\u26A0\uFE0F' }, { id: 'mute' as LogFilter, label: '\uD83D\uDD07' }, { id: 'ban' as LogFilter, label: '\uD83D\uDD28' }].map(f => (
                    <button key={f.id} onClick={() => setLogFilter(f.id)}
                      className={cn('px-3 py-1.5 rounded-lg border text-xs transition-colors',
                        logFilter === f.id ? 'bg-[rgb(var(--surface-2))] border-[rgb(var(--border))] text-[rgb(var(--text))]' : 'border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))]'
                      )}>{f.label}</button>
                  ))}
                </div>
              </div>
              {logLoading ? (
                <p className="text-[rgb(var(--text-secondary))] text-center py-10">\u23F3 Загрузка...</p>
              ) : filteredLog.length === 0 ? (
                <p className="text-[rgb(var(--text-secondary))] text-center py-10">Записи не найдены</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgb(var(--border))]">
                      {['Пользователь', 'Действие', 'Причина', 'Модератор', 'Время'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-[rgb(var(--text-secondary))] uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLog.map((entry: LogEntry, i: number) => (
                      <tr key={i} className="border-b border-[rgb(var(--border))]">
                        <td className="px-3 py-2 font-medium text-[rgb(var(--text))]">{entry.user}</td>
                        <td className="px-3 py-2">
                          <span className={cn('px-2 py-0.5 rounded-full text-xs',
                            entry.action?.includes('Бан') ? 'bg-red-500/20 text-red-400' :
                            entry.action?.includes('Мут') ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          )}>{entry.action}</span>
                        </td>
                        <td className="px-3 py-2 text-[rgb(var(--text-secondary))]">{entry.reason}</td>
                        <td className="px-3 py-2 text-[rgb(var(--text-secondary))]">{entry.moderator}</td>
                        <td className="px-3 py-2 text-[rgb(var(--text-secondary))] text-xs">{entry.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          )}
        </div>

        <div className="lg:col-span-5 space-y-6">
          <StatsPanel
            server={effectiveServer}
            stats={stats}
            events={events}
            isLoading={statsLoading}
            platform={platformFilter}
          />
        </div>
      </div>

      {saved && (
        <div className="fixed bottom-6 right-6 bg-green-400 text-black px-5 py-3 rounded-2xl font-semibold shadow-xl z-50 animate-bounce">
          \u2705 Настройки модерации сохранены!
        </div>
      )}
    </div>
  );
}