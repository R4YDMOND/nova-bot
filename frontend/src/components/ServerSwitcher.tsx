'use client';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { useServer } from '@/context/ServerProvider';
import { Server as ServerIcon } from 'lucide-react';
import { PlatformIcon } from '@/components/PlatformIcon';

export function ServerSwitcher() {
  const { servers, loading, selectedServerId, selectedServer, selectServer } = useServer();

  if (!loading && servers.length === 0) {
    return null;
  }

  return (
    <Select value={selectedServerId} onValueChange={selectServer}>
      <SelectTrigger className="w-56">
        <span className="flex items-center gap-2 truncate">
          <ServerIcon className="w-4 h-4 text-[rgb(var(--text-secondary))] shrink-0" />
          {selectedServer ? (
            <>
              <PlatformIcon platform={selectedServer.platform} className="w-4 h-4 rounded shrink-0" />
              <span className="truncate">{selectedServer.name}</span>
            </>
          ) : (
            <span className="text-[rgb(var(--text-secondary))]">Выберите сервер</span>
          )}
        </span>
      </SelectTrigger>
      <SelectContent>
        {servers.map(s => (
          <SelectItem key={s.server_id} value={s.server_id}>
            <span className="flex items-center gap-2">
              <PlatformIcon platform={s.platform} className="w-4 h-4 rounded shrink-0" />
              {s.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
