'use client';
import { useState, useEffect } from 'react';

export default function ModulesPage() {
  const [modules, setModules] = useState([
    { id: 'moderation', name: '🛡️ Модерация', desc: 'Антиспам, антимат, защита от рейдов', enabled: true, link: '/dashboard/moderation' },
    { id: 'levels', name: '📊 Система уровней', desc: 'Опыт за активность, награды, лидерборд', enabled: true, link: '/dashboard/ranking' },
    { id: 'ai', name: '🤖 AI-помощник', desc: 'Умные ответы, генерация контента', enabled: false, link: '/dashboard/ai' },
    { id: 'music', name: '🎵 Музыка', desc: 'Воспроизведение треков в голосовых', enabled: false, link: '/dashboard/music' },
    { id: 'commands', name: '⚡ Команды', desc: 'Кастомные команды и автопостинг', enabled: true, link: '/dashboard/commands' },
    { id: 'analytics', name: '📈 Аналитика', desc: 'Статистика, отчёты, графики', enabled: false, link: '/dashboard/analytics' },
  ]);
  const [saved, setSaved] = useState(false);
  const [visible, setVisible] = useState<number[]>([]);

  useEffect(() => {
    modules.forEach((_, i) => setTimeout(() => setVisible(p => [...p, i]), i * 60));
  }, []);

  const toggle = (id: string) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
    setSaved(false);
  };

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2200); };

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">🧩 Модули</h1>
          <p className="text-white/50 mt-1">Управляйте функциями бота</p>
        </div>
        <button
          onClick={save}
          className={`px-5 py-2.5 rounded-xl font-semibold text-black transition-all ${
            saved ? 'bg-green-400' : 'bg-cyan-400 hover:bg-cyan-300'
          }`}
        >
          {saved ? '✅ Сохранено' : '💾 Сохранить'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {modules.map((mod, i) => (
          <div
            key={mod.id}
            className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all"
            style={{
              opacity: visible.includes(i) ? 1 : 0,
              transform: visible.includes(i) ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
            }}
          >
            <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-lg ${
              mod.enabled ? 'bg-cyan-400/10' : 'bg-white/5'
            }`}>
              {mod.name.split(' ')[0]}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-white font-medium text-sm flex items-center gap-1">
                {mod.name.slice(mod.name.indexOf(' ') + 1)}
                <a
                  href={mod.link}
                  onClick={e => e.stopPropagation()}
                  className="text-cyan-400 text-xs opacity-60 hover:opacity-100 ml-1"
                >↗</a>
              </div>
              <div className="text-white/40 text-xs mt-0.5 truncate">{mod.desc}</div>
            </div>

            <button
              onClick={() => toggle(mod.id)}
              className={`shrink-0 w-10 h-6 rounded-full relative transition-colors ${
                mod.enabled ? 'bg-cyan-400' : 'bg-white/20'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
                mod.enabled ? 'left-5 bg-black' : 'left-1 bg-white'
              }`} />
            </button>
          </div>
        ))}
      </div>

      {saved && (
        <div className="fixed bottom-6 right-6 bg-green-400 text-black px-5 py-3 rounded-2xl font-semibold shadow-xl z-50 animate-bounce">
          ✅ Настройки модулей сохранены
        </div>
      )}
    </div>
  );
}
