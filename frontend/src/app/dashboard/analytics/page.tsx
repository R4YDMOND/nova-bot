'use client';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/toggle';
import { api } from '@/lib/api';

type Stats = { serversCount?: number; totalMessages?: number; activeUsers?: number; commandsUsed?: number };
type ReportConfig = { webhook_url?: string; daily?: boolean; weekly?: boolean; monthly?: boolean; include_members?: boolean; include_commands?: boolean; include_activity?: boolean };

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats>({});
  const [reports, setReports] = useState<ReportConfig>({});
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.stats.getDashboard().catch(() => ({})),
      api.analytics.getReportsConfig().catch(() => ({ config: {} })),
    ]).then(([statsData, reportsData]) => {
      setStats(statsData as Stats);
      setReports((reportsData as { config: ReportConfig }).config || {});
      setLoading(false);
    });
  }, []);

  const updateReport = (key: keyof ReportConfig, value: ReportConfig[keyof ReportConfig]) =>
    setReports(prev => ({ ...prev, [key]: value }));

  const saveReports = async () => {
    await api.analytics.saveReportsConfig({ server_id: 'default', config: reports }).catch(() => {});
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const sendTestReport = async () => {
    if (!reports.webhook_url) return;
    setSending(true);
    await api.analytics.sendReport({ webhook_url: reports.webhook_url, type: 'daily' }).catch(() => {});
    setSending(false);
    alert('✅ Тестовый отчёт отправлен!');
  };

  const statCards = [
    { label: '🌐 Серверов', value: stats.serversCount ?? '—' },
    { label: '👥 Пользователей', value: stats.activeUsers ?? '—' },
    { label: '💬 Сообщений', value: stats.totalMessages ?? '—' },
    { label: '⚡ Команд', value: stats.commandsUsed ?? '—' },
  ];

  const toggleItems = [
    { key: 'daily' as const, label: '📅 Ежедневный отчёт' },
    { key: 'weekly' as const, label: '📆 Еженедельный отчёт' },
    { key: 'monthly' as const, label: '🗓️ Ежемесячный отчёт' },
    { key: 'include_members' as const, label: '👥 Включать статистику участников' },
    { key: 'include_commands' as const, label: '💬 Включать статистику команд' },
    { key: 'include_activity' as const, label: '📈 Включать активность' },
  ] as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">📊 Аналитика</h1>
        <p className="text-[rgb(var(--text-secondary))] mt-1">Статистика и автоматические отчёты</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <Card key={i} className="p-5 text-center">
            {loading ? (
              <div className="h-8 w-16 bg-white/10 rounded-lg mx-auto mb-2 animate-pulse" />
            ) : (
              <div className="text-3xl font-bold text-cyan-400">
                {typeof card.value === 'number' ? card.value.toLocaleString('ru-RU') : card.value}
              </div>
            )}
            <div className="text-sm text-[rgb(var(--text-secondary))] mt-1">{card.label}</div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">📮 Автоматические отчёты</h2>

        <div className="mb-4">
          <label className="text-sm text-[rgb(var(--text-secondary))] block mb-1">Webhook URL для отчётов</label>
          <input
            type="text"
            value={reports.webhook_url || ''}
            onChange={e => updateReport('webhook_url', e.target.value)}
            placeholder="https://vk.com/... или https://lolka.app/webhooks/..."
            className="input w-full"
          />
        </div>

        <div className="space-y-3 mb-6">
          {toggleItems.map(item => (
            <div key={item.key} className="flex justify-between items-center">
              <span className="text-sm">{item.label}</span>
              <Switch checked={!!reports[item.key]} onCheckedChange={v => updateReport(item.key, v)} />
            </div>
          ))}
        </div>

        <div className="flex gap-3 flex-wrap">
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
            className="px-5 py-2.5 rounded-xl font-medium border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-2))] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? '⏳ Отправка...' : '🧪 Тест отчёта'}
          </button>
        </div>
      </Card>
    </div>
  );
}