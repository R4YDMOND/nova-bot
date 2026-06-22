'use client';

import { Bell, Search } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <header className="h-16 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-6 flex items-center justify-between z-20">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-secondary))] w-4 h-4" />
          <input type="text" placeholder="Поиск по панели..." className="input w-full pl-10 py-2.5 text-sm" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <button className="p-2.5 hover:bg-[rgb(var(--surface-2))] rounded-2xl transition-all relative">
          <Bell className="w-5 h-5 text-[rgb(var(--text-secondary))]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </button>
        <div className="flex items-center gap-3 pl-6 border-l border-[rgb(var(--border))]">
          <div className="text-right">
            <p className="text-sm font-medium text-[rgb(var(--text))]">Администратор</p>
            <p className="text-xs text-[rgb(var(--text-secondary))]">Online</p>
          </div>
          <div className="w-9 h-9 bg-nova-500 rounded-2xl flex items-center justify-center text-black font-bold">A</div>
        </div>
      </div>
    </header>
  );
}
