'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Users, MessageCircle, TrendingUp, Zap } from 'lucide-react';
import Link from 'next/link';

const stats = [
  { label: "Активных серверов", value: "24", icon: Users, change: "+3 сегодня" },
  { label: "Сообщений обработано", value: "12.4k", icon: MessageCircle, change: "+18%" },
  { label: "AI запросов", value: "3.2k", icon: Bot, change: "+41%" },
  { label: "Вебхуков активно", value: "18", icon: Zap, change: "Все работают" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      {/* Hero */}
      <div className="pt-24 pb-16 px-6 text-center">
        <h1 className="text-6xl md:text-7xl font-bold tracking-tighter mb-6">
          Nova — твой<br />
          <span className="bg-gradient-to-r from-nova-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
            VK & Lolka Bot
          </span>
        </h1>
        <p className="text-xl text-[rgb(var(--text-secondary))] max-w-2xl mx-auto mb-8">
          Современная панель управления для VK и Lolka.app
        </p>
        <Link href="/dashboard">
          <Button size="lg" className="text-lg px-10 py-7">Открыть Dashboard</Button>
        </Link>
      </div>

      {/* Статистика */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-semibold mb-8">Общая статистика</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <stat.icon className="w-8 h-8 text-nova-400" />
                <span className="text-xs text-green-400 font-medium">{stat.change}</span>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-4xl font-bold">{stat.value}</CardTitle>
                <p className="text-[rgb(var(--text-secondary))]">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
