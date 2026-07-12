'use client';
import { Bell, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ThemeToggle } from './ThemeToggle';
import { ServerSwitcher } from './ServerSwitcher';

interface Profile {
  name: string;
  avatar: string;
}

const labels: Record<string, string> = {
  dashboard: 'Обзор',
  ai: 'AI',
  commands: 'Команды',
  analytics: 'Аналитика',
  moderation: 'Модерация',
  webhooks: 'Вебхуки',
  music: 'Музыка',
  ranking: 'Уровни',
  servers: 'Серверы',
  docs: 'Документация',
  settings: 'Настройки',
};

export function Header() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.authenticated) setProfile({ name: data.name, avatar: data.avatar });
      })
      .catch(() => {});
  }, []);

  const segments = (pathname || '').split('/').filter(Boolean);
  const crumbs = segments.map((seg) => labels[seg] || seg);

  return (
    <header className="h-16 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-6 flex items-center justify-between z-20 shrink-0">
      <div className="flex items-center gap-6 flex-1">
        <nav className="hidden md:flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span>/</span>}
              <span className={i === crumbs.length - 1 ? 'text-[rgb(var(--text))] font-medium' : ''}>
                {crumb}
              </span>
            </span>
          ))}
        </nav>

        <ServerSwitcher />

        <div className="relative w-72 ml-auto md:ml-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-secondary))] w-4 h-4" />
          <input
            type="text"
            placeholder="Поиск..."
            className="input w-full pl-9 pr-12 py-2 text-sm"
          />
          <kbd className="hidden lg:block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[rgb(var(--text-secondary))] border border-[rgb(var(--border))] rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <button className="p-2.5 hover:bg-[rgb(var(--surface-2))] rounded-xl transition-all relative">
          <Bell className="w-5 h-5 text-[rgb(var(--text-secondary))]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-[rgb(var(--border))]">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-[rgb(var(--text))]">
              {profile?.name ?? 'Гость'}
            </p>
            <p className="text-xs text-[rgb(var(--text-secondary))]">
              {profile ? 'Online' : 'Не авторизован'}
            </p>
          </div>
          {profile?.avatar ? (
            <Image
              src={profile.avatar}
              alt={profile.name}
              width={36}
              height={36}
              className="rounded-xl object-cover"
            />
          ) : (
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white font-bold text-sm">
              {profile?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}