'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Plus, Trash2 } from 'lucide-react';

interface Webhook {
  id: string;
  platform: string;
  url: string;
  channel: string;
  serverName: string;
  active: boolean;
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([
    {
      id: '1',
      platform: 'Lolka',
      url: 'https://lolka.app/api/webhooks/xxx',
      channel: '📢 общий',
      serverName: 'Phoenix Gaming',
      active: true,
    },
    {
      id: '2',
      platform: 'VK',
      url: 'https://vk.com/callback/xxx',
      channel: '📢 Новости',
      serverName: 'Техномания',
      active: true,
    },
  ]);

  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="w-8 h-8 text-nova-400" />
            Вебхуки
          </h1>
          <p className="text-[rgb(var(--text-secondary))] mt-1">
            Управление подключениями и событиями
          </p>
        </div>

        <Button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Новый вебхук
        </Button>
      </div>

      <div className="grid gap-4">
        {webhooks.map((wh) => (
          <Card key={wh.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {wh.platform === 'Lolka' ? '🎮' : '💙'}
                </span>
                <div>
                  <h3 className="font-semibold text-lg">{wh.platform}</h3>
                  <p className="text-sm text-[rgb(var(--text-secondary))]">{wh.serverName}</p>
                </div>
              </div>
              
              <Badge variant={wh.active ? "success" : "default"}>
                {wh.active ? '● Активен' : '○ Выключен'}
              </Badge>
            </div>

            <div className="text-sm text-[rgb(var(--text-secondary))] break-all font-mono bg-[rgb(var(--surface-2))] p-4 rounded-2xl mb-4 border border-[rgb(var(--border))]">
              {wh.url}
            </div>

            <div className="text-sm mb-6">
              Канал: <span className="font-medium text-white">{wh.channel}</span>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" size="sm">Тест</Button>
              <Button variant="secondary" size="sm">Сканировать</Button>
              <Button variant="destructive" size="sm" className="ml-auto">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {showAdd && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Добавить новый вебхук</h3>
          <p className="text-[rgb(var(--text-secondary))] mb-6">
            Полноценная форма добавления вебхука будет добавлена в следующих обновлениях.
          </p>
          <Button onClick={() => setShowAdd(false)} variant="secondary">
            Закрыть
          </Button>
        </Card>
      )}
    </div>
  );
}