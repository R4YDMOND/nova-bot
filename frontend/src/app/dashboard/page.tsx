"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE = "https://nova-bot-rpsy.onrender.com";

const navigate = (url: string) => {
  window.location.href = url;
};

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
    { icon: "📢", label: "Рассылка", desc: "Отправить сообщение во все каналы", href: "/dashboard/webhooks" },
    { icon: "🗓️", label: "Создать событие", desc: "Запланировать ивент", href: "/dashboard/webhooks" },
    { icon: "🎵", label: "Включить музыку", desc: "Треки и радиостанции", href: "/dashboard/music" },
    { icon: "🔍", label: "Сканировать", desc: "Найти популярный контент", href: "/dashboard/webhooks" },
  ];

  const recentActivity = [
    { text: "Тестовый вебхук отправлен", time: "Только что", icon: "🧪" },
    { text: "Сервер Phoenix Gaming добавлен", time: "5 минут назад", icon: "🖥️" },
    { text: "Сканирование завершено", time: "1 час назад", icon: "🔍" },
    { text: "Обновлены настройки AI", time: "Вчера", icon: "🤖" },
  ];

  return (
    <div style={styles.wrapper}>
      {/* Сайдбар */}
      <aside style={styles.sidebar}>
        <Link href="/" style={styles.logoLink}>
          <div style={styles.logoIcon}>N</div>
          <span style={styles.logoText}>Нова</span>
        </Link>
        <nav style={styles.nav}>
          {[
            { icon: "📊", label: "Обзор", href: "/dashboard", active: true },
            { icon: "🖥️", label: "Серверы", href: "/dashboard/servers" },
            { icon: "🎵", label: "Музыка", href: "/dashboard/music" },
            { icon: "🏆", label: "Рейтинг", href: "/dashboard/ranking" },
            { icon: "🛡️", label: "Модерация", href: "/dashboard/moderation" },
            { icon: "📊", label: "Аналитика", href: "/dashboard/analytics" },
            { icon: "⚡", label: "Команды", href: "/dashboard/commands" },
            { icon: "🤖", label: "AI", href: "/dashboard/ai" },
            { icon: "🔗", label: "Вебхуки", href: "/dashboard/webhooks" },
          ].map((item, i) => (
            <span
              key={i}
              onClick={() => navigate(item.href)}
              style={{
                ...styles.navItem,
                color: item.active ? "#FFF" : "#94A3B8",
                background: item.active ? "#1F2937" : "transparent",
                fontWeight: item.active ? "500" : "400",
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {item.label}
            </span>
          ))}
        </nav>
      </aside>

      {/* Контент */}
      <main style={styles.main}>
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

        {/* Карточки статистики */}
        <div style={styles.statsGrid}>
          {[
            { label: "Серверов", value: stats.serversCount ?? "-", icon: "🖥️", color: "#3B82F6" },
            { label: "Пользователей", value: stats.totalUsers ?? "-", icon: "👥", color: "#10B981" },
            { label: "Новых за неделю", value: stats.newUsers ?? "-", icon: "⭐", color: "#F59E0B" },
            { label: "Команд выполнено", value: stats.commandsUsed ?? "-", icon: "⚡", color: "#A855F7" },
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

        {/* Последняя активность */}
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
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    background: "#0A0A0F",
    display: "flex",
    color: "#F1F5F9",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  sidebar: {
    width: "230px",
    minWidth: "230px",
    background: "#111118",
    borderRight: "1px solid #1F2937",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    position: "sticky",
    top: 0,
    height: "100vh",
    overflow: "auto",
  },
  logoLink: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
    marginBottom: "28px",
  },
  logoIcon: {
    width: "34px",
    height: "34px",
    background: "#16161F",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    color: "#00E5FF",
    fontSize: "17px",
  },
  logoText: {
    fontSize: "19px",
    fontWeight: "bold",
    color: "#FFF",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
  },
  navItem: {
    padding: "9px 12px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  navIcon: {
    fontSize: "15px",
    width: "20px",
    textAlign: "center" as const,
  },
  main: {
    flex: 1,
    padding: "32px 40px",
    overflow: "auto",
    maxWidth: "1000px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px",
    flexWrap: "wrap",
    gap: "16px",
  },
  title: {
    fontSize: "26px",
    fontWeight: "700",
    marginBottom: "4px",
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: "14px",
  },
  addServerBtn: {
    padding: "12px 24px",
    background: "#00E5FF",
    color: "#000",
    fontWeight: "600",
    fontSize: "14px",
    borderRadius: "10px",
    textDecoration: "none",
    whiteSpace: "nowrap" as const,
    transition: "all 0.2s",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "14px",
    marginBottom: "32px",
  },
  statCard: {
    background: "#16161F",
    borderRadius: "14px",
    padding: "20px",
    border: "1px solid #1F2937",
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  statIcon: {
    fontSize: "28px",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#FFF",
    lineHeight: "1.1",
  },
  statLabel: {
    fontSize: "12px",
    color: "#94A3B8",
    marginTop: "2px",
  },
  section: {
    marginBottom: "28px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "14px",
  },
  quickGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px",
  },
  quickCard: {
    background: "#16161F",
    borderRadius: "12px",
    padding: "18px",
    border: "1px solid #1F2937",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    transition: "border-color 0.2s",
  },
  quickIcon: {
    fontSize: "26px",
  },
  quickLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#F1F5F9",
    marginBottom: "2px",
  },
  quickDesc: {
    fontSize: "11px",
    color: "#94A3B8",
  },
  activityList: {
    background: "#16161F",
    borderRadius: "12px",
    border: "1px solid #1F2937",
    overflow: "hidden",
  },
  activityItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 18px",
    borderBottom: "1px solid #1F2937",
  },
  activityIcon: {
    fontSize: "18px",
  },
  activityText: {
    flex: 1,
    fontSize: "13px",
    color: "#E2E8F0",
  },
  activityTime: {
    fontSize: "11px",
    color: "#64748B",
    whiteSpace: "nowrap" as const,
  },
};
