'use client';
import { useState, useEffect, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/toggle';
import { api } from '@/lib/api';
import { useServer } from '@/context/ServerProvider';
import { NoServerSelected } from '@/components/NoServerSelected';
import { AIPlaygroundModal } from '@/components/AIPlaygroundModal';
import { PROVIDERS, PROMPT_VARIABLES, type AIProvider, type AIUsage } from '@/types/ai';

interface AISettings {
  botName: string;
  language: string;
  activeModel: 'auto' | 'gemini' | 'deepseek';
  geminiEnabled: boolean;
  geminiTemperature: number;
  geminiStyle: string;
  geminiCustomPrompt: string;
  deepseekEnabled: boolean;
  deepseekTemperature: number;
  deepseekStyle: string;
  deepseekCustomPrompt: string;
  useContext: boolean;
  contextMessages: number;
  systemPrompt: string;
  autoModeration: boolean;
  serverName: string;
  platform: string;
  avatarStyle: string;
  avatarUrl: string;
  // ── ТЗ №9: LLM-роутер, RAG, кэш, модерация, function calling ──
  provider: AIProvider;
  contextSize: number;
  cacheEnabled: boolean;
  moderationEnabled: boolean;
  moderationThreshold: number;
  toolGrantRoles: boolean;
}

const DEFAULT: AISettings = {
  botName: 'Нова ✨', language: 'ru', activeModel: 'auto',
  geminiEnabled: true, geminiTemperature: 0.8, geminiStyle: 'friendly', geminiCustomPrompt: '',
  deepseekEnabled: true, deepseekTemperature: 0.7, deepseekStyle: 'creative', deepseekCustomPrompt: '',
  useContext: true, contextMessages: 10, systemPrompt: 'Ты — дружелюбный AI-помощник. Отвечай на русском языке. 🤖',
  autoModeration: false, serverName: '', platform: 'VK', avatarStyle: 'nova', avatarUrl: '',
  provider: 'yandexgpt', contextSize: 5, cacheEnabled: true,
  moderationEnabled: false, moderationThreshold: 70, toolGrantRoles: false,
};

const GEMINI_STYLES = [
  { value: 'friendly', label: '😊 Дружелюбный', desc: 'Тёплое, приветливое общение' },
  { value: 'gaming', label: '🎮 Игровой', desc: 'Энергичный, с игровым сленгом' },
  { value: 'professional', label: '💼 Профессиональный', desc: 'Серьёзный, деловой тон' },
];

const DEEPSEEK_STYLES = [
  { value: 'creative', label: '🎨 Креативный', desc: 'Нестандартные, яркие ответы' },
  { value: 'humorous', label: '😂 Юмористический', desc: 'С шутками и мемами' },
  { value: 'anime', label: '🌸 Аниме', desc: 'В стиле аниме-персонажа' },
];

const AVATARS = [
  { id: 'nova', icon: 'N', label: 'Нова ✨', color: '#00E5FF' },
  { id: 'star', icon: '✨', label: 'Звезда', color: '#FBBF24' },
  { id: 'robot', icon: '🤖', label: 'Робот', color: '#60A5FA' },
  { id: 'cat', icon: '🐒', label: 'Кот', color: '#F472B6' },
];

const TABS = [
  { id: 'general', label: '⚙️ Общие' },
  { id: 'provider', label: '🔌 Провайдер и RAG' },
  { id: 'gemini', label: '🔥 Gemini' },
  { id: 'deepseek', label: '🧠 DeepSeek' },
  { id: 'server', label: '🌐 Сервер' },
];

export default function AIPage() {
  const { selectedServer, selectedServerId, loading: serverLoading } = useServer();
  const [settings, setSettings] = useState<AISettings>(DEFAULT);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  const [usage, setUsage] = useState<AIUsage | null>(null);

  useEffect(() => {
    if (!selectedServer) { setSettingsLoading(false); return; }
    setSettingsLoading(true);
    api.ai.get(selectedServerId).then((data) => {
      if (data.settings) {
        const s = data.settings as Record<string, unknown>;
        setSettings(prev => ({
          ...prev,
          botName: (s.botName as string) || prev.botName,
          activeModel: (s.personality as AISettings['activeModel']) || prev.activeModel,
          geminiTemperature: (s.temperature as number) ?? prev.geminiTemperature,
          systemPrompt: (s.systemPrompt as string) || prev.systemPrompt,
          provider: (s.provider as AIProvider) || prev.provider,
          contextSize: (s.contextSize as number) ?? prev.contextSize,
          cacheEnabled: (s.cacheEnabled as boolean) ?? prev.cacheEnabled,
          moderationEnabled: (s.moderationEnabled as boolean) ?? prev.moderationEnabled,
          moderationThreshold: (s.moderationThreshold as number) ?? prev.moderationThreshold,
          toolGrantRoles: (s.toolGrantRoles as boolean) ?? prev.toolGrantRoles,
        }));
      } else {
        setSettings(DEFAULT);
      }
    }).catch(() => {}).finally(() => setSettingsLoading(false));
  }, [selectedServer, selectedServerId]);

  const refreshUsage = useCallback(() => {
    if (!selectedServer) return;
    api.ai.getUsage(selectedServerId).then((data) => {
      if (!data.error) setUsage({ used: data.used, limit: data.limit });
    }).catch(() => {});
  }, [selectedServer, selectedServerId]);

  useEffect(() => { refreshUsage(); }, [refreshUsage]);

  const update = <K extends keyof AISettings>(key: K, value: AISettings[K]) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  const toggle = (key: keyof AISettings) =>
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  const save = async () => {
    if (!selectedServer) return;
    setSaving(true);
    try {
      await api.ai.save({
        server_id: selectedServerId,
        platform: selectedServer.platform,
        botName: settings.botName,
        personality: settings.activeModel,
        temperature: settings.geminiTemperature,
        systemPrompt: settings.systemPrompt,
        provider: settings.provider,
        contextSize: settings.contextSize,
        cacheEnabled: settings.cacheEnabled,
        moderationEnabled: settings.moderationEnabled,
        moderationThreshold: settings.moderationThreshold,
        toolGrantRoles: settings.toolGrantRoles,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { alert('Не удалось сохранить настройки'); }
    finally { setSaving(false); }
  };

  if (serverLoading || settingsLoading) {
    return <div className="p-8 text-[rgb(var(--text-secondary))]">⏳ Загрузка...</div>;
  }

  if (!selectedServer) {
    return <NoServerSelected title="✨ AI-Настройки" />;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">✨ AI-Настройки</h1>
          <p className="text-[rgb(var(--text-secondary))] text-sm mt-1">Гибкая настройка моделей и стилей общения 🤖</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setPlaygroundOpen(true)}>
            <Sparkles className="h-4 w-4 mr-1.5" /> Playground
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? 'Сохранение...' : saved ? '✅ Сохранено!' : '💾 Сохранить'}
          </Button>
        </div>
      </div>

      {usage && (
        <Card className="p-4">
          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="font-medium">📊 Лимиты API (сегодня)</span>
            <span className="text-[rgb(var(--text-secondary))]">{usage.used} / {usage.limit}</span>
          </div>
          <div className="h-2 rounded-full bg-[rgb(var(--surface-2))] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all"
              style={{ width: `${Math.min(100, (usage.used / Math.max(1, usage.limit)) * 100)}%` }}
            />
          </div>
        </Card>
      )}

      <div className="flex gap-1.5 flex-wrap">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))]'
                : 'border border-transparent text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-2))]'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">🤖 Активная модель</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'auto', label: '🔄 Авто', desc: 'Gemini → DeepSeek' },
                { value: 'gemini', label: '🔥 Gemini', desc: 'Google AI' },
                { value: 'deepseek', label: '🧠 DeepSeek', desc: 'DeepSeek AI' },
              ].map(m => (
                <button key={m.value} onClick={() => update('activeModel', m.value as AISettings['activeModel'])}
                  className={`p-4 rounded-2xl text-left border-2 transition-all ${
                    settings.activeModel === m.value
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] hover:border-indigo-400/50'
                  }`}>
                  <div className="font-semibold">{m.label}</div>
                  <div className="text-xs text-[rgb(var(--text-secondary))] mt-1">{m.desc}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[rgb(var(--text-secondary))] block mb-2">🤖 Имя бота</label>
                <input type="text" value={settings.botName}
                  onChange={e => update('botName', e.target.value)} className="input w-full" />
              </div>
              <div>
                <label className="text-sm text-[rgb(var(--text-secondary))] block mb-2">🌐 Язык</label>
                <select value={settings.language} onChange={e => update('language', e.target.value)} className="input w-full">
                  <option value="ru">🇷🇺 Русский</option>
                  <option value="en">🇬🇧 English</option>
                </select>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">📝 Системный промпт</h3>
            <textarea value={settings.systemPrompt}
              onChange={e => update('systemPrompt', e.target.value)}
              rows={3} className="input w-full font-mono text-sm resize-y" />
            <div className="flex flex-wrap gap-1.5 mt-3">
              {PROMPT_VARIABLES.map(v => (
                <button key={v.token} type="button" title={v.desc}
                  onClick={() => update('systemPrompt', `${settings.systemPrompt} ${v.token}`.trim())}
                  className="text-xs font-mono px-2 py-1 rounded-lg bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] text-indigo-400 hover:border-indigo-400/60 transition-colors">
                  {v.token}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">⚙️ Дополнительно</h3>
            {[
              { key: 'useContext' as const, label: '🧠 Запоминать контекст', desc: 'Помнить последние сообщения' },
              { key: 'autoModeration' as const, label: '🛡️ Авто-модерация AI', desc: 'Фильтровать ответы бота' },
            ].map((item, i, arr) => (
              <div key={item.key}
                className={`flex justify-between items-center py-3 ${i < arr.length - 1 ? 'border-b border-[rgb(var(--border))]' : ''}`}>
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-sm text-[rgb(var(--text-secondary))]">{item.desc}</div>
                </div>
                <Switch checked={!!settings[item.key]} onCheckedChange={() => toggle(item.key)} />
              </div>
            ))}
            {settings.useContext && (
              <div>
                <label className="text-sm text-[rgb(var(--text-secondary))] block mb-2">Сообщений для контекста</label>
                <input type="number" value={settings.contextMessages}
                  onChange={e => update('contextMessages', parseInt(e.target.value) || 10)}
                  min={1} max={50} className="input w-32" />
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'provider' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">🔌 LLM-провайдер</h3>
            <p className="text-sm text-[rgb(var(--text-secondary))] mb-4">
              При достижении лимита (429) или блокировке (403) бот автоматически переключится на следующий доступный провайдер.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {PROVIDERS.map(p => (
                <button key={p.value} onClick={() => update('provider', p.value)}
                  className={`p-4 rounded-2xl text-left border-2 transition-all ${
                    settings.provider === p.value
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] hover:border-indigo-400/50'
                  }`}>
                  <div className="font-semibold">{p.label}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">🧠 Контекстная память (RAG)</h3>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-[rgb(var(--text-secondary))]">Размер контекста</span>
                <span className="text-indigo-400 font-semibold">{settings.contextSize} сообщений</span>
              </div>
              <input type="range" min={0} max={20} step={1} value={settings.contextSize}
                onChange={e => update('contextSize', parseInt(e.target.value))}
                className="w-full accent-indigo-500" />
            </div>
            <div className="flex justify-between items-center py-3 border-t border-[rgb(var(--border))]">
              <div>
                <div className="font-medium">⚡ Умный кэш ответов</div>
                <div className="text-sm text-[rgb(var(--text-secondary))]">Повторяющиеся вопросы (&gt;90% совпадения) отвечаются мгновенно, без запроса к LLM</div>
              </div>
              <Switch checked={settings.cacheEnabled} onCheckedChange={() => toggle('cacheEnabled')} />
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">🛡️ AI Модерация</h3>
              <Switch checked={settings.moderationEnabled} onCheckedChange={() => toggle('moderationEnabled')} />
            </div>
            {settings.moderationEnabled && (
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-[rgb(var(--text-secondary))]">Порог уверенности токсичности</span>
                  <span className="text-indigo-400 font-semibold">{settings.moderationThreshold}%</span>
                </div>
                <input type="range" min={0} max={100} step={5} value={settings.moderationThreshold}
                  onChange={e => update('moderationThreshold', parseInt(e.target.value))}
                  className="w-full accent-indigo-500" />
                <p className="text-xs text-[rgb(var(--text-secondary))] mt-2">
                  Если локальный фильтр находит подозрительное сообщение, AI оценивает токсичность (0-100%).
                  При превышении порога сообщение удаляется.
                </p>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">🧰 Инструменты (Function Calling)</h3>
            <label className="flex items-center gap-3 py-2 cursor-pointer">
              <input type="checkbox" checked={settings.toolGrantRoles}
                onChange={() => toggle('toolGrantRoles')}
                className="w-4 h-4 accent-indigo-500" />
              <span className="text-sm">Выдавать роли (только Lolka)</span>
            </label>
          </Card>
        </div>
      )}

      {activeTab === 'gemini' && (
        <Card className="p-6 space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">🔥 Google Gemini</h3>
            <Switch checked={settings.geminiEnabled} onCheckedChange={() => toggle('geminiEnabled')} />
          </div>
          {settings.geminiEnabled && (<>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-[rgb(var(--text-secondary))]">🌡️ Температура</span>
                <span className="text-indigo-400 font-semibold">{settings.geminiTemperature}</span>
              </div>
              <input type="range" min="0" max="1" step="0.1" value={settings.geminiTemperature}
                onChange={e => update('geminiTemperature', parseFloat(e.target.value))}
                className="w-full accent-indigo-500" />
            </div>
            <div className="space-y-2">
              {GEMINI_STYLES.map(style => (
                <button key={style.value} onClick={() => update('geminiStyle', style.value)}
                  className={`w-full p-4 rounded-2xl text-left border-2 transition-all ${
                    settings.geminiStyle === style.value
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] hover:border-indigo-400/50'
                  }`}>
                  <div className="font-semibold">{style.label}</div>
                  <div className="text-xs text-[rgb(var(--text-secondary))] mt-0.5">{style.desc}</div>
                </button>
              ))}
            </div>
            <div>
              <label className="text-sm text-[rgb(var(--text-secondary))] block mb-2">📝 Кастомный промпт для Gemini</label>
              <textarea value={settings.geminiCustomPrompt}
                onChange={e => update('geminiCustomPrompt', e.target.value)}
                rows={2} placeholder="Дополнительные инструкции..."
                className="input w-full font-mono text-sm resize-y" />
            </div>
          </>)}
        </Card>
      )}

      {activeTab === 'deepseek' && (
        <Card className="p-6 space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">🧠 DeepSeek AI</h3>
            <Switch checked={settings.deepseekEnabled} onCheckedChange={() => toggle('deepseekEnabled')} />
          </div>
          {settings.deepseekEnabled && (<>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-[rgb(var(--text-secondary))]">🌡️ Температура</span>
                <span className="text-purple-400 font-semibold">{settings.deepseekTemperature}</span>
              </div>
              <input type="range" min="0" max="1" step="0.1" value={settings.deepseekTemperature}
                onChange={e => update('deepseekTemperature', parseFloat(e.target.value))}
                className="w-full accent-purple-500" />
            </div>
            <div className="space-y-2">
              {DEEPSEEK_STYLES.map(style => (
                <button key={style.value} onClick={() => update('deepseekStyle', style.value)}
                  className={`w-full p-4 rounded-2xl text-left border-2 transition-all ${
                    settings.deepseekStyle === style.value
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] hover:border-purple-400/50'
                  }`}>
                  <div className="font-semibold">{style.label}</div>
                  <div className="text-xs text-[rgb(var(--text-secondary))] mt-0.5">{style.desc}</div>
                </button>
              ))}
            </div>
            <div>
              <label className="text-sm text-[rgb(var(--text-secondary))] block mb-2">📝 Кастомный промпт для DeepSeek</label>
              <textarea value={settings.deepseekCustomPrompt}
                onChange={e => update('deepseekCustomPrompt', e.target.value)}
                rows={2} placeholder="Дополнительные инструкции..."
                className="input w-full font-mono text-sm resize-y" />
            </div>
          </>)}
        </Card>
      )}

      {activeTab === 'server' && (
        <div className="space-y-4">
          <Card className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[rgb(var(--text-secondary))] block mb-2">Платформа</label>
                <select value={settings.platform} onChange={e => update('platform', e.target.value)} className="input w-full">
                  <option value="VK">💬 VK</option>
                  <option value="Lolka">⚡ Lolka</option>
                  <option value="MAX">🚀 MAX</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-[rgb(var(--text-secondary))] block mb-2">Название сервера/группы</label>
                <input type="text" value={settings.serverName}
                  onChange={e => update('serverName', e.target.value)}
                  placeholder="Phoenix Gaming" className="input w-full" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">🖼️ Аватар AI-помощника</h3>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {AVATARS.map(avatar => (
                <button key={avatar.id} onClick={() => update('avatarStyle', avatar.id)}
                  className={`p-4 rounded-2xl text-center border-2 transition-all ${
                    settings.avatarStyle === avatar.id
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] hover:border-indigo-400/50'
                  }`}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto mb-2 bg-[rgb(var(--surface))]"
                    style={{ border: `2px solid ${avatar.color}40`, color: avatar.color }}>
                    {avatar.icon}
                  </div>
                  <div className="text-xs font-medium">{avatar.label}</div>
                </button>
              ))}
            </div>
            <div>
              <label className="text-sm text-[rgb(var(--text-secondary))] block mb-2">Или укажите свой URL аватара</label>
              <input type="text" value={settings.avatarUrl}
                onChange={e => update('avatarUrl', e.target.value)}
                placeholder="https://example.com/avatar.png" className="input w-full" />
            </div>
          </Card>
        </div>
      )}

      {saved && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-5 py-3 rounded-2xl font-semibold shadow-lg z-50">
          ✅ Настройки AI сохранены
        </div>
      )}
    </div>
  );
}