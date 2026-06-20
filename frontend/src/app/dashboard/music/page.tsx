"use client";

import { useState, useEffect } from "react";

const API_BASE = "https://nova-bot-rpsy.onrender.com";

export default function MusicPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [availableTypes, setAvailableTypes] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newProvider, setNewProvider] = useState({
    type: "youtube",
    name: "",
    api_key: "",
    webhook_url: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [animBtn, setAnimBtn] = useState("");

  useEffect(() => { loadProviders(); }, []);

  const loadProviders = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/music/providers?server_id=default`);
      const data = await res.json();
      setProviders(data.providers || []);
      setAvailableTypes(data.available_types || []);
    } catch (e) { console.error(e); }
  };

  const addProvider = async () => {
    await fetch(`${API_BASE}/api/music/providers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ server_id: "default", type: newProvider.type, name: newProvider.name || newProvider.type, api_key: newProvider.api_key, webhook_url: newProvider.webhook_url }),
    });
    setShowAdd(false);
    setNewProvider({ type: "youtube", name: "", api_key: "", webhook_url: "" });
    setAnimBtn("saved");
    setTimeout(() => setAnimBtn(""), 1500);
    loadProviders();
  };

  const deleteProvider = async (id: number) => {
    await fetch(`${API_BASE}/api/music/providers/${id}`, { method: "DELETE" });
    loadProviders();
  };

  const searchMusic = async () => {
    if (!searchQuery.trim() || !selectedProvider) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/music/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selectedProvider.type, query: searchQuery, api_key: selectedProvider.apiKey || "" }),
      });
      const data = await res.json();
      setSearchResults(data.tracks || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      youtube: "▶️", yandex: "🎧", vk: "💙", soundcloud: "☁️",
      yandex_radio: "📻", record: "🎵", dfm: "📡",
      europa_plus: "📻", nashe: "🎸", relax_fm: "🎧",
      like_fm: "🔊", shanson: "🎹", custom: "🔗",
    };
    return icons[type] || "🎵";
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      youtube: "YouTube Music", yandex: "Яндекс.Музыка", vk: "VK Музыка",
      soundcloud: "SoundCloud", yandex_radio: "Яндекс.Радио",
      record: "Radio Record", dfm: "DFM", europa_plus: "Европа Плюс",
      nashe: "Наше Радио", relax_fm: "Relax FM", like_fm: "Like FM",
      shanson: "Радио Шансон", custom: "Свой Webhook",
    };
    return labels[type] || type;
  };

  return (
    <div style={{ padding: "32px 40px", maxWidth: "1000px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>🎵 Музыка</h1>
      <p style={{ color: "#94A3B8", fontSize: 14, marginBottom: 32 }}>Поиск треков и радиостанции для вашего сервера</p>

      {/* Провайдеры */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>🔌 Подключённые сервисы</h3>
          <button onClick={() => setShowAdd(!showAdd)} style={{ ...styles.btn, background: showAdd ? "#1F2937" : "#00E5FF", color: showAdd ? "#FFF" : "#000" }}>
            {showAdd ? "✕" : "+ Добавить"}
          </button>
        </div>

        {showAdd && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <select value={newProvider.type} onChange={(e) => setNewProvider({ ...newProvider, type: e.target.value })} style={styles.input}>
              {availableTypes.map((t: any) => (<option key={t.value} value={t.value}>{t.icon} {t.label}</option>))}
            </select>
            <input type="text" placeholder="Название" value={newProvider.name} onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })} style={styles.input} />
            {!["yandex_radio", "record", "dfm", "europa_plus", "nashe", "relax_fm", "like_fm", "shanson"].includes(newProvider.type) && (
              <input type="text" placeholder={newProvider.type === "custom" ? "Webhook URL" : "API Ключ"} value={newProvider.type === "custom" ? newProvider.webhook_url : newProvider.api_key}
                onChange={(e) => newProvider.type === "custom" ? setNewProvider({ ...newProvider, webhook_url: e.target.value }) : setNewProvider({ ...newProvider, api_key: e.target.value })} style={styles.input} />
            )}
            <button onClick={addProvider} style={{ ...styles.btn, background: animBtn === "saved" ? "#22C55E" : "#10B981", color: "#FFF", transition: "all 0.3s", transform: animBtn === "saved" ? "scale(1.05)" : "scale(1)" }}>
              {animBtn === "saved" ? "✅" : "💾 Сохранить"}
            </button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {providers.map((p: any) => (
            <div key={p.id} style={styles.card}>
              <span style={{ fontSize: 24 }}>{getTypeIcon(p.type)}</span>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 13 }}>{p.name || getTypeLabel(p.type)}</strong>
                <div style={{ fontSize: 11, color: "#64748B" }}>{getTypeLabel(p.type)}</div>
              </div>
              <span style={{ color: p.enabled ? "#22C55E" : "#EF4444", fontSize: 12 }}>{p.enabled ? "🟢" : "🔴"}</span>
              <button onClick={() => deleteProvider(p.id)} style={styles.delBtn}>✕</button>
            </div>
          ))}
          {providers.length === 0 && <p style={{ color: "#64748B", textAlign: "center", padding: 20, fontSize: 14 }}>Нет подключённых сервисов. Добавьте первый!</p>}
        </div>
      </div>

      {/* Поиск */}
      {providers.length > 0 && (
        <div style={styles.section}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: 15, fontWeight: 600 }}>🔍 Поиск треков</h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <select value={selectedProvider?.id || ""} onChange={(e) => { const p = providers.find((pr) => pr.id === parseInt(e.target.value)); setSelectedProvider(p); }} style={styles.input}>
              <option value="">Выберите сервис...</option>
              {providers.map((p: any) => (<option key={p.id} value={p.id}>{getTypeIcon(p.type)} {p.name || getTypeLabel(p.type)}</option>))}
            </select>
            <input type="text" placeholder="Название трека..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchMusic()} style={{ ...styles.input, flex: 1 }} />
            <button onClick={searchMusic} disabled={loading} style={{ ...styles.btn, background: loading ? "#374151" : "#00E5FF", color: "#000" }}>{loading ? "⏳" : "🔍"}</button>
          </div>
          {searchResults.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {searchResults.map((track: any, i: number) => (
                <div key={i} style={styles.card}>
                  <span style={{ color: "#64748B", fontSize: 14, width: 24, textAlign: "center" }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 13 }}>{track.title}</strong>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>{track.artist}</div>
                  </div>
                  <a href={track.url} target="_blank" style={{ padding: "6px 12px", background: "#22C55E", color: "#FFF", borderRadius: 6, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>▶</a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <style>{animStyles}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: { background: "#16161F", borderRadius: 14, padding: 20, marginBottom: 16, border: "1px solid #1F2937" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  btn: { padding: "8px 16px", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13, transition: "all 0.2s" },
  input: { padding: "8px 12px", background: "#0A0A0F", border: "1px solid #1F2937", borderRadius: 8, color: "#FFF", fontSize: 13, outline: "none" },
  card: { display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#111118", borderRadius: 10, border: "1px solid #1F2937" },
  delBtn: { padding: "4px 8px", background: "transparent", color: "#EF4444", border: "1px solid #374151", borderRadius: 6, cursor: "pointer", fontSize: 12 },
};

const animStyles = `
  @keyframes popIn { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
  @keyframes fadeIn { 0% { opacity: 0; transform: translateY(8px); } 100% { opacity: 1; transform: translateY(0); } }
`;
