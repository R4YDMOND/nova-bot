'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Home, Bot, Command, BarChart3, Shield, Zap, Music, Server, BookOpen, Settings, Menu, X, Trophy } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Обзор', href: '/dashboard' },
  { icon: Bot, label: 'AI', href: '/dashboard/ai' },
  { icon: Command, label: 'Команды', href: '/dashboard/commands' },
  { icon: BarChart3, label: 'Аналитика', href: '/dashboard/analytics' },
  { icon: Shield, label: 'Модерация', href: '/dashboard/moderation' },
  { icon: Zap, label: 'Вебхуки', href: '/dashboard/webhooks' },
  { icon: Music, label: 'Музыка', href: '/dashboard/music' },
  { icon: Trophy, label: 'Уровни', href: '/dashboard/ranking' },
  { icon: Server, label: 'Серверы', href: '/dashboard/servers' },
  { icon: BookOpen, label: 'Документация', href: '/dashboard/docs' },
  { icon: Settings, label: 'Настройки', href: '/dashboard/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname?.startsWith(href + '/'));

  return (
    <>
      {/* Мобильная кнопка */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-[rgb(var(--surface))] rounded-2xl border border-[rgb(var(--border))]"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Оверлей */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setIsOpen(false)} />
      )}

      {/* Сайдбар */}
      <div className={`w-64 border-r border-[rgb(var(--border))] bg-[rgb(var(--surface))] flex flex-col h-screen fixed lg:static transition-transform duration-300 z-40
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Логотип */}
        <div className="p-6 border-b border-[rgb(var(--border))]">
          <Link href="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[rgb(var(--text))]">Nova</h1>
              <p className="text-xs text-[rgb(var(--text-secondary))]">Lolka · VK Bot</p>
            </div>
          </Link>
        </div>

        {/* Навигация */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-sm ${
                isActive(item.href)
                  ? 'bg-[rgb(var(--surface-2))] text-[rgb(var(--text))]'
                  : 'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--surface-2))] hover:text-[rgb(var(--text))]'
              }`}
            >
              <item.icon className={`w-4 h-4 shrink-0 transition-colors ${
                isActive(item.href) ? 'text-primary' : 'group-hover:text-primary'
              }`} />
              <span>{item.label}</span>
              {isActive(item.href) && (
                <div className="ml-auto w-1.5 h-1.5 bg-primary rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-[rgb(var(--border))] text-center">
          <p className="text-xs text-[rgb(var(--text-secondary))]">Nova Bot v2.4.1</p>
        </div>
      </div>
    </>
  );
}