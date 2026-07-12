'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, DashboardServer } from '@/lib/api';

interface ServerContextValue {
  servers: DashboardServer[];
  loading: boolean;
  selectedServerId: string;
  selectedServer: DashboardServer | null;
  selectServer: (serverId: string) => void;
  refresh: () => Promise<void>;
  syncLolka: () => Promise<{ status?: string; synced?: number; error?: string }>;
}

const STORAGE_KEY = 'nova:selectedServerId';

const ServerContext = createContext<ServerContextValue | null>(null);

export function ServerProvider({ children }: { children: React.ReactNode }) {
  const [servers, setServers] = useState<DashboardServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServerId, setSelectedServerId] = useState<string>('default');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.servers.list();
      const list = data.servers || [];
      setServers(list);

      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      const stillExists = saved && list.some(s => s.server_id === saved);
      if (stillExists && saved) {
        setSelectedServerId(saved);
      } else if (list.length > 0) {
        setSelectedServerId(list[0].server_id);
        if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, list[0].server_id);
      }
    } catch {
      // остаёмся на 'default', страницы продолжат работать с дефолтным сервером
    } finally {
      setLoading(false);
    }
  }, []);

  const syncLolka = useCallback(async () => {
    try {
      const res = await api.servers.syncLolka();
      await refresh();
      return res;
    } catch {
      return { error: 'Не удалось синхронизировать серверы Lolka' };
    }
  }, [refresh]);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) setSelectedServerId(saved);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectServer = useCallback((serverId: string) => {
    setSelectedServerId(serverId);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, serverId);
  }, []);

  const selectedServer = servers.find(s => s.server_id === selectedServerId) || null;

  return (
    <ServerContext.Provider value={{ servers, loading, selectedServerId, selectedServer, selectServer, refresh, syncLolka }}>
      {children}
    </ServerContext.Provider>
  );
}

export function useServer() {
  const ctx = useContext(ServerContext);
  if (!ctx) {
    return {
      servers: [] as DashboardServer[],
      loading: false,
      selectedServerId: 'default',
      selectedServer: null,
      selectServer: () => {},
      refresh: async () => {},
      syncLolka: async () => ({}),
    } as ServerContextValue;
  }
  return ctx;
}
