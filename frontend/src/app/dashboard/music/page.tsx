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

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/music/providers?server_id=default`);
      const data = await res.json();
      setProviders(data.providers || []);
      setAvailableTypes(data.available_types || []);
    } catch (e) {
      console.error(e);
    }
  };

  const addProvider = async () => {
    await fetch(`${API_BASE}/api/music/providers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        server_id: "default",
        type: newProvider.type,
        name: newProvider.name || newProvider.type,
        api_key: newProvider.api_key,
        webhook_url: newProvider.webhook_url,
      }),
    });
    setShowAdd(false);
    setNewProvider({ type: "youtube", name: "", api_key: "", webhook_url: "" });
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
        body: JSON.stringify({
          type: selectedProvider.type,
          query: searchQuery,
          api_key: selectedProvider.apiKey || "",
        }),
      });
      const data = await res.json();
      setSearchResults(data.tracks || []);
    } catch (e) {
      console.error(e);
    }
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
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <a href="/" style={styles.logoLink}>
            <div style={styles.logoIcon}>N</div>
            <span style={styles.logoText}>Нова</span>
          </a>
          <span style={styles.separator}>|</span>
          <a href="/dashboard/modules" style={styles.backLink}>← Модули</a>
          <span style={styles.separator}>/</span>
          <span style={styles.currentPage}>🎵 Музыка</span>
        </div>
      </header>

      <div style={styles.content}>
        <h1 style={styles.title}>🎵 Музыка</h1>
        <p style={styles.subtitle}>Поиск треков и радиостанции для вашего сервера</p>

        {/* Провайдеры */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h3>🔌 Подключённые сервисы</h3>
            <button onClick={() => setShowAdd(!showAdd)} style={styles.addBtn}>
              {showAdd ? "✕" : "+ Добавить"}
            </button>
          </div>

          {showAdd && (
            <div style={styles.addForm}>
              <select
                value={newProvider.type}
                onChange={(e) => setNewProvider({ ...newProvider, type: e.target.value })}
                style={styles.input}
              >
                {availableTypes.map((t: any) => (
                  <option key={t.value} value={t.value}>
                    {t.icon} {t.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Название"
                value={newProvider.name}
                onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                style={styles.input}
              />
              {newProvider.type !== "yandex_radio" && newProvider.type !== "record" && newProvider.type !== "dfm" && newProvider.type !== "europa_plus" && newProvider.type !== "nashe" && newProvider.type !== "relax_fm" && newProvider.type !== "like_fm" && newProvider.type !== "shanson" && (
                <input
                  type="text"
                  placeholder={newProvider.type === "custom" ? "Webhook URL" : "API Ключ"}
                  value={newProvider.type === "custom" ? newProvider.webhook_url : newProvider.api_key}
                  onChange={(e) =>
                    newProvider.type === "custom"
                      ? setNewProvider({ ...newProvider, webhook_url: e.target.value })
                      : setNewProvider({ ...newProvider, api_key: e.target.value })
                  }
                  style={styles.input}
                />
              )}
              <button onClick={addProvider} style={styles.saveBtn}>
                💾 Сохранить
              </button>
            </div>
          )}

          <div style={styles.providersList}>
            {providers.map((p: any) => (
              <div key={p.id} style={styles.providerCard}>
                <span style={styles.providerIcon}>{getTypeIcon(p.type)}</span>
                <div style={styles.providerInfo}>
                  <strong>{p.name || getTypeLabel(p.type)}</strong>
                  <span style={styles.providerType}>{getTypeLabel(p.type)}</span>
                </div>
                <span style={{ ...styles.status, color: p.enabled ? "#22C55E" : "#EF4444" }}>
                  {p.enabled ? "🟢" : "🔴"}
                </span>
                <button onClick={() => deleteProvider(p.id)} style={styles.deleteBtn}>
                  ✕
                </button>
              </div>
            ))}
            {providers.length === 0 && (
              <p style={styles.empty}>Нет подключённых сервисов. Добавьте первый!</p>
            )}
          </div>
        </div>

        {/* Поиск */}
        {providers.length > 0 && (
          <div style={styles.section}>
            <h3>🔍 Поиск треков</h3>
            <div style={styles.searchRow}>
              <select
                value={selectedProvider?.id || ""}
                onChange={(e) => {
                  const p = providers.find((pr) => pr.id === parseInt(e.target.value));
                  setSelectedProvider(p);
                }}
                style={styles.input}
              >
                <option value="">Выберите сервис...</option>
                {providers.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {getTypeIcon(p.type)} {p.name || getTypeLabel(p.type)}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Название трека..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchMusic()}
                style={{ ...styles.input, flex: 1 }}
              />
              <button onClick={searchMusic} disabled={loading} style={styles.searchBtn}>
                {loading ? "⏳" : "🔍"}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div style={styles.results}>
                {searchResults.map((track: any, i: number) => (
                  <div key={i} style={styles.trackCard}>
                    <span style={styles.trackNum}>{i + 1}</span>
                    <div style={styles.trackInfo}>
                      <strong>{track.title}</strong>
                      <span style={styles.trackArtist}>{track.artist}</span>
                    </div>
                    <a href={track.url} target="_blank" style={styles.playBtn}>
                      ▶
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    background: "#0A0A0F",
    color: "#F1F5F9",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 40px",
    background: "#111118",
    borderBottom: "1px solid #1F2937",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  logoLink: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    textDecoration: "none",
  },
  logoIcon: {
    width: "32px",
    height: "32px",
    background: "#16161F",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    color: "#00E5FF",
    fontSize: "16px",
  },
  logoText: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#FFF",
  },
  separator: {
    color: "#374151",
  },
  backLink: {
    color: "#94A3B8",
    textDecoration: "none",
    fontSize: "14px",
  },
  currentPage: {
    color: "#00E5FF",
    fontSize: "14px",
    fontWeight: "500",
  },
  content: {
    padding: "32px 40px",
    maxWidth: "900px",
  },
  title: {
    fontSize: "26px",
    fontWeight: "700",
    marginBottom: "4px",
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: "14px",
    marginBottom: "32px",
  },
  section: {
    background: "#16161F",
    borderRadius: "14px",
    padding: "20px",
    marginBottom: "16px",
    border: "1px solid #1F2937",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  addBtn: {
    padding: "8px 16px",
    background: "#00E5FF",
    color: "#000",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "13px",
  },
  addForm: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
    flexWrap: "wrap" as const,
  },
  input: {
    padding: "8px 12px",
    background: "#0A0A0F",
    border: "1px solid #1F2937",
    borderRadius: "8px",
    color: "#FFF",
    fontSize: "13px",
    outline: "none",
  },
  saveBtn: {
    padding: "8px 16px",
    background: "#22C55E",
    color: "#000",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "13px",
  },
  providersList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  providerCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    background: "#111118",
    borderRadius: "10px",
    border: "1px solid #1F2937",
  },
  providerIcon: {
    fontSize: "24px",
  },
  providerInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
  },
  providerType: {
    fontSize: "11px",
    color: "#64748B",
  },
  status: {
    fontSize: "12px",
  },
  deleteBtn: {
    padding: "4px 8px",
    background: "transparent",
    color: "#EF4444",
    border: "1px solid #374151",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
  empty: {
    color: "#64748B",
    textAlign: "center" as const,
    padding: "20px",
    fontSize: "14px",
  },
  searchRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
  },
  searchBtn: {
    padding: "8px 16px",
    background: "#00E5FF",
    color: "#000",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "13px",
  },
  results: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  },
  trackCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px",
    background: "#111118",
    borderRadius: "8px",
  },
  trackNum: {
    color: "#64748B",
    fontSize: "14px",
    width: "24px",
    textAlign: "center" as const,
  },
  trackInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
  },
  trackArtist: {
    fontSize: "11px",
    color: "#94A3B8",
  },
  playBtn: {
    padding: "6px 12px",
    background: "#22C55E",
    color: "#FFF",
    borderRadius: "6px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "600",
  },
};

export default MusicPage;
