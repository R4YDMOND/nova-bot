"use client"

import { useState } from 'react'

interface Module {
  name: string
  icon: string
  desc: string
  enabled: boolean
}

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([
    { name: 'Модерация', icon: '🛡️', desc: 'Антиспам, антимат, антирейд. Безопасность 24/7.', enabled: true },
    { name: 'Система уровней', icon: '📊', desc: 'Награждайте участников опытом за активность.', enabled: true },
    { name: 'AI-помощник', icon: '🤖', desc: 'Умные ответы и поддержка разговоров.', enabled: false },
    { name: 'Музыка', icon: '🎵', desc: 'Воспроизведение музыки в голосовых каналах.', enabled: false },
    { name: 'Кастомные команды', icon: '⚡', desc: 'Создавайте свои команды без кода.', enabled: true },
    { name: 'Аналитика', icon: '📈', desc: 'Отслеживайте рост и активность.', enabled: false },
  ])

  const toggleModule = (index: number) => {
    const newModules = [...modules]
    newModules[index].enabled = !newModules[index].enabled
    setModules(newModules)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex' }}>
      
      {/* Sidebar */}
      <aside style={{
        width: '260px', background: '#111118', borderRight: '1px solid #1F2937',
        padding: '30px 20px', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <div style={{ width: '40px', height: '40px', background: '#16161F', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#00E5FF', fontSize: '20px' }}>N</div>
          <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#FFFFFF' }}>Нова</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {[
            { icon: '📊', label: 'Обзор', href: '/dashboard?refresh', active: false },
            { icon: '🖥️', label: 'Мои серверы', href: '/dashboard?refresh', active: false },
            { icon: '🧩', label: 'Модули', href: '/dashboard/modules', active: true },
            { icon: '✨', label: 'AI-Настройки', href: '/dashboard/ai', active: false },
            { icon: '⚡', label: 'Команды', href: '/dashboard/commands', active: false },
          <span key={i} onClick={() => window.location.href = item.href} style={{
              padding: '12px 16px', borderRadius: '12px', display: 'flex',
              alignItems: 'center', gap: '12px', fontSize: '15px',
              fontWeight: item.active ? '600' : '400',
              color: item.active ? '#FFFFFF' : '#94A3B8',
              background: item.active ? '#1F2937' : 'transparent',
              textDecoration: 'none', transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => { if (!item.active) e.currentTarget.style.background = '#1A1A24' }}
            onMouseLeave={(e) => { if (!item.active) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {item.label}
            </span>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '40px', overflow: 'auto' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '8px' }}>Модули Нова</h1>
          <p style={{ color: '#94A3B8', fontSize: '15px' }}>Сервер: TestServer • 🟢 Активен</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '30px', flexWrap: 'wrap' }}>
          {['Все модули', 'Основные', 'Развлечения', 'AI', 'Модерация'].map((tab, i) => (
            <button key={i} style={{
              padding: '8px 20px', borderRadius: '10px', border: '1px solid #1F2937',
              background: i === 0 ? '#1F2937' : 'transparent',
              color: i === 0 ? '#FFFFFF' : '#94A3B8',
              cursor: 'pointer', fontSize: '14px', fontWeight: '500'
            }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Modules Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {modules.map((mod, i) => (
            <div key={i} style={{
              background: '#16161F', borderRadius: '16px', padding: '24px',
              border: mod.enabled ? '1px solid rgba(0, 229, 255, 0.2)' : '1px solid #1F2937',
              transition: 'all 0.2s',
              boxShadow: mod.enabled ? '0 0 15px rgba(0, 229, 255, 0.05)' : 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', background: mod.enabled ? 'rgba(0, 229, 255, 0.1)' : '#0A0A0F', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                  {mod.icon}
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={mod.enabled} onChange={() => toggleModule(i)} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: mod.enabled ? '#00E5FF' : '#374151',
                    borderRadius: '26px', transition: '0.3s'
                  }}>
                    <span style={{
                      position: 'absolute', height: '20px', width: '20px',
                      left: mod.enabled ? '26px' : '3px', bottom: '3px',
                      background: '#FFFFFF', borderRadius: '50%', transition: '0.3s'
                    }} />
                  </span>
                </label>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', marginBottom: '8px' }}>{mod.name}</h3>
              <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: '1.5', marginBottom: '16px' }}>{mod.desc}</p>

              <button style={{
                padding: '8px 18px', borderRadius: '8px', border: '1px solid #1F2937',
                background: 'transparent', color: '#00E5FF', cursor: 'pointer',
                fontSize: '13px', fontWeight: '500'
              }}>
                Настроить →
              </button>
            </div>
          ))}
        </div>

        {/* Save button */}
        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{
            padding: '14px 32px', background: '#00E5FF', color: '#000000',
            border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer',
            fontSize: '15px', boxShadow: '0 0 15px rgba(0, 229, 255, 0.2)'
          }}>
            Сохранить изменения
          </button>
        </div>
      </main>
    </div>
  )
}
