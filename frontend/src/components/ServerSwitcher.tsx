'use client';

import { useState, useRef, useEffect } from 'react';
import { useServer } from '@/context/ServerProvider';

const PLATFORM_META: Record<string, { label: string; badge: string; dot: string }> = {
  vk: { label: 'VK', badge: 'bg-blue-500/15 text-blue-400', dot: 'bg-blue-400' },
  lolka: { label: 'Lolka', badge: 'bg-purple-500/15 text-purple-400', dot: 'bg-purple-400' },
};

export function ServerSwitcher() {
  const { servers, selectedServer, setSelectedServerId, loading, syncLolka, syncing } = useServer();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const meta = selectedServer ? PLATFORM_META[selectedServer.platform] : null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface))] transition-colors text-sm max-w-[220px]"
      >
        {loading ? (
          <span className="text-[rgb(var(--text-secondary))]">Загрузка...</span>
        ) : selectedServer ? (
          <>
            {selectedServer.icon_url ? (
              <img src={selectedServer.icon_url} alt="" className="w-5 h-5 rounded-full shrink-0" />
            ) : (
              <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {selectedServer.name.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="truncate font-medium">{selectedServer.name}</span>
            {meta && (
              <span className={`shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${meta.badge}`}>
                {meta.label}
              </span>
            )}
          </>
        ) : (
          <span className="text-[rgb(var(--text-secondary))]">Нет серверов</span>
        )}
        <svg className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="max-h-72 overflow-y-auto">
            {servers.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-[rgb(var(--text-secondary))]">
                Нет подключённых серверов
              </div>
            )}
            {servers.map((s) => {
              const m = PLATFORM_META[s.platform] || PLATFORM_META.vk;
              const active = selectedServer?.server_id === s.server_id;
              return (
                <button
                  key={`${s.platform}-${s.server_id}`}
                  onClick={() => {
                    setSelectedServerId(s.server_id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                    active ? 'bg-[rgb(var(--surface-2))]' : 'hover:bg-[rgb(var(--surface-2))]'
                  }`}
                >
                  {s.icon_url ? (
                    <img src={s.icon_url} alt="" className="w-8 h-8 rounded-full shrink-0" />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {s.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{s.name}</div>
                    <div className="text-xs text-[rgb(var(--text-secondary))]">
                      {s.member_count > 0 ? `${s.member_count} участников` : '\u00A0'}
                    </div>
                  </div>
                  <span className={`shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${m.badge}`}>
                    {m.label}
                  </span>
                  {active && <span className={`w-2 h-2 rounded-full shrink-0 ${m.dot}`} />}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => syncLolka()}
            disabled={syncing}
            className="w-full px-4 py-3 text-sm font-medium text-center border-t border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-2))] disabled:opacity-50 transition-colors"
          >
            {syncing ? 'Синхронизация...' : '🔄 Синхронизировать с Lolka'}
          </button>
        </div>
      )}
    </div>
  );
}
