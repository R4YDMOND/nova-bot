'use client';

/**
 * AI-Настройки — единый лейаут (редизайн по рекомендации, ТЗ №9).
 *
 * Раньше настройки были размазаны по вкладкам (Общие / Провайдер и RAG / Gemini / DeepSeek),
 * причём вкладки Gemini/DeepSeek дублировали температуру/стиль и почти ничего не сохраняли
 * в бэкенд (activeModel/geminiStyle/deepseekCustomPrompt никогда не отправлялись в save()).
 * Здесь — 4 карточки сверху вниз, без дублирования: провайдер теперь выпадающий список
 * (общие температура/промпт одинаковы для всех LLM), стиль — переключатель с инъекцией
 * в системный промпт на бэкенде (ai_engine.PERSONALITY_STYLES), а не мёртвое поле.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/toggle';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { api } from '@/lib/api';
import { useServer } from '@/context/ServerProvider';
import { NoServerSelected } from '@/components/NoServerSelected';
import { AIPlaygroundModal } from '@/components/AIPlaygroundModal';
import {
  PROVIDERS, LANGUAGES, PERSONALITY_STYLES, PROMPT_VARIABLES,
  type AISettings, type AIUsage,
} from '@/types/ai';
import { cn } from '@/lib/utils';

const DEFAULT: AISettings = {
  botName: 'Нова ✨',
  personality: 'friendly',
  language: 'ru',
  temperature: 0.7,
  systemPrompt: 'Ты — дружелюбный AI-помощник. 🤖',
  provider: 'yandexgpt',
  contextSize: 5,
  cacheEnabled: true,
  urlTranslateEnabled: true,
  moderationEnabled: false,
  moderationThreshold: 70,
  toolGrantRoles: false,
};

export default function AIPage() {
  const { servers, selectedServer, selectedServerId, loading: serverLoading } = useServer();
  const [platformFilter, setPlatformFilter] = useState<'vk' | 'lolka' | 'max'>('vk');
  const filteredServers = useMemo(() => servers.filter(s => s.platform === platformFilter), [servers, platformFilter]);
  const effectiveServer = useMemo(() => {
    if (selectedServer && selectedServer.platform === platformFilter) return selectedServer;
    return filteredServers[0] || null;
  }, [selectedServer, platformFilter, filteredServers]);
  const effectiveServerId = effectiveServer?.server_id || selectedServerId;

  const [settings, setSettings] = useState<AISettings>(DEFAULT);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  const [usage, setUsage] = useState<AIUsage | null>(null);

  const platformPills = (
    <div className="flex p-1 rounded-lg border bg-[rgb(var(--surface))] border-[rgb(var(--border))]">
      {[
        { id: 'vk' as const, label: 'VK', color: 'bg-blue-500' },
        { id: 'lolka' as const, label: 'Lolka', color: 'bg-purple-500' },
        { id: 'max' as const, label: 'MAX', color: 'bg-red-500' },
      ].map(p => (
        <button
          key={p.id}
          onClick={() => setPlatformFilter(p.id)}
          title="Выберите платформу для настройки AI"
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-bold transition-all',
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

  useEffect(() => {
    if (!effectiveServer) { setSettingsLoading(false); return; }
    setSettingsLoading(true);
    api.ai.get(effectiveServerId).then((data) => {
      if (data.settings) {
        setSettings(prev => ({ ...prev, ...(data.settings as Partial<AISettings>) }));
      } else {
        setSettings(DEFAULT);
      }
    }).catch(() => {}).finally(() => setSettingsLoading(false));
  }, [effectiveServer, effectiveServerId]);

  const refreshUsage = useCallback(() => {
    if (!effectiveServer) return;
    api.ai.getUsage(effectiveServerId).then((data) => {
      if (!data.error) setUsage({ used: data.used, limit: data.limit });
    }).catch(() => {});
  }, [effectiveServer, effectiveServerId]);

  useEffect(() => { refreshUsage(); }, [refreshUsage]);

  const update = <K extends keyof AISettings>(key: K, value: AISettings[K]) =>
    setSettings(prev => ({ ...prev, [key]: value }));

  const toggle = (key: keyof AISettings) =>
    setSettings(prev => ({ ...prev, [key]: !prev[key] } as AISettings));

  const save = async () => {
    if (!effectiveServer) return;
    setSaving(true);
    try {
      await api.ai.save({
        server_id: effectiveServerId,
        platform: effectiveServer.platform,
        botName: settings.botName,
        personality: settings.personality,
        language: settings.language,
        temperature: settings.temperature,
        systemPrompt: settings.systemPrompt,
        provider: settings.provider,
        contextSize: settings.contextSize,
        cacheEnabled: settings.cacheEnabled,
        urlTranslateEnabled: settings.urlTranslateEnabled,
        moderationEnabled: settings.moderationEnabled,
        moderationThreshold: settings.moderationThreshold,
        toolGrantRoles: settings.toolGrantRoles,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      refreshUsage();
    } catch { alert('Не удалось сохранить настройки'); }
    finally { setSaving(false); }
  };

  if (serverLoading || settingsLoading) {
    return <div className="p-8 text-[rgb(var(--text-secondary))]">⏳ Загрузка...</div>;
  }

  if (filteredServers.length === 0) {
    const label = platformFilter === 'vk' ? 'VK' : platformFilter === 'lolka' ? 'Lolka' : 'MAX';
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-secondary))]">Платформа:</span>
          {platformPills}
        </div>
        <NoServerSelected
          heading={`Нет серверов ${label}`}
          description={`Добавьте и настройте сервер ${label} на странице управления серверами.`}
          link="/dashboard/servers"
          linkText="Перейти к серверам"
        />
      </div>
    );
  }

  if (!effectiveServer) {
    return <NoServerSelected title="✨ AI-Настройки" />;
  }

  const usagePct = usage ? Math.min(100, (usage.used / Math.max(1, usage.limit)) * 100) : 0;
  const usageColor = usagePct >= 90 ? 'text-red-400' : usagePct >= 80 ? 'text-amber-400' : 'text-green-400';
  const usageBarColor = usagePct >= 90 ? 'from-red-500 to-red-600' : usagePct >= 80 ? 'from-amber-500 to-orange-500' : 'from-green-500 to-emerald-600';

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Шапка */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">✨ AI-Настройки</h1>
          <p className="text-[rgb(var(--text-secondary))] text-sm mt-1">Единая настройка модели, памяти и модерации</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {platformPills}
          {usage && (
            <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-[rgb(var(--surface))] border border-[rgb(var(--border))]', usageColor)}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Лимиты API: {usage.used} / {usage.limit}
            </div>
          )}
          <Button variant="secondary" onClick={() => setPlaygroundOpen(true)}>
            <Sparkles className="h-4 w-4 mr-1.5" /> Playground
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? 'Сохранение...' : saved ? '✅ Сохранено!' : '💾 Сохранить'}
          </Button>
        </div>
      </div>

      {usage && (
        <div className="h-1.5 rounded-full bg-[rgb(var(--surface-2))] overflow-hidden -mt-2">
          <div className={cn('h-full rounded-full bg-gradient-to-r transition-all', usageBarColor)} style={{ width: `${usagePct}%` }} />
        </div>
      )}

      {/* Карточка 1: Конфигурация модели */}
      <Card className="p-6 space-y-5">
        <div>
          <h3 className="text-lg font-semibold">🔌 Конфигурация модели</h3>
          <p className="text-sm text-[rgb(var(--text-secondary))] mt-0.5">
            При лимите (429) или блокировке (403) бот автоматически переключится на резервный провайдер.
          </p>
        </div>
        <div>
          <label className="text-sm text-[rgb(var(--text-secondary))] block mb-2">LLM-провайдер</label>
          <Select value={settings.provider} onValueChange={v => update('provider', v as AISettings['provider'])}>
            <SelectTrigger>{PROVIDERS.find(p => p.value === settings.provider)?.label}</SelectTrigger>
            <SelectContent>
              {PROVIDERS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-[rgb(var(--text-secondary))] block mb-2">Имя бота</label>
            <input type="text" value={settings.botName} onChange={e => update('botName', e.target.value)} className="input w-full" />
          </div>
          <div>
            <label className="text-sm text-[rgb(var(--text-secondary))] block mb-2">Язык ответов</label>
            <Select value={settings.language} onValueChange={v => update('language', v as AISettings['language'])}>
              <SelectTrigger>{LANGUAGES.find(l => l.value === settings.language)?.label}</SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Карточка 2: Личность и поведение */}
      <Card className="p-6 space-y-5">
        <h3 className="text-lg font-semibold">🎭 Личность и поведение</h3>
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-[rgb(var(--text-secondary))]">Температура (креативность)</span>
              <span className="text-indigo-400 font-semibold">{settings.temperature.toFixed(1)}</span>
            </div>
            <input type="range" min={0} max={1} step={0.1} value={settings.temperature}
              onChange={e => update('temperature', parseFloat(e.target.value))}
              className="w-full accent-indigo-500" />
          </div>
          <div>
            <span className="text-sm text-[rgb(var(--text-secondary))] block mb-2">Стиль общения</span>
            <div className="flex flex-wrap gap-1.5">
              {PERSONALITY_STYLES.map(s => (
                <button key={s.value} type="button" onClick={() => update('personality', s.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                    settings.personality === s.value
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                      : 'border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] hover:border-indigo-400/50'
                  )}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className="text-sm text-[rgb(var(--text-secondary))] block mb-2">Системный промпт</label>
          <textarea value={settings.systemPrompt} onChange={e => update('systemPrompt', e.target.value)}
            rows={4} className="input w-full font-mono text-sm resize-y" />
          <div className="flex flex-wrap gap-1.5 mt-3">
            {PROMPT_VARIABLES.map(v => (
              <button key={v.token} type="button" title={v.desc}
                onClick={() => update('systemPrompt', `${settings.systemPrompt} ${v.token}`.trim())}
                className="text-xs font-mono px-2 py-1 rounded-lg bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] text-indigo-400 hover:border-indigo-400/60 transition-colors">
                {v.token}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Карточка 3: Память и оптимизация */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold">🧠 Память и оптимизация</h3>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-[rgb(var(--text-secondary))]">Контекстная память (RAG) — размер контекста</span>
            <span className="text-indigo-400 font-semibold">{settings.contextSize} сообщ.</span>
          </div>
          <input type="range" min={0} max={20} step={1} value={settings.contextSize}
            onChange={e => update('contextSize', parseInt(e.target.value))}
            className="w-full accent-indigo-500" />
        </div>
        <div className="flex justify-between items-center py-3 border-t border-[rgb(var(--border))]">
          <div>
            <div className="font-medium">⚡ Умный кэш ответов</div>
            <div className="text-sm text-[rgb(var(--text-secondary))]">Похожие вопросы (&gt;90% совпадения) отвечаются мгновенно, без запроса к LLM</div>
          </div>
          <Switch checked={settings.cacheEnabled} onCheckedChange={() => toggle('cacheEnabled')} />
        </div>
        <div className="flex justify-between items-center py-3 border-t border-[rgb(var(--border))]">
          <div>
            <div className="font-medium">🔗 Авто-перевод ссылок</div>
            <div className="text-sm text-[rgb(var(--text-secondary))]">Бот читает статьи по ссылкам в чате и кратко пересказывает их</div>
          </div>
          <Switch checked={settings.urlTranslateEnabled} onCheckedChange={() => toggle('urlTranslateEnabled')} />
        </div>
      </Card>

      {/* Карточка 4: Интеграции и безопасность */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold">🛡️ Интеграции и безопасность</h3>
        <div className="flex justify-between items-center py-3 border-b border-[rgb(var(--border))]">
          <div>
            <div className="font-medium">AI Модерация (AutoMod)</div>
            <div className="text-sm text-[rgb(var(--text-secondary))]">Удаляет токсичные/спам-сообщения, если AI уверен на заданный процент</div>
          </div>
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
          </div>
        )}
        {platformFilter === 'lolka' && (
          <div className="pt-3 border-t border-[rgb(var(--border))]">
            <div className="font-medium mb-2">🧰 Инструменты (Function Calling)</div>
            <label className="flex items-center gap-3 py-1 cursor-pointer">
              <input type="checkbox" checked={settings.toolGrantRoles}
                onChange={() => toggle('toolGrantRoles')}
                className="w-4 h-4 accent-indigo-500" />
              <span className="text-sm">Разрешить AI выдавать роли (по просьбе в чате)</span>
            </label>
          </div>
        )}
      </Card>

      <AIPlaygroundModal
        open={playgroundOpen}
        onOpenChange={setPlaygroundOpen}
        serverId={effectiveServerId}
        provider={settings.provider}
        temperature={settings.temperature}
        systemPrompt={settings.systemPrompt}
      />
    </div>
  );
}
