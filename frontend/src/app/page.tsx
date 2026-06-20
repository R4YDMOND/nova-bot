"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [stats, setStats] = useState({
    servers: 0,
    users: 0,
    responseTime: 0.8,
    webhooksOnline: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("https://nova-bot-rpsy.onrender.com/api/stats")
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => {
        setStats({
          servers: data.servers || 0,
          users: data.users || 0,
          responseTime: data.responseTime || 0.8,
          webhooksOnline: data.webhooksOnline ?? true,
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load stats:", err);
        setError(true);
        setLoading(false);
      });
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M+";
    if (num >= 1000) return (num / 1000).toFixed(0) + "K+";
    return num.toString() + "+";
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>N</div>
          <span style={styles.logoText}>НОВА</span>
        </div>
        <p style={styles.tagline}>Умный помощник для серверов</p>
        <p style={styles.subtitle}>Вспышка энергии для твоего сообщества</p>
      </header>

      <div style={styles.statsRow}>
        {loading && !error ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} style={styles.statCard}>
                <div style={styles.skeleton} />
              </div>
            ))}
          </>
        ) : (
          <>
            <div style={styles.statCard}>
              <span style={styles.statValue}>{formatNumber(stats.servers)}</span>
              <span style={styles.statLabel}>Серверов</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statValue}>{formatNumber(stats.users)}</span>
              <span style={styles.statLabel}>Пользователей</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statValue}>{"<"}{stats.responseTime}s</span>
              <span style={styles.statLabel}>Ответ</span>
            </div>
          </>
        )}
      </div>

      <div style={styles.cta}>
        <Link href="/login" style={styles.ctaButton}>
          ⭐ Интегрировать Нова
        </Link>
        <p style={styles.ctaStatus}>
          {stats.webhooksOnline ? (
            <>
              <span style={styles.statusDot} />
              Вебхуки работают
            </>
          ) : (
            "Подключение..."
          )}
          <span style={styles.ctaVersion}> • Полная версия скоро</span>
        </p>
      </div>

      {error && (
        <p style={styles.errorText}>
          ⚡ Данные временно недоступны. Мы уже работаем над этим.
        </p>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0A0A0F 0%, #111118 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  header: {
    textAlign: "center",
    marginBottom: "48px",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "16px",
  },
  logoIcon: {
    width: "48px",
    height: "48px",
    background: "#16161F",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    color: "#00E5FF",
    fontSize: "24px",
  },
  logoText: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: "-0.5px",
  },
  tagline: {
    fontSize: "18px",
    color: "#94A3B8",
    margin: "0 0 8px 0",
    fontWeight: "500",
  },
  subtitle: {
    fontSize: "16px",
    color: "#64748B",
    margin: 0,
  },
  statsRow: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: "48px",
  },
  statCard: {
    background: "#16161F",
    border: "1px solid #1F2937",
    borderRadius: "16px",
    padding: "24px 32px",
    textAlign: "center",
    minWidth: "160px",
  },
  statValue: {
    display: "block",
    fontSize: "28px",
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: "4px",
  },
  statLabel: {
    fontSize: "14px",
    color: "#94A3B8",
    fontWeight: "500",
  },
  skeleton: {
    width: "100px",
    height: "28px",
    background: "linear-gradient(90deg, #1F2937 25%, #374151 50%, #1F2937 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
    borderRadius: "8px",
  },
  cta: {
    textAlign: "center",
  },
  ctaButton: {
    display: "inline-block",
    padding: "14px 32px",
    background: "#00E5FF",
    color: "#000000",
    fontWeight: "700",
    fontSize: "16px",
    borderRadius: "12px",
    textDecoration: "none",
    transition: "all 0.2s ease",
    boxShadow: "0 0 20px rgba(0, 229, 255, 0.2)",
  },
  ctaStatus: {
    marginTop: "16px",
    fontSize: "14px",
    color: "#94A3B8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    background: "#22C55E",
    borderRadius: "50%",
    display: "inline-block",
  },
  ctaVersion: {
    color: "#64748B",
  },
  errorText: {
    marginTop: "24px",
    color: "#F59E0B",
    fontSize: "14px",
    background: "#F59E0B10",
    padding: "8px 16px",
    borderRadius: "8px",
  },
};

if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  document.head.appendChild(style);
}
