'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 hover:bg-[rgb(var(--surface-2))] rounded-2xl transition-all text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))]"
      aria-label="Переключить тему"
    >
      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
