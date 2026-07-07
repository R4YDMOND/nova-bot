'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Zap, Shield, Music, Bot } from 'lucide-react';
import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="max-w-5xl mx-auto py-12 px-6 space-y-12">
      <div className="text-center">
        <div className="inline-flex items-center gap-3 mb-6">
          <BookOpen className="w-10 h-10 text-nova-400" />
        </div>
        <h1 className="text-5xl font-bold tracking-tighter mb-4">Документация Nova</h1>
        <p className="text-xl text-[rgb(var(--text-secondary))] max-w-2xl mx-auto">
          Всё, что нужно знать о настройке и использовании Lolka • VK Bot
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="group hover:border-nova-400/50 transition-colors">
          <CardHeader>
            <Bot className="w-8 h-8 text-nova-400 mb-3" />
            <CardTitle>Начало работы</CardTitle>
            <CardDescription>Как добавить бота и подключить сообщество</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/docs/getting-started">
              <Button variant="secondary" className="w-full">Перейти →</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="group hover:border-nova-400/50 transition-colors">
          <CardHeader>
            <Zap className="w-8 h-8 text-nova-400 mb-3" />
            <CardTitle>Вебхуки и Интеграции</CardTitle>
            <CardDescription>Настройка уведомлений и внешних сервисов</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/docs/webhooks">
              <Button variant="secondary" className="w-full">Перейти →</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="group hover:border-nova-400/50 transition-colors">
          <CardHeader>
            <Shield className="w-8 h-8 text-nova-400 mb-3" />
            <CardTitle>Модерация и Команды</CardTitle>
            <CardDescription>Автомодерация, кастомные команды</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/docs/moderation">
              <Button variant="secondary" className="w-full">Перейти →</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="group hover:border-nova-400/50 transition-colors">
          <CardHeader>
            <Music className="w-8 h-8 text-nova-400 mb-3" />
            <CardTitle>Музыка и AI</CardTitle>
            <CardDescription>Музыкальный плеер и искусственный интеллект</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/docs/music-ai">
              <Button variant="secondary" className="w-full">Перейти →</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="text-center pt-8">
        <p className="text-[rgb(var(--text-secondary))]">
          Нужна помощь? Напишите в поддержку или присоединяйтесь к сообществу.
        </p>
      </div>
    </div>
  );
}