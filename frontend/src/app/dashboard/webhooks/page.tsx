"use client"

import { useState } from 'react'

const navigate = (url: string) => window.location.href = url

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState([
    { id: '1', platform: 'Lolka', url: 'https://lolka.app/api/webhooks/xxx', channel: '#общий', active: true },
    { id: '2', platform: 'VK', url: 'https://vk.com/callback/xxx', channel: '#новости', groupId: '123456', active: true },
  ])

  const [saved, setSaved] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [newWebhook, setNewWebhook] = useState({ platform: 'Lolka', url: '', channel: '', groupId: '' })
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcastPlatforms, setBroadcastPlatforms] = useState<string[]>(['lolka', 'vk'])
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState('')

  const toggle = (id: string) => setWebhooks(webhooks.map(w => w.id === id ? { ...w, active: !w.active } : w))
  const deleteWebhook = (id: string) => setWebhooks(webhooks.filter(w => w.id !== id))

  const addWebhook = () => {
    if (!newWebhook.url || !newWebhook.channel) return
    setWebhooks([...webhooks, {
      id: Date.now().toString(),
      platform: newWebhook.platform,
      url: newWebhook.url,
      channel: newWebhook.channel,
      groupId: newWebhook.groupId,
      active: true
    }])
    setNewWebhook({ platform: 'Lolka', url: '', channel: '', groupId: '' })
    setShowAdd(false)
  }

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const testWebhook = (wh: any) => {
    const endpoint = wh.platform === 'Lolka' ? '/api/send/lolka' : '/api/send/vk'
    const body: any = { message: '🧪 Тестовое сообщение от Нова! Всё работает ✅', webhook_url: wh.url }
    if (wh.platform === 'VK') body.group_id = wh.groupId

    fetch(`https://nova-bot-rpsy.onrender.com${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    .then(res => res.json())
    .then(data => alert(data.sent ? '✅ Сообщение отправлено!' : '❌ Ошибка: ' + JSON.stringify(data)))
    .catch(() => alert('❌ Ошибка соединения'))
  }

  const sendBroadcast = () => {
    if (!broadcastMsg.trim()) return
    setSending(true)
    
    const activeWebhooks = webhooks.filter(w => w.active && broadcastPlatforms.includes(w.platform.toLowerCase()))
    
    fetch('https://nova-bot-rpsy.onrender.com/api/send/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: broadcastMsg,
        platforms: broadcastPlatforms,
        webhooks: activeWebhooks.map(w => ({
          platform: w.platform.toLowerCase(),
          url: w.url,
          group_id: w.groupId
        }))
      })
    })
    .then(res => res.json())
    .then(data => {
      setSendResult(`✅ Отправлено на ${data.sent_count} из ${data.total} платформ`)
      setSending(false)
      setTimeout(() => setSendResult(''), 3000)
    })
    .catch(() => {
      setSendResult('❌ Ошибка отправки')
      setSending(false)
    })
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '2px' }}>🔗 Вебхуки</h1>
            <p style={{ color: '#94A3B8', fontSize: '13px' }}>Интеграции с Lolka и VK, рассылки</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowBroadcast(!showBroadcast)} style={{
              padding: '10px 20px', background: showBroadcast ? '#1F2937' : '#A855F7', color: '#FFF',
              border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer'
            }}>{showBroadcast ? '✕ Закрыть' : '📢 Рассылка'}</button>
            <button onClick={() => setShowAdd(!showAdd)} style={{
              padding: '10px 20px', background: showAdd ? '#1F2937' : '#00E5FF', color: showAdd ? '#FFF' : '#000',
              border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer'
            }}>{showAdd ? '✕ Отмена' : '+ Добавить'}</button>
            <button onClick={save} style={{
              padding: '10px 22px', background: saved ? '#22C55E' : '#1F2937', color: saved ? '#000' : '#FFF',
              border: '1px solid #374151', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer'
            }}>{saved ? '✅ Сохранено' : '💾 Сохранить'}</button>
          </div>
        </div>

        {/* Broadcast Panel */}
        {showBroadcast && (
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', marginBottom: '20px', border: '1px solid #A855F720' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>📢 Рассылка сообщений</h3>
            <textarea value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)}
              placeholder="Текст сообщения для рассылки..."
              rows={3}
              style={{ width: '100%', padding: '12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '12px' }} />
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['lolka', 'vk'].map(p => (
                  <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    <input type="checkbox" checked={broadcastPlatforms.includes(p)}
                      onChange={() => setBroadcastPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])} />
                    {p === 'lolka' ? '🎮 Lolka' : '💙 VK'}
                  </label>
                ))}
              </div>
              <button onClick={sendBroadcast} disabled={sending || !broadcastMsg.trim()} style={{
                padding: '10px 24px', background: sending ? '#374151' : '#A855F7', color: '#FFF',
                border: 'none', borderRadius: '10px', fontWeight: '600', cursor: sending ? 'wait' : 'pointer', fontSize: '14px'
              }}>{sending ? '⏳ Отправка...' : '🚀 Отправить'}</button>
              {sendResult && <span style={{ fontSize: '13px', color: sendResult.includes('✅') ? '#22C55E' : '#EF4444' }}>{sendResult}</span>}
            </div>
          </div>
        )}

        {/* Add Form */}
        {showAdd && (
          <div style={{
            background: '#16161F', borderRadius: '14px', padding: '20px', marginBottom: '20px',
            border: '1px solid #1F2937', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px'
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
              padding: '10px 20px', background: '#00E5FF', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px'
            }}>✅ Добавить</button>
            {newWebhook.platform === 'VK' && (
              <input type="text" value={newWebhook.groupId} onChange={(e) => setNewWebhook({ ...newWebhook, groupId: e.target.value })}
                placeholder="ID группы VK" style={{ padding: '10px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px', gridColumn: '1 / 3' }} />
            )}
          </div>
        )}

        {/* Webhooks List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {webhooks.map(w => (
            <div key={w.id} style={{
              background: '#16161F', borderRadius: '14px', padding: '18px 20px',
              border: '1px solid #1F2937', opacity: w.active ? 1 : 0.5
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                  background: w.platform === 'Lolka' ? 'rgba(88,101,242,0.15)' : 'rgba(0,119,255,0.15)',
                  color: w.platform === 'Lolka' ? '#5865F2' : '#0077FF'
                }}>{w.platform === 'Lolka' ? '🎮 Lolka' : '💙 VK'}</span>
                <code style={{ flex: 1, minWidth: '180px', padding: '6px 12px', background: '#0A0A0F', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.url}</code>
                <span style={{ fontSize: '13px', color: '#94A3B8' }}>{w.channel}</span>
                <div onClick={() => toggle(w.id)} style={{ width: '38px', height: '22px', background: w.active ? '#00E5FF' : '#374151', borderRadius: '22px', cursor: 'pointer', position: 'relative' }}>
                  <div style={{ position: 'absolute', height: '16px', width: '16px', left: w.active ? '20px' : '3px', top: '3px', background: w.active ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} />
                </div>
                <button onClick={() => testWebhook(w)} style={{ padding: '6px 12px', background: 'transparent', color: '#00E5FF', border: '1px solid #1F2937', borderRadius: '8px', cursor: 'pointer', fontSize: '11px' }}>🧪 Тест</button>
                <button onClick={() => deleteWebhook(w.id)} style={{ padding: '6px 10px', background: 'transparent', color: '#EF4444', border: '1px solid #374151', borderRadius: '8px', cursor: 'pointer', fontSize: '11px' }}>✕</button>
              </div>
            </div>
          ))}
        </div>

        {/* Инструкция */}
        <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', marginTop: '24px', border: '1px solid #1F2937' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>📖 Инструкция</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: '#111118', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>🎮 Lolka</div>
              <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.5' }}>1. Настройки сервера → Вебхуки<br/>2. Скопируйте URL и вставьте сюда<br/>3. Бот сможет отправлять сообщения</p>
            </div>
            <div style={{ background: '#111118', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>💙 VK</div>
              <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.5' }}>1. Управление группой → API<br/>2. Создайте ключ доступа<br/>3. Укажите ID группы и ключ</p>
            </div>
          </div>
        </div>

        {saved && (
          <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#22C55E', color: '#000', padding: '10px 20px', borderRadius: '12px', fontWeight: '600', fontSize: '13px', zIndex: 1000, boxShadow: '0 4px 20px rgba(34,197,94,0.3)', animation: 'slideUp 0.3s ease' }}>✅ Сохранено</div>
        )}
        <style>{`@keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      </main>
    </div>
  )
}
