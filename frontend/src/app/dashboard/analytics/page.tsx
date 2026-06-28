'use client';

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/toggle";

const API_BASE = "https://nova-bot-rpsy.onrender.com";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>({});
  const [reports, setReports] = useState<any>({});
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/stats/dashboard`)
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(console.error);

    fetch(`${API_BASE}/api/analytics/reports?server_id=default`)
      .then(r => r.json())
      .then(d => setReports(d.config || {}))
      .catch(console.error);
  }, []);

  const updateReport = (key: string, value: any) => {
    setReports((prev: Record<string, any>) => ({ ...prev, [key]: value }));
  };

  const saveReports = async () => {
    await fetch(`${API_BASE}/api/analytics/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ server_id: "default", config: reports })
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sendTestReport = async () => {
    if (!reports.webhook_url) return;
    setSending(true);
    await fetch(`${API_BASE}/api/analytics/reports/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ webhook_url: reports.webhook_url, type: "daily" })
    });
    setSending(false);
    alert("✅ Тестовый отчёт отправлен!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📊 Аналитика</h1>
        <p className="text-[rgb(var(--text-secondary))] text-sm">
          Статистика и автоматические отчёты
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "🖥️ Серверов", value: stats.serversCount || 0 },
          { label: "👥 Пользователей", value: stats.totalUsers || 0 },
          { label: "⭐ Новых за неделю", value: stats.newUsers || 0 },
          { label: "💬 Команд", value: stats.commandsUsed || 0 },
        ].map((card, i) => (
          <Card key={i} className="text-center p-6">
            <div className="text-3xl font-bold text-nova-400">{card.value}</div>
            <div className="text-sm text-[rgb(var(--text-secondary))] mt-2">{card.label}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
