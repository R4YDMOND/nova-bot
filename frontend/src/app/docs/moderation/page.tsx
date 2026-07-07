'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ShieldCheck, Filter, Gavel, Terminal } from 'lucide-react';
import Link from 'next/link';

export default function ModerationDocsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6 space-y-8">
      <Link href="/docs" className="inline-flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))] hover:text-nova-400 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Назад к документации
      </Link>

      <div>
        <h1 className="text-4xl font-bold tracking-tighter mb-3">Модерация и Команды</h1>
        <p className="text-lg text-[rgb(var(--text-secondary))]">
          Автоматическая защита сообщества и гибкая настройка команд бота.
        </p>
      </div>

      <Card>
        <CardHeader>
          <ShieldCheck className="w-7 h-7 text-nova-400 mb-2" />
          <CardTitle>Базовая защита</CardTitle>
          <CardDescription className="text-base">
            В разделе «Модерация» → «Защита» включаются антиспам, антирейд, фильтр нецензурных
            слов, капча для новых участников и фильтр ссылок. Каждый переключатель работает
            независимо.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <Filter className="w-7 h-7 text-nova-400 mb-2" />
          <CardTitle>Фильтры контента</CardTitle>
          <CardDescription className="text-base">
            Настраиваются запрещённые слова, заблокированные домены, лимиты на количество
            упоминаний и эмодзи в одном сообщении. Роли и каналы из белого списка исключаются
            из проверок автоматически.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <Gavel className="w-7 h-7 text-nova-400 mb-2" />
          <CardTitle>Наказания</CardTitle>
          <CardDescription className="text-base">
            Действие по умолчанию (предупреждение, таймаут, бан), длительность мута и шаблон
            причины задаются в «Наказания». Все нарушения фиксируются в «Журнал нарушений» —
            с указанием пользователя, типа нарушения и серьёзности.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <Terminal className="w-7 h-7 text-nova-400 mb-2" />
          <CardTitle>Кастомные команды</CardTitle>
          <CardDescription className="text-base">
            В разделе «Команды» можно создавать свои команды, задавать cooldown, доступные роли
            и пользовательский ответ с переменными вроде {'{user}'}, {'{reason}'}, {'{moderator}'}.
            Каждую команду можно временно отключить без удаления.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}