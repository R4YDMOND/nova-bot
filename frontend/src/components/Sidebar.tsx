'use client';

import { Home, Bot, Music, Shield, BarChart3, Zap, Server, Command, BookOpen } from 'lucide-react';
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
  { icon: BookOpen, label: 'Документация', href: '/docs' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 border-r border-[rgb(var(--border))] bg-[rgb(var(--surface))] flex flex-col h-full">
      <div className="p-6 border-b border-[rgb(var(--border))]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-gradient-to-br from-nova-400 to-nova-500 rounded-2xl flex items-center justify-center shadow-nova">
            <span className="text-black font-bold text-2xl">N</span>
          </div>
          <div>
            <h1 className="font-semibold text-2xl tracking-tighter text-[rgb(var(--text))]">Nova</h1>
            <p className="text-xs text-[rgb(var(--text-secondary))] tracking-wide">DISCORD BOT</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/docs' && pathname?.startsWith('/docs'));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium ${
                isActive
                  ? 'bg-[rgb(var(--surface-2))] text-[rgb(var(--text))] shadow-sm'
                  : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-2))] hover:text-[rgb(var(--text))]'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-nova-400' : 'group-hover:text-nova-400'}`} />
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-nova-400 rounded-full"></div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[rgb(var(--border))]">
        <p className="text-xs text-center text-[rgb(var(--text-secondary))]">v2.4.1</p>
      </div>
    </div>
  );
}
