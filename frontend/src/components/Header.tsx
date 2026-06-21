"use client";

import { Bell, Search } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <header className="h-16 border-b border-zinc-800 bg-[#0a0a0a] dark:bg-[#0a0a0a] px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Поиск по панели..."
            className="bg-zinc-900 border-zinc-700 focus:border-[#00E5FF] rounded-2xl px-4 py-2 pl-10 text-white placeholder:text-zinc-500 outline-none transition-all w-full text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        <button className="p-2.5 hover:bg-zinc-800 rounded-2xl transition-colors relative">
          <Bell className="w-5 h-5 text-zinc-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-zinc-800">
          <div className="text-right">
            <p className="text-sm font-medium">Администратор</p>
            <p className="text-xs text-zinc-500">Online</p>
          </div>
          <div className="w-8 h-8 bg-[#00E5FF] rounded-full flex items-center justify-center text-black font-bold text-sm">
            A
          </div>
        </div>
      </div>
    </header>
  );
}
