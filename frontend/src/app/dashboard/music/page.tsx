"use client";

import { useState, useEffect } from "react";

const API_BASE = "https://nova-bot-rpsy.onrender.com";

export default function MusicPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [availableTypes, setAvailableTypes] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newProvider, setNewProvider] = useState({ type: "youtube", name: "", api_key: "", webhook_url: "" });
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
      method: "POST", headers: { "Content-Type": "application/json" },
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
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selectedProvider.type, query: searchQuery, api_key: selectedProvider.apiKey || "" }),
      });
      const data = await res.json();
      setSearchResults(data.tracks || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = { youtube: "▶️", yandex: "🎧", vk: "💙", soundcloud: "☁️", yandex_radio: "📻", record: "🎵", dfm: "📡", europa_plus: "📻", nashe: "🎸", relax_fm: "🎧", like_fm: "🔊", shanson: "🎹", custom: "🔗" };
    return icons[type] || "🎵";
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = { youtube: "YouTube Music", yandex: "Яндекс.Музыка", vk: "VK Музыка", soundcloud: "SoundCloud", yandex_radio: "Яндекс.Радио", record: "Radio Record", dfm: "DFM", europa_plus: "Европа Плюс", nashe: "Наше Радио", relax_fm: "Relax FM", like_fm: "Like FM", shanson: "Радио Шансон", custom: "Свой Webhook" };
    return labels[type] || type;
  };

  return (
    <div style={{ padding: "32px 40px", maxWidth: "1000px" }}>
      <h1 style={{ fontSize: "var(--font-3xl)", fontWeight: 700, marginBottom: 4, color: "var(--text-primary)" }}>🎵 Музыка</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-lg)", marginBottom: 32 }}>Поиск треков и радиостанции для вашего сервера</p>

      <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-xl)", padding: 20, marginBottom: 16, border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: "var(--font-xl)", fontWeight: 600, color: "var(--text-primary)" }}>🔌 Подключённые сервисы</h3>
          <button onClick={() => setShowAdd(!showAdd)} style={{ padding: "8px 16px", background: showAdd ? "var(--border)" : "var(--accent)", color: showAdd ? "var(--text-primary)" : "#000", border: "none", borderRadius: "var(--radius-md)", fontWeight: 600, cursor: "pointer", fontSize: "var(--font-md)", transition: "all 0.2s" }}>{showAdd ? "✕" : "+ Добавить"}</button>
        </div>

        {showAdd && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <select value={newProvider.type} onChange={(e) => setNewProvider({ ...newProvider, type: e.target.value })} style={{ padding: "8px 12px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: "var(--font-md)", outline: "none" }}>
              {availableTypes.map((t: any) => (<option key={t.value} value={t.value}>{t.icon} {t.label}</option>))}
            </select>
            <input type="text" placeholder="Название" value={newProvider.name} onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })} style={{ padding: "8px 12px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: "var(--font-md)", outline: "none" }} />
            {!["yandex_radio","record","dfm","europa_plus","nashe","relax_fm","like_fm","shanson"].includes(newProvider.type) && (
              <input type="text" placeholder={newProvider.type === "custom" ? "Webhook URL" : "API Ключ"} value={newProvider.type === "custom" ? newProvider.webhook_url : newProvider.api_key}
                onChange={(e) => newProvider.type === "custom" ? setNewProvider({ ...newProvider, webhook_url: e.target.value }) : setNewProvider({ ...newProvider, api_key: e.target.value })} style={{ padding: "8px 12px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: "var(--font-md)", outline: "none" }} />
            )}
            <button onClick={addProvider} style={{ padding: "8px 16px", background: animBtn === "saved" ? "var(--success)" : "var(--success)", color: "#FFF", border: "none", borderRadius: "var(--radius-md)", fontWeight: 600, cursor: "pointer", fontSize: "var(--font-md)", transition: "all 0.3s", transform: animBtn === "saved" ? "scale(1.05)" : "scale(1)" }}>
              {animBtn === "saved" ? "✅" : "💾 Сохранить"}
            </button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {providers.map((p: any) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
              <span style={{ fontSize: "var(--icon-xl)" }}>{getTypeIcon(p.type)}</span>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: "var(--font-md)", color: "var(--text-primary)" }}>{p.name || getTypeLabel(p.type)}</strong>
                <div style={{ fontSize: "var(--font-xs)", color: "var(--text-muted)" }}>{getTypeLabel(p.type)}</div>
              </div>
              <span style={{ color: p.enabled ? "var(--success)" : "var(--danger)", fontSize: "var(--font-sm)" }}>{p.enabled ? "🟢" : "🔴"}</span>
              <button onClick={() => deleteProvider(p.id)} style={{ padding: "4px 8px", background: "transparent", color: "var(--danger)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: "var(--font-sm)" }}>✕</button>
            </div>
          ))}
          {providers.length === 0 && <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 20, fontSize: "var(--font-lg)" }}>Нет подключённых сервисов. Добавьте первый!</p>}
        </div>
      </div>

      {providers.length > 0 && (
        <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-xl)", padding: 20, border: "1px solid var(--border)" }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "var(--font-xl)", fontWeight: 600, color: "var(--text-primary)" }}>🔍 Поиск треков</h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <select value={selectedProvider?.id || ""} onChange={(e) => { const p = providers.find((pr) => pr.id === parseInt(e.target.value)); setSelectedProvider(p); }} style={{ padding: "8px 12px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: "var(--font-md)", outline: "none" }}>
              <option value="">Выберите сервис...</option>
              {providers.map((p: any) => (<option key={p.id} value={p.id}>{getTypeIcon(p.type)} {p.name || getTypeLabel(p.type)}</option>))}
            </select>
            <input type="text" placeholder="Название трека..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchMusic()} style={{ padding: "8px 12px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: "var(--font-md)", outline: "none", flex: 1 }} />
            <button onClick={searchMusic} disabled={loading} style={{ padding: "8px 16px", background: loading ? "var(--border)" : "var(--accent)", color: "#000", border: "none", borderRadius: "var(--radius-md)", fontWeight: 600, cursor: "pointer", fontSize: "var(--font-md)" }}>{loading ? "⏳" : "🔍"}</button>
          </div>
          {searchResults.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {searchResults.map((track: any, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "var(--font-lg)", width: 24, textAlign: "center" }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: "var(--font-md)", color: "var(--text-primary)" }}>{track.title}</strong>
                    <div style={{ fontSize: "var(--font-xs)", color: "var(--text-secondary)" }}>{track.artist}</div>
                  </div>
                  <a href={track.url} target="_blank" style={{ padding: "6px 12px", background: "var(--success)", color: "#FFF", borderRadius: "var(--radius-sm)", textDecoration: "none", fontSize: "var(--font-lg)", fontWeight: 600 }}>▶</a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes popIn { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
}
