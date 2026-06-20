"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nova-bot-rpsy.onrender.com";
const navigate = (url: string) => (window.location.href = url);

const sanitize = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/[\u0000-\u001F]/g, "")
    .replace(/[\u200B-\u200D]/g, "")
    .replace(/[\uFEFF]/g, "")
    .trim();
};

export default function ServersPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/servers`)
      .then((res) => res.json())
      .then((data) => {
        setServers(data.servers || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "32px 40px", maxWidth: "1000px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>🖥️ Мои серверы</h1>
          <p style={{ color: "#94A3B8", fontSize: 14 }}>Управляйте подключёнными серверами</p>
        </div>
        <button
          onClick={() => navigate("/login")}
          style={{ padding: "12px 24px", background: "#00E5FF", color: "#000", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          + Добавить сервер
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 32 }}>
        {[
          { label: "Всего серверов", value: servers.length, color: "#00E5FF", icon: "🖥️" },
          { label: "Активных", value: servers.length, color: "#22C55E", icon: "🟢" },
          { label: "Модулей доступно", value: "9", color: "#A855F7", icon: "🧩" },
          { label: "Время ответа", value: "<0.8s", color: "#F59E0B", icon: "⚡" },
        ].map((stat, i) => (
          <div key={i} style={{ background: "#16161F", borderRadius: 14, padding: 20, border: `1px solid #1F2937`, borderTop: `3px solid ${stat.color}`, display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 28 }}>{stat.icon}</span>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#FFF", lineHeight: 1.1 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "#16161F", borderRadius: 14, border: "1px solid #1F2937", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "#94A3B8" }}>⏳ Загрузка...</div>
        ) : servers.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🖥️</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Нет серверов</h3>
            <p style={{ color: "#94A3B8", marginBottom: 20 }}>Добавьте первый сервер чтобы начать 🚀</p>
            <button onClick={() => navigate("/login")} style={{ padding: "12px 24px", background: "#00E5FF", color: "#000", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer" }}>
              ⭐ Интегрировать Нова
            </button>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1F2937" }}>
                {["Сервер", "ID", "Статус", "Действия"].map((h, i) => (
                  <th key={i} style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {servers.map((s: any) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #1F2937" }}>
                  <td style={{ padding: "16px 20px", fontWeight: 500 }}>🖥️ {sanitize(s.name)}</td>
                  <td style={{ padding: "16px 20px", color: "#94A3B8", fontSize: 13 }}>{s.id}</td>
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "rgba(34,197,94,0.15)", color: "#22C55E" }}>🟢 Активен</span>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <button onClick={() => navigate("/dashboard/modules")} style={{ padding: "8px 14px", background: "transparent", color: "#00E5FF", border: "1px solid #1F2937", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>
                      ⚙️ Настроить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
