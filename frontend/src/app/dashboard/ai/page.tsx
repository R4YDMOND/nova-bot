"use client";

import { useState } from "react";

const sanitize = (text: string): string => {
  if (!text) return "";
  return text.replace(/[\u0000-\u001F]/g, "").replace(/[\u200B-\u200D]/g, "").replace(/[\uFEFF]/g, "").trim();
};

export default function AIPage() {
  const [settings, setSettings] = useState({
    botName: "Нова ✨", language: "ru", activeModel: "auto",
    geminiEnabled: true, geminiTemperature: 0.8, geminiStyle: "friendly", geminiCustomPrompt: "",
    deepseekEnabled: true, deepseekTemperature: 0.7, deepseekStyle: "creative", deepseekCustomPrompt: "",
    useContext: true, contextMessages: 10,
    systemPrompt: "Ты — дружелюбный AI-помощник. Отвечай на русском языке. 🤖",
    forbiddenTopics: "политика, религия, NSFW 🚫", autoModeration: false,
    serverName: "", platform: "Lolka",
    avatarStyle: "nova", avatarUrl: "",
  });

  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const update = (key: string, value: any) => setSettings({ ...settings, [key]: value });
  const toggle = (key: string) => update(key, !settings[key as keyof typeof settings]);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const geminiStyles = [
    { value: "friendly", label: "😊 Дружелюбный", desc: "Тёплое, приветливое общение" },
    { value: "gaming", label: "🎮 Игровой", desc: "Энергичный, с игровым сленгом" },
    { value: "professional", label: "💼 Профессиональный", desc: "Серьёзный, деловой тон" },
  ];

  const deepseekStyles = [
    { value: "creative", label: "🎨 Креативный", desc: "Нестандартные, яркие ответы" },
    { value: "humorous", label: "😂 Юмористический", desc: "С шутками и мемами" },
    { value: "anime", label: "🌸 Аниме", desc: "В стиле аниме-персонажа" },
  ];

  return (
    <div style={{ padding: "32px 40px", maxWidth: "1000px" }}>
      <h1 style={{ fontSize: "var(--font-3xl)", fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>✨ AI-Настройки</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-md)", marginBottom: 24 }}>Гибкая настройка моделей и стилей общения 🤖</p>

      <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
        {[{ id: "general", label: "⚙️ Общие" },{ id: "gemini", label: "🔵 Gemini" },{ id: "deepseek", label: "🟣 DeepSeek" },{ id: "server", label: "🖥️ Сервер" }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: "10px 18px", borderRadius: "var(--radius-lg)", border: "none", background: activeTab === tab.id ? "var(--border)" : "transparent", color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: activeTab === tab.id ? 600 : 400, cursor: "pointer", fontSize: "var(--font-md)", transition: "all 0.15s" }}>{sanitize(tab.label)}</button>
        ))}
      </div>

      {activeTab === "general" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-xl)", padding: 20, border: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "var(--font-xl)", fontWeight: 600, marginBottom: 14, color: "var(--text-primary)", marginTop: 0 }}>🤖 Активная модель</h3>
            <div style={{ display: "flex", gap: 10 }}>
              {[{ value: "auto", label: "🔄 Авто", desc: "Gemini → DeepSeek" },{ value: "gemini", label: "🔵 Gemini", desc: "Google AI" },{ value: "deepseek", label: "🟣 DeepSeek", desc: "DeepSeek AI" }].map((m) => (
                <div key={m.value} onClick={() => update("activeModel", m.value)} style={{ flex: 1, padding: 14, borderRadius: "var(--radius-lg)", cursor: "pointer", background: settings.activeModel === m.value ? "rgba(0,229,255,0.08)" : "var(--bg-secondary)", border: `2px solid ${settings.activeModel === m.value ? "var(--accent)" : "var(--border)"}`, transition: "all 0.2s" }}>
                  <div style={{ fontWeight: 600, fontSize: "var(--font-lg)", marginBottom: 4, color: "var(--text-primary)" }}>{sanitize(m.label)}</div>
                  <div style={{ fontSize: "var(--font-xs)", color: "var(--text-secondary)" }}>{sanitize(m.desc)}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-xl)", padding: 20, border: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>🤖 Имя бота</label><input type="text" value={sanitize(settings.botName)} onChange={e => update("botName", e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", color: "var(--text-primary)", fontSize: "var(--font-lg)", outline: "none", boxSizing: "border-box" }} /></div>
            <div><label style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>🌐 Язык</label><select value={settings.language} onChange={e => update("language", e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", color: "var(--text-primary)", fontSize: "var(--font-lg)" }}><option value="ru">🇷🇺 Русский</option><option value="en">🇬🇧 English</option></select></div>
          </div>

          <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-xl)", padding: 20, border: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "var(--font-xl)", fontWeight: 600, marginBottom: 8, color: "var(--text-primary)", marginTop: 0 }}>📝 Системный промпт</h3>
            <textarea value={sanitize(settings.systemPrompt)} onChange={e => update("systemPrompt", e.target.value)} rows={3} style={{ width: "100%", padding: 12, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", color: "var(--text-primary)", fontSize: "var(--font-md)", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "monospace" }} />
          </div>

          <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-xl)", padding: 20, border: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "var(--font-xl)", fontWeight: 600, marginBottom: 14, color: "var(--text-primary)", marginTop: 0 }}>⚙️ Дополнительно</h3>
            {[{ key: "useContext", label: "🧠 Запоминать контекст", desc: "Помнить последние сообщения" },{ key: "autoModeration", label: "🛡️ Автомодерация AI", desc: "Фильтровать ответы бота" }].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i === 0 ? "1px solid var(--border)" : "none" }}>
                <div><div style={{ fontSize: "var(--font-lg)", fontWeight: 500, color: "var(--text-primary)" }}>{sanitize(item.label)}</div><div style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)" }}>{sanitize(item.desc)}</div></div>
                <div onClick={() => toggle(item.key)} style={{ width: 44, height: 26, background: settings[item.key as keyof typeof settings] ? "var(--accent)" : "var(--border)", borderRadius: 26, cursor: "pointer", position: "relative" }}><div style={{ position: "absolute", height: 20, width: 20, left: settings[item.key as keyof typeof settings] ? 22 : 4, top: 3, background: settings[item.key as keyof typeof settings] ? "#000" : "#FFF", borderRadius: "50%", transition: "0.25s" }} /></div>
              </div>
            ))}
            {settings.useContext && <div style={{ marginTop: 12 }}><label style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>💬 Сообщений для контекста</label><input type="number" value={settings.contextMessages} onChange={e => update("contextMessages", parseInt(e.target.value) || 10)} style={{ width: "100%", padding: "10px 14px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", color: "var(--text-primary)", fontSize: "var(--font-lg)", outline: "none", boxSizing: "border-box" }} /></div>}
          </div>
        </div>
      )}

      {activeTab === "gemini" && (
        <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-xl)", padding: 20, border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: "var(--font-xl)", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>🔵 Google Gemini</h3>
            <div onClick={() => toggle("geminiEnabled")} style={{ width: 44, height: 26, background: settings.geminiEnabled ? "var(--accent)" : "var(--border)", borderRadius: 26, cursor: "pointer", position: "relative" }}><div style={{ position: "absolute", height: 20, width: 20, left: settings.geminiEnabled ? 22 : 4, top: 3, background: settings.geminiEnabled ? "#000" : "#FFF", borderRadius: "50%", transition: "0.25s" }} /></div>
          </div>
          {settings.geminiEnabled && (
            <>
              <div style={{ marginBottom: 16 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: "var(--font-md)", color: "var(--text-secondary)" }}>🌡️ Температура</span><span style={{ color: "#3B82F6", fontWeight: 600 }}>{settings.geminiTemperature}</span></div><input type="range" min="0" max="1" step="0.1" value={settings.geminiTemperature} onChange={e => update("geminiTemperature", parseFloat(e.target.value))} style={{ width: "100%", accentColor: "#3B82F6" }} /></div>
              <h4 style={{ fontSize: "var(--font-md)", fontWeight: 600, marginBottom: 10, color: "var(--text-secondary)" }}>🎨 Стили общения</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{geminiStyles.map(style => (<div key={style.value} onClick={() => update("geminiStyle", style.value)} style={{ padding: 14, borderRadius: "var(--radius-lg)", cursor: "pointer", background: settings.geminiStyle === style.value ? "rgba(59,130,246,0.1)" : "var(--bg-secondary)", border: `2px solid ${settings.geminiStyle === style.value ? "#3B82F6" : "var(--border)"}`, transition: "all 0.2s" }}><div style={{ fontWeight: 600, fontSize: "var(--font-lg)", color: "var(--text-primary)" }}>{sanitize(style.label)}</div><div style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)" }}>{sanitize(style.desc)}</div></div>))}</div>
              <div style={{ marginTop: 16 }}><label style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>📝 Кастомный промпт для Gemini</label><textarea value={sanitize(settings.geminiCustomPrompt)} onChange={e => update("geminiCustomPrompt", e.target.value)} rows={2} placeholder="Дополнительные инструкции..." style={{ width: "100%", padding: 10, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", color: "var(--text-primary)", fontSize: "var(--font-md)", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "monospace" }} /></div>
            </>
          )}
        </div>
      )}

      {activeTab === "deepseek" && (
        <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-xl)", padding: 20, border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: "var(--font-xl)", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>🟣 DeepSeek AI</h3>
            <div onClick={() => toggle("deepseekEnabled")} style={{ width: 44, height: 26, background: settings.deepseekEnabled ? "var(--purple)" : "var(--border)", borderRadius: 26, cursor: "pointer", position: "relative" }}><div style={{ position: "absolute", height: 20, width: 20, left: settings.deepseekEnabled ? 22 : 4, top: 3, background: settings.deepseekEnabled ? "#000" : "#FFF", borderRadius: "50%", transition: "0.25s" }} /></div>
          </div>
          {settings.deepseekEnabled && (
            <>
              <div style={{ marginBottom: 16 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: "var(--font-md)", color: "var(--text-secondary)" }}>🌡️ Температура</span><span style={{ color: "var(--purple)", fontWeight: 600 }}>{settings.deepseekTemperature}</span></div><input type="range" min="0" max="1" step="0.1" value={settings.deepseekTemperature} onChange={e => update("deepseekTemperature", parseFloat(e.target.value))} style={{ width: "100%", accentColor: "var(--purple)" }} /></div>
              <h4 style={{ fontSize: "var(--font-md)", fontWeight: 600, marginBottom: 10, color: "var(--text-secondary)" }}>🎨 Стили общения</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{deepseekStyles.map(style => (<div key={style.value} onClick={() => update("deepseekStyle", style.value)} style={{ padding: 14, borderRadius: "var(--radius-lg)", cursor: "pointer", background: settings.deepseekStyle === style.value ? "rgba(168,85,247,0.1)" : "var(--bg-secondary)", border: `2px solid ${settings.deepseekStyle === style.value ? "var(--purple)" : "var(--border)"}`, transition: "all 0.2s" }}><div style={{ fontWeight: 600, fontSize: "var(--font-lg)", color: "var(--text-primary)" }}>{sanitize(style.label)}</div><div style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)" }}>{sanitize(style.desc)}</div></div>))}</div>
              <div style={{ marginTop: 16 }}><label style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>📝 Кастомный промпт для DeepSeek</label><textarea value={sanitize(settings.deepseekCustomPrompt)} onChange={e => update("deepseekCustomPrompt", e.target.value)} rows={2} placeholder="Дополнительные инструкции..." style={{ width: "100%", padding: 10, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", color: "var(--text-primary)", fontSize: "var(--font-md)", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "monospace" }} /></div>
            </>
          )}
        </div>
      )}

      {activeTab === "server" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-xl)", padding: 20, border: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Платформа</label><select value={settings.platform} onChange={e => update("platform", e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", color: "var(--text-primary)", fontSize: "var(--font-lg)" }}><option value="Lolka">🎮 Lolka</option><option value="VK">💙 VK</option></select></div>
            <div><label style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Название сервера/группы</label><input type="text" value={sanitize(settings.serverName)} onChange={e => update("serverName", e.target.value)} placeholder="Phoenix Gaming" style={{ width: "100%", padding: "10px 14px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", color: "var(--text-primary)", fontSize: "var(--font-lg)", outline: "none", boxSizing: "border-box" }} /></div>
          </div>
          <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-xl)", padding: 20, border: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "var(--font-xl)", fontWeight: 600, marginBottom: 16, color: "var(--text-primary)", marginTop: 0 }}>🖼️ Аватар AI-помощника</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
              {[{ id: "nova", icon: "N", label: "Нова ✨", color: "var(--accent)" },{ id: "star", icon: "⭐", label: "Звезда", color: "var(--warning)" },{ id: "robot", icon: "🤖", label: "Робот", color: "var(--info)" },{ id: "cat", icon: "🐱", label: "Кот", color: "var(--pink)" }].map(avatar => (
                <div key={avatar.id} onClick={() => update("avatarStyle", avatar.id)} style={{ padding: "16px 8px", borderRadius: "var(--radius-xl)", cursor: "pointer", textAlign: "center", background: settings.avatarStyle === avatar.id ? "rgba(0,229,255,0.08)" : "var(--bg-secondary)", border: `2px solid ${settings.avatarStyle === avatar.id ? "var(--accent)" : "var(--border)"}`, transition: "all 0.2s" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "var(--radius-xl)", background: "var(--bg-input)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 8px", border: `2px solid ${avatar.color}40`, color: avatar.color }}>{avatar.icon}</div>
                  <div style={{ fontSize: "var(--font-xs)", fontWeight: 500, color: "var(--text-primary)" }}>{sanitize(avatar.label)}</div>
                </div>
              ))}
            </div>
            <label style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Или укажите свой URL аватара</label>
            <input type="text" value={sanitize(settings.avatarUrl)} onChange={e => update("avatarUrl", e.target.value)} placeholder="https://example.com/avatar.png" style={{ width: "100%", padding: "10px 14px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", color: "var(--text-primary)", fontSize: "var(--font-lg)", outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <button onClick={save} style={{ padding: "12px 28px", background: saved ? "var(--success)" : "var(--accent)", color: "#000", border: "none", borderRadius: "var(--radius-lg)", fontWeight: 600, cursor: "pointer", fontSize: "var(--font-lg)", transition: "all 0.3s", boxShadow: saved ? "0 0 20px rgba(34,197,94,0.3)" : "0 0 20px rgba(0,229,255,0.15)" }}>{saved ? "✅ Сохранено!" : "💾 Сохранить"}</button>
      </div>
      {saved && <div style={{ position: "fixed", bottom: 24, right: 24, background: "var(--success)", color: "#000", padding: "10px 20px", borderRadius: "var(--radius-lg)", fontWeight: 600, fontSize: "var(--font-lg)", zIndex: 1000, boxShadow: "0 4px 20px rgba(34,197,94,0.3)", animation: "slideUp 0.3s ease" }}>✅ Настройки AI сохранены</div>}
      <style>{`@keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  );
}
