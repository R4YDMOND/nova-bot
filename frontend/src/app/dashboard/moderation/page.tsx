'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/toggle';

const API_URL = 'https://nova-bot-rpsy.onrender.com';

const TABS = [
  { id: 'protection', label: '🛡️ Защита' },
  { id: 'auto', label: '🤖 Автомодерация' },
  { id: 'punish', label: '⚖️ Наказания' },
  { id: 'rules', label: '📜 Правила' },
  { id: 'moderator', label: '👮 Модератор' },
  { id: 'log', label: '📋 Журнал' },
];

const MOD_AVATARS = [
  { id: 'shield', icon: '🛡️', label: 'Щит', color: 'text-cyan-400' },
  { id: 'sword', icon: '⚔️', label: 'Меч', color: 'text-red-400' },
  { id: 'eye', icon: '👁️', label: 'Oko', color: 'text-purple-400' },
  { id: 'hammer', icon: '🔨', label: 'Молот', color: 'text-yellow-400' },
  { id: 'lock', icon: '🔒', label: 'Замок', color: 'text-green-400' },
  { id: 'robot', icon: '🤖', label: 'Робот', color: 'text-blue-400' },
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

export default function ModerationPage() {
  const [activeTab, setActiveTab] = useState('protection');
  const [saved, setSaved] = useState(false);
  const [logFilter, setLogFilter] = useState('all');
  const [logSearch, setLogSearch] = useState('');
  const [auditLog, setAuditLog] = useState<LogEntry[]>([]);
  const [logLoading, setLogLoading] = useState(true);

  const [settings, setSettings] = useState<Settings>({
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
    modBotName: 'Nova Модератор 🤖', modAvatarStyle: 'shield', modAvatarUrl: '',
    useAIResponses: true, aiModel: 'auto',
  });

  useEffect(() => {
    fetch(`${API_URL}/api/moderation/log`)
      .then(r => r.json())
      .then(d => { setAuditLog(d.entries || []); setLogLoading(false); })
      .catch(() => setLogLoading(false));
  }, []);

  const update = (key: keyof Settings, value: any) => setSettings(s => ({ ...s, [key]: value }));
  const toggle = (key: keyof Settings) => setSettings(s => ({ ...s, [key]: !s[key] }));
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const filteredLog = auditLog.filter(e => {
    const matchType = logFilter === 'all'
      || (logFilter === 'warn' && e.action?.includes('Предупреждение'))
      || (logFilter === 'mute' && e.action?.includes('Мут'))
      || (logFilter === 'ban' && e.action?.includes('Бан'));
    const q = logSearch.toLowerCase();
    return matchType && (e.user?.toLowerCase().includes(q) || e.reason?.toLowerCase().includes(q));
  });

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-white mb-1">🛡️ Модерация</h1>
      <p className="text-white/50 text-lg mb-6">Защита, автомодерация, правила и журнал</p>

      <div className="flex flex-wrap gap-1 mb-6">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}>{tab.label}</button>
        ))}
      </div>

      {activeTab === 'protection' && (
        <Card className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">🛡️ Базовая защита</h3>
          {([
            { key: 'antiSpam' as const, label: '🚫 Антиспам', desc: 'Автоудаление спам-сообщений' },
            { key: 'antiRaid' as const, label: '🛡️ Антирейд', desc: 'Защита от массовых атак' },
            { key: 'badWordsFilter' as const, label: '🔇 Фильтр мата', desc: 'Удаление запрещённых слов' },
            { key: 'captchaForNew' as const, label: '🤖 Капча для новых', desc: 'Проверка участников при входе' },
            { key: 'autoDeleteLinks' as const, label: '🔗 Удаление ссылок', desc: 'Автоудаление всех ссылок' },
          ] as const).map((item, i, arr) => (
            <div key={item.key} className={`flex justify-between items-center py-3 ${i < arr.length - 1 ? 'border-b border-white/10' : ''}`}>
              <div>
                <div className="text-white font-medium">{item.label}</div>
                <div className="text-white/50 text-sm">{item.desc}</div>
              </div>
              <Switch checked={settings[item.key] as boolean} onCheckedChange={() => toggle(item.key)} />
            </div>
          ))}
        </Card>
      )}

      {activeTab === 'auto' && (
        <Card className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">🤖 Автомодерация</h3>
          {([
            { toggleKey: 'autoModMentions' as const, label: '👥 Лимит упоминаний', numKey: 'maxMentions' as const },
            { toggleKey: 'autoModEmoji' as const, label: '😀 Лимит эмодзи', numKey: 'maxEmoji' as const },
            { toggleKey: 'autoModCaps' as const, label: '🔠 CAPS (порог %)', numKey: 'capsThreshold' as const },
            { toggleKey: 'autoModRepeats' as const, label: '🔁 Повторы сообщений', numKey: 'repeatThreshold' as const },
          ] as const).map((item, i, arr) => (
            <div key={item.toggleKey} className={`flex justify-between items-center py-3 ${i < arr.length - 1 ? 'border-b border-white/10' : ''}`}>
              <span className="text-white font-medium">{item.label}</span>
              <div className="flex items-center gap-3">
                <input type="number" value={settings[item.numKey]}
                  onChange={e => update(item.numKey, parseInt(e.target.value) || 0)}
                  className="w-16 text-center px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm" />
                <Switch checked={settings[item.toggleKey] as boolean} onCheckedChange={() => toggle(item.toggleKey)} />
              </div>
            </div>
          ))}
        </Card>
      )}

      {activeTab === 'punish' && (
        <div className="flex flex-col gap-4">
          <Card className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">⚖️ Система наказаний</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-white/50 text-sm block mb-1">⚠️ Максимум предупреждений до мута</label>
                <input type="number" value={settings.maxWarnings} onChange={e => update('maxWarnings', parseInt(e.target.value) || 3)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white" />
              </div>
              <div>
                <label className="text-white/50 text-sm block mb-1">📋 Канал логов</label>
                <input type="text" value={settings.logChannel} onChange={e => update('logChannel', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white" />
              </div>
              <div>
                <label className="text-white/50 text-sm block mb-1">📩 Канал для апелляций</label>
                <input type="text" value={settings.appealChannel} onChange={e => update('appealChannel', e.target.value)}
                  placeholder="#апелляции" className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white" />
              </div>
              <div>
                <label className="text-white/50 text-sm block mb-1">🔇 Длительность мута (минут): {settings.muteDuration}м</label>
                <input type="range" min="1" max="1440" step="5" value={settings.muteDuration}
                  onChange={e => update('muteDuration', parseInt(e.target.value))} className="w-full accent-cyan-400" />
              </div>
              <div>
                <label className="text-white/50 text-sm block mb-1">
                  🔨 Длительность бана: {settings.banDuration === 0 ? 'Навсегда' : `${Math.floor(settings.banDuration / 60)}ч`}
                </label>
                <input type="range" min="0" max="10080" step="60" value={settings.banDuration}
                  onChange={e => update('banDuration', parseInt(e.target.value))} className="w-full accent-red-400" />
              </div>
            </div>
          </Card>
          <Card className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-2">💬 Шаблоны сообщений</h3>
            <p className="text-white/40 text-xs mb-4">Переменные: {'{user}'}, {'{rule}'}, {'{count}'}, {'{max}'}, {'{duration}'}, {'{reason}'}, {'{appeal}'}</p>
            {([
              { key: 'warnMessage' as const, label: '⚠️ Предупреждение' },
              { key: 'muteMessage' as const, label: '🔇 Мут' },
              { key: 'banMessage' as const, label: '🔨 Бан' },
            ] as const).map(f => (
              <div key={f.key} className="mb-3">
                <label className="text-white/50 text-sm block mb-1">{f.label}</label>
                <input type="text" value={settings[f.key]} onChange={e => update(f.key, e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm" />
              </div>
            ))}
          </Card>
        </div>
      )}

      {activeTab === 'rules' && (
        <Card className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">📜 Правила сервера</h3>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-white/50 text-sm block mb-1">🔗 Ссылка на канал с правилами</label>
              <input type="text" value={settings.rulesUrl} onChange={e => update('rulesUrl', e.target.value)}
                placeholder="https://..." className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white" />
            </div>
            <div>
              <label className="text-white/50 text-sm block mb-1">💬 Название канала</label>
              <input type="text" value={settings.rulesChannel} onChange={e => update('rulesChannel', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white" />
            </div>
            <div>
              <label className="text-white/50 text-sm block mb-1">📝 Текст правил</label>
              <textarea value={settings.rulesText} onChange={e => update('rulesText', e.target.value)}
                rows={6} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm font-mono resize-y" />
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'moderator' && (
        <div className="flex flex-col gap-4">
          <Card className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">👮 Бот-модератор</h3>
            <div className="mb-4">
              <label className="text-white/50 text-sm block mb-1">Имя бота-модератора</label>
              <input type="text" value={settings.modBotName} onChange={e => update('modBotName', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white" />
            </div>
            <label className="text-white/50 text-sm block mb-2">Аватар модератора</label>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {MOD_AVATARS.map(av => (
                <button key={av.id} onClick={() => update('modAvatarStyle', av.id)}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    settings.modAvatarStyle === av.id ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}>
                  <div className="text-2xl mb-1">{av.icon}</div>
                  <div className={`text-xs font-medium ${settings.modAvatarStyle === av.id ? av.color : 'text-white/50'}`}>{av.label}</div>
                </button>
              ))}
            </div>
            <div>
              <label className="text-white/50 text-sm block mb-1">Или укажите URL своего аватара</label>
              <input type="text" value={settings.modAvatarUrl} onChange={e => update('modAvatarUrl', e.target.value)}
                placeholder="https://example.com/avatar.png" className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white" />
            </div>
          </Card>
          <Card className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">🤖 AI-модератор</h3>
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-white font-medium">Использовать AI для ответов</div>
                <div className="text-white/50 text-sm">Gemini/DeepSeek вместо шаблонов</div>
              </div>
              <Switch checked={settings.useAIResponses} onCheckedChange={() => toggle('useAIResponses')} />
            </div>
            {settings.useAIResponses && (
              <div>
                <label className="text-white/50 text-sm block mb-1">AI модель</label>
                <select value={settings.aiModel} onChange={e => update('aiModel', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white cursor-pointer">
                  <option value="auto">🔁 Авто</option>
                  <option value="gemini">✨ Gemini</option>
                  <option value="deepseek">🦅 DeepSeek</option>
                </select>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'log' && (
        <Card className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h3 className="text-xl font-semibold text-white">📋 Журнал нарушений</h3>
            <div className="flex gap-2 flex-wrap">
              <input type="text" value={logSearch} onChange={e => setLogSearch(e.target.value)}
                placeholder="🔍 Поиск..." className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm w-40" />
              {[{ id: 'all', label: 'Все' }, { id: 'warn', label: '⚠️' }, { id: 'mute', label: '🔇' }, { id: 'ban', label: '🔨' }].map(f => (
                <button key={f.id} onClick={() => setLogFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                    logFilter === f.id ? 'bg-white/10 border-white/30 text-white' : 'border-white/10 text-white/50 hover:text-white'
                  }`}>{f.label}</button>
              ))}
            </div>
          </div>
          {logLoading ? (
            <p className="text-white/50 text-center py-10">⏳ Загрузка...</p>
          ) : filteredLog.length === 0 ? (
            <p className="text-white/30 text-center py-10">Записи не найдены</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['Пользователь', 'Действие', 'Причина', 'Модератор', 'Время'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-white/40 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLog.map((entry, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="px-3 py-2 font-medium text-white">{entry.user}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        entry.action?.includes('Бан') ? 'bg-red-500/20 text-red-400' :
                        entry.action?.includes('Мут') ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>{entry.action}</span>
                    </td>
                    <td className="px-3 py-2 text-white/50">{entry.reason}</td>
                    <td className="px-3 py-2 text-white/50">{entry.moderator}</td>
                    <td className="px-3 py-2 text-white/30 text-xs">{entry.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      <div className="mt-8">
        <button onClick={save} className={`px-7 py-3 rounded-xl font-semibold text-black transition-all ${
          saved ? 'bg-green-400' : 'bg-cyan-400 hover:bg-cyan-300'
        }`}>
          {saved ? '✅ Сохранено!' : '💾 Сохранить настройки'}
        </button>
      </div>
      {saved && (
        <div className="fixed bottom-6 right-6 bg-green-400 text-black px-5 py-3 rounded-2xl font-semibold shadow-xl z-50 animate-bounce">
          ✅ Настройки модерации сохранены!
        </div>
      )}
    </div>
  );
}
