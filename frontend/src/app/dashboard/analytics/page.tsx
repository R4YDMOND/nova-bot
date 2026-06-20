"use client";

import { useState, useEffect } from "react";

const API_BASE = "https://nova-bot-rpsy.onrender.com";

const navigate = (url: string) => { window.location.href = url; };

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>({});
  const [reports, setReports] = useState<any>({});
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Загружаем статистику
    fetch(`${API_BASE}/api/stats/dashboard`)
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(console.error);
    
    // Загружаем настройки отчётов
    fetch(`${API_BASE}/api/analytics/reports?server_id=default`)
      .then(r => r.json())
      .then(d => setReports(d.config || {}))
      .catch(console.error);
  }, []);

  const updateReport = (key: string, value: any) => {
    setReports({ ...reports, [key]: value });
  };

  const saveReports = async () => {
    await fetch(`${API_BASE}/api/analytics/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ server_id: "default", config: reports }),
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
      body: JSON.stringify({ webhook_url: reports.webhook_url, type: "daily" }),
    });
    setSending(false);
    alert("✅ Тестовый отчёт отправлен!");
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', color: '#F1F5F9' }}>
      {/* Сайдбар */}
      <aside style={{ width: '240px', minWidth: '240px', background: '#111118', borderRight: '1px solid #1F2937', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '32px' }}>
          <div style={{ width: '34px', height: '34px', background: '#16161F', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#00E5FF', fontSize: '17px' }}>N</div>
          <span style={{ fontSize: '19px', fontWeight: 'bold', color: '#FFF' }}>Нова</span>
        </a>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          {[
            { icon: '📊', label: 'Обзор', href: '/dashboard' },
            { icon: '🖥️', label: 'Серверы', href: '/dashboard/servers' },
            { icon: '🧩', label: 'Модули', href: '/dashboard/modules' },
            { icon: '⚡', label: 'Команды', href: '/dashboard/commands' },
            { icon: '🔗', label: 'Вебхуки', href: '/dashboard/webhooks' },
          ].map((item, i) => (
            <span key={i} onClick={() => navigate(item.href)} style={{ padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer', color: '#94A3B8', transition: 'all 0.15s' }}>
              <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{item.icon}</span>{item.label}
            </span>
          ))}
        </nav>
      </aside>

      {/* Контент */}
      <main style={{ flex: 1, padding: '32px 40px', overflow: 'auto' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '4px' }}>📊 Аналитика</h1>
        <p style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '32px' }}>Статистика и автоматические отчёты</p>

        {/* Карточки статистики */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: '🖥️ Серверов', value: stats.serversCount || 0 },
            { label: '👥 Пользователей', value: stats.totalUsers || 0 },
            { label: '⭐ Новых за неделю', value: stats.newUsers || 0 },
            { label: '💬 Команд', value: stats.commandsUsed || 0 },
          ].map((card, i) => (
            <div key={i} style={{ background: '#16161F', borderRadius: '14px', padding: '20px', border: '1px solid #1F2937', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#00E5FF' }}>{card.value}</div>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Топ команд */}
        <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', marginBottom: '24px', border: '1px solid #1F2937' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>⚡ Топ команд</h3>
          {(stats.topCommands || []).map((cmd: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 4 ? '1px solid #1F2937' : 'none' }}>
              <span style={{ fontSize: '13px' }}>{cmd.name}</span>
              <span style={{ fontSize: '13px', color: '#00E5FF' }}>{cmd.count}</span>
            </div>
          ))}
        </div>

        {/* Настройка отчётов */}
        <div style={{ background: '#16161F', borderRadius: '14px', padding: '24px', border: '1px solid #1F2937' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>📋 Отчёты</h3>
          <p style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '20px' }}>Автоматическая отправка статистики в канал</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Включить отчёты */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px' }}>Включить автоотчёты</span>
              <div onClick={() => updateReport('enabled', !reports.enabled)} style={{ width: '44px', height: '26px', background: reports.enabled ? '#00E5FF' : '#374151', borderRadius: '26px', cursor: 'pointer', position: 'relative' }}>
                <div style={{ position: 'absolute', height: '20px', width: '20px', left: reports.enabled ? '22px' : '4px', top: '3px', background: reports.enabled ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} />
              </div>
            </div>

            {/* Канал */}
            <div>
              <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>📢 Канал для отчётов</label>
              <input
                type="text"
                value={reports.channel || ''}
                onChange={(e) => updateReport('channel', e.target.value)}
                placeholder="#отчёты"
                style={{ width: '100%', padding: '10px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            {/* Webhook URL */}
            <div>
              <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>🔗 Webhook URL</label>
              <input
                type="text"
                value={reports.webhook_url || ''}
                onChange={(e) => updateReport('webhook_url', e.target.value)}
                placeholder="https://lolka.app/api/webhooks/xxx"
                style={{ width: '100%', padding: '10px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            {/* Время */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>📅 Ежедневно</label>
                <input type="time" value={reports.daily_time || '09:00'} onChange={(e) => updateReport('daily_time', e.target.value)}
                  style={{ width: '100%', padding: '8px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>📈 Еженедельно</label>
                <select value={reports.weekly_day || 'monday'} onChange={(e) => updateReport('weekly_day', e.target.value)}
                  style={{ width: '100%', padding: '8px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px' }}>
                  <option value="monday">Понедельник</option>
                  <option value="tuesday">Вторник</option>
                  <option value="friday">Пятница</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>📅 Ежемесячно</label>
                <input type="number" min="1" max="28" value={reports.monthly_day || 1} onChange={(e) => updateReport('monthly_day', parseInt(e.target.value))}
                  style={{ width: '100%', padding: '8px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Что включать */}
            <div>
              <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '8px' }}>Включать в отчёт:</label>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {[
                  { key: 'include_servers', label: 'Серверы' },
                  { key: 'include_users', label: 'Пользователи' },
                  { key: 'include_messages', label: 'Сообщения' },
                  { key: 'include_top_commands', label: 'Топ команд' },
                ].map(item => (
                  <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    <input type="checkbox" checked={reports[item.key] ?? true} onChange={(e) => updateReport(item.key, e.target.checked)} style={{ accentColor: '#00E5FF' }} />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Кнопки */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={saveReports} style={{ padding: '10px 24px', background: saved ? '#22C55E' : '#00E5FF', color: '#000', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
                {saved ? '✅ Сохранено' : '💾 Сохранить'}
              </button>
              <button onClick={sendTestReport} disabled={sending || !reports.webhook_url} style={{ padding: '10px 24px', background: sending ? '#374151' : '#A855F7', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
                {sending ? '⏳' : '🧪 Тестовый отчёт'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
