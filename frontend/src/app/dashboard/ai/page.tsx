"use client"

import { useState } from 'react'

export default function AIPage() {
  const [settings, setSettings] = useState({
    botName: 'Нова',
    personality: 'friendly',
    temperature: 0.7,
    maxLength: 500,
    useEmoji: true,
    systemPrompt: 'Ты — дружелюбный AI-помощник сервера. Отвечай на русском языке.'
  })

  const [saved, setSaved] = useState(false)
  const navigate = (url: string) => window.location.href = url

  const saveSettings = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

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
            const isActive = item.label === 'AI-Настройки'
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
      <main style={{ flex: 1, padding: '40px 48px', maxWidth: '700px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>AI-Настройки</h1>
            <p style={{ color: '#94A3B8', fontSize: '14px' }}>Настройте поведение искусственного интеллекта</p>
          </div>
          <button onClick={saveSettings} style={{
            padding: '10px 22px', background: saved ? '#22C55E' : '#00E5FF', color: '#000',
            border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
            transition: 'all 0.25s'
          }}>
            {saved ? '✅ Сохранено' : '💾 Сохранить'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Имя бота */}
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px 24px', border: '1px solid #1F2937' }}>
            <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '8px' }}>Имя бота</label>
            <input type="text" value={settings.botName} onChange={(e) => setSettings({...settings, botName: e.target.value})}
              style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* Стиль */}
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px 24px', border: '1px solid #1F2937' }}>
            <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '8px' }}>Стиль общения</label>
            <select value={settings.personality} onChange={(e) => setSettings({...settings, personality: e.target.value})}
              style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '15px', outline: 'none', cursor: 'pointer' }}>
              <option value="friendly">Дружественный</option>
              <option value="gaming">Игровой</option>
              <option value="serious">Серьёзный</option>
              <option value="funny">Юмористический</option>
            </select>
          </div>

          {/* Температура */}
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px 24px', border: '1px solid #1F2937' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#94A3B8' }}>Температура (креативность)</span>
              <span style={{ color: '#00E5FF', fontWeight: '600', fontSize: '14px' }}>{settings.temperature}</span>
            </div>
            <input type="range" min="0" max="1" step="0.1" value={settings.temperature}
              onChange={(e) => setSettings({...settings, temperature: parseFloat(e.target.value)})}
              style={{ width: '100%', accentColor: '#00E5FF' }} />
          </div>

          {/* Длина */}
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px 24px', border: '1px solid #1F2937' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: '#94A3B8' }}>Макс. длина ответа</span>
              <span style={{ color: '#00E5FF', fontWeight: '600', fontSize: '14px' }}>{settings.maxLength}</span>
            </div>
            <input type="range" min="100" max="2000" step="100" value={settings.maxLength}
              onChange={(e) => setSettings({...settings, maxLength: parseInt(e.target.value)})}
              style={{ width: '100%', accentColor: '#00E5FF' }} />
          </div>

          {/* Системный промпт */}
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px 24px', border: '1px solid #1F2937' }}>
            <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '8px' }}>Системный промпт</label>
            <textarea value={settings.systemPrompt} onChange={(e) => setSettings({...settings, systemPrompt: e.target.value})}
              rows={3}
              style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace' }} />
          </div>

          {/* Эмодзи */}
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px 24px', border: '1px solid #1F2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '15px' }}>Использовать эмодзи</span>
            <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '26px', cursor: 'pointer' }}>
              <input type="checkbox" checked={settings.useEmoji} onChange={(e) => setSettings({...settings, useEmoji: e.target.checked})} style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: settings.useEmoji ? '#00E5FF' : '#374151', borderRadius: '26px', transition: '0.25s' }}>
                <span style={{ position: 'absolute', height: '20px', width: '20px', left: settings.useEmoji ? '22px' : '4px', top: '3px', background: settings.useEmoji ? '#000' : '#94A3B8', borderRadius: '50%', transition: '0.25s' }} />
              </span>
            </label>
          </div>
        </div>
      </main>
    </div>
  )
}
