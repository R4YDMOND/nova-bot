'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/toggle';
import { Zap, Copy, Trash2, Plus } from 'lucide-react';

type Webhook = { id: number; name: string; project: string; url: string; event: string; active: boolean };

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([
    { id: 1, name: 'Lolka', project: 'Phoenix Gaming', url: 'https://lolka.app/api/webhooks/xxx123', event: 'Новое сообщение', active: true },
    { id: 2, name: 'VK Callback', project: 'Техномания', url: 'https://api.vk.com/callback/yyy456', event: 'Новый пост', active: true },
  ]);
  const [copied, setCopied] = useState<number | null>(null);

  const toggleWebhook = (id: number) =>
    setWebhooks(prev => prev.map(h => h.id === id ? { ...h, active: !h.active } : h));
  const deleteWebhook = (id: number) =>
    setWebhooks(prev => prev.filter(h => h.id !== id));
  const copyUrl = (id: number, url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8 p-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[rgb(var(--text))] flex items-center gap-3">
            <Zap className="w-8 h-8 text-primary" />
            Вебхуки
          </h1>
          <p className="text-[rgb(var(--text-secondary))] mt-1">Управление интеграциями и уведомлениями</p>
        </div>
        <Button className="flex items-center gap-2">
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
                  <div className="w-11 h-11 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-xl">🔗</div>
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
    </div>
  );
}
