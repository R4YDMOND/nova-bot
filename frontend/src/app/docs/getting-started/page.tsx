'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, UserPlus, Link2, Settings } from 'lucide-react';
import Link from 'next/link';

const steps = [
  {
    icon: UserPlus,
    title: '1. Создайте сервер',
    description:
      'Если у вас ещё нет сообщества в VK или сервера в Lolka — создайте его перед подключением бота. Nova Bot работает с уже существующими сообществами, отдельная регистрация не требуется.',
  },
  {
    icon: Link2,
    title: '2. Подключите VK или Lolka',
    description:
      'Войдите в панель управления через кнопку «Войти через VK» или «Войти через Lolka» на главной странице. После авторизации выберите сообщество из списка в разделе «Серверы» и добавьте его — укажите название и ID.',
  },
  {
    icon: Settings,
    title: '3. Настройте бота',
    description:
      'Перейдите в «Команды», чтобы включить нужные модули (модерация, музыка, AI-помощник), и в «Модерация», чтобы задать базовую защиту сообщества — антиспам, антирейд, фильтры контента.',
  },
];

export default function GettingStartedPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6 space-y-8">
      <Link href="/docs" className="inline-flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))] hover:text-nova-400 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Назад к документации
      </Link>

      <div>
        <h1 className="text-4xl font-bold tracking-tighter mb-3">Начало работы</h1>
        <p className="text-lg text-[rgb(var(--text-secondary))]">
          Ваш путь к подключению Nova Bot — от создания сервера до первой настроенной команды.
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <Card key={i}>
            <CardHeader>
              <step.icon className="w-7 h-7 text-nova-400 mb-2" />
              <CardTitle>{step.title}</CardTitle>
              <CardDescription className="text-base">{step.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            Не получилось подключить сообщество или бот не отвечает на команды? Проверьте раздел{' '}
            <Link href="/docs/moderation" className="text-nova-400 hover:underline">Модерация и Команды</Link>{' '}
            или напишите в поддержку.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}