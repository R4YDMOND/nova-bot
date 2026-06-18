"use client"

import { useState } from 'react'

interface Module {
  id: string
  name: string
  icon: string
  desc: string
  enabled: boolean
  link?: string
}

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([
    { id: 'moderation', name: 'Модерация', icon: '🛡️', desc: 'Фильтрация спама, мата, защита от рейдов', enabled: true },
    { id: 'levels', name: 'Система уровней', icon: '📊', desc: 'Опыт за активность, награды, лидерборд', enabled: true, link: '/dashboard/ranking' },
    { id: 'ai', name: 'AI-помощник', icon: '🤖', desc: 'Умные ответы, генерация контента', enabled: false, link: '/dashboard/ai' },
    { id: 'music', name: 'Музыка', icon: '🎵', desc: 'Воспроизведение треков в голосовых каналах', enabled: false },
    { id: 'commands', name: 'Команды', icon: '⚡', desc: 'Кастомные команды и автопостинг', enabled: true, link: '/dashboard/commands' },
    { id: 'analytics', name: 'Аналитика', icon: '📈', desc: 'Статистика, отчёты, графики активности', enabled: false },
    { id: 'greetings', name: 'Приветствия', icon: '👋', desc: 'Приветствие новых участников', enabled: true },
    { id: 'roles', name: 'Автороли', icon: '🏷️', desc: 'Автоматическая выдача ролей', enabled: false },
    { id: 'logs', name: 'Логирование', icon: '📜', desc: 'Журнал действий сервера', enabled: true },
  ])

  const [saved, setSaved] = useState(false)
  const [filter, setFilter] = useState('all')

  const toggleModule = (id: string) => {
    setModules(modules.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m))
  }

  const handleModuleClick = (mod: Module) => {
    if (mod.link) {
      window.location.href = mod.link
      return
    }
    toggleModule(mod.id)
  }

  const saveSettings = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const filtered = filter === 'all' ? modules : filter === 'enabled' ? modules.filter(m => m.enabled) : modules.filter(m => !m.enabled)

  const navigate = (url: string) => window.location.href = url

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', color: '#F1F5F9', display: 'flex' }}>
      
      {/* ===== SIDEBAR ===== */}
      <aside style={{
        width: '240px', background: '#0E0E14', borderRight: '1px solid #1A1A24',
        padding: '24px 16px', display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh'
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '32px', padding: '0 8px' }}>
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
                padding: '10px 12px', borderRadius: '8px', display: 'flex',
                alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer',
                fontWeight: isActive ? '500' : '400',
                color: isActive ? '#FFF' : '#8B8B9E',
                background: isActive ? '#1A1A24' : 'transparent',
                transition: 'all 0.15s'
              }}>
                <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </span>
            )
          })}
        </nav>

        <div style={{ borderTop: '1px solid #1A1A24', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {['📖 Документация', '🛟 Поддержка'].map((item, i) => (
            <span key={i} style={{ padding: '10px 12px', borderRadius: '8px', fontSize: '14px', color: '#8B8B9E', cursor: 'pointer' }}>{item}</span>
          ))}
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <main style={{ flex: 1, padding: '40px 48px', maxWidth: '1000px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px', letterSpacing: '-0.3px' }}>Модули</h1>
            <p style={{ color: '#8B8B9E', fontSize: '14px' }}>Управляйте функциями бота на сервере</p>
          </div>
          <button onClick={saveSettings} style={{
            padding: '10px 22px', background: saved ? '#22C55E' : '#00E5FF',
            color: '#000', border: 'none', borderRadius: '10px',
            fontWeight: '600', fontSize: '14px', cursor: 'pointer',
            transition: 'all 0.25s', boxShadow: saved ? '0 0 16px rgba(34,197,94,0.3)' : 'none'
          }}>
            {saved ? '✅ Сохранено' : 'Сохранить'}
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
          {[
            { id: 'all', label: 'Все' },
            { id: 'enabled', label: 'Активные' },
            { id: 'disabled', label: 'Отключены' },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: '7px 16px', borderRadius: '20px', border: '1px solid #1F2937',
              background: filter === f.id ? '#1F2937' : 'transparent',
              color: filter === f.id ? '#FFF' : '#8B8B9E',
              cursor: 'pointer', fontSize: '13px', fontWeight: '500',
              transition: 'all 0.15s'
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Modules List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {filtered.map((mod) => (
            <div key={mod.id}
              onClick={() => handleModuleClick(mod)}
              style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '16px 20px', borderRadius: '12px',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#111118'
                e.currentTarget.style.borderColor = '#1A1A24'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = 'transparent'
              }}
            >
              {/* Icon */}
              <div style={{
                width: '44px', height: '44px', minWidth: '44px',
                background: mod.enabled ? 'rgba(0,229,255,0.08)' : '#0E0E14',
                borderRadius: '12px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '22px',
                transition: 'all 0.15s'
              }}>
                {mod.icon}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '2px' }}>
                  {mod.name}
                  {mod.link && <span style={{ color: '#8B8B9E', fontSize: '12px', marginLeft: '8px' }}>↗</span>}
                </div>
                <div style={{ fontSize: '13px', color: '#8B8B9E', lineHeight: '1.4' }}>{mod.desc}</div>
              </div>

              {/* Toggle */}
              <div onClick={(e) => { e.stopPropagation(); toggleModule(mod.id); }} style={{ cursor: 'pointer' }}>
                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '26px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={mod.enabled} onChange={() => {}} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: mod.enabled ? '#00E5FF' : '#2A2A36',
                    borderRadius: '26px', transition: 'all 0.25s ease'
                  }}>
                    <span style={{
                      position: 'absolute', height: '20px', width: '20px',
                      left: mod.enabled ? '22px' : '4px', top: '3px',
                      background: mod.enabled ? '#000' : '#8B8B9E',
                      borderRadius: '50%', transition: 'all 0.25s ease'
                    }} />
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#8B8B9E' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
            <p>Нет модулей в этой категории</p>
          </div>
        )}

      </main>

      {/* ===== TOAST ===== */}
      {saved && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          background: '#22C55E', color: '#000', padding: '12px 24px',
          borderRadius: '12px', fontWeight: '600', fontSize: '14px',
          zIndex: 1000, animation: 'slideUp 0.3s ease',
          boxShadow: '0 4px 20px rgba(34,197,94,0.3)'
        }}>
          ✅ Настройки сохранены
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
