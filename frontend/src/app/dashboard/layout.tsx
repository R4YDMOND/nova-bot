"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigate = (url: string) => {
  window.location.href = url;
};

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0A0F",
        display: "flex",
        color: "#F1F5F9",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', system-ui, sans-serif",
      }}
    >
      {/* Сайдбар */}
      <aside
        style={{
          width: collapsed ? 56 : 220,
          minWidth: collapsed ? 56 : 220,
          background: "#111118",
          borderRight: "1px solid #1F2937",
          padding: collapsed ? "16px 8px" : "20px 14px",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          transition: "all 0.3s ease",
          zIndex: 10,
        }}
      >
        {/* Кнопка сворачивания */}
        <div
          style={{
            display: "flex",
            justifyContent: collapsed ? "center" : "flex-end",
            marginBottom: 16,
          }}
        >
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Развернуть меню" : "Свернуть меню"}
            style={{
              background: "transparent",
              border: "1px solid #1F2937",
              color: "#94A3B8",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
              padding: "3px 7px",
              transition: "transform 0.3s",
              transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            ◀
          </button>
        </div>

        {/* Лого */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: collapsed ? 0 : 8,
            textDecoration: "none",
            marginBottom: 20,
            justifyContent: collapsed ? "center" : "flex-start",
            opacity: collapsed ? 0 : 1,
            transition: "opacity 0.2s",
            pointerEvents: collapsed ? "none" : "auto",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              minWidth: 30,
              background: "#16161F",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              color: "#00E5FF",
              fontSize: 15,
            }}
          >
            N
          </div>
          <span
            style={{
              fontSize: 17,
              fontWeight: "bold",
              color: "#FFF",
              whiteSpace: "nowrap",
            }}
          >
            Нова
          </span>
        </Link>

        {/* Навигация */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {NAV_ITEMS.map((item, i) => {
            const isActive = pathname === item.href;
            return (
              <span
                key={i}
                onClick={() => navigate(item.href)}
                title={collapsed ? item.label : undefined}
                style={{
                  padding: collapsed ? "8px 0" : "8px 10px",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: collapsed ? 0 : 8,
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  color: isActive ? "#FFF" : "#94A3B8",
                  background: isActive ? "#1F2937" : "transparent",
                  fontWeight: isActive ? 500 : 400,
                  justifyContent: collapsed ? "center" : "flex-start",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>
                  {item.icon}
                </span>
                <span
                  style={{
                    opacity: collapsed ? 0 : 1,
                    transition: "opacity 0.15s",
                    display: collapsed ? "none" : "inline",
                  }}
                >
                  {item.label}
                </span>
              </span>
            );
          })}
        </nav>
      </aside>

      {/* Контент */}
      <main
        style={{
          flex: 1,
          overflow: "auto",
          minWidth: 0,
          animation: "fadeIn 0.2s ease",
        }}
      >
        {children}
      </main>
    </div>
  );
}
