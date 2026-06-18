"use client"

import { useState, useEffect } from 'react'

const navigate = (url: string) => window.location.href = url

export default function ModulesPage() {
  const [modules, setModules] = useState([
    { id: 'moderation', name: 'Модерация', icon: '🛡️', desc: 'Антиспам, антимат, защита от рейдов', enabled: true, link: '/dashboard/moderation' },
    { id: 'levels', name: 'Система уровней', icon: '📊', desc: 'Опыт за активность, награды, лидерборд', enabled: true, link: '/dashboard/ranking' },
    { id: 'ai', name: 'AI-помощник', icon: '🤖', desc: 'Умные ответы, генерация контента', enabled: false, link: '/dashboard/ai' },
    { id: 'music', name: 'Музыка', icon: '🎵', desc: 'Воспроизведение треков', enabled: false, link: '/dashboard/music' },
    { id: 'commands', name: 'Команды', icon: '⚡', desc: 'Кастомные команды и автопостинг', enabled: true, link: '/dashboard/commands' },
    { id: 'analytics', name: 'Аналитика', icon: '📈', desc: 'Статистика, отчёты, графики', enabled: false, link: '/dashboard/analytics' },
  ])

  const [saved, setSaved] = useState(false)
  const [visible, setVisible] = useState<number[]>([])

  useEffect(() => {
    modules.forEach((_, i) => {
      setTimeout(() => setVisible(prev => [...prev, i]), i * 60)
    })
  }, [])

  const toggle = (id: string) => {
    setModules(modules.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m))
    setSaved(false)
  }

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2200) }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', color: '#F1F5F9' }}>
      
      <aside style={{ width: '240px', minWidth: '240px', background: '#111118', borderRight: '1px solid #1F2937', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '32px' }}>
          <div style={{ width: '34px', height: '34px', background: '#16161F', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#00E5FF', fontSize: '17px' }}>N</div>
          <span style={{ fontSize: '19px', fontWeight: 'bold', color: '#FFF' }}>Нова</span>
        </a>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          {[
            { icon: '📊', label: 'Обзор', href: '/dashboard' },
            { icon: '🖥️', label: 'Серверы', href: '/dashboard/servers' },
            { icon: '🧩', label: 'Модули', href: '/dashboard/modules' },
            { icon: '⚡', label: 'Команды', href: '/dashboard/commands' },
          ].map((item, i) => {
            const isActive = item.label === 'Модули'
            return (
              <span key={i} onClick={() => navigate(item.href)} style={{
                padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center',
                gap: '10px', fontSize: '14px', cursor: 'pointer', fontWeight: isActive ? '500' : '400',
                color: isActive ? '#FFF' : '#94A3B8', background: isActive ? '#1F2937' : 'transparent',
                transition: 'all 0.15s'
              }}>
                <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </span>
            )
          })}
        </nav>
      </aside>

      <main style={{ flex: 1, padding: '32px 40px', maxWidth: '800px' }}>
        
        {/* Header + Save button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '2px' }}>Модули</h1>
            <p style={{ color: '#94A3B8', fontSize: '13px' }}>Управляйте функциями бота</p>
          </div>
          <button onClick={save} style={{
            padding: '10px 22px', background: saved ? '#22C55E' : '#00E5FF', color: '#000',
            border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
            transition: 'all 0.25s', boxShadow: saved ? '0 0 15px rgba(34,197,94,0.3)' : 'none'
          }}>
            {saved ? '✅ Сохранено' : '💾 Сохранить'}
          </button>
        </div>

        {/* Modules List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {modules.map((mod, i) => (
            <div key={mod.id} style={{
              display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px',
              borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease',
              border: '1px solid transparent',
              opacity: visible.includes(i) ? 1 : 0,
              transform: visible.includes(i) ? 'translateX(0)' : 'translateX(-10px)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#111118'; e.currentTarget.style.borderColor = '#1F2937'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
            >
              <div style={{
                width: '42px', height: '42px', minWidth: '42px',
                background: mod.enabled ? 'rgba(0,229,255,0.08)' : '#111118',
                borderRadius: '12px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '20px', transition: 'all 0.2s'
              }}>
                {mod.icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '1px' }}>
                  {mod.name}
                  {mod.link && (
                    <span onClick={(e) => { e.stopPropagation(); navigate(mod.link!) }} style={{
                      color: '#00E5FF', fontSize: '11px', marginLeft: '6px', cursor: 'pointer',
                      opacity: 0.7, transition: 'opacity 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                    >↗</span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>{mod.desc}</div>
              </div>

              <div onClick={(e) => { e.stopPropagation(); toggle(mod.id); }} style={{
                width: '40px', height: '24px', background: mod.enabled ? '#00E5FF' : '#374151',
                borderRadius: '24px', cursor: 'pointer', transition: 'all 0.25s ease',
                position: 'relative', flexShrink: 0
              }}>
                <div style={{
                  position: 'absolute', height: '18px', width: '18px',
                  left: mod.enabled ? '20px' : '3px', top: '3px',
                  background: mod.enabled ? '#000' : '#FFF',
                  borderRadius: '50%', transition: 'all 0.25s ease'
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Toast */}
        {saved && (
          <div style={{
            position: 'fixed', bottom: '24px', right: '24px',
            background: '#22C55E', color: '#000', padding: '10px 20px',
            borderRadius: '12px', fontWeight: '600', fontSize: '13px',
            zIndex: 1000, boxShadow: '0 4px 20px rgba(34,197,94,0.3)',
            animation: 'slideUp 0.3s ease'
          }}>✅ Настройки модулей сохранены</div>
        )}
        <style>{`@keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      </main>
    </div>
  )
}
