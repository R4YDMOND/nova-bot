'use client';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useState } from 'react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    toggleTheme();
    setTimeout(() => setIsAnimating(false), 400);
  };

  return (
    <button
      onClick={handleToggle}
      className="p-2.5 hover:bg-[rgb(var(--surface-2))] rounded-2xl transition-all text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text))] relative overflow-hidden"
      aria-label="Переключить тему"
    >
      <div className={`transition-transform duration-500 ${isAnimating ? 'rotate-180 scale-90' : ''}`}>
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </div>
    </button>
  );
}