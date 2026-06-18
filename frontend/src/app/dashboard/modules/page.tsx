"use client"

import { useState } from 'react'

export default function ModulesPage() {
  const [modules, setModules] = useState([
    { id: 'moderation', name: 'Модерация', icon: '🛡️', desc: 'Антиспам, антимат, защита от рейдов', enabled: true },
    { id: 'levels', name: 'Система уровней', icon: '📊', desc: 'Опыт за активность, награды, лидерборд', enabled: true, link: '/dashboard/ranking' },
    { id: 'ai', name: 'AI-помощник', icon: '🤖', desc: 'Умные ответы, генерация контента', enabled: false, link: '/dashboard/ai' },
    { id: 'music', name: 'Музыка', icon: '🎵', desc: 'Воспроизведение треков', enabled: false },
    { id: 'commands', name: 'Команды', icon: '⚡', desc: 'Кастомные команды и автопостинг', enabled: true, link: '/dashboard/commands' },
    { id: 'analytics', name: 'Аналитика', icon: '📈', desc: 'Статистика, отчёты, графики', enabled: false },
  ])

  const [saved, setSaved] = useState(false)

  const toggle = (id: string) => {
    setModules(modules.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m))
  }

  const saveSettings = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const navigate = (url: string) => window.location.href = url

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', color: '#F1F5F9' }}>
      
      {/* Sidebar */}
      <aside style={{ width: '240px', background: '#111118', borderRight: '1px solid #1F2937', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '32px' }}>
          <div style={{ width: '34px', height: '34px', background: '#16161F', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#00E5FF', fontSize: '17px' }}>N</div>
          <span style={{ fontSize: '19px', fontWeight: 'bold', color: '#FFF' }}>Нова</span>
        </a>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          {[
            { icon: '📊', label: 'Обзор', href: '/dashboard' },
            { icon: '🧩', label: 'Модули', href: '/dashboard/modules' },
            { icon: '✨', label: 'AI-Настройки', href: '/dashboard/ai' },
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
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                {item.label}
              </span>
            )
          })}
        </nav>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '40px 48px', maxWidth: '900px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>Модули</h1>
            <p style={{ color: '#94A3B8', fontSize: '14px' }}>Управляйте функциями бота</p>
          </div>
          <button onClick={saveSettings} style={{
            padding: '10px 22px', background: saved ? '#22C55E' : '#00E5FF', color: '#000',
            border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
            transition: 'all 0.25s'
          }}>
            {saved ? '✅ Сохранено' : '💾 Сохранить'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {modules.map(mod => (
            <div key={mod.id} style={{
              display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px',
              borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s',
              border: '1px solid transparent'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#111118'; e.currentTarget.style.borderColor = '#1F2937'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
            >
              <div style={{ width: '44px', height: '44px', minWidth: '44px', background: mod.enabled ? 'rgba(0,229,255,0.08)' : '#111118', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                {mod.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '2px' }}>
                  {mod.name}
                  {mod.link && <span style={{ color: '#00E5FF', fontSize: '12px', marginLeft: '6px', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); navigate(mod.link!) }}>↗ настройки</span>}
                </div>
                <div style={{ fontSize: '13px', color: '#94A3B8' }}>{mod.desc}</div>
              </div>
              <div onClick={(e) => { e.stopPropagation(); toggle(mod.id); }}>
                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '26px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={mod.enabled} onChange={() => {}} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: mod.enabled ? '#00E5FF' : '#374151', borderRadius: '26px', transition: '0.25s' }}>
                    <span style={{ position: 'absolute', height: '20px', width: '20px', left: mod.enabled ? '22px' : '4px', top: '3px', background: mod.enabled ? '#000' : '#94A3B8', borderRadius: '50%', transition: '0.25s' }} />
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
