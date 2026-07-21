'use client';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardServer } from '@/lib/api';
import { PlatformIcon, PLATFORM_LABEL } from '@/components/PlatformIcon';
import { Trash2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServerCardProps {
  server: DashboardServer;
  selected: boolean;
  onSelect: () => void;
  onConfigure: () => void;
  onRemove: () => void;
  deleting: boolean;
}

export function ServerCard({ server, selected, onSelect, onConfigure, onRemove, deleting }: ServerCardProps) {
  const isActive = server.is_active !== false;

  const handleConfigure = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConfigure();
  };

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all hover:shadow-lg cursor-pointer group',
        server.platform === 'vk'
          ? 'border-2 border-blue-500/30 hover:border-blue-500/50'
          : 'border-2 border-purple-500/30 hover:border-purple-500/50'
      )}
      onClick={onSelect}
    >
      {/* Platform Badge */}
      <div className="absolute top-4 right-4 z-10">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm",
          server.platform === 'vk' ? 'bg-blue-500' : 'bg-purple-500'
        )}>
          {server.platform === 'vk' ? 'VK' : 'L'}
        </div>
      </div>

      <CardHeader className="text-center pb-2 pt-8">
        <div className="mx-auto mb-4 relative w-20 h-20">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center overflow-hidden border-2 border-[rgb(var(--surface))]">
            {server.icon_url ? (
              <Image src={server.icon_url} alt="" width={80} height={80} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">{server.platform === 'vk' ? '🔵' : '💜'}</span>
            )}
          </div>
        </div>
        <CardTitle className="text-lg font-bold truncate text-[rgb(var(--text))]">{server.name}</CardTitle>
        <CardDescription className="space-y-1.5 text-sm mt-1">
          <div className="font-mono text-[rgb(var(--text-secondary))] text-xs">ID: {server.server_id}</div>
          <div className="flex items-center justify-center gap-1 text-[rgb(var(--text-secondary))]">
            <Users className="w-3.5 h-3.5" />
            {server.member_count > 0 ? server.member_count.toLocaleString('ru-RU') : 'N/A'} участников
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2 pb-6 flex flex-col items-center gap-4">
        {/* ИСПРАВЛЕНИЕ: Используем isActive вместо selected */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isActive ? "bg-green-500" : "bg-yellow-500"
          )} />
          <span className={cn(
            "text-xs font-medium",
            isActive ? "text-green-500" : "text-yellow-500"
          )}>
            {isActive ? 'Подключен' : 'Ограничено'}
          </span>
        </div>

        <div className="flex w-full gap-2">
          <Button 
            onClick={handleConfigure}
            className={cn(
              "flex-1 h-10 text-sm",
              server.platform === 'vk' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-purple-500 hover:bg-purple-600'
            )}
          >
            Настроить
          </Button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            disabled={deleting}
            className="p-2.5 rounded-lg text-[rgb(var(--text-secondary))] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            title="Удалить"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}