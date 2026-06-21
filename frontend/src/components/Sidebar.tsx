"use client";

import { Home, Bot, Music, Shield, BarChart3, Zap, Server, Command } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { icon: Home, label: 'Обзор', href: '/dashboard' },
  { icon: Bot, label: 'AI', href: '/dashboard/ai' },
  { icon: Command, label: 'Команды', href: '/dashboard/commands' },
  { icon: BarChart3, label: 'Аналитика', href: '/dashboard/analytics' },
  { icon: Shield, label: 'Модерация', href: '/dashboard/moderation' },
  { icon: Zap, label: 'Вебхуки', href: '/dashboard/webhooks' },
  { icon: Music, label: 'Музыка', href: '/dashboard/music' },
  { icon: Server, label: 'Серверы', href: '/dashboard/servers' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 border-r border-zinc-800 bg-[#0a0a0a] flex flex-col">
      <div className="p-6 border-b border-zinc-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#00E5FF] rounded-2xl flex items-center justify-center">
            <span className="text-black font-bold text-xl">N</span>
          </div>
          <div>
            <h1 className="font-semibold text-xl tracking-tight text-white">Nova</h1>
            <p className="text-xs text-zinc-500">Bot</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all mb-1 ${
                isActive
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
