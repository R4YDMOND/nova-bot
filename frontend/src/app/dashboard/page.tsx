"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";        // ← исправлено

const API_BASE = "https://nova-bot-rpsy.onrender.com";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/stats/dashboard`)
      .then((r) => r.json())
      .then((d) => {
        setStats(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const quickActions = [
    { icon: "📢", label: "Рассылка", desc: "Сообщение во все каналы", href: "/dashboard/webhooks" },
    { icon: "🗓️", label: "Создать событие", desc: "Запланировать ивент", href: "/dashboard/webhooks" },
    { icon: "🎵", label: "Включить музыку", desc: "Треки и радио", href: "/dashboard/music" },
    { icon: "🔍", label: "Сканировать", desc: "Популярный контент", href: "/dashboard/webhooks" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">👋 Добро пожаловать в Nova</h1>
          <p className="text-[rgb(var(--text-secondary))] mt-1">
            Управляйте серверами, музыкой, событиями и аналитикой
          </p>
        </div>
        <Link
          href="/dashboard/servers"
          className="px-6 py-3 bg-nova-500 hover:bg-nova-600 text-black rounded-2xl font-semibold text-sm transition-all active:scale-95"
        >
          + Подключить сервер
        </Link>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Серверов", value: stats.serversCount ?? 0, icon: "🖥️" },
          { label: "Пользователей", value: stats.totalUsers ?? 0, icon: "👥" },
          { label: "Новых за неделю", value: stats.newUsers ?? 0, icon: "⭐" },
          { label: "Команд", value: stats.commandsUsed ?? 0, icon: "⚡" },
        ].map((card, i) => (
          <Card key={i} className="flex items-center gap-4 p-6">
            <span className="text-3xl">{card.icon}</span>
            <div>
              <div className="text-2xl font-bold">
                {loading ? "—" : card.value}
              </div>
              <div className="text-sm text-[rgb(var(--text-secondary))]">{card.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Быстрые действия */}
      <div>
        <h3 className="text-lg font-semibold mb-4">⚡ Быстрые действия</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <Link
              key={i}
              href={action.href}
              className="group flex items-center gap-4 p-6 rounded-3xl border border-[rgb(var(--border))] hover:border-nova-400/50 bg-[rgb(var(--surface))] hover:bg-[rgb(var(--surface-2))] transition-all"
            >
              <span className="text-3xl transition-transform group-hover:scale-110">{action.icon}</span>
              <div>
                <div className="font-semibold">{action.label}</div>
                <div className="text-sm text-[rgb(var(--text-secondary))]">{action.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
