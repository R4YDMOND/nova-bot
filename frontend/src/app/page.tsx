'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Users, MessageCircle, Zap, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const stats = [
  { label: "Подключённых сообществ", value: "24", icon: Users, change: "+3 сегодня" },
  { label: "Сообщений обработано", value: "12.4k", icon: MessageCircle, change: "+18%" },
  { label: "AI-запросов сегодня", value: "3.2k", icon: Bot, change: "+41%" },
  { label: "Активных вебхуков", value: "18", icon: Zap, change: "Все работают" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--text))]">
      {/* Hero Section */}
      <div className="pt-24 pb-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-6">
            Nova — твой<br />
            <span className="bg-gradient-to-r from-nova-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              VK & Lolka Bot
            </span>
          </h1>
          <p className="text-xl text-[rgb(var(--text-secondary))] max-w-2xl mx-auto mb-10">
            Современная панель управления для VK и Lolka.app
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-10 py-7 w-full sm:w-auto">
                Открыть панель управления
              </Button>
            </Link>
            <Link href="/docs">
              <Button variant="secondary" size="lg" className="text-lg px-10 py-7 w-full sm:w-auto">
                Читать документацию
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-semibold mb-8 text-center">Общая статистика проекта</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:border-nova-400/30 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <stat.icon className="w-9 h-9 text-nova-400" />
                <span className="text-xs font-medium text-emerald-400">{stat.change}</span>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-4xl font-bold mb-1">{stat.value}</CardTitle>
                <p className="text-[rgb(var(--text-secondary))]">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
