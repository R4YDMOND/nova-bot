"use client";

import { useState, useEffect } from "react";

const API_URL = "https://nova-bot-rpsy.onrender.com";
const navigate = (url: string) => (window.location.href = url);

const sanitize = (text: string): string => {
  if (!text) return "";
  return text.replace(/[\u0000-\u001F]/g, "").replace(/[\u200B-\u200D]/g, "").replace(/[\uFEFF]/g, "").trim();
};

export default function ServersPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/servers`)
      .then((res) => res.json())
      .then((data) => { setServers(data.servers || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "32px 40px", maxWidth: "1000px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: "var(--font-3xl)", fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>🖥️ Мои серверы</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-lg)" }}>Управляйте подключёнными серверами</p>
        </div>
        <button onClick={() => navigate("/login")} style={{ padding: "12px 24px", background: "var(--accent)", color: "#000", border: "none", borderRadius: "var(--radius-lg)", fontWeight: 600, fontSize: "var(--font-lg)", cursor: "pointer", whiteSpace: "nowrap" }}>+ Добавить сервер</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 32 }}>
        {[
          { label: "Всего серверов", value: servers.length, color: "var(--accent)", icon: "🖥️" },
          { label: "Активных", value: servers.length, color: "var(--success)", icon: "🟢" },
          { label: "Модулей доступно", value: "9", color: "var(--purple)", icon: "🧩" },
          { label: "Время ответа", value: "<0.8s", color: "var(--warning)", icon: "⚡" },
        ].map((stat, i) => (
          <div key={i} style={{ background: "var(--bg-card)", borderRadius: "var(--radius-xl)", padding: 20, border: "1px solid var(--border)", borderTop: "3px solid " + stat.color, display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: "var(--icon-xl)" }}>{stat.icon}</span>
            <div>
              <div style={{ fontSize: "var(--font-3xl)", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.1 }}>{stat.value}</div>
              <div style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)", marginTop: 2 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--text-secondary)" }}>⏳ Загрузка...</div>
        ) : servers.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🖥️</div>
            <h3 style={{ fontSize: "var(--font-xl)", fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>Нет серверов</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>Добавьте первый сервер чтобы начать 🚀</p>
            <button onClick={() => navigate("/login")} style={{ padding: "12px 24px", background: "var(--accent)", color: "#000", border: "none", borderRadius: "var(--radius-lg)", fontWeight: 600, cursor: "pointer" }}>⭐ Интегрировать Нова</button>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Сервер", "ID", "Статус", "Действия"].map((h, i) => (
                  <th key={i} style={{ padding: "14px 20px", textAlign: "left", fontSize: "var(--font-xs)", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {servers.map((s: any) => (
                <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "16px 20px", fontWeight: 500, color: "var(--text-primary)" }}>🖥️ {sanitize(s.name)}</td>
                  <td style={{ padding: "16px 20px", color: "var(--text-secondary)", fontSize: "var(--font-md)" }}>{s.id}</td>
                  <td style={{ padding: "16px 20px" }}>
                    <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: "var(--font-sm)", fontWeight: 600, background: "rgba(34,197,94,0.15)", color: "var(--success)" }}>🟢 Активен</span>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <button onClick={() => navigate("/dashboard/modules")} style={{ padding: "8px 14px", background: "transparent", color: "var(--accent)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "var(--font-sm)" }}>⚙️ Настроить</button>
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
