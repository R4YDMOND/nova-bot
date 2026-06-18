"use client"

import { useState } from 'react'

const navigate = (url: string) => window.location.href = url

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState([
    { id: '1', platform: 'Lolka', url: 'https://lolka.app/api/webhooks/xxx', channel: '#общий', events: ['messages', 'members'], active: true, lastSent: '2 мин назад' },
    { id: '2', platform: 'VK', url: 'https://vk.com/callback/xxx', channel: '#новости', events: ['wall', 'messages'], active: true, lastSent: '10 мин назад' },
  ])

  const [saved, setSaved] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newWebhook, setNewWebhook] = useState({ platform: 'Lolka', url: '', channel: '', events: 'messages' })

  const toggle = (id: string) => {
    setWebhooks(webhooks.map(w => w.id === id ? { ...w, active: !w.active } : w))
  }

  const deleteWebhook = (id: string) => {
    setWebhooks(webhooks.filter(w => w.id !== id))
  }

  const addWebhook = () => {
    if (!newWebhook.url || !newWebhook.channel) return
    setWebhooks([...webhooks, {
      id: Date.now().toString(),
      platform: newWebhook.platform,
      url: newWebhook.url,
      channel: newWebhook.channel,
      events: newWebhook.events.split(',').map(e => e.trim()),
      active: true,
      lastSent: 'Только что'
    }])
    setNewWebhook({ platform: 'Lolka', url: '', channel: '', events: 'messages' })
    setShowAdd(false)
  }

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const testWebhook = (url: string) => {
    fetch('https://nova-bot-rpsy.onrender.com/api/webhook/lolka', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '/ping', author: { username: 'Тест' }, webhook_url: url })
    })
    .then(() => alert('✅ Тестовый запрос отправлен!'))
    .catch(() => alert('❌ Ошибка отправки'))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', color: '#F1F5F9' }}>
      
      {/* Sidebar */}
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
            { icon: '🔗', label: 'Вебхуки', href: '/dashboard/webhooks' },
          ].map((item, i) => {
            const isActive = item.label === 'Вебхуки'
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

      {/* Main */}
      <main style={{ flex: 1, padding: '32px 40px', overflow: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '2px' }}>🔗 Вебхуки</h1>
            <p style={{ color: '#94A3B8', fontSize: '13px' }}>Управляйте интеграциями с Lolka и VK</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowAdd(!showAdd)} style={{
              padding: '10px 20px', background: showAdd ? '#1F2937' : '#00E5FF', color: showAdd ? '#FFF' : '#000',
              border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
              transition: 'all 0.2s'
            }}>{showAdd ? '✕ Отмена' : '+ Добавить вебхук'}</button>
            <button onClick={save} style={{
              padding: '10px 22px', background: saved ? '#22C55E' : '#1F2937', color: saved ? '#000' : '#FFF',
              border: '1px solid #374151', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
              transition: 'all 0.25s'
            }}>{saved ? '✅ Сохранено' : '💾 Сохранить'}</button>
          </div>
        </div>

        {/* Add Form */}
        {showAdd && (
          <div style={{
            background: '#16161F', borderRadius: '14px', padding: '20px', marginBottom: '20px',
            border: '1px solid #1F2937', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px'
          }}>
            <select value={newWebhook.platform} onChange={(e) => setNewWebhook({ ...newWebhook, platform: e.target.value })}
              style={{ padding: '10px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px' }}>
              <option value="Lolka">🎮 Lolka</option>
              <option value="VK">💙 VK</option>
            </select>
            <input type="text" value={newWebhook.url} onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
              placeholder="URL вебхука" style={{ padding: '10px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px' }} />
            <input type="text" value={newWebhook.channel} onChange={(e) => setNewWebhook({ ...newWebhook, channel: e.target.value })}
              placeholder="#канал" style={{ padding: '10px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px' }} />
            <button onClick={addWebhook} style={{
              padding: '10px', background: '#00E5FF', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px'
            }}>✅ Добавить</button>
          </div>
        )}

        {/* Webhooks List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {webhooks.map(w => (
            <div key={w.id} style={{
              background: '#16161F', borderRadius: '14px', padding: '18px 20px',
              border: '1px solid #1F2937', transition: 'all 0.2s',
              opacity: w.active ? 1 : 0.5
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00E5FF20'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1F2937'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                {/* Platform */}
                <span style={{
                  padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                  background: w.platform === 'Lolka' ? 'rgba(88,101,242,0.15)' : 'rgba(0,119,255,0.15)',
                  color: w.platform === 'Lolka' ? '#5865F2' : '#0077FF'
                }}>
                  {w.platform === 'Lolka' ? '🎮 Lolka' : '💙 VK'}
                </span>

                {/* URL */}
                <code style={{
                  flex: 1, minWidth: '200px', padding: '6px 12px', background: '#0A0A0F',
                  borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace', color: '#94A3B8',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  {w.url}
                </code>

                {/* Channel */}
                <span style={{ fontSize: '13px', color: '#94A3B8' }}>{w.channel}</span>

                {/* Last sent */}
                <span style={{ fontSize: '11px', color: '#64748B' }}>↗ {w.lastSent}</span>

                {/* Toggle */}
                <div onClick={() => toggle(w.id)} style={{
                  width: '38px', height: '22px', background: w.active ? '#00E5FF' : '#374151',
                  borderRadius: '22px', cursor: 'pointer', transition: 'all 0.25s ease',
                  position: 'relative', flexShrink: 0
                }}>
                  <div style={{
                    position: 'absolute', height: '16px', width: '16px',
                    left: w.active ? '20px' : '3px', top: '3px',
                    background: w.active ? '#000' : '#FFF',
                    borderRadius: '50%', transition: 'all 0.25s ease'
                  }} />
                </div>

                {/* Actions */}
                <button onClick={() => testWebhook(w.url)} style={{
                  padding: '6px 12px', background: 'transparent', color: '#00E5FF',
                  border: '1px solid #1F2937', borderRadius: '8px', cursor: 'pointer', fontSize: '11px'
                }}>🧪 Тест</button>
                <button onClick={() => deleteWebhook(w.id)} style={{
                  padding: '6px 10px', background: 'transparent', color: '#EF4444',
                  border: '1px solid #374151', borderRadius: '8px', cursor: 'pointer', fontSize: '11px'
                }}>✕</button>
              </div>
            </div>
          ))}
        </div>

        {/* Инструкция */}
        <div style={{
          background: '#16161F', borderRadius: '14px', padding: '20px', marginTop: '24px',
          border: '1px solid #1F2937'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>📖 Как подключить вебхуки</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: '#111118', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>🎮 Lolka</div>
              <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.5' }}>
                1. Зайдите в настройки сервера<br/>
                2. Создайте вебхук в нужном канале<br/>
                3. Скопируйте URL и вставьте сюда<br/>
                4. Бот начнёт получать сообщения
              </p>
            </div>
            <div style={{ background: '#111118', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>💙 VK</div>
              <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.5' }}>
                1. Создайте Callback API в настройках группы<br/>
                2. Укажите URL: <code style={{ color: '#00E5FF', fontSize: '11px' }}>nova-bot-rpsy.onrender.com/api/webhook/vk</code><br/>
                3. Подтвердите сервер<br/>
                4. Бот начнёт получать события
              </p>
            </div>
          </div>
        </div>

        {saved && (
          <div style={{
            position: 'fixed', bottom: '24px', right: '24px', background: '#22C55E', color: '#000',
            padding: '10px 20px', borderRadius: '12px', fontWeight: '600', fontSize: '13px',
            zIndex: 1000, boxShadow: '0 4px 20px rgba(34,197,94,0.3)', animation: 'slideUp 0.3s ease'
          }}>✅ Настройки вебхуков сохранены</div>
        )}
        <style>{`@keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      </main>
    </div>
  )
}
