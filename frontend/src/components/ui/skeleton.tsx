import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Skeleton loader (shadcn/ui-паттерн) — см. "Концепция визуального оформления
 * Nova Bot.md", User Experience → Ожидание: скелетоны на время загрузки списков/
 * графиков вместо текста "Загрузка...", чтобы не было скачков контента (CLS) и
 * чтобы медленный отклик бесплатного хостинга не ощущался как зависание.
 * Без Framer Motion — только Tailwind `animate-pulse`, чтобы не тащить лишнюю
 * зависимость (та же логика, что и у dialog-in/overlay-in в tailwind.config.js).
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-[rgb(var(--surface-2))]', className)}
      {...props}
    />
  );
}

/** Скелетон таблицы (лидерборд, топ Nova Points): шапка + N строк-заглушек. */
export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden">
      <div className="flex gap-4 px-4 py-3 bg-[rgb(var(--surface-2))]">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1 bg-[rgb(var(--border))]" />
        ))}
      </div>
      <div className="divide-y divide-[rgb(var(--border))]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className={c === 0 ? 'h-4 w-6 shrink-0' : 'h-4 flex-1'}
                style={{ animationDelay: `${(r * cols + c) * 30}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Скелетон списка карточек (магазин ролей, товары). */
export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-[rgb(var(--surface-2))]">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-1/3 bg-[rgb(var(--border))]" style={{ animationDelay: `${i * 40}ms` }} />
            <Skeleton className="h-3 w-1/5 bg-[rgb(var(--border))]" style={{ animationDelay: `${i * 40 + 20}ms` }} />
          </div>
          <Skeleton className="h-7 w-7 rounded-lg shrink-0 bg-[rgb(var(--border))]" style={{ animationDelay: `${i * 40}ms` }} />
        </div>
      ))}
    </div>
  );
}

/** Скелетон всей страницы (первичная загрузка сервера/настроек) — повторяет
 * layout вкладки: заголовок + карточка настроек, чтобы избежать CLS при
 * появлении реального контента. */
export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
      <div className="rounded-3xl border border-[rgb(var(--border))] p-6 space-y-4">
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}
