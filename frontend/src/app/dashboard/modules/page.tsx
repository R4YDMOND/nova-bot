"use client";

import { useState, useEffect } from "react";

const navigate = (url: string) => (window.location.href = url);

const sanitize = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/[\u0000-\u001F]/g, "")
    .replace(/[\u200B-\u200D]/g, "")
    .replace(/[\uFEFF]/g, "")
    .trim();
};

export default function ModulesPage() {
  const [modules, setModules] = useState([
    { id: "moderation", name: "🛡️ Модерация", icon: "🛡️", desc: "Антиспам, антимат, защита от рейдов", enabled: true, link: "/dashboard/moderation" },
    { id: "levels", name: "📊 Система уровней", icon: "📊", desc: "Опыт за активность, награды, лидерборд", enabled: true, link: "/dashboard/ranking" },
    { id: "ai", name: "🤖 AI-помощник", icon: "🤖", desc: "Умные ответы, генерация контента", enabled: false, link: "/dashboard/ai" },
    { id: "music", name: "🎵 Музыка", icon: "🎵", desc: "Воспроизведение треков в голосовых", enabled: false, link: "/dashboard/music" },
    { id: "commands", name: "⚡ Команды", icon: "⚡", desc: "Кастомные команды и автопостинг", enabled: true, link: "/dashboard/commands" },
    { id: "analytics", name: "📈 Аналитика", icon: "📈", desc: "Статистика, отчёты, графики", enabled: false, link: "/dashboard/analytics" },
  ]);

  const [saved, setSaved] = useState(false);
  const [visible, setVisible] = useState<number[]>([]);

  useEffect(() => {
    modules.forEach((_, i) => {
      setTimeout(() => setVisible((prev) => [...prev, i]), i * 50);
    });
  }, []);

  const toggle = (id: string) => {
    setModules(modules.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)));
    setSaved(false);
  };

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div style={{ padding: "32px 40px", maxWidth: "900px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 2 }}>🧩 Модули</h1>
          <p style={{ color: "#94A3B8", fontSize: 13 }}>Управляйте функциями бота</p>
        </div>
        <button
          onClick={save}
          style={{
            padding: "10px 22px",
            background: saved ? "#22C55E" : "#00E5FF",
            color: "#000",
            border: "none",
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            transition: "all 0.25s",
          }}
        >
          {saved ? "✅ Сохранено" : "💾 Сохранить"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {modules.map((mod, i) => (
          <div
            key={mod.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 18px",
              borderRadius: 14,
              cursor: "pointer",
              transition: "all 0.2s ease",
              border: "1px solid transparent",
              background: "#16161F",
              opacity: visible.includes(i) ? 1 : 0,
              transform: visible.includes(i) ? "translateY(0)" : "translateY(8px)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#1A1A26";
              e.currentTarget.style.borderColor = "#1F2937";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#16161F";
              e.currentTarget.style.borderColor = "transparent";
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                minWidth: 40,
                background: mod.enabled ? "rgba(0,229,255,0.08)" : "#111118",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              {mod.icon}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>
                {sanitize(mod.name)}
                {mod.link && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(mod.link!);
                    }}
                    style={{ color: "#00E5FF", fontSize: 11, marginLeft: 4, cursor: "pointer", opacity: 0.7 }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
                  >
                    ↗
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.3 }}>{sanitize(mod.desc)}</div>
            </div>

            <div
              onClick={(e) => {
                e.stopPropagation();
                toggle(mod.id);
              }}
              style={{
                width: 38,
                height: 22,
                background: mod.enabled ? "#00E5FF" : "#374151",
                borderRadius: 22,
                cursor: "pointer",
                transition: "all 0.25s ease",
                position: "relative",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  height: 16,
                  width: 16,
                  left: mod.enabled ? 20 : 3,
                  top: 3,
                  background: mod.enabled ? "#000" : "#FFF",
                  borderRadius: "50%",
                  transition: "all 0.25s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {saved && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "#22C55E",
            color: "#000",
            padding: "10px 20px",
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 13,
            zIndex: 1000,
            boxShadow: "0 4px 20px rgba(34,197,94,0.3)",
            animation: "slideUp 0.3s ease",
          }}
        >
          ✅ Настройки модулей сохранены
        </div>
      )}
      <style>{`@keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  );
}
