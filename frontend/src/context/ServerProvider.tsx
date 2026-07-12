'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { api, type Server } from '@/lib/api';

const STORAGE_KEY = 'nova_selected_server_id';

type ServerContextValue = {
  servers: Server[];
  selectedServer: Server | null;
  selectedServerId: string;
  setSelectedServerId: (id: string) => void;
  loading: boolean;
  refresh: () => Promise<void>;
  syncLolka: () => Promise<{ status: string; synced?: number; error?: string }>;
  syncing: boolean;
};

const ServerContext = createContext<ServerContextValue | null>(null);

export function ServerProvider({ children }: { children: ReactNode }) {
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServerId, setSelectedServerIdState] = useState<string>('default');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.servers.list();
      const list = data.servers || [];
      setServers(list);

      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (saved && list.some((s) => s.server_id === saved)) {
        setSelectedServerIdState(saved);
      } else if (list.length > 0) {
        setSelectedServerIdState(list[0].server_id);
      } else {
        setSelectedServerIdState('default');
      }
    } catch {
      setServers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function setSelectedServerId(id: string) {
    setSelectedServerIdState(id);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, id);
  }

  async function syncLolka() {
    setSyncing(true);
    try {
      const res = await api.servers.syncLolka();
      await refresh();
      return res;
    } finally {
      setSyncing(false);
    }
  }

  const selectedServer = servers.find((s) => s.server_id === selectedServerId) || null;

  return (
    <ServerContext.Provider
      value={{ servers, selectedServer, selectedServerId, setSelectedServerId, loading, refresh, syncLolka, syncing }}
    >
      {children}
    </ServerContext.Provider>
  );
}

export function useServer() {
  const ctx = useContext(ServerContext);
  if (!ctx) {
    throw new Error('useServer() должен использоваться внутри <ServerProvider>');
  }
  return ctx;
}
