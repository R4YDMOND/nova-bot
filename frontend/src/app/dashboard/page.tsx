"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

  const recentActivity = [
    { text: "Тестовый вебхук отправлен", time: "Только что", icon: "🧪" },
    { text: "Сервер Phoenix Gaming добавлен", time: "5 мин назад", icon: "🖥️" },
    { text: "Сканирование завершено", time: "1 час назад", icon: "🔍" },
    { text: "Обновлены настройки AI", time: "Вчера", icon: "🤖" },
  ];

  return (
    <div style={{ padding: "32px 40px", maxWidth: "1000px" }}>
      {/* Приветствие */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>👋 Добро пожаловать в Nova</h1>
          <p style={styles.subtitle}>Управляйте серверами, музыкой, событиями и аналитикой</p>
        </div>
        <Link href="/dashboard/servers" style={styles.addServerBtn}>
          + Подключить сервер
        </Link>
      </div>

      {/* Статистика */}
      <div style={styles.statsGrid}>
        {[
          { label: "Серверов", value: stats.serversCount ?? "-", icon: "🖥️", color: "#3B82F6" },
          { label: "Пользователей", value: stats.totalUsers ?? "-", icon: "👥", color: "#10B981" },
          { label: "Новых за неделю", value: stats.newUsers ?? "-", icon: "⭐", color: "#F59E0B" },
          { label: "Команд", value: stats.commandsUsed ?? "-", icon: "⚡", color: "#A855F7" },
        ].map((card, i) => (
          <div key={i} style={{ ...styles.statCard, borderTop: `3px solid ${card.color}` }}>
            <span style={styles.statIcon}>{card.icon}</span>
            <div>
              <div style={styles.statValue}>{loading ? "..." : card.value}</div>
              <div style={styles.statLabel}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Быстрые действия */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>⚡ Быстрые действия</h3>
        <div style={styles.quickGrid}>
          {quickActions.map((action, i) => (
            <Link key={i} href={action.href} style={styles.quickCard}>
              <span style={styles.quickIcon}>{action.icon}</span>
              <div>
                <div style={styles.quickLabel}>{action.label}</div>
                <div style={styles.quickDesc}>{action.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Активность */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>📋 Последняя активность</h3>
        <div style={styles.activityList}>
          {recentActivity.map((item, i) => (
            <div key={i} style={styles.activityItem}>
              <span style={styles.activityIcon}>{item.icon}</span>
              <span style={styles.activityText}>{item.text}</span>
              <span style={styles.activityTime}>{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 },
  title: { fontSize: 26, fontWeight: 700, marginBottom: 4 },
  subtitle: { color: "#94A3B8", fontSize: 14 },
  addServerBtn: { padding: "12px 24px", background: "#00E5FF", color: "#000", fontWeight: 600, fontSize: 14, borderRadius: 10, textDecoration: "none", whiteSpace: "nowrap" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 32 },
  statCard: { background: "#16161F", borderRadius: 14, padding: 20, border: "1px solid #1F2937", display: "flex", alignItems: "center", gap: 14 },
  statIcon: { fontSize: 28 },
  statValue: { fontSize: 24, fontWeight: 700, color: "#FFF", lineHeight: 1.1 },
  statLabel: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 16, fontWeight: 600, marginBottom: 14 },
  quickGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
  quickCard: { background: "#16161F", borderRadius: 12, padding: 18, border: "1px solid #1F2937", textDecoration: "none", display: "flex", alignItems: "center", gap: 14 },
  quickIcon: { fontSize: 26 },
  quickLabel: { fontSize: 14, fontWeight: 600, color: "#F1F5F9", marginBottom: 2 },
  quickDesc: { fontSize: 11, color: "#94A3B8" },
  activityList: { background: "#16161F", borderRadius: 12, border: "1px solid #1F2937", overflow: "hidden" },
  activityItem: { display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid #1F2937" },
  activityIcon: { fontSize: 18 },
  activityText: { flex: 1, fontSize: 13, color: "#E2E8F0" },
  activityTime: { fontSize: 11, color: "#64748B", whiteSpace: "nowrap" },
};
