"use client"

import { useState } from 'react'

const navigate = (url: string) => window.location.href = url

const SIDEBAR_ITEMS = [
  { icon: '📊', label: 'Обзор', href: '/dashboard' },
  { icon: '🖥️', label: 'Мои серверы', href: '/dashboard' },
  { icon: '🧩', label: 'Модули', href: '/dashboard/modules' },
  { icon: '✨', label: 'AI-Настройки', href: '/dashboard/ai' },
  { icon: '⚡', label: 'Команды', href: '/dashboard/commands' },
]

export default function AIPage() {
  const [settings, setSettings] = useState({
    botName: 'Нова',
    personality: 'friendly',
    temperature: 0.7,
    maxLength: 500,
    useEmoji: true,
    useContext: true,
    contextMessages: 10,
    systemPrompt: 'Ты — дружелюбный AI-помощник сервера. Отвечай на русском языке.',
    forbiddenTopics: '',
    autoModeration: false,
    language: 'ru',
  })

  const [saved, setSaved] = useState(false)

  const update = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value })
  }

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', color: '#F1F5F9' }}>
      
      <aside style={{ width: '240px', minWidth: '240px', background: '#111118', borderRight: '1px solid #1F2937', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '32px' }}>
          <div style={{ width: '34px', height: '34px', background: '#16161F', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#00E5FF', fontSize: '17px' }}>N</div>
          <span style={{ fontSize: '19px', fontWeight: 'bold', color: '#FFF' }}>Нова</span>
        </a>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          {SIDEBAR_ITEMS.map((item, i) => {
            const isActive = item.label === 'AI-Настройки'
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

      <main style={{ flex: 1, padding: '40px 48px', overflow: 'auto', maxWidth: '800px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>AI-Настройки</h1>
            <p style={{ color: '#94A3B8', fontSize: '14px' }}>Тонкая настройка искусственного интеллекта</p>
          </div>
          <button onClick={save} style={{
            padding: '10px 22px', background: saved ? '#22C55E' : '#00E5FF', color: '#000',
            border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
            transition: 'all 0.25s'
          }}>{saved ? '✅ Сохранено' : '💾 Сохранить'}</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Личность */}
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px 24px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>🤖 Личность бота</h3>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Имя бота</label>
                <input type="text" value={settings.botName} onChange={(e) => update('botName', e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Стиль общения</label>
                <select value={settings.personality} onChange={(e) => update('personality', e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', cursor: 'pointer' }}>
                  <option value="friendly">Дружественный</option>
                  <option value="gaming">Игровой</option>
                  <option value="serious">Серьёзный</option>
                  <option value="funny">Юмористический</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Язык</label>
                <select value={settings.language} onChange={(e) => update('language', e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', cursor: 'pointer' }}>
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                  <option value="auto">Авто</option>
                </select>
              </div>
            </div>
          </div>

          {/* Параметры генерации */}
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px 24px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>🌡️ Параметры генерации</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#94A3B8' }}>Температура (креативность)</span>
                <span style={{ color: '#00E5FF', fontWeight: '600', fontSize: '14px' }}>{settings.temperature}</span>
              </div>
              <input type="range" min="0" max="1" step="0.1" value={settings.temperature}
                onChange={(e) => update('temperature', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#00E5FF' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '11px', color: '#64748B' }}>Точный</span>
                <span style={{ fontSize: '11px', color: '#64748B' }}>Креативный</span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#94A3B8' }}>Макс. длина ответа</span>
                <span style={{ color: '#00E5FF', fontWeight: '600', fontSize: '14px' }}>{settings.maxLength}</span>
              </div>
              <input type="range" min="100" max="2000" step="100" value={settings.maxLength}
                onChange={(e) => update('maxLength', parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#00E5FF' }} />
            </div>
          </div>

          {/* Контекст */}
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px 24px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>🧠 Контекст</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px' }}>Запоминать контекст</span>
              <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '26px', cursor: 'pointer' }}>
                <input type="checkbox" checked={settings.useContext} onChange={(e) => update('useContext', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: settings.useContext ? '#00E5FF' : '#374151', borderRadius: '26px', transition: '0.25s' }}>
                  <span style={{ position: 'absolute', height: '20px', width: '20px', left: settings.useContext ? '22px' : '4px', top: '3px', background: settings.useContext ? '#000' : '#94A3B8', borderRadius: '50%', transition: '0.25s' }} />
                </span>
              </label>
            </div>
            {settings.useContext && (
              <div>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Количество сообщений для контекста</label>
                <input type="number" value={settings.contextMessages} onChange={(e) => update('contextMessages', parseInt(e.target.value) || 10)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            )}
          </div>

          {/* Промпт и ограничения */}
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px 24px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>📝 Системный промпт</h3>
            <textarea value={settings.systemPrompt} onChange={(e) => update('systemPrompt', e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace', marginBottom: '12px' }} />
            
            <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Запрещённые темы (через запятую)</label>
            <input type="text" value={settings.forbiddenTopics} onChange={(e) => update('forbiddenTopics', e.target.value)}
              placeholder="политика, религия, спойлеры"
              style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* Дополнительно */}
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px 24px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>⚙️ Дополнительно</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px' }}>Использовать эмодзи</span>
              <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '26px', cursor: 'pointer' }}>
                <input type="checkbox" checked={settings.useEmoji} onChange={(e) => update('useEmoji', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: settings.useEmoji ? '#00E5FF' : '#374151', borderRadius: '26px', transition: '0.25s' }}>
                  <span style={{ position: 'absolute', height: '20px', width: '20px', left: settings.useEmoji ? '22px' : '4px', top: '3px', background: settings.useEmoji ? '#000' : '#94A3B8', borderRadius: '50%', transition: '0.25s' }} />
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px' }}>Автомодерация AI-ответов</span>
              <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '26px', cursor: 'pointer' }}>
                <input type="checkbox" checked={settings.autoModeration} onChange={(e) => update('autoModeration', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: settings.autoModeration ? '#00E5FF' : '#374151', borderRadius: '26px', transition: '0.25s' }}>
                  <span style={{ position: 'absolute', height: '20px', width: '20px', left: settings.autoModeration ? '22px' : '4px', top: '3px', background: settings.autoModeration ? '#000' : '#94A3B8', borderRadius: '50%', transition: '0.25s' }} />
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Toast */}
        {saved && (
          <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#22C55E', color: '#000', padding: '12px 24px', borderRadius: '12px', fontWeight: '600', fontSize: '14px', zIndex: 1000, boxShadow: '0 4px 20px rgba(34,197,94,0.3)', animation: 'slideUp 0.3s ease' }}>
            ✅ Настройки сохранены
          </div>
        )}
        <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      </main>
    </div>
  )
}
