"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navigate = (url: string) => { window.location.href = url; };

const NAV_ITEMS = [
  { icon: "📊", label: "Обзор", href: "/dashboard" },
  { icon: "🖥️", label: "Серверы", href: "/dashboard/servers" },
  { icon: "🎵", label: "Музыка", href: "/dashboard/music" },
  { icon: "🏆", label: "Рейтинг", href: "/dashboard/ranking" },
  { icon: "🛡️", label: "Модерация", href: "/dashboard/moderation" },
  { icon: "📊", label: "Аналитика", href: "/dashboard/analytics" },
  { icon: "⚡", label: "Команды", href: "/dashboard/commands" },
  { icon: "🤖", label: "AI", href: "/dashboard/ai" },
  { icon: "🔗", label: "Вебхуки", href: "/dashboard/webhooks" },
];

const THEMES = [
  { value: "dark", label: "🌙 Тёмная", icon: "🌙" },
  { value: "light", label: "☀️ Светлая", icon: "☀️" },
  { value: "cyberpunk", label: "🦾 Киберпанк", icon: "🦾" },
  { value: "gray", label: "⬜ Серый", icon: "⬜" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("nova-theme") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
    const savedSound = localStorage.getItem("nova-sound") === "true";
    setSoundEnabled(savedSound);
  }, []);

  const changeTheme = (t: string) => {
    setTheme(t);
    localStorage.setItem("nova-theme", t);
    document.documentElement.setAttribute("data-theme", t);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("nova-sound", String(next));
    if (next && typeof window !== "undefined") {
      try { new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=").play().catch(() => {}); } catch {}
    }
  };

  const playClickSound = () => {
    if (soundEnabled && typeof window !== "undefined") {
      try { new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=").play().catch(() => {}); } catch {}
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary)",
      display: "flex",
      color: "var(--text-primary)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', system-ui, sans-serif"
    }}>
      <aside style={{
        width: collapsed ? 56 : "var(--sidebar-width)",
        minWidth: collapsed ? 56 : "var(--sidebar-width)",
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
        padding: collapsed ? "16px 8px" : "22px 16px",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflow: "hidden",
        transition: "all 0.3s ease",
        zIndex: 10,
        boxShadow: "var(--shadow-lg)",
      }}>
        <div style={{ display: "flex", justifyContent: collapsed ? "center" : "flex-end", marginBottom: 18 }}>
          <button
            onClick={() => { setCollapsed(!collapsed); playClickSound(); }}
            title={collapsed ? "Развернуть" : "Свернуть"}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              fontSize: 13,
              padding: "4px 8px",
              transition: "transform 0.3s",
              transform: collapsed ? "rotate(180deg)" : "rotate(0deg)"
            }}
          >
            ◀
          </button>
        </div>

        <Link href="/" style={{
          display: "flex",
          alignItems: "center",
          gap: collapsed ? 0 : 10,
          textDecoration: "none",
          marginBottom: 22,
          justifyContent: collapsed ? "center" : "flex-start",
          opacity: collapsed ? 0 : 1,
          transition: "opacity 0.2s",
          pointerEvents: collapsed ? "none" : "auto",
          overflow: "hidden"
        }}>
          <div style={{
            width: 34,
            height: 34,
            minWidth: 34,
            background: "var(--bg-card)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            color: "var(--accent)",
            fontSize: 17,
            boxShadow: "var(--shadow-sm)"
          }}>
            N
          </div>
          <span style={{ fontSize: 19, fontWeight: "bold", color: "var(--text-primary)", whiteSpace: "nowrap" }}>
            Нова
          </span>
        </Link>

        <nav style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
          {NAV_ITEMS.map((item, i) => {
            const isActive = pathname === item.href;
            return (
              <span
                key={i}
                onClick={() => { navigate(item.href); playClickSound(); }}
                title={collapsed ? item.label : undefined}
                style={{
                  padding: collapsed ? "11px 0" : "11px 14px",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  alignItems: "center",
                  gap: collapsed ? 0 : 12,
                  fontSize: "var(--font-lg)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  background: isActive ? "var(--border)" : "transparent",
                  fontWeight: isActive ? 500 : 400,
                  justifyContent: collapsed ? "center" : "flex-start",
                  whiteSpace: "nowrap"
                }}>
                <span style={{ fontSize: "var(--icon-lg)", width: 22, textAlign: "center" }}>{item.icon}</span>
                <span style={{ opacity: collapsed ? 0 : 1, transition: "opacity 0.15s", display: collapsed ? "none" : "inline" }}>
                  {item.label}
                </span>
              </span>
            );
          })}
        </nav>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
          <button
            onClick={() => { setShowSettings(!showSettings); playClickSound(); }}
            style={{
              padding: "8px 10px",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "var(--font-md)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: collapsed ? "center" : "flex-start"
            }}>
            <span>⚙️</span>
            {!collapsed && <span>Настройки</span>}
          </button>

          {showSettings && !collapsed && (
            <div style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-md)",
              padding: 10,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              animation: "fadeInUp 0.2s ease"
            }}>
              <span style={{ fontSize: "var(--font-xs)", color: "var(--text-muted)", marginBottom: 2 }}>Тема</span>
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { changeTheme(t.value); playClickSound(); }}
                  style={{
                    padding: "6px 10px",
                    background: theme === t.value ? "var(--border)" : "transparent",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    color: theme === t.value ? "var(--text-primary)" : "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: "var(--font-sm)",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}>
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                <span style={{ fontSize: "var(--font-xs)", color: "var(--text-muted)" }}>Звук</span>
                <div
                  onClick={() => { toggleSound(); playClickSound(); }}
                  style={{
                    width: 36,
                    height: 20,
                    background: soundEnabled ? "var(--accent)" : "var(--border)",
                    borderRadius: 20,
                    cursor: "pointer",
                    position: "relative"
                  }}>
                  <div style={{
                    position: "absolute",
                    height: 14,
                    width: 14,
                    left: soundEnabled ? 20 : 3,
                    top: 3,
                    background: soundEnabled ? "#000" : "#FFF",
                    borderRadius: "50%",
                    transition: "0.2s"
                  }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main style={{ flex: 1, overflow: "auto", minWidth: 0, animation: "fadeIn 0.2s ease" }}>
        {children}
      </main>
    </div>
  );
}
