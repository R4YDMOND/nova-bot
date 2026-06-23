"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

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
    setReports(prev => ({ ...prev, [key]: value }));
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

      {/* Статистика */}
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

      {/* Топ команд */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">⚡ Топ команд</h3>
        {(stats.topCommands || []).length === 0 ? (
          <p className="text-[rgb(var(--text-secondary))] text-sm py-8 text-center">
            Нет данных
          </p>
        ) : (
          (stats.topCommands || []).map((cmd: any, i: number) => (
            <div key={i} className="flex justify-between py-3 border-b border-[rgb(var(--border))] last:border-0">
              <span className="text-sm font-medium">{cmd.name}</span>
              <span className="text-sm font-semibold text-nova-400">{cmd.count}</span>
            </div>
          ))
        )}
      </Card>

      {/* Настройки отчётов */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">📋 Настройки отчётов</h3>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-sm">Включить автоотчёты</span>
            <Switch
              checked={reports.enabled || false}
              onCheckedChange={(v) => updateReport('enabled', v)}
            />
          </div>

          <div>
            <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">
              📢 Канал для отчётов
            </label>
            <input
              type="text"
              value={reports.channel || ''}
              onChange={e => updateReport('channel', e.target.value)}
              placeholder="#отчёты"
              className="input w-full"
            />
          </div>

          <div>
            <label className="text-xs text-[rgb(var(--text-secondary))] block mb-1">
              🔗 Webhook URL
            </label>
            <input
              type="text"
              value={reports.webhook_url || ''}
              onChange={e => updateReport('webhook_url', e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              className="input w-full"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={saveReports}
              className={`px-6 py-3 rounded-2xl font-semibold text-sm transition-all ${
                saved
                  ? 'bg-emerald-500 text-black'
                  : 'bg-nova-500 hover:bg-nova-600 text-black'
              }`}
            >
              {saved ? '✅ Сохранено' : '💾 Сохранить настройки'}
            </button>

            <button
              onClick={sendTestReport}
              disabled={sending || !reports.webhook_url}
              className="px-6 py-3 rounded-2xl font-semibold text-sm bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-all text-white"
            >
              {sending ? '⏳ Отправка...' : '🧪 Тестовый отчёт'}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
