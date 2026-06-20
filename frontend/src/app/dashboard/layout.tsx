"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigate = (url: string) => {
  window.location.href = url;
};

const NAV_ITEMS = [
  { icon: "📊", label: "Обзор", href: "/dashboard" },
  { icon: "🖥️", label: "Серверы", href: "/dashboard/servers" },
  { icon: "🧩", label: "Модули", href: "/dashboard/modules" },
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
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
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
            }}
          >
            N
          </div>
          <span style={{ fontSize: "19px", fontWeight: "bold", color: "#FFF" }}>
            Нова
          </span>
        </Link>

        <nav style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
          {NAV_ITEMS.map((item, i) => {
            const isActive = pathname === item.href;
            return (
              <span
                key={i}
                onClick={() => navigate(item.href)}
                style={{
                  padding: "9px 12px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  color: isActive ? "#FFF" : "#94A3B8",
                  background: isActive ? "#1F2937" : "transparent",
                  fontWeight: isActive ? "500" : "400",
                }}
              >
                <span style={{ fontSize: "15px", width: "20px", textAlign: "center" }}>
                  {item.icon}
                </span>
                {item.label}
              </span>
            );
          })}
        </nav>
      </aside>

      <main style={{ flex: 1, overflow: "auto" }}>{children}</main>
    </div>
  );
}
