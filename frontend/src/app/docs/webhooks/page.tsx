'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowLeftRight, MessageSquare, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default function WebhooksDocsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6 space-y-8">
      <Link href="/docs" className="inline-flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))] hover:text-nova-400 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Назад к документации
      </Link>

      <div>
        <h1 className="text-4xl font-bold tracking-tighter mb-3">Вебхуки и Интеграции</h1>
        <p className="text-lg text-[rgb(var(--text-secondary))]">
          Nova Bot умеет автоматически синхронизировать сообщества между VK и Lolka в реальном времени.
        </p>
      </div>

      <Card>
        <CardHeader>
          <ArrowLeftRight className="w-7 h-7 text-nova-400 mb-2" />
          <CardTitle>Авто-переадресация VK ↔ Lolka</CardTitle>
          <CardDescription className="text-base">
            Включается в разделе «Вебхуки» панели управления. Работает в обе стороны независимо —
            можно включить только VK → Lolka, только Lolka → VK, или оба направления сразу.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <MessageSquare className="w-7 h-7 text-nova-400 mb-2" />
          <CardTitle>Синхронизация сообщений</CardTitle>
          <CardDescription className="text-base">
            Новые сообщения, редактирование и удаление на одной платформе автоматически отражаются
            на другой. Реагирует на события message.new, message.edit, message.delete.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <ImageIcon className="w-7 h-7 text-nova-400 mb-2" />
          <CardTitle>Синхронизация медиа</CardTitle>
          <CardDescription className="text-base">
            Изображения и вложения, загруженные в одном сообществе, копируются в другое —
            галереи и медиатеки остаются идентичными на обеих платформах.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="py-6 space-y-2">
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            Логи всех запросов вебхуков (успешные и с ошибками) доступны в разделе «Вебхуки» →
            «Логи вебхуков». Там же — статистика запросов и кнопка «Тестировать» для проверки
            конкретной интеграции без ожидания реального события.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}