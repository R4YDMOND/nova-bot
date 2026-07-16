import { cn } from '@/lib/utils';

type Platform = 'vk' | 'lolka';

interface EventItemProps {
  event: {
    type: string;
    title: string;
    description: string;
    created_at: string;
  };
  platform: Platform;
}

export function EventItem({ event, platform }: EventItemProps) {
  return (
    <div className="flex gap-3 items-start p-3 border rounded-xl bg-[rgb(var(--surface-2))] border-[rgb(var(--border))]">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold leading-tight truncate text-[rgb(var(--text))]">
          {event.title}
        </p>
        <p className="text-[10px] mt-0.5 leading-snug break-words text-[rgb(var(--text-secondary))]">
          {event.description}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[9px] text-[rgb(var(--text-secondary))]">
            {new Date(event.created_at).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span
            className={cn(
              'text-[8px] font-bold px-1.5 py-0.5 rounded bg-[rgb(var(--surface-2))]',
              platform === 'vk' ? 'text-blue-500' : 'text-purple-500'
            )}
          >
            {platform.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}