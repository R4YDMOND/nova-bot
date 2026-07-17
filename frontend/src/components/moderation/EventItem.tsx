'use client';
import { cn } from '@/lib/utils';
import { Trash2, AlertTriangle, Shield, Ban, CheckCircle, MessageSquare } from 'lucide-react';

type ModerationEvent = {
  type: string;
  title: string;
  description: string;
  created_at: string;
};

type Platform = 'vk' | 'lolka';

interface EventItemProps {
  event: ModerationEvent;
  platform: Platform;
}

export function EventItem({ event, platform }: EventItemProps) {
  const getIcon = () => {
    if (event.type.includes('ban') || event.type.includes('block')) return Ban;
    if (event.type.includes('warn')) return AlertTriangle;
    if (event.type.includes('delete')) return Trash2;
    if (event.type.includes('captcha')) return CheckCircle;
    if (event.type.includes('received') || event.type.includes('message')) return MessageSquare;
    return Shield;
  };

  const Icon = getIcon();
  
  const getColor = () => {
    if (event.type.includes('ban') || event.type.includes('block')) return 'text-red-400 bg-red-500/10';
    if (event.type.includes('warn')) return 'text-amber-400 bg-amber-500/10';
    if (event.type.includes('delete')) return 'text-orange-400 bg-orange-500/10';
    if (event.type.includes('captcha')) return 'text-emerald-400 bg-emerald-500/10';
    return 'text-blue-400 bg-blue-500/10';
  };

  const colorClass = getColor();

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Только что';
    if (minutes < 60) return `${minutes} мин. назад`;
    if (hours < 24) return `${hours} ч. назад`;
    return `${days} дн. назад`;
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] transition-colors hover:bg-[rgb(var(--surface))]">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", colorClass)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-[rgb(var(--text))] truncate">
            {event.title}
          </h4>
          <span className="text-[10px] font-medium text-[rgb(var(--text-secondary))] whitespace-nowrap">
            {formatTime(event.created_at)}
          </span>
        </div>
        <p className="text-xs text-[rgb(var(--text-secondary))] mt-0.5 line-clamp-2">
          {event.description}
        </p>
      </div>
    </div>
  );
}