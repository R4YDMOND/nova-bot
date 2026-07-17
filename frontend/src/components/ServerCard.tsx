'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardServer } from '@/lib/api';
import { PlatformIcon, PLATFORM_LABEL } from '@/components/PlatformIcon';
import { Trash2 } from 'lucide-react';

interface ServerCardProps {
  server: DashboardServer;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  deleting: boolean;
}

export function ServerCard({ server, selected, onSelect, onRemove, deleting }: ServerCardProps) {
  const router = useRouter();

  const handleConfigure = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    router.push('/dashboard/moderation');
  };

  return (
    <Card
      className={`group relative flex flex-col items-center text-center gap-4 p-6 min-h-[200px] cursor-pointer transition-all hover:shadow-lg ${
        selected
          ? 'border-2 border-primary bg-primary/5'
          : server.platform === 'vk' 
            ? 'border border-blue-500/20 hover:border-blue-500/40' 
            : 'border border-purple-500/20 hover:border-purple-500/40'
      }`}
      onClick={onSelect}
    >
      {/* Аватар: единый формат 64x64px, круглый. Значок платформы — бейдж поверх аватара */}
      <div className="relative w-16 h-16 shrink-0">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center overflow-hidden">
          {server.icon_url ? (
            <img src={server.icon_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <PlatformIcon platform={server.platform} className="w-8 h-8 rounded-lg" />
          )}
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full ring-2 ring-[rgb(var(--surface))] overflow-hidden bg-[rgb(var(--surface))]">
          <PlatformIcon platform={server.platform} className="w-6 h-6" />
        </div>
      </div>

      {/* Название и платформа */}
      <div className="w-full">
        <h3 className="font-bold text-base truncate text-[rgb(var(--text))]">{server.name}</h3>
        <div className="flex justify-center mt-2">
          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] text-[rgb(var(--text-secondary))]">
            <PlatformIcon platform={server.platform} className="w-3.5 h-3.5 rounded" /> {PLATFORM_LABEL[server.platform]}
          </span>
        </div>
      </div>

      {/* Участники и ID */}
      <div className="flex flex-col gap-1">
        <div className="text-sm text-[rgb(var(--text))] font-semibold">
          👥 {server.member_count > 0 ? server.member_count.toLocaleString('ru-RU') : 'N/A'}
        </div>
        <div className="text-xs text-[rgb(var(--text-secondary))] font-mono">
          ID: {server.server_id}
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="flex w-full gap-2 mt-auto">
        <Button 
          onClick={handleConfigure}
          className={`flex-1 ${server.platform === 'vk' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-purple-500 hover:bg-purple-600'}`}
        >
          Настроить
        </Button>
      </div>

      {/* Кнопка удаления */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        disabled={deleting}
        className="p-2 rounded-lg text-[rgb(var(--text-secondary))] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 md:opacity-0 md:group-hover:opacity-100 absolute top-2 right-2"
        title="Удалить из панели"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </Card>
  );
}