"use client"

import { useState } from 'react'

export default function AIPage() {
  const [settings, setSettings] = useState({
    botName: 'Нова', personality: 'friendly', temperature: 0.7, maxLength: 500,
    useEmoji: true, useContext: true, contextMessages: 10,
    systemPrompt: 'Ты — дружелюбный AI-помощник сервера. Отвечай на русском языке.',
    forbiddenTopics: 'политика, религия, NSFW', autoModeration: false, language: 'ru',
    responseStyle: 'detailed', creativityLevel: 0.6, respectRoles: true,
    ignoredRoles: '', allowedChannels: '', cooldownSeconds: 5,
    maxTokensPerUser: 1000, dailyLimit: 50, greetingMessage: '', customInstructions: '',
  })

  const [saved, setSaved] = useState(false)
  const update = (key: string, value: any) => setSettings({ ...settings, [key]: value })
  const toggle = (key: string) => update(key, !settings[key as keyof typeof settings])
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const resetAll = () => {
    setSettings({
      botName: 'Нова', personality: 'friendly', temperature: 0.7, maxLength: 500,
      useEmoji: true, useContext: true, contextMessages: 10,
      systemPrompt: 'Ты — дружелюбный AI-помощник сервера. Отвечай на русском языке.',
      forbiddenTopics: 'политика, религия, NSFW', autoModeration: false, language: 'ru',
      responseStyle: 'detailed', creativityLevel: 0.6, respectRoles: true,
      ignoredRoles: '', allowedChannels: '', cooldownSeconds: 5,
      maxTokensPerUser: 1000, dailyLimit: 50, greetingMessage: '', customInstructions: '',
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', color: '#F1F5F9' }}>
      
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 40px', background: '#111118', borderBottom: '1px solid #1F2937',
        position: 'sticky', top: 0, zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{ width: '32px', height: '32px', background: '#16161F', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#00E5FF', fontSize: '16px' }}>N</div>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFF' }}>Нова</span>
          </a>
          <span style={{ color: '#374151' }}>|</span>
          <a href="/dashboard/modules" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '14px' }}>← Модули</a>
          <span style={{ color: '#374151' }}>/</span>
          <span style={{ color: '#00E5FF', fontSize: '14px', fontWeight: '500' }}>AI-Настройки</span>
        </div>
        <button onClick={save} style={{
          padding: '10px 22px', background: saved ? '#22C55E' : '#00E5FF', color: '#000',
          border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
          transition: 'all 0.25s'
        }}>{saved ? '✅ Сохранено!' : '💾 Сохранить'}</button>
      </header>

      <main style={{ padding: '32px 40px', maxWidth: '1000px', margin: '0 auto' }}>
        
        <h1 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '4px' }}>✨ AI-Настройки</h1>
        <p style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '28px' }}>Тонкая настройка искусственного интеллекта</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* Личность */}
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '14px' }}>🤖 Личность</h3>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Имя</label>
              <input type="text" value={settings.botName} onChange={(e) => update('botName', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Стиль</label>
              <select value={settings.personality} onChange={(e) => update('personality', e.target.value)}
                style={{ width: '100%', padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px', cursor: 'pointer' }}>
                <option value="friendly">😊 Дружественный</option>
                <option value="gaming">🎮 Игровой</option>
                <option value="serious">🤵 Серьёзный</option>
                <option value="funny">😂 Юмористический</option>
              </select>
            </div>
          </div>

          {/* Параметры */}
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '14px' }}>🌡️ Генерация</h3>
            {[
              { label: 'Температура', key: 'temperature', min: 0, max: 1, step: 0.1 },
              { label: 'Длина ответа', key: 'maxLength', min: 100, max: 2000, step: 100 },
            ].map((s, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>{s.label}</span>
                  <span style={{ fontSize: '12px', color: '#00E5FF', fontWeight: '600' }}>{settings[s.key as keyof typeof settings]}</span>
                </div>
                <input type="range" min={s.min} max={s.max} step={s.step} value={settings[s.key as keyof typeof settings] as number}
                  onChange={(e) => update(s.key, parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#00E5FF' }} />
              </div>
            ))}
          </div>

          {/* Контекст */}
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '14px' }}>🧠 Контекст</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px' }}>Запоминать контекст</span>
              <div onClick={() => toggle('useContext')} style={{ width: '38px', height: '22px', background: settings.useContext ? '#00E5FF' : '#374151', borderRadius: '22px', cursor: 'pointer', position: 'relative' }}>
                <div style={{ position: 'absolute', height: '16px', width: '16px', left: settings.useContext ? '20px' : '3px', top: '3px', background: settings.useContext ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} />
              </div>
            </div>
            {settings.useContext && (
              <input type="number" value={settings.contextMessages} onChange={(e) => update('contextMessages', parseInt(e.target.value) || 10)}
                style={{ width: '100%', padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }} />
            )}
          </div>

          {/* Квоты */}
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '14px' }}>📋 Квоты</h3>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Кулдаун (сек)</label>
              <input type="number" value={settings.cooldownSeconds} onChange={(e) => update('cooldownSeconds', parseInt(e.target.value) || 5)}
                style={{ width: '100%', padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Дневной лимит</label>
              <input type="number" value={settings.dailyLimit} onChange={(e) => update('dailyLimit', parseInt(e.target.value) || 50)}
                style={{ width: '100%', padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Промпт (на всю ширину) */}
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', border: '1px solid #1F2937', gridColumn: '1 / 3' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>📝 Системный промпт</h3>
            <textarea value={settings.systemPrompt} onChange={(e) => update('systemPrompt', e.target.value)} rows={3}
              style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace' }} />
          </div>
        </div>

        {/* Нижние кнопки */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
          <button onClick={() => window.location.href = '/dashboard/modules'} style={{
            padding: '10px 20px', background: 'transparent', color: '#94A3B8',
            border: '1px solid #1F2937', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px'
          }}>← Назад</button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={resetAll} style={{ padding: '10px 18px', background: 'transparent', color: '#EF4444', border: '1px solid #374151', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>🔄 Сбросить</button>
            <button onClick={save} style={{ padding: '10px 24px', background: saved ? '#22C55E' : '#00E5FF', color: '#000', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px', transition: 'all 0.3s', boxShadow: saved ? '0 0 15px rgba(34,197,94,0.3)' : 'none' }}>{saved ? '✅ Сохранено!' : '💾 Сохранить'}</button>
          </div>
        </div>

        {saved && (
          <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#22C55E', color: '#000', padding: '10px 20px', borderRadius: '12px', fontWeight: '600', fontSize: '13px', zIndex: 1000, boxShadow: '0 4px 20px rgba(34,197,94,0.3)', animation: 'slideUp 0.3s ease' }}>✅ Настройки AI сохранены</div>
        )}
        <style>{`@keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      </main>
    </div>
  )
}
