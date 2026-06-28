'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, Users, Server, Clock, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const [stats, setStats] = useState({
    servers: 1247,
    users: 87450,
    responseTime: 0.68,
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Симуляция загрузки реальных данных
    setTimeout(() => {
      setStats({
        servers: 1247,
        users: 87450,
        responseTime: 0.68,
      });
      setIsLoaded(true);
    }, 800);
  }, []);

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--text))]">
      {/* Hero Section */}
      <div className="pt-24 pb-16 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[rgb(var(--surface-2))] px-4 py-1.5 rounded-full mb-6">
            <span className="text-nova-400">⚡</span>
            <span className="text-sm font-medium">Nova Bot v2.4.1 — Активен</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-6">
            Умный бот для<br />
            <span className="bg-gradient-to-r from-nova-400 to-cyan-400 bg-clip-text text-transparent">
              Lolka-сообществ
            </span>
          </h1>

          <p className="text-xl text-[rgb(var(--text-secondary))] max-w-2xl mx-auto mb-10">
            Модерация, AI-помощник, уровни, музыка и вебхуки — всё в одном боте
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-10 py-7 rounded-3xl font-semibold">
                Открыть панель управления
                <ArrowRight className="ml-2" />
              </Button>
            </Link>
            
            <Button variant="secondary" size="lg" className="text-lg px-10 py-7 rounded-3xl font-semibold">
              Добавить на сервер
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-8 text-center">
            <div className="text-5xl font-bold text-nova-400 mb-3">
              {isLoaded ? stats.servers.toLocaleString() : '---'}+
            </div>
            <div className="text-[rgb(var(--text-secondary))]">Серверов подключено</div>
          </Card>

          <Card className="p-8 text-center">
            <div className="text-5xl font-bold text-nova-400 mb-3">
              {isLoaded ? (stats.users / 1000).toFixed(1) : '---'}K+
            </div>
            <div className="text-[rgb(var(--text-secondary))]">Активных пользователей</div>
          </Card>

          <Card className="p-8 text-center">
            <div className="text-5xl font-bold text-nova-400 mb-3">
              {isLoaded ? stats.responseTime : '---'}с
            </div>
            <div className="text-[rgb(var(--text-secondary))]">Среднее время ответа</div>
          </Card>
        </div>
      </div>

      {/* Features */}
      <div className="bg-[rgb(var(--surface))] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">Возможности Nova</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "🛡️", title: "Модерация", desc: "Авто-мод, фильтры, анти-спам" },
              { icon: "🤖", title: "AI-Помощник", desc: "Умные ответы и генерация контента" },
              { icon: "🏆", title: "Система уровней", desc: "Ранги, награды, лидерборды" },
              { icon: "🎵", title: "Музыка", desc: "YouTube, Spotify, радио" },
              { icon: "🔗", title: "Вебхуки", desc: "Гибкие уведомления и интеграции" },
              { icon: "📊", title: "Аналитика", desc: "Подробная статистика сервера" },
            ].map((feature, i) => (
              <Card key={i} className="p-8 hover:scale-[1.02] transition-transform">
                <div className="text-4xl mb-6">{feature.icon}</div>
                <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-[rgb(var(--text-secondary))]">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center py-12 text-[rgb(var(--text-secondary))]">
        Nova Bot © 2026 — Для Lolka-сообществ
      </div>
    </div>
  );
}
