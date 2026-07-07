'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Music2, Radio, Brain, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function MusicAiDocsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6 space-y-8">
      <Link href="/docs" className="inline-flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))] hover:text-nova-400 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Назад к документации
      </Link>

      <div>
        <h1 className="text-4xl font-bold tracking-tighter mb-3">Музыка и AI</h1>
        <p className="text-lg text-[rgb(var(--text-secondary))]">
          Музыкальный плеер с несколькими провайдерами и встроенный AI-помощник для сообщества.
        </p>
      </div>

      <Card>
        <CardHeader>
          <Music2 className="w-7 h-7 text-nova-400 mb-2" />
          <CardTitle>Музыкальные провайдеры</CardTitle>
          <CardDescription className="text-base">
            В разделе «Музыка» подключаются VK Music, Spotify и YouTube Music. Можно
            воспроизводить треки в голосовых каналах и текстовых чатах, переключаться между
            провайдерами без остановки плеера.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <Radio className="w-7 h-7 text-nova-400 mb-2" />
          <CardTitle>Радиостанции</CardTitle>
          <CardDescription className="text-base">
            Готовые тематические станции (Chillout Lounge, Lo-Fi Beats, Synthwave Radio, Rock FM)
            запускаются одной кнопкой — без необходимости искать конкретные треки.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <Brain className="w-7 h-7 text-nova-400 mb-2" />
          <CardTitle>AI-модели</CardTitle>
          <CardDescription className="text-base">
            В «AI Настройках» выбирается активная модель: Auto (GPT + Local — автоматический
            выбор), Gemini (максимальная точность), DeepSeek (глубокий анализ) или Custom (своя
            модель и параметры). Температуру и системный промпт можно настроить под тон вашего
            сообщества.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <MessageCircle className="w-7 h-7 text-nova-400 mb-2" />
          <CardTitle>Контекст и авто-модерация</CardTitle>
          <CardDescription className="text-base">
            При включённом «Запоминать контекст» AI учитывает последние N сообщений диалога
            (настраивается количество). «AI авто-модерация» позволяет боту самостоятельно
            реагировать на нарушения — например, выполнять таймаут по команде из чата, как в
            примере: {'/ban @user спам 7d'}.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}