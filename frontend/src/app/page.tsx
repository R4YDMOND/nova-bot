'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Zap, BarChart3, Shield, Music } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--text))]">
      {/* Hero секция */}
      <div className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-3 bg-[rgb(var(--surface-2))] px-4 py-2 rounded-2xl">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Онлайн</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter">
            Nova — твой<br />
            <span className="bg-gradient-to-r from-nova-400 to-cyan-400 bg-clip-text text-transparent">
              VK & Lolka Bot
            </span>
          </h1>

          <p className="text-xl text-[rgb(var(--text-secondary))] max-w-2xl mx-auto">
            Мощный многофункциональный бот для VK и Lolka.app<br />
            с удобной панелью управления
          </p>

          <div className="flex items-center justify-center gap-4 pt-6">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8 py-6">
                Открыть панель управления
              </Button>
            </Link>
            <Link href="/docs">
              <Button variant="secondary" size="lg" className="text-lg px-8 py-6">
                Документация
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Bot className="w-10 h-10 text-nova-400 mb-4" />
              <CardTitle>AI Функции</CardTitle>
              <CardDescription>Умные ответы, генерация контента и обработка сообщений</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="w-10 h-10 text-nova-400 mb-4" />
              <CardTitle>Вебхуки</CardTitle>
              <CardDescription>Интеграции с внешними сервисами и уведомлениями</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="w-10 h-10 text-nova-400 mb-4" />
              <CardTitle>Модерация</CardTitle>
              <CardDescription>Автоматическая модерация, фильтры и антиспам</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Music className="w-10 h-10 text-nova-400 mb-4" />
              <CardTitle>Музыка</CardTitle>
              <CardDescription>Проигрывание треков из VK и других источников</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="w-10 h-10 text-nova-400 mb-4" />
              <CardTitle>Аналитика</CardTitle>
              <CardDescription>Подробная статистика активности и вовлечённости</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Server className="w-10 h-10 text-nova-400 mb-4" />
              <CardTitle>Управление серверами</CardTitle>
              <CardDescription>Подключение и настройка нескольких сообществ</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
