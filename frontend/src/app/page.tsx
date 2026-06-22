'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, MessageCircle, Bot, Zap } from 'lucide-react';
import Link from 'next/link';

const API_BASE = 'https://nova-bot-rpsy.onrender.com';

export default function HomePage() {
  const [stats, setStats] = useState({ servers: 0, users: 0, responseTime: 0.8, webhooksOnline: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/stats`)
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const formatNumber = (num: number): string => {
    if (num === 0) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M+';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K+';
    return num.toString() + '+';
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--text))]">
      {/* Hero */}
      <div className="pt-24 pb-16 px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-3 bg-[rgb(var(--surface-2))] px-4 py-2 rounded-2xl">
            <div className={`w-3 h-3 rounded-full animate-pulse ${stats.webhooksOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">{stats.webhooksOnline ? 'Вебхуки работают' : 'Подключение...'}</span>
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

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-10 py-7">Открыть панель управления</Button>
            </Link>
            <Link href="/docs">
              <Button variant="secondary" size="lg" className="text-lg px-10 py-7">Документация</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="max-w-4xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-semibold mb-8 text-center">Статистика проекта</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Users className="w-8 h-8 text-nova-400" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-4xl font-bold">{loading ? '...' : formatNumber(stats.servers)}</CardTitle>
              <p className="text-[rgb(var(--text-secondary))]">Серверов</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Bot className="w-8 h-8 text-nova-400" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-4xl font-bold">{loading ? '...' : formatNumber(stats.users)}</CardTitle>
              <p className="text-[rgb(var(--text-secondary))]">Пользователей</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Zap className="w-8 h-8 text-nova-400" />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-4xl font-bold">{loading ? '...' : `<${stats.responseTime}s`}</CardTitle>
              <p className="text-[rgb(var(--text-secondary))]">Время ответа</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
