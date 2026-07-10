'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/toggle';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { Zap, Copy, Trash2, Plus, X } from 'lucide-react';

type Platform = 'vk' | 'lolka';

type Webhook = {
  id: number;
  name: string;
  platform: Platform;
  project: string;
  url: string;
  event: string;
  active: boolean;
};

const PLATFORM_LABEL: Record<Platform, string> = { vk: 'VK', lolka: 'Lolka' };
const PLATFORM_ICON: Record<Platform, string> = { vk: '🔵', lolka: '🎮' };

const EVENT_OPTIONS = [
  'Новое сообщение',
  'Новый пост',
  'Новый участник',
  'Модерация',
  'Изменение уровня',
];

const emptyForm = {
  platform: 'vk' as Platform,
  project: '',
  url: '',
  event: EVENT_OPTIONS[0],
};

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([
    { id: 1, name: 'Lolka', platform: 'lolka', project: 'Phoenix Gaming', url: 'https://lolka.app/api/webhooks/xxx123', event: 'Новое сообщение', active: true },
    { id: 2, name: 'VK Callback', platform: 'vk', project: 'Техномания', url: 'https://api.vk.com/callback/yyy456', event: 'Новый пост', active: true },
  ]);
  const [copied, setCopied] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const toggleWebhook = (id: number) =>
    setWebhooks(prev => prev.map(h => h.id === id ? { ...h, active: !h.active } : h));
  const deleteWebhook = (id: number) =>
    setWebhooks(prev => prev.filter(h => h.id !== id));
  const copyUrl = (id: number, url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const openModal = () => {
    setForm(emptyForm);
    setError(null);
    setShowModal(true);
  };

  const isValidUrl = (value: string) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const createWebhook = () => {
    if (!form.project.trim()) {
      setError('Укажите название проекта / сервера');
      return;
    }
    if (!isValidUrl(form.url)) {
      setError('Введите корректный URL вебхука (начинается с https://)');
      return;
    }
    const newHook: Webhook = {
      id: Date.now(),
      name: PLATFORM_LABEL[form.platform],
      platform: form.platform,
      project: form.project.trim(),
      url: form.url.trim(),
      event: form.event,
      active: true,
    };
    setWebhooks(prev => [newHook, ...prev]);
    setShowModal(false);
  };

  return (
    <div className="space-y-8 p-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[rgb(var(--text))] flex items-center gap-3">
            <Zap className="w-8 h-8 text-primary" />
            Вебхуки
          </h1>
          <p className="text-[rgb(var(--text-secondary))] mt-1">Управление интеграциями и уведомлениями VK и Lolka</p>
        </div>
        <Button onClick={openModal} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Создать вебхук
        </Button>
      </div>

      {webhooks.length === 0 && (
        <div className="text-center py-16 text-[rgb(var(--text-secondary))]">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Нет вебхуков. Создайте первый!</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {webhooks.map(hook => (
          <Card key={hook.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-xl">
                    {PLATFORM_ICON[hook.platform]}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{hook.name}</CardTitle>
                    <CardDescription>{hook.project}</CardDescription>
                  </div>
                </div>
                <Badge variant={hook.active ? 'success' : 'secondary'}>
                  {hook.active ? 'Активен' : 'Выключен'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-[rgb(var(--text-secondary))] text-xs mb-1">URL</p>
                <div className="bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] px-3 py-2 rounded-xl font-mono text-sm text-[rgb(var(--text-secondary))] flex items-center justify-between gap-2">
                  <span className="truncate">{hook.url}</span>
                  <button onClick={() => copyUrl(hook.id, hook.url)} className="shrink-0 text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))] transition-colors" title="Скопировать">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                {copied === hook.id && <p className="text-green-400 text-xs mt-1">✅ Скопировано!</p>}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[rgb(var(--text-secondary))]">Событие:</span>
                <span className="text-[rgb(var(--text))] font-medium">{hook.event}</span>
              </div>
              <div className="pt-3 border-t border-[rgb(var(--border))] flex gap-3">
                <button onClick={() => toggleWebhook(hook.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface))] transition-colors text-sm">
                  <Switch checked={hook.active} onCheckedChange={() => toggleWebhook(hook.id)} />
                  {hook.active ? 'Выключить' : 'Включить'}
                </button>
                <button onClick={() => deleteWebhook(hook.id)}
                  className="px-3 py-2 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-colors" title="Удалить">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-3xl p-8 max-w-md w-full relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 rounded-xl text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-2))] transition-colors">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Новый вебхук
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[rgb(var(--text-secondary))] mb-1.5">Платформа</label>
                <Select value={form.platform} onValueChange={(v: string) => setForm(f => ({ ...f, platform: v as Platform }))}>
                  <SelectTrigger>
                    <span className="flex items-center gap-2">
                      {PLATFORM_ICON[form.platform]} {PLATFORM_LABEL[form.platform]}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vk">🔵 VK</SelectItem>
                    <SelectItem value="lolka">🎮 Lolka</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm text-[rgb(var(--text-secondary))] mb-1.5">Проект / сервер</label>
                <input
                  type="text"
                  value={form.project}
                  onChange={e => setForm(f => ({ ...f, project: e.target.value }))}
                  placeholder="Например, Phoenix Gaming"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm text-[rgb(var(--text-secondary))] mb-1.5">URL вебхука</label>
                <input
                  type="text"
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder={form.platform === 'vk' ? 'https://api.vk.com/callback/...' : 'https://lolka.app/api/webhooks/...'}
                  className="input w-full font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-[rgb(var(--text-secondary))] mb-1.5">Событие</label>
                <Select value={form.event} onValueChange={(v: string) => setForm(f => ({ ...f, event: v }))}>
                  <SelectTrigger>
                    <span>{form.event}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_OPTIONS.map(ev => (
                      <SelectItem key={ev} value={ev}>{ev}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 px-5 py-2.5 border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] rounded-xl hover:bg-[rgb(var(--surface-2))] transition-colors">
                  Отмена
                </button>
                <Button onClick={createWebhook} className="flex-1">
                  Создать
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
