"use client";

import { useState } from "react";

const navigate = (url: string) => (window.location.href = url);

const sanitize = (text: string): string => {
  if (!text) return "";
  return text.replace(/[\u0000-\u001F]/g, "").replace(/[\u200B-\u200D]/g, "").replace(/[\uFEFF]/g, "").trim();
};

export default function CommandsPage() {
  const [commands, setCommands] = useState([
    { name: "🏓 /ping", desc: "Проверка бота", category: "Основные", enabled: true, cooldown: 3, allowedRoles: "" },
    { name: "❓ /help", desc: "Список команд", category: "Основные", enabled: true, cooldown: 5, allowedRoles: "" },
    { name: "📊 /stats", desc: "Статистика", category: "Основные", enabled: true, cooldown: 10, allowedRoles: "" },
    { name: "🔨 /ban", desc: "Забанить", category: "Модерация", enabled: true, cooldown: 0, allowedRoles: "@модер, @админ" },
    { name: "👢 /kick", desc: "Выгнать", category: "Модерация", enabled: true, cooldown: 0, allowedRoles: "@модер, @админ" },
    { name: "🔇 /mute", desc: "Замутить", category: "Модерация", enabled: true, cooldown: 0, allowedRoles: "@модер, @админ" },
    { name: "🧹 /clear", desc: "Очистить чат", category: "Модерация", enabled: false, cooldown: 5, allowedRoles: "@админ" },
    { name: "🏆 /rank", desc: "Уровень", category: "Уровни", enabled: true, cooldown: 5, allowedRoles: "" },
    { name: "📈 /top", desc: "Топ участников", category: "Уровни", enabled: true, cooldown: 15, allowedRoles: "" },
    { name: "🎵 /play", desc: "Музыка", category: "Музыка", enabled: false, cooldown: 3, allowedRoles: "@DJ" },
    { name: "🤖 /ai", desc: "Спросить AI", category: "AI", enabled: true, cooldown: 5, allowedRoles: "" },
  ]);

  const [saved, setSaved] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [searchQuery, setSearchQuery] = useState("");
  const categories = ["Все", "Основные", "Модерация", "Уровни", "Музыка", "AI"];

  const filtered = commands.filter((c) => {
    const matchCat = activeCategory === "Все" || c.category === activeCategory;
    const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const toggle = (name: string) => setCommands(commands.map((c) => (c.name === name ? { ...c, enabled: !c.enabled } : c)));
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div style={{ padding: "32px 40px", maxWidth: "1000px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: "var(--font-3xl)", fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>⚡ Команды</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-lg)" }}>Управляйте доступными командами бота</p>
        </div>
        <button onClick={save} style={{ padding: "10px 22px", background: saved ? "var(--success)" : "var(--accent)", color: "#000", border: "none", borderRadius: "var(--radius-lg)", fontWeight: 600, fontSize: "var(--font-lg)", cursor: "pointer", transition: "all 0.25s", whiteSpace: "nowrap" }}>{saved ? "✅ Сохранено" : "💾 Сохранить"}</button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input type="text" value={sanitize(searchQuery)} onChange={(e) => setSearchQuery(e.target.value)} placeholder="🔍 Поиск команд..." style={{ padding: "8px 14px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", color: "var(--text-primary)", fontSize: "var(--font-md)", outline: "none", width: 220 }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: "7px 14px", borderRadius: 20, border: "1px solid var(--border)", background: activeCategory === cat ? "var(--border)" : "transparent", color: activeCategory === cat ? "var(--text-primary)" : "var(--text-secondary)", cursor: "pointer", fontSize: "var(--font-sm)", fontWeight: 500, transition: "all 0.15s" }}>{cat}</button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Команда", "Описание", "Категория", "Кулдаун", "Роли", "Статус"].map((h, i) => (
                <th key={i} style={{ padding: "12px 16px", textAlign: "left", fontSize: "var(--font-xs)", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((cmd, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border)" }} onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-secondary)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <td style={{ padding: "12px 16px" }}><code style={{ background: "var(--bg-input)", padding: "4px 10px", borderRadius: "var(--radius-sm)", color: "var(--accent)", fontSize: "var(--font-md)", fontFamily: "monospace" }}>{sanitize(cmd.name)}</code></td>
                <td style={{ padding: "12px 16px", fontSize: "var(--font-md)", color: "var(--text-primary)" }}>{sanitize(cmd.desc)}</td>
                <td style={{ padding: "12px 16px" }}><span style={{ padding: "3px 8px", borderRadius: "var(--radius-sm)", fontSize: "var(--font-xs)", background: "var(--bg-input)", color: "var(--text-secondary)" }}>{cmd.category}</span></td>
                <td style={{ padding: "12px 16px", fontSize: "var(--font-sm)", color: "var(--text-secondary)" }}>{cmd.cooldown}с</td>
                <td style={{ padding: "12px 16px", fontSize: "var(--font-xs)", color: "var(--text-muted)" }}>{sanitize(cmd.allowedRoles) || "Все"}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div onClick={() => toggle(cmd.name)} style={{ width: 40, height: 24, background: cmd.enabled ? "var(--accent)" : "var(--border)", borderRadius: 24, cursor: "pointer", transition: "0.25s", position: "relative" }}>
                    <div style={{ position: "absolute", height: 18, width: 18, left: cmd.enabled ? 20 : 3, top: 3, background: cmd.enabled ? "#000" : "#FFF", borderRadius: "50%", transition: "0.25s" }} />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Команды не найдены</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {saved && <div style={{ position: "fixed", bottom: 24, right: 24, background: "var(--success)", color: "#000", padding: "12px 24px", borderRadius: "var(--radius-lg)", fontWeight: 600, fontSize: "var(--font-lg)", zIndex: 1000, boxShadow: "0 4px 20px rgba(34,197,94,0.3)", animation: "slideUp 0.3s ease" }}>✅ Сохранено</div>}
      <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  );
}
