"use client"

import { useState } from 'react'

const navigate = (url: string) => window.location.href = url

interface Webhook {
  id: string
  platform: string
  url: string
  channel: string
  groupId: string
  serverName: string
  active: boolean
  rules: {
    posts: boolean
    videos: boolean
    articles: boolean
    music: boolean
    other: boolean
  }
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([
    {
      id: '1', platform: 'Lolka', url: 'https://lolka.app/api/webhooks/xxx',
      channel: '#общий', groupId: '', serverName: 'Phoenix Gaming',
      active: true, rules: { posts: true, videos: true, articles: false, music: false, other: true }
    },
    {
      id: '2', platform: 'VK', url: 'https://vk.com/callback/xxx',
      channel: '#новости', groupId: '123456', serverName: 'Техномания',
      active: true, rules: { posts: true, videos: false, articles: true, music: false, other: false }
    },
  ])

  const [saved, setSaved] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [showForward, setShowForward] = useState(false)
  const [editingRules, setEditingRules] = useState<string | null>(null)

  const [newWebhook, setNewWebhook] = useState({
    platform: 'Lolka', url: '', channel: '', groupId: '', serverName: '',
    rules: { posts: true, videos: true, articles: true, music: false, other: true }
  })

  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcastPlatforms, setBroadcastPlatforms] = useState<string[]>(['lolka', 'vk'])
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState('')

  const [forwardUrl, setForwardUrl] = useState('')
  const [forwardType, setForwardType] = useState('posts')
  const [forwardComment, setForwardComment] = useState('')
  const [forwardResult, setForwardResult] = useState('')

  const toggle = (id: string) => setWebhooks(webhooks.map(w => w.id === id ? { ...w, active: !w.active } : w))
  const deleteWebhook = (id: string) => setWebhooks(webhooks.filter(w => w.id !== id))

  const toggleRule = (webhookId: string, rule: keyof Webhook['rules']) => {
    setWebhooks(webhooks.map(w => w.id === webhookId ? {
      ...w, rules: { ...w.rules, [rule]: !w.rules[rule] }
    } : w))
  }

  const addWebhook = () => {
    if (!newWebhook.url || !newWebhook.channel) return
    setWebhooks([...webhooks, {
      ...newWebhook,
      id: Date.now().toString(),
      active: true
    }])
    setNewWebhook({ platform: 'Lolka', url: '', channel: '', groupId: '', serverName: '', rules: { posts: true, videos: true, articles: true, music: false, other: true } })
    setShowAdd(false)
  }

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const testWebhook = (wh: Webhook) => {
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
          group_id: w.groupId,
          serverName: w.serverName
        }))
      })
    })
    .then(res => res.json())
    .then(data => {
      setSendResult(`✅ Отправлено на ${data.sent_count} из ${data.total} платформ`)
      setSending(false)
      setTimeout(() => setSendResult(''), 3000)
    })
    .catch(() => { setSendResult('❌ Ошибка отправки'); setSending(false) })
  }

  const forwardContent = () => {
    if (!forwardUrl.trim()) return
    setSending(true)
    
    const activeWebhooks = webhooks.filter(w => w.active && w.rules[forwardType as keyof Webhook['rules']])
    
    const message = `/forward ${forwardUrl} ${forwardComment}`.trim()
    
    fetch('https://nova-bot-rpsy.onrender.com/api/forward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        platform: activeWebhooks[0]?.platform || 'Lolka',
        serverName: activeWebhooks[0]?.serverName || '',
        webhooks: activeWebhooks.map(w => ({
          platform: w.platform.toLowerCase(),
          url: w.url,
          group_id: w.groupId,
          rules: w.rules,
          serverName: w.serverName,
          channel: w.channel
        }))
      })
    })
    .then(res => res.json())
    .then(data => {
      setForwardResult(`✅ Переслано: ${data.total_sent} из ${data.total_urls} ссылок`)
      setSending(false)
      setTimeout(() => setForwardResult(''), 4000)
    })
    .catch(() => { setForwardResult('❌ Ошибка'); setSending(false) })
  }

  const getTypeLabel = (type: string) => {
    const labels: any = { posts: 'пост', videos: 'видео', articles: 'статья', music: 'музыка', other: 'материал' }
    return labels[type] || 'материал'
  }

  const getTypeIcon = (type: string) => {
    const icons: any = { posts: '📝', videos: '🎬', articles: '📄', music: '🎵', other: '📎' }
    return icons[type] || '📎'
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '2px' }}>🔗 Вебхуки</h1>
            <p style={{ color: '#94A3B8', fontSize: '13px' }}>Интеграции, пересылка контента и рассылки</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => setShowForward(!showForward)} style={{
              padding: '10px 16px', background: showForward ? '#1F2937' : '#EC4899', color: '#FFF',
              border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '13px', cursor: 'pointer'
            }}>{showForward ? '✕ Закрыть' : '↗ Переслать'}</button>
            <button onClick={() => setShowBroadcast(!showBroadcast)} style={{
              padding: '10px 16px', background: showBroadcast ? '#1F2937' : '#A855F7', color: '#FFF',
              border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '13px', cursor: 'pointer'
            }}>{showBroadcast ? '✕ Закрыть' : '📢 Рассылка'}</button>
            <button onClick={() => setShowAdd(!showAdd)} style={{
              padding: '10px 16px', background: showAdd ? '#1F2937' : '#00E5FF', color: showAdd ? '#FFF' : '#000',
              border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '13px', cursor: 'pointer'
            }}>{showAdd ? '✕ Отмена' : '+ Добавить'}</button>
            <button onClick={save} style={{
              padding: '10px 20px', background: saved ? '#22C55E' : '#1F2937', color: saved ? '#000' : '#FFF',
              border: '1px solid #374151', borderRadius: '10px', fontWeight: '600', fontSize: '13px', cursor: 'pointer'
            }}>{saved ? '✅ Сохранено' : '💾 Сохранить'}</button>
          </div>
        </div>

        {/* Forward Panel */}
        {showForward && (
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', marginBottom: '16px', border: '1px solid #EC489920' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>↗ Переслать контент</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <input type="text" value={forwardUrl} onChange={(e) => setForwardUrl(e.target.value)}
                placeholder="https://ссылка..."
                style={{ flex: 1, minWidth: '250px', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none' }} />
              <select value={forwardType} onChange={(e) => setForwardType(e.target.value)}
                style={{ padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '13px', cursor: 'pointer' }}>
                <option value="posts">📝 Пост</option>
                <option value="videos">🎬 Видео</option>
                <option value="articles">📄 Статья</option>
                <option value="music">🎵 Музыка</option>
                <option value="other">📎 Другое</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input type="text" value={forwardComment} onChange={(e) => setForwardComment(e.target.value)}
                placeholder="💬 Комментарий (необязательно)"
                style={{ flex: 1, padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none' }} />
              <button onClick={forwardContent} disabled={sending || !forwardUrl.trim()} style={{
                padding: '10px 20px', background: sending ? '#374151' : '#EC4899', color: '#FFF',
                border: 'none', borderRadius: '10px', fontWeight: '600', cursor: sending ? 'wait' : 'pointer', fontSize: '13px'
              }}>{sending ? '⏳ ...' : '🚀 Переслать'}</button>
            </div>
            {forwardResult && <div style={{ marginTop: '8px', fontSize: '13px', color: forwardResult.includes('✅') ? '#22C55E' : '#EF4444' }}>{forwardResult}</div>}
          </div>
        )}

        {/* Broadcast Panel */}
        {showBroadcast && (
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', marginBottom: '16px', border: '1px solid #A855F720' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>📢 Рассылка</h3>
            <textarea value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)}
              placeholder="Текст сообщения..."
              rows={2}
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
              }}>{sending ? '⏳ ...' : '🚀 Отправить'}</button>
              {sendResult && <span style={{ fontSize: '13px', color: sendResult.includes('✅') ? '#22C55E' : '#EF4444' }}>{sendResult}</span>}
            </div>
          </div>
        )}

        {/* Add Form */}
        {showAdd && (
          <div style={{
            background: '#16161F', borderRadius: '14px', padding: '20px', marginBottom: '16px',
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
            <input type="text" value={newWebhook.serverName} onChange={(e) => setNewWebhook({ ...newWebhook, serverName: e.target.value })}
              placeholder="Название сервера/группы" style={{ padding: '10px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px', gridColumn: '1 / 3' }} />
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
              background: '#16161F', borderRadius: '14px', padding: '16px 20px',
              border: '1px solid #1F2937', opacity: w.active ? 1 : 0.5
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: editingRules === w.id ? '12px' : '0' }}>
                <span style={{
                  padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                  background: w.platform === 'Lolka' ? 'rgba(88,101,242,0.15)' : 'rgba(0,119,255,0.15)',
                  color: w.platform === 'Lolka' ? '#5865F2' : '#0077FF'
                }}>{w.platform === 'Lolka' ? '🎮 Lolka' : '💙 VK'}</span>
                {w.serverName && (
                  <span style={{ fontSize: '12px', color: '#FFF', fontWeight: '600' }}>{w.serverName}</span>
                )}
                <code style={{ flex: 1, minWidth: '150px', padding: '5px 10px', background: '#0A0A0F', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.url}</code>
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>{w.channel}</span>
                
                <div style={{ display: 'flex', gap: '4px' }}>
                  {Object.entries(w.rules).filter(([_, v]) => v).map(([key]) => (
                    <span key={key} style={{ fontSize: '14px' }} title={getTypeLabel(key)}>{getTypeIcon(key)}</span>
                  ))}
                </div>

                <div onClick={() => toggle(w.id)} style={{ width: '36px', height: '20px', background: w.active ? '#00E5FF' : '#374151', borderRadius: '20px', cursor: 'pointer', position: 'relative' }}>
                  <div style={{ position: 'absolute', height: '14px', width: '14px', left: w.active ? '20px' : '3px', top: '3px', background: w.active ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} />
                </div>

                <button onClick={() => setEditingRules(editingRules === w.id ? null : w.id)} style={{
                  padding: '5px 10px', background: 'transparent', color: '#F59E0B', border: '1px solid #374151',
                  borderRadius: '6px', cursor: 'pointer', fontSize: '11px'
                }}>⚙️</button>
                <button onClick={() => testWebhook(w)} style={{
                  padding: '5px 10px', background: 'transparent', color: '#00E5FF', border: '1px solid #1F2937',
                  borderRadius: '6px', cursor: 'pointer', fontSize: '11px'
                }}>🧪</button>
                <button onClick={() => deleteWebhook(w.id)} style={{
                  padding: '5px 8px', background: 'transparent', color: '#EF4444', border: '1px solid #374151',
                  borderRadius: '6px', cursor: 'pointer', fontSize: '11px'
                }}>✕</button>
              </div>

              {editingRules === w.id && (
                <div style={{
                  background: '#111118', borderRadius: '10px', padding: '14px',
                  display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center'
                }}>
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>Пересылать:</span>
                  {Object.entries(w.rules).map(([key, value]) => (
                    <label key={key} style={{
                      display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                      fontSize: '12px', padding: '6px 12px', borderRadius: '8px',
                      background: value ? 'rgba(0,229,255,0.1)' : '#0A0A0F',
                      border: `1px solid ${value ? '#00E5FF40' : '#1F2937'}`
                    }}>
                      <input type="checkbox" checked={value} onChange={() => toggleRule(w.id, key as keyof Webhook['rules'])}
                        style={{ accentColor: '#00E5FF' }} />
                      {getTypeIcon(key)} {getTypeLabel(key)}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Инструкция */}
        <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', marginTop: '20px', border: '1px solid #1F2937' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>📖 Инструкция</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ background: '#111118', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>↗ Пересылка контента</div>
              <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.5' }}>
                Вставьте ссылку — бот с AI определит тип и отправит в нужные каналы с живым комментарием.
              </p>
            </div>
            <div style={{ background: '#111118', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>⚙️ Правила</div>
              <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.5' }}>
                Настройте какие типы контента отправлять в каждый канал. Например: видео → #ютуб, посты → #новости.
              </p>
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
