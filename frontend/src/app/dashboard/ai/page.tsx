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
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>✨ AI-Настройки</h1>
      <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 24 }}>Гибкая настройка моделей и стилей общения 🤖</p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
        {[
          { id: "general", label: "⚙️ Общие" },
          { id: "gemini", label: "🔵 Gemini" },
          { id: "deepseek", label: "🟣 DeepSeek" },
          { id: "server", label: "🖥️ Сервер" },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: activeTab === tab.id ? "#1F2937" : "transparent", color: activeTab === tab.id ? "#FFF" : "#94A3B8", fontWeight: activeTab === tab.id ? 600 : 400, cursor: "pointer", fontSize: 13, transition: "all 0.15s" }}>
            {sanitize(tab.label)}
          </button>
        ))}
      </div>

      {/* Tab: General */}
      {activeTab === "general" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🤖 Активная модель</h3>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { value: "auto", label: "🔄 Авто", desc: "Gemini → DeepSeek" },
                { value: "gemini", label: "🔵 Gemini", desc: "Google AI" },
                { value: "deepseek", label: "🟣 DeepSeek", desc: "DeepSeek AI" },
              ].map((m) => (
                <div key={m.value} onClick={() => update("activeModel", m.value)} style={{ flex: 1, padding: 14, borderRadius: 12, cursor: "pointer", background: settings.activeModel === m.value ? "rgba(0,229,255,0.08)" : "#111118", border: `2px solid ${settings.activeModel === m.value ? "#00E5FF" : "#1F2937"}`, transition: "all 0.2s" }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{sanitize(m.label)}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8" }}>{sanitize(m.desc)}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...styles.section, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={styles.label}>🤖 Имя бота</label>
              <input type="text" value={sanitize(settings.botName)} onChange={(e) => update("botName", e.target.value)} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>🌐 Язык</label>
              <select value={settings.language} onChange={(e) => update("language", e.target.value)} style={styles.input}>
                <option value="ru">🇷🇺 Русский</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>📝 Системный промпт</h3>
            <textarea value={sanitize(settings.systemPrompt)} onChange={(e) => update("systemPrompt", e.target.value)} rows={3} style={{ ...styles.input, width: "100%", resize: "vertical", fontFamily: "monospace", boxSizing: "border-box" }} />
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>⚙️ Дополнительно</h3>
            {[
              { key: "useContext", label: "🧠 Запоминать контекст", desc: "Помнить последние сообщения" },
              { key: "autoModeration", label: "🛡️ Автомодерация AI", desc: "Фильтровать ответы бота" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i === 0 ? "1px solid #1F2937" : "none" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{sanitize(item.label)}</div>
                  <div style={{ fontSize: 12, color: "#94A3B8" }}>{sanitize(item.desc)}</div>
                </div>
                <div onClick={() => toggle(item.key)} style={toggleStyle(settings[item.key as keyof typeof settings] as boolean)}>
                  <div style={toggleDotStyle(settings[item.key as keyof typeof settings] as boolean)} />
                </div>
              </div>
            ))}
            {settings.useContext && (
              <div style={{ marginTop: 12 }}>
                <label style={styles.label}>💬 Сообщений для контекста</label>
                <input type="number" value={settings.contextMessages} onChange={(e) => update("contextMessages", parseInt(e.target.value) || 10)} style={styles.input} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Gemini */}
      {activeTab === "gemini" && (
        <div style={styles.section}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>🔵 Google Gemini</h3>
            <div onClick={() => toggle("geminiEnabled")} style={toggleStyle(settings.geminiEnabled)}><div style={toggleDotStyle(settings.geminiEnabled)} /></div>
          </div>
          {settings.geminiEnabled && (
            <>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 13, color: "#94A3B8" }}>🌡️ Температура</span><span style={{ color: "#3B82F6", fontWeight: 600 }}>{settings.geminiTemperature}</span></div>
                <input type="range" min="0" max="1" step="0.1" value={settings.geminiTemperature} onChange={(e) => update("geminiTemperature", parseFloat(e.target.value))} style={{ width: "100%", accentColor: "#3B82F6" }} />
              </div>
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "#94A3B8" }}>🎨 Стили общения</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {geminiStyles.map((style) => (
                  <div key={style.value} onClick={() => update("geminiStyle", style.value)} style={{ padding: 14, borderRadius: 12, cursor: "pointer", background: settings.geminiStyle === style.value ? "rgba(59,130,246,0.1)" : "#111118", border: `2px solid ${settings.geminiStyle === style.value ? "#3B82F6" : "#1F2937"}`, transition: "all 0.2s" }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{sanitize(style.label)}</div>
                    <div style={{ fontSize: 12, color: "#94A3B8" }}>{sanitize(style.desc)}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={styles.label}>📝 Кастомный промпт для Gemini</label>
                <textarea value={sanitize(settings.geminiCustomPrompt)} onChange={(e) => update("geminiCustomPrompt", e.target.value)} rows={2} placeholder="Дополнительные инструкции..." style={{ ...styles.input, width: "100%", resize: "vertical", fontFamily: "monospace", boxSizing: "border-box" }} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab: DeepSeek */}
      {activeTab === "deepseek" && (
        <div style={styles.section}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>🟣 DeepSeek AI</h3>
            <div onClick={() => toggle("deepseekEnabled")} style={{ ...toggleStyle(settings.deepseekEnabled), background: settings.deepseekEnabled ? "#A855F7" : "#374151" }}><div style={toggleDotStyle(settings.deepseekEnabled)} /></div>
          </div>
          {settings.deepseekEnabled && (
            <>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 13, color: "#94A3B8" }}>🌡️ Температура</span><span style={{ color: "#A855F7", fontWeight: 600 }}>{settings.deepseekTemperature}</span></div>
                <input type="range" min="0" max="1" step="0.1" value={settings.deepseekTemperature} onChange={(e) => update("deepseekTemperature", parseFloat(e.target.value))} style={{ width: "100%", accentColor: "#A855F7" }} />
              </div>
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "#94A3B8" }}>🎨 Стили общения</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {deepseekStyles.map((style) => (
                  <div key={style.value} onClick={() => update("deepseekStyle", style.value)} style={{ padding: 14, borderRadius: 12, cursor: "pointer", background: settings.deepseekStyle === style.value ? "rgba(168,85,247,0.1)" : "#111118", border: `2px solid ${settings.deepseekStyle === style.value ? "#A855F7" : "#1F2937"}`, transition: "all 0.2s" }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{sanitize(style.label)}</div>
                    <div style={{ fontSize: 12, color: "#94A3B8" }}>{sanitize(style.desc)}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={styles.label}>📝 Кастомный промпт для DeepSeek</label>
                <textarea value={sanitize(settings.deepseekCustomPrompt)} onChange={(e) => update("deepseekCustomPrompt", e.target.value)} rows={2} placeholder="Дополнительные инструкции..." style={{ ...styles.input, width: "100%", resize: "vertical", fontFamily: "monospace", boxSizing: "border-box" }} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab: Server */}
      {activeTab === "server" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ ...styles.section, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={styles.label}>Платформа</label>
              <select value={settings.platform} onChange={(e) => update("platform", e.target.value)} style={styles.input}>
                <option value="Lolka">🎮 Lolka</option>
                <option value="VK">💙 VK</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Название сервера/группы</label>
              <input type="text" value={sanitize(settings.serverName)} onChange={(e) => update("serverName", e.target.value)} placeholder="Phoenix Gaming" style={styles.input} />
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🖼️ Аватар AI-помощника</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
              {[
                { id: "nova", icon: "N", label: "Нова ✨", color: "#00E5FF" },
                { id: "star", icon: "⭐", label: "Звезда", color: "#F59E0B" },
                { id: "robot", icon: "🤖", label: "Робот", color: "#3B82F6" },
                { id: "cat", icon: "🐱", label: "Кот", color: "#EC4899" },
              ].map((avatar) => (
                <div key={avatar.id} onClick={() => update("avatarStyle", avatar.id)} style={{ padding: "16px 8px", borderRadius: 14, cursor: "pointer", textAlign: "center", background: settings.avatarStyle === avatar.id ? "rgba(0,229,255,0.08)" : "#111118", border: `2px solid ${settings.avatarStyle === avatar.id ? "#00E5FF" : "#1F2937"}`, transition: "all 0.2s" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "#0A0A0F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 8px", border: `2px solid ${avatar.color}40`, color: avatar.color }}>{avatar.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 500 }}>{sanitize(avatar.label)}</div>
                </div>
              ))}
            </div>
            <label style={styles.label}>Или укажите свой URL аватара</label>
            <input type="text" value={sanitize(settings.avatarUrl)} onChange={(e) => update("avatarUrl", e.target.value)} placeholder="https://example.com/avatar.png" style={styles.input} />
          </div>
        </div>
      )}

      {/* Кнопка сохранения */}
      <div style={{ marginTop: 24 }}>
        <button onClick={save} style={{ padding: "12px 28px", background: saved ? "#22C55E" : "#00E5FF", color: "#000", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 14, transition: "all 0.3s", boxShadow: saved ? "0 0 20px rgba(34,197,94,0.3)" : "0 0 20px rgba(0,229,255,0.15)" }}>
          {saved ? "✅ Сохранено!" : "💾 Сохранить"}
        </button>
      </div>

      {saved && <div style={{ position: "fixed", bottom: 24, right: 24, background: "#22C55E", color: "#000", padding: "10px 20px", borderRadius: 12, fontWeight: 600, fontSize: 13, zIndex: 1000, boxShadow: "0 4px 20px rgba(34,197,94,0.3)", animation: "slideUp 0.3s ease" }}>✅ Настройки AI сохранены</div>}
      <style>{`@keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: { background: "#16161F", borderRadius: 14, padding: 20, border: "1px solid #1F2937", marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: 600, marginBottom: 14, marginTop: 0 },
  label: { fontSize: 12, color: "#94A3B8", display: "block", marginBottom: 6 },
  input: { width: "100%", padding: "10px 14px", background: "#0A0A0F", border: "1px solid #1F2937", borderRadius: 10, color: "#FFF", fontSize: 14, outline: "none", boxSizing: "border-box" },
};

const toggleStyle = (active: boolean): React.CSSProperties => ({ width: 44, height: 26, background: active ? "#00E5FF" : "#374151", borderRadius: 26, cursor: "pointer", position: "relative", flexShrink: 0 });
const toggleDotStyle = (active: boolean): React.CSSProperties => ({ position: "absolute", height: 20, width: 20, left: active ? 22 : 4, top: 3, background: active ? "#000" : "#FFF", borderRadius: "50%", transition: "0.25s" });
