"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

const API_BASE = "https://nova-bot-rpsy.onrender.com";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/stats/dashboard`)
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const quickActions = [
    { icon: "📢", label: "Рассылка", desc: "Сообщение во все каналы", href: "/dashboard/webhooks" },
    { icon: "🗓️", label: "Создать событие", desc: "Запланировать ивент", href: "/dashboard/webhooks" },
    { icon: "🎵", label: "Включить музыку", desc: "Треки и радио", href: "/dashboard/music" },
    { icon: "🔍", label: "Сканировать", desc: "Популярный контент", href: "/dashboard/webhooks" },
  ];

  const recentActivity = [
    { text: "Тестовый вебхук отправлен", time: "Только что", icon: "🧪" },
    { text: "Сервер Phoenix Gaming добавлен", time: "5 мин назад", icon: "🖥️" },
    { text: "Сканирование завершено", time: "1 час назад", icon: "🔍" },
    { text: "Обновлены настройки AI", time: "Вчера", icon: "🤖" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">👋 Добро пожаловать в Nova</h1>
          <p className="text-[rgb(var(--text-secondary))]">Управляйте серверами, музыкой, событиями и аналитикой</p>
        </div>
        <Link href="/dashboard/servers" className="px-5 py-2.5 bg-nova-500 hover:bg-nova-600 text-black rounded-2xl font-semibold text-sm transition-all">
          + Подключить сервер
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Серверов", value: stats.serversCount ?? "-", icon: "🖥️", color: "border-t-nova-500" },
          { label: "Пользователей", value: stats.totalUsers ?? "-", icon: "👥", color: "border-t-emerald-500" },
          { label: "Новых за неделю", value: stats.newUsers ?? "-", icon: "⭐", color: "border-t-amber-500" },
          { label: "Команд", value: stats.commandsUsed ?? "-", icon: "⚡", color: "border-t-purple-500" },
        ].map((card, i) => (
          <Card key={i} className={`border-t-2 ${card.color} flex items-center gap-4`}>
            <span className="text-2xl">{card.icon}</span>
            <div>
              <div className="text-xl font-bold">{loading ? "..." : card.value}</div>
              <div className="text-xs text-[rgb(var(--text-secondary))]">{card.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">⚡ Быстрые действия</h3>
        <div className="grid grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <Link key={i} href={action.href} className="card flex items-center gap-4 hover:border-nova-400/30 transition-all">
              <span className="text-2xl">{action.icon}</span>
              <div>
                <div className="font-semibold text-sm">{action.label}</div>
                <div className="text-xs text-[rgb(var(--text-secondary))]">{action.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">📋 Последняя активность</h3>
        <Card className="divide-y divide-[rgb(var(--border))]">
          {recentActivity.map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1 text-sm">{item.text}</span>
              <span className="text-xs text-[rgb(var(--text-muted))]">{item.time}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}