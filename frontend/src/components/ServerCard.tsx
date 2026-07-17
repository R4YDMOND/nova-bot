'use client';

import { useRouter } from 'next/navigation';
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
  onRemove: () => void;
  deleting: boolean;
}

export function ServerCard({ server, selected, onSelect, onRemove, deleting }: ServerCardProps) {
  const router = useRouter();
  const isActive = server.is_active !== false;

  const handleConfigure = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    router.push('/dashboard/moderation');
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
      <div className="absolute top-3 right-3 z-10">
        <div className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm",
          server.platform === 'vk' ? 'bg-blue-500' : 'bg-purple-500'
        )}>
          {server.platform === 'vk' ? 'VK' : 'L'}
        </div>
      </div>

      <CardHeader className="text-center pb-2 pt-6">
        <div className="mx-auto mb-3 relative w-16 h-16">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center overflow-hidden border-2 border-[rgb(var(--surface))]">
            {server.icon_url ? (
              <img src={server.icon_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">{server.platform === 'vk' ? '🔵' : '💜'}</span>
            )}
          </div>
        </div>
        
        <CardTitle className="text-base font-bold truncate text-[rgb(var(--text))]">{server.name}</CardTitle>
        <CardDescription className="space-y-1 text-xs">
          <div className="font-mono text-[rgb(var(--text-secondary))]">ID: {server.server_id}</div>
          <div className="flex items-center justify-center gap-1 text-[rgb(var(--text-secondary))]">
            <Users className="w-3 h-3" />
            {server.member_count > 0 ? server.member_count.toLocaleString('ru-RU') : 'N/A'} участников
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2 pb-4 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            selected ? "bg-green-500" : "bg-yellow-500"
          )} />
          <span className={cn(
            "text-xs font-medium",
            selected ? "text-green-500" : "text-yellow-500"
          )}>
            {selected ? 'Подключен' : 'Ограничен'}
          </span>
        </div>

        <div className="flex w-full gap-2">
          <Button 
            onClick={handleConfigure}
            className={cn(
              "flex-1 h-9 text-xs",
              server.platform === 'vk' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-purple-500 hover:bg-purple-600'
            )}
          >
            Настроить
          </Button>
          
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            disabled={deleting}
            className="p-2 rounded-lg text-[rgb(var(--text-secondary))] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
            title="Удалить"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}