'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Toggle';
import { Badge } from '@/components/ui/Badge';
import { Zap, Copy, Trash2, Plus } from 'lucide-react';
import { useState } from 'react';

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState([
    { id: 1, name: "Lolka", server: "Phoenix Gaming", url: "https://lolka.app/api/webhooks/xxx", channel: "📢 общий", active: true },
    { id: 2, name: "VK", server: "Техномания", url: "https://vk.com/callback/xxx", channel: "📢 Новости", active: true },
  ]);

  const toggleWebhook = (id: number) => {
    setWebhooks(prev => prev.map(h => h.id === id ? { ...h, active: !h.active } : h));
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('URL скопирован!');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="w-8 h-8 text-nova-400" />
            Вебхуки
          </h1>
          <p className="text-[rgb(var(--text-secondary))] mt-2">Управление подключениями и событиями</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Новый вебхук
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {webhooks.map((hook) => (
          <Card key={hook.id} className="group">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-nova-400 to-cyan-500 rounded-2xl flex items-center justify-center text-lg">
                    {hook.name === 'Lolka' ? '🎮' : '💙'}
                  </div>
                  <div>
                    <CardTitle>{hook.name}</CardTitle>
                    <CardDescription>{hook.server}</CardDescription>
                  </div>
                </div>
                <Badge variant={hook.active ? "success" : "default"}>
                  {hook.active ? "● Активен" : "Неактивен"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-[rgb(var(--surface-2))] p-3 rounded-2xl text-sm font-mono break-all">{hook.url}</div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[rgb(var(--text-secondary))]">Канал:</span>
                <span>{hook.channel}</span>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-[rgb(var(--border))]">
                <Button variant="secondary" size="sm" onClick={() => copyUrl(hook.url)} className="flex-1">
                  <Copy className="w-4 h-4 mr-2" /> Копировать
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleWebhook(hook.id)}>
                  <Switch checked={hook.active} /> {hook.active ? "Выключить" : "Включить"}
                </Button>
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Создать новый вебхук</CardTitle>
          <CardDescription>Настройте новое подключение к внешнему сервису</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full">Добавить вебхук</Button>
        </CardContent>
      </Card>
    </div>
  );
}
