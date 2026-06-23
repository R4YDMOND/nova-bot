"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/toggle';        // ← исправлено
import { Badge } from '@/components/ui/badge';
import { Zap, Copy, Trash2, Plus, ExternalLink } from 'lucide-react';

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState([
    {
      id: 1,
      name: "Lolka",
      project: "Phoenix Gaming",
      url: "https://lolka.app/api/webhooks/xxx123",
      event: "Новое сообщение",
      active: true,
    },
    {
      id: 2,
      name: "VK Callback",
      project: "Техномания",
      url: "https://api.vk.com/callback/yyy456",
      event: "Новый пост",
      active: true,
    },
  ]);

  const toggleWebhook = (id: number) => {
    setWebhooks(prev => prev.map(h =>
      h.id === id ? { ...h, active: !h.active } : h
    ));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('✅ URL скопирован в буфер обмена!');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="w-9 h-9 text-nova-400" />
            Вебхуки
          </h1>
          <p className="text-[rgb(var(--text-secondary))] mt-2">
            Управление интеграциями и уведомлениями
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Создать вебхук
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {webhooks.map((hook) => (
          <Card key={hook.id} className="group">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-nova-400 to-cyan-500 rounded-2xl flex items-center justify-center text-2xl">
                    🔗
                  </div>
                  <div>
                    <CardTitle className="text-xl">{hook.name}</CardTitle>
                    <CardDescription>{hook.project}</CardDescription>
                  </div>
                </div>
                <Badge variant={hook.active ? "success" : "secondary"}>
                  {hook.active ? "Активен" : "Выключен"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-xs text-[rgb(var(--text-secondary))] mb-1">URL</p>
                <div className="bg-[rgb(var(--surface-2))] p-3 rounded-2xl font-mono text-sm break-all flex items-center justify-between">
                  {hook.url}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(hook.url)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[rgb(var(--text-secondary))]">Событие:</span>
                <span className="font-medium">{hook.event}</span>
              </div>

              <div className="pt-4 border-t border-[rgb(var(--border))] flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => toggleWebhook(hook.id)}
                >
                  <Switch checked={hook.active} className="mr-2" />
                  {hook.active ? 'Выключить' : 'Включить'}
                </Button>
                <Button variant="ghost" className="text-red-400 hover:text-red-500 hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Пустая карточка для создания */}
      <Card className="border-dashed border-[rgb(var(--border))]">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[rgb(var(--surface-2))] flex items-center justify-center mb-6">
            <Plus className="w-8 h-8 text-[rgb(var(--text-secondary))]" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Новый вебхук</h3>
          <p className="text-[rgb(var(--text-secondary))] max-w-sm">
            Подключите Lolka.app, VK или любой внешний сервис
          </p>
          <Button className="mt-6">
            Создать вебхук
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
