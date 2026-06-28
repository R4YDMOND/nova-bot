'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/toggle';

const API_BASE = 'https://nova-bot-rpsy.onrender.com';

type Stats = { serversCount?: number; totalUsers?: number; newUsers?: number; commandsUsed?: number };
type ReportConfig = { webhook_url?: string; daily?: boolean; weekly?: boolean; monthly?: boolean; include_members?: boolean; include_commands?: boolean; include_activity?: boolean };

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats>({});
  const [reports, setReports] = useState<ReportConfig>({});
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/stats/dashboard`).then(r => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/api/analytics/reports?server_id=default`).then(r => r.json()).catch(() => ({})),
    ]).then(([statsData, reportsData]) => {
      setStats(statsData);
      setReports(reportsData.config || {});
      setLoading(false);
    });
  }, []);

  const updateReport = (key: keyof ReportConfig, value: any) =>
    setReports(prev => ({ ...prev, [key]: value }));

  const saveReports = async () => {
    await fetch(`${API_BASE}/api/analytics/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ server_id: 'default', config: reports }),
    }).catch(() => {});
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const sendTestReport = async () => {
    if (!reports.webhook_url) return;
    setSending(true);
    await fetch(`${API_BASE}/api/analytics/reports/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhook_url: reports.webhook_url, type: 'daily' }),
    }).catch(() => {});
    setSending(false);
    alert('✅ Тестовый отчёт отправлен!');
  };

  const statCards = [
    { label: '🌐 Серверов', value: stats.serversCount ?? '—' },
    { label: '👥 Пользователей', value: stats.totalUsers ?? '—' },
    { label: '✨ Новых за неделю', value: stats.newUsers ?? '—' },
    { label: '💬 Команд', value: stats.commandsUsed ?? '—' },
  ];

  return (
    <div className="p-8 max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">📊 Аналитика</h1>
        <p className="text-white/50 mt-1">Статистика и автоматические отчёты</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <Card key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
            {loading ? (
              <div className="h-8 w-16 bg-white/10 rounded-lg mx-auto mb-2 animate-pulse" />
            ) : (
              <div className="text-3xl font-bold text-cyan-400">{typeof card.value === 'number' ? card.value.toLocaleString('ru-RU') : card.value}</div>
            )}
            <div className="text-sm text-white/50 mt-1">{card.label}</div>
          </Card>
        ))}
      </div>

      {/* Auto-reports */}
      <Card className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">📬 Автоматические отчёты</h2>

        <div className="mb-4">
          <label className="text-white/50 text-sm block mb-1">Discord Webhook URL</label>
          <input
            type="text"
            value={reports.webhook_url || ''}
            onChange={e => updateReport('webhook_url', e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm"
          />
        </div>

        <div className="space-y-3 mb-6">
          {([
            { key: 'daily' as const, label: '📅 Ежедневный отчёт' },
            { key: 'weekly' as const, label: '📆 Еженедельный отчёт' },
            { key: 'monthly' as const, label: '🗓️ Ежемесячный отчёт' },
            { key: 'include_members' as const, label: '👥 Включать статистику участников' },
            { key: 'include_commands' as const, label: '💬 Включать статистику команд' },
            { key: 'include_activity' as const, label: '📈 Включать активность' },
          ] as const).map(item => (
            <div key={item.key} className="flex justify-between items-center">
              <span className="text-white/70 text-sm">{item.label}</span>
              <Switch
                checked={!!reports[item.key]}
                onCheckedChange={v => updateReport(item.key, v)}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={saveReports}
            className={`px-5 py-2.5 rounded-xl font-semibold text-black transition-all ${
              saved ? 'bg-green-400' : 'bg-cyan-400 hover:bg-cyan-300'
            }`}
          >
            {saved ? '✅ Сохранено!' : '💾 Сохранить'}
          </button>
          <button
            onClick={sendTestReport}
            disabled={!reports.webhook_url || sending}
            className="px-5 py-2.5 rounded-xl font-medium border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? '⏳ Отправка...' : '🧪 Тест отчёта'}
          </button>
        </div>
      </Card>
    </div>
  );
}
