"use client"

import { useState } from 'react'

export default function AIPage() {
  const [settings, setSettings] = useState({
    botName: 'Нова',
    personality: 'friendly',
    temperature: 0.7,
    maxLength: 500,
    useEmoji: true,
    systemPrompt: 'Ты — дружелюбный AI-помощник сервера. Отвечай на русском языке, помогай участникам с вопросами.'
  })

  const navigate = (url: string) => {
    window.location.href = url
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
            { icon: '📊', label: 'Обзор', href: '/dashboard' },
            { icon: '🖥️', label: 'Мои серверы', href: '/dashboard' },
            { icon: '🧩', label: 'Модули', href: '/dashboard/modules' },
            { icon: '✨', label: 'AI-Настройки', href: '/dashboard/ai' },
            { icon: '⚡', label: 'Команды', href: '/dashboard/commands' },
          ].map((item, i) => {
            const isActive = item.label === 'AI-Настройки'
            return (
              <span key={i} onClick={() => navigate(item.href)} style={{
                padding: '12px 16px', borderRadius: '12px', display: 'flex',
                alignItems: 'center', gap: '12px', fontSize: '15px', cursor: 'pointer',
                fontWeight: isActive ? '600' : '400',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                background: isActive ? '#1F2937' : 'transparent',
                transition: 'all 0.2s'
              }}>
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                {item.label}
              </span>
            )
          })}
        </nav>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '40px', overflow: 'auto', maxWidth: '900px' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '8px' }}>AI-Настройки Нова</h1>
          <p style={{ color: '#94A3B8', fontSize: '15px' }}>Сервер: TestServer • Текущая модель: nova-core-v1</p>
        </div>

        {/* Личность бота */}
        <div style={{ background: '#16161F', borderRadius: '20px', padding: '30px', marginBottom: '20px', border: '1px solid #1F2937' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#FFFFFF', marginBottom: '24px' }}>🤖 Личность бота</h2>
          
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div style={{ width: '64px', height: '64px', background: '#111118', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', fontWeight: 'bold', color: '#00E5FF', boxShadow: '0 0 15px rgba(0, 229, 255, 0.15)' }}>N</div>
            <div style={{ flex: 1 }}>
              <label style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '6px', display: 'block' }}>Имя бота</label>
              <input type="text" value={settings.botName} onChange={(e) => setSettings({...settings, botName: e.target.value})}
                style={{ width: '100%', padding: '12px 16px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '12px', color: '#FFFFFF', fontSize: '15px', outline: 'none' }} />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '6px', display: 'block' }}>Стиль общения</label>
            <select value={settings.personality} onChange={(e) => setSettings({...settings, personality: e.target.value})}
              style={{ width: '100%', padding: '12px 16px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '12px', color: '#FFFFFF', fontSize: '15px', outline: 'none', cursor: 'pointer' }}>
              <option value="friendly">Дружественный и полезный</option>
              <option value="gaming">Игровой / мемный</option>
              <option value="serious">Серьёзный помощник</option>
              <option value="funny">Юмористический</option>
            </select>
          </div>
        </div>

        {/* Параметры */}
        <div style={{ background: '#16161F', borderRadius: '20px', padding: '30px', marginBottom: '20px', border: '1px solid #1F2937' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#FFFFFF', marginBottom: '24px' }}>🌡️ Параметры генерации</h2>
          
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#94A3B8', fontSize: '14px' }}>Температура (креативность)</span>
              <span style={{ color: '#00E5FF', fontSize: '14px', fontWeight: '600' }}>{settings.temperature}</span>
            </div>
            <input type="range" min="0" max="1" step="0.1" value={settings.temperature}
              onChange={(e) => setSettings({...settings, temperature: parseFloat(e.target.value)})}
              style={{ width: '100%', accentColor: '#00E5FF', height: '6px', cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ color: '#64748B', fontSize: '12px' }}>Точный</span>
              <span style={{ color: '#64748B', fontSize: '12px' }}>Креативный</span>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#94A3B8', fontSize: '14px' }}>Максимальная длина ответа</span>
              <span style={{ color: '#00E5FF', fontSize: '14px', fontWeight: '600' }}>{settings.maxLength}</span>
            </div>
            <input type="range" min="100" max="2000" step="100" value={settings.maxLength}
              onChange={(e) => setSettings({...settings, maxLength: parseInt(e.target.value)})}
              style={{ width: '100%', accentColor: '#00E5FF', height: '6px', cursor: 'pointer' }} />
          </div>
        </div>

        {/* Системный промпт */}
        <div style={{ background: '#16161F', borderRadius: '20px', padding: '30px', marginBottom: '20px', border: '1px solid #1F2937' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#FFFFFF', marginBottom: '16px' }}>💬 Системный промпт</h2>
          <p style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '12px' }}>Инструкции, которые определяют поведение AI</p>
          <textarea value={settings.systemPrompt}
            onChange={(e) => setSettings({...settings, systemPrompt: e.target.value})}
            style={{ width: '100%', height: '120px', padding: '16px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '12px', color: '#FFFFFF', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'monospace', lineHeight: '1.6' }} />
        </div>

        {/* Дополнительно */}
        <div style={{ background: '#16161F', borderRadius: '20px', padding: '30px', marginBottom: '20px', border: '1px solid #1F2937' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#FFFFFF', marginBottom: '20px' }}>⚙️ Дополнительно</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ color: '#FFFFFF', fontSize: '15px' }}>Использовать эмодзи</span>
            <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer' }}>
              <input type="checkbox" checked={settings.useEmoji} onChange={(e) => setSettings({...settings, useEmoji: e.target.checked})} style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: settings.useEmoji ? '#00E5FF' : '#374151', borderRadius: '26px', transition: '0.3s' }}>
                <span style={{ position: 'absolute', height: '20px', width: '20px', left: settings.useEmoji ? '26px' : '3px', bottom: '3px', background: '#FFFFFF', borderRadius: '50%', transition: '0.3s' }} />
              </span>
            </label>
          </div>
        </div>

        {/* Кнопки */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px' }}>
          <button style={{ padding: '14px 28px', background: 'transparent', color: '#94A3B8', border: '1px solid #1F2937', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '15px' }}>
            Сбросить
          </button>
          <button style={{ padding: '14px 32px', background: '#00E5FF', color: '#000000', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '15px', boxShadow: '0 0 15px rgba(0, 229, 255, 0.2)' }}>
            Сохранить изменения
          </button>
        </div>
      </main>
    </div>
  )
}
