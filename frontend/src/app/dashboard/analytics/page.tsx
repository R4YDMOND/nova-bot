"use client";

import { useState, useEffect } from "react";

const API_BASE = "https://nova-bot-rpsy.onrender.com";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>({});
  const [reports, setReports] = useState<any>({});
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/stats/dashboard`).then(r => r.json()).then(d => setStats(d)).catch(console.error);
    fetch(`${API_BASE}/api/analytics/reports?server_id=default`).then(r => r.json()).then(d => setReports(d.config || {})).catch(console.error);
  }, []);

  const updateReport = (key: string, value: any) => setReports({ ...reports, [key]: value });
  const saveReports = async () => {
    await fetch(`${API_BASE}/api/analytics/reports`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ server_id: "default", config: reports }) });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };
  const sendTestReport = async () => {
    if (!reports.webhook_url) return; setSending(true);
    await fetch(`${API_BASE}/api/analytics/reports/send`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ webhook_url: reports.webhook_url, type: "daily" }) });
    setSending(false); alert("✅ Тестовый отчёт отправлен!");
  };

  return (
    <div style={{ padding: "32px 40px", maxWidth: "900px" }}>
      <h1 style={{ fontSize: "var(--font-3xl)", fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>📊 Аналитика</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-md)", marginBottom: 32 }}>Статистика и автоматические отчёты</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "🖥️ Серверов", value: stats.serversCount || 0 },
          { label: "👥 Пользователей", value: stats.totalUsers || 0 },
          { label: "⭐ Новых за неделю", value: stats.newUsers || 0 },
          { label: "💬 Команд", value: stats.commandsUsed || 0 },
        ].map((card, i) => (
          <div key={i} style={{ background: "var(--bg-card)", borderRadius: "var(--radius-xl)", padding: 20, border: "1px solid var(--border)", textAlign: "center" }}>
            <div style={{ fontSize: "var(--font-4xl)", fontWeight: 700, color: "var(--accent)" }}>{card.value}</div>
            <div style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)", marginTop: 4 }}>{card.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-xl)", padding: 20, marginBottom: 24, border: "1px solid var(--border)" }}>
        <h3 style={{ fontSize: "var(--font-xl)", fontWeight: 600, marginBottom: 12, color: "var(--text-primary)" }}>⚡ Топ команд</h3>
        {(stats.topCommands || []).length === 0 && <p style={{ color: "var(--text-muted)", fontSize: "var(--font-md)" }}>Нет данных</p>}
        {(stats.topCommands || []).map((cmd: any, i: number) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 4 ? "1px solid var(--border)" : "none" }}>
            <span style={{ fontSize: "var(--font-md)", color: "var(--text-primary)" }}>{cmd.name}</span>
            <span style={{ fontSize: "var(--font-md)", color: "var(--accent)" }}>{cmd.count}</span>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-xl)", padding: 24, border: "1px solid var(--border)" }}>
        <h3 style={{ fontSize: "var(--font-xl)", fontWeight: 600, marginBottom: 4, color: "var(--text-primary)" }}>📋 Отчёты</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-md)", marginBottom: 20 }}>Автоматическая отправка статистики в канал</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "var(--font-lg)", color: "var(--text-primary)" }}>Включить автоотчёты</span>
            <div onClick={() => updateReport("enabled", !reports.enabled)} style={{ width: 44, height: 26, background: reports.enabled ? "var(--accent)" : "var(--border)", borderRadius: 26, cursor: "pointer", position: "relative" }}><div style={{ position: "absolute", height: 20, width: 20, left: reports.enabled ? 22 : 4, top: 3, background: reports.enabled ? "#000" : "#FFF", borderRadius: "50%", transition: "0.25s" }} /></div>
          </div>
          <div><label style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>📢 Канал для отчётов</label><input type="text" value={reports.channel || ""} onChange={e => updateReport("channel", e.target.value)} placeholder="#отчёты" style={{ width: "100%", padding: 10, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: "var(--font-lg)", boxSizing: "border-box" }} /></div>
          <div><label style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>🔗 Webhook URL</label><input type="text" value={reports.webhook_url || ""} onChange={e => updateReport("webhook_url", e.target.value)} placeholder="https://lolka.app/api/webhooks/xxx" style={{ width: "100%", padding: 10, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: "var(--font-lg)", boxSizing: "border-box" }} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div><label style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>📅 Ежедневно</label><input type="time" value={reports.daily_time || "09:00"} onChange={e => updateReport("daily_time", e.target.value)} style={{ width: "100%", padding: 8, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: "var(--font-md)", boxSizing: "border-box" }} /></div>
            <div><label style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>📈 Еженедельно</label><select value={reports.weekly_day || "monday"} onChange={e => updateReport("weekly_day", e.target.value)} style={{ width: "100%", padding: 8, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: "var(--font-md)" }}><option value="monday">Понедельник</option><option value="tuesday">Вторник</option><option value="friday">Пятница</option></select></div>
            <div><label style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>📅 Ежемесячно</label><input type="number" min="1" max="28" value={reports.monthly_day || 1} onChange={e => updateReport("monthly_day", parseInt(e.target.value))} style={{ width: "100%", padding: 8, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: "var(--font-md)", boxSizing: "border-box" }} /></div>
          </div>
          <div><label style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>Включать в отчёт:</label><div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>{[{ key: "include_servers", label: "Серверы" },{ key: "include_users", label: "Пользователи" },{ key: "include_messages", label: "Сообщения" },{ key: "include_top_commands", label: "Топ команд" }].map(item => (<label key={item.key} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: "var(--font-md)", color: "var(--text-primary)" }}><input type="checkbox" checked={reports[item.key] ?? true} onChange={e => updateReport(item.key, e.target.checked)} style={{ accentColor: "var(--accent)" }} />{item.label}</label>))}</div></div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={saveReports} style={{ padding: "10px 24px", background: saved ? "var(--success)" : "var(--accent)", color: "#000", border: "none", borderRadius: "var(--radius-lg)", fontWeight: 600, cursor: "pointer", fontSize: "var(--font-lg)" }}>{saved ? "✅ Сохранено" : "💾 Сохранить"}</button>
            <button onClick={sendTestReport} disabled={sending || !reports.webhook_url} style={{ padding: "10px 24px", background: sending ? "var(--border)" : "var(--purple)", color: "#FFF", border: "none", borderRadius: "var(--radius-lg)", fontWeight: 600, cursor: "pointer", fontSize: "var(--font-lg)" }}>{sending ? "⏳" : "🧪 Тестовый отчёт"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
