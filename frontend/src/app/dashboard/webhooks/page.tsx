"use client"

import { useState, useEffect } from 'react'

const navigate = (url: string) => { window.location.href = url }

interface Webhook {
  id: string; platform: string; url: string; channel: string; groupId: string
  serverName: string; active: boolean; autoScan: boolean; scanInterval: number; minLikes: number
  rules: { posts: boolean; videos: boolean; articles: boolean; music: boolean; other: boolean }
}

const mockChannels: Record<string, string[]> = {
  Lolka: ['📢 общий', '📰 новости', '🎮 игры', '🎵 музыка', '😂 мемы', '⭐ важное', '🤖 бот-команды', '💬 флуд', '🎨 творчество', '📺 стримы'],
  VK: ['💬 Основной чат', '📢 Новости', '🗣 Обсуждения', '😄 Флудилка', '😂 Мемы', '⭐ Важное', '🎮 Игры', '📺 Стримы'],
}

const API_BASE = 'https://nova-bot-rpsy.onrender.com'

async function apiCall(url: string, options?: RequestInit) {
  try { const res = await fetch(url, options); return await res.json() } catch (e) { return { error: 'Ошибка соединения' } }
}

export default function WebhooksPage() {
  // Вебхуки
  const [webhooks, setWebhooks] = useState<Webhook[]>([
    { id: '1', platform: 'Lolka', url: 'https://lolka.app/api/webhooks/xxx', channel: '📢 общий', groupId: '', serverName: 'Phoenix Gaming', active: true, autoScan: false, scanInterval: 30, minLikes: 5, rules: { posts: true, videos: true, articles: false, music: false, other: true } },
    { id: '2', platform: 'VK', url: 'https://vk.com/callback/xxx', channel: '📢 Новости', groupId: '123456', serverName: 'Техномания', active: true, autoScan: true, scanInterval: 30, minLikes: 5, rules: { posts: true, videos: false, articles: true, music: false, other: false } },
  ])

  // Состояния
  const [saved, setSaved] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [showForward, setShowForward] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [showAutoForward, setShowAutoForward] = useState(false)
  const [showEvents, setShowEvents] = useState(false)
  const [editingRules, setEditingRules] = useState<string | null>(null)
  const [editingScan, setEditingScan] = useState<string | null>(null)
  const [editingChannel, setEditingChannel] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState('')
  const [newWebhook, setNewWebhook] = useState({ platform: '', url: '', channel: '', groupId: '', serverName: '', autoScan: false, scanInterval: 30, minLikes: 5, rules: { posts: true, videos: true, articles: true, music: false, other: true } })
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcastPlatforms, setBroadcastPlatforms] = useState<string[]>(['lolka', 'vk'])
  const [broadcastAvatarUrl, setBroadcastAvatarUrl] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState('')
  const [forwardUrl, setForwardUrl] = useState('')
  const [forwardType, setForwardType] = useState('posts')
  const [forwardComment, setForwardComment] = useState('')
  const [forwardResult, setForwardResult] = useState('')
  const [logs, setLogs] = useState<any[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [autoForward, setAutoForward] = useState({ enabled: false, from_lolka_to_vk: true, from_vk_to_lolka: true })

  // События
  const [events, setEvents] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', event_date: '', template: 'custom',
    channel: '', webhook_url: '', max_participants: 0, created_by: 'Admin'
  })

  useEffect(() => {
    loadEvents()
    loadAutoForward()
  }, [])

  const loadEvents = async () => {
    const data = await apiCall(API_BASE + '/api/events?server_id=default')
    setEvents(data.events || [])
    setTemplates(data.templates || [])
  }

  const loadAutoForward = async () => {
    const data = await apiCall(API_BASE + '/api/webhooks/auto-forward/config?server_id=default')
    if (data.config) setAutoForward(data.config)
  }

  const createEvent = async () => {
    if (!newEvent.title || !newEvent.event_date) return
    await apiCall(API_BASE + '/api/events', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newEvent, server_id: 'default' })
    })
    setShowAddEvent(false)
    setNewEvent({ title: '', description: '', event_date: '', template: 'custom', channel: '', webhook_url: '', max_participants: 0, created_by: 'Admin' })
    loadEvents()
  }

  const deleteEvent = async (id: number) => {
    await apiCall(API_BASE + '/api/events/' + id, { method: 'DELETE' })
    loadEvents()
  }

  const notifyEvent = async (event: any) => {
    const data = await apiCall(API_BASE + '/api/events/' + event.id + '/notify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhook_url: event.webhook_url || '' })
    })
    alert(data.sent ? '✅ Уведомление отправлено!' : '❌ Ошибка')
  }

  const selectTemplate = (tpl: string) => {
    const t = templates.find((x: any) => x.value === tpl)
    setNewEvent({
      ...newEvent,
      template: tpl,
      max_participants: t?.max_players || 0,
      title: tpl !== 'custom' ? t?.name?.replace(/[^\w\sа-яА-Я]/g, '').trim() + ' ' : ''
    })
  }

  // Вебхуки функции
  const save = function() { setSaved(true); setTimeout(function() { setSaved(false) }, 2000) }
  const toggle = function(id: string) { setWebhooks(webhooks.map(function(w) { return w.id === id ? { ...w, active: !w.active } : w })) }
  const deleteWebhook = function(id: string) { setWebhooks(webhooks.filter(function(w) { return w.id !== id })) }
  const toggleRule = function(webhookId: string, rule: string) { setWebhooks(webhooks.map(function(w) { if (w.id !== webhookId) return w; var newRules = { ...w.rules, [rule]: !w.rules[rule as keyof typeof w.rules] }; return { ...w, rules: newRules } })) }
  const updateWebhook = function(id: string, key: string, value: any) { setWebhooks(webhooks.map(function(w) { return w.id === id ? { ...w, [key]: value } : w })) }
  const detectPlatform = function(url: string): string { if (!url) return ''; var clean = url.toLowerCase().trim(); if (clean.includes('lolka.app') || clean.includes('lolka')) return 'Lolka'; if (clean.includes('vk.com') || clean.includes('vk.ru')) return 'VK'; return '' }
  const handleUrlChange = function(value: string) { var platform = detectPlatform(value); setNewWebhook({ ...newWebhook, url: value, platform: platform || newWebhook.platform }) }
  const channelsFor = function(platform: string): string[] { return mockChannels[platform] || [] }
  const addWebhook = function() { if (!newWebhook.url || !newWebhook.channel) return; setWebhooks([...webhooks, { ...newWebhook, id: Date.now().toString(), active: true }]); setNewWebhook({ platform: '', url: '', channel: '', groupId: '', serverName: '', autoScan: false, scanInterval: 30, minLikes: 5, rules: { posts: true, videos: true, articles: true, music: false, other: true } }); setShowAdd(false) }

  const testWebhook = async function(wh: Webhook) {
    var endpoint = wh.platform === 'Lolka' ? '/api/send/lolka' : '/api/send/vk'
    var body: any = { message: '🧪 Тестовое сообщение от Нова!', webhook_url: wh.url }
    if (wh.platform === 'VK') body.group_id = wh.groupId
    var data = await apiCall(API_BASE + endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    alert(data.sent ? '✅ Отправлено!' : '❌ Ошибка: ' + JSON.stringify(data))
  }

  const scanWebhook = async function(wh: Webhook) {
    setScanning(true); setScanResult('')
    var data = await apiCall(API_BASE + '/api/scan/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ platform: wh.platform.toLowerCase(), group_id: wh.groupId, serverName: wh.serverName, min_likes: wh.minLikes, rules: wh.rules, webhooks: [{ platform: wh.platform.toLowerCase(), url: wh.url, group_id: wh.groupId, rules: wh.rules, serverName: wh.serverName, channel: wh.channel }] }) })
    setScanResult(data.found ? '✅ Найдено: ' + data.found + ', переслано: ' + (data.sent || 0) : 'ℹ️ Нет нового'); setScanning(false); setTimeout(function() { setScanResult('') }, 4000)
  }

  const scanAll = function() { webhooks.filter(function(w) { return w.active }).forEach(function(wh, i) { setTimeout(function() { scanWebhook(wh) }, i * 500) }) }

  const loadLogs = async function() {
    setLogsLoading(true);
    var data = await apiCall(API_BASE + '/api/webhooks/logs?limit=50');
    setLogs(data.logs || []);
    setLogsLoading(false);
  }

  const sendBroadcast = async function() {
    if (!broadcastMsg.trim()) return; setSending(true)
    var active = webhooks.filter(function(w) { return w.active && broadcastPlatforms.includes(w.platform.toLowerCase()) })
    var data = await apiCall(API_BASE + '/api/send/broadcast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: broadcastMsg, platforms: broadcastPlatforms, avatar_url: broadcastAvatarUrl, webhooks: active.map(function(w) { return { platform: w.platform.toLowerCase(), url: w.url, group_id: w.groupId, serverName: w.serverName } }) }) })
    setSendResult('✅ ' + data.sent_count + '/' + data.total); setSending(false); setTimeout(function() { setSendResult('') }, 3000)
  }

  const forwardContent = async function() {
    if (!forwardUrl.trim()) return; setSending(true)
    var active = webhooks.filter(function(w) { return w.active && w.rules[forwardType as keyof typeof w.rules] })
    var data = await apiCall(API_BASE + '/api/forward', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: ('/forward ' + forwardUrl + ' ' + forwardComment).trim(), platform: active[0]?.platform || 'Lolka', serverName: active[0]?.serverName || '', webhooks: active.map(function(w) { return { platform: w.platform.toLowerCase(), url: w.url, group_id: w.groupId, rules: w.rules, serverName: w.serverName, channel: w.channel } }) }) })
    setForwardResult('✅ ' + data.total_sent + '/' + data.total_urls); setSending(false); setTimeout(function() { setForwardResult('') }, 4000)
  }

  const saveAutoForward = async function() {
    await apiCall(API_BASE + '/api/webhooks/auto-forward/config', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ server_id: 'default', config: autoForward })
    })
    setSaved(true); setTimeout(function() { setSaved(false) }, 2000)
  }

  var getTypeLabel: any = { posts: 'пост', videos: 'видео', articles: 'статья', music: 'музыка', other: 'материал' }
  var getTypeIcon: any = { posts: '📝', videos: '🎬', articles: '📄', music: '🎵', other: '📎' }
  var getEventIcon: any = { raid: '⚔️', farm: '🎯', meeting: '🤝', event: '🎉', tournament: '🏆', custom: '📝' }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', color: '#F1F5F9' }}>
      <aside style={{ width: '240px', minWidth: '240px', background: '#111118', borderRight: '1px solid #1F2937', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '32px' }}><div style={{ width: '34px', height: '34px', background: '#16161F', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#00E5FF', fontSize: '17px' }}>N</div><span style={{ fontSize: '19px', fontWeight: 'bold', color: '#FFF' }}>Нова</span></a>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          {[{ icon: '📊', label: 'Обзор', href: '/dashboard' },{ icon: '🖥️', label: 'Серверы', href: '/dashboard/servers' },{ icon: '🧩', label: 'Модули', href: '/dashboard/modules' },{ icon: '⚡', label: 'Команды', href: '/dashboard/commands' },{ icon: '🔗', label: 'Вебхуки', href: '/dashboard/webhooks' }].map(function(item, i) { var isActive = item.label === 'Вебхуки'; return (<span key={i} onClick={function() { navigate(item.href) }} style={{ padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer', fontWeight: isActive ? '500' : '400', color: isActive ? '#FFF' : '#94A3B8', background: isActive ? '#1F2937' : 'transparent', transition: 'all 0.15s' }}><span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{item.icon}</span>{item.label}</span>) })}
        </nav>
      </aside>

      <main style={{ flex: 1, padding: '32px 40px', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}><div><h1 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '2px' }}>🔗 Вебхуки</h1><p style={{ color: '#94A3B8', fontSize: '13px' }}>События, авто-форвард, логи и управление</p></div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={function() { setShowEvents(!showEvents); if (!showEvents) loadEvents() }} style={{ padding: '10px 16px', background: showEvents ? '#1F2937' : '#EF4444', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>{showEvents ? '✕' : '🗓️ События'}</button>
            <button onClick={function() { setShowLogs(!showLogs); if (!showLogs) loadLogs() }} style={{ padding: '10px 16px', background: showLogs ? '#1F2937' : '#F59E0B', color: '#000', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>{showLogs ? '✕' : '📋 Логи'}</button>
            <button onClick={function() { setShowAutoForward(!showAutoForward) }} style={{ padding: '10px 16px', background: showAutoForward ? '#1F2937' : '#10B981', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>{showAutoForward ? '✕' : '🔄 Форвард'}</button>
            <button onClick={scanAll} disabled={scanning} style={{ padding: '10px 16px', background: scanning ? '#374151' : '#3B82F6', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '13px', cursor: scanning ? 'wait' : 'pointer' }}>{scanning ? '⏳' : '🔍 Скан'}</button>
            <button onClick={function() { setShowForward(!showForward) }} style={{ padding: '10px 16px', background: showForward ? '#1F2937' : '#EC4899', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>{showForward ? '✕' : '↗'}</button>
            <button onClick={function() { setShowBroadcast(!showBroadcast) }} style={{ padding: '10px 16px', background: showBroadcast ? '#1F2937' : '#A855F7', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>{showBroadcast ? '✕' : '📢'}</button>
            <button onClick={function() { setShowAdd(!showAdd) }} style={{ padding: '10px 16px', background: showAdd ? '#1F2937' : '#00E5FF', color: showAdd ? '#FFF' : '#000', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>{showAdd ? '✕' : '+ Вебхук'}</button>
            <button onClick={save} style={{ padding: '10px 20px', background: saved ? '#22C55E' : '#1F2937', color: saved ? '#000' : '#FFF', border: '1px solid #374151', borderRadius: '10px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>{saved ? '✅' : '💾'}</button>
          </div>
        </div>
        {scanResult && <div style={{ background: '#10B98120', borderRadius: '10px', padding: '10px 16px', marginBottom: '12px', border: '1px solid #10B98140' }}><span style={{ fontSize: '13px', color: '#10B981' }}>{scanResult}</span></div>}

        {/* События */}
        {showEvents && (
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', marginBottom: '16px', border: '1px solid #EF444420' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600' }}>🗓️ События</h3>
              <button onClick={function() { setShowAddEvent(!showAddEvent) }} style={{ padding: '8px 14px', background: showAddEvent ? '#1F2937' : '#EF4444', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}>{showAddEvent ? '✕' : '+ Событие'}</button>
            </div>

            {showAddEvent && (
              <div style={{ background: '#111118', borderRadius: '10px', padding: '16px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {templates.map((t: any) => (
                    <button key={t.value} onClick={function() { selectTemplate(t.value) }}
                      style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid ' + (newEvent.template === t.value ? '#EF4444' : '#1F2937'), background: newEvent.template === t.value ? '#EF444420' : 'transparent', color: newEvent.template === t.value ? '#EF4444' : '#94A3B8', cursor: 'pointer', fontSize: '12px' }}>
                      {t.icon} {t.name.replace(/[^\w\sа-яА-Я]/g, '').trim()}
                    </button>
                  ))}
                </div>
                <input type="text" value={newEvent.title} onChange={function(e) { setNewEvent({ ...newEvent, title: e.target.value }) }} placeholder="Название события" style={{ padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px' }} />
                <input type="datetime-local" value={newEvent.event_date} onChange={function(e) { setNewEvent({ ...newEvent, event_date: e.target.value }) }} style={{ padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" value={newEvent.channel} onChange={function(e) { setNewEvent({ ...newEvent, channel: e.target.value }) }} placeholder="Канал" style={{ flex: 1, padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px' }} />
                  <input type="number" value={newEvent.max_participants || ''} onChange={function(e) { setNewEvent({ ...newEvent, max_participants: parseInt(e.target.value) || 0 }) }} placeholder="Мест" style={{ width: '80px', padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px' }} />
                </div>
                <textarea value={newEvent.description} onChange={function(e) { setNewEvent({ ...newEvent, description: e.target.value }) }} placeholder="Описание..." rows={2} style={{ padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px', resize: 'vertical' }} />
                <button onClick={createEvent} style={{ padding: '10px', background: '#EF4444', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>✅ Создать событие</button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {events.length === 0 && <p style={{ color: '#64748B', fontSize: '13px', textAlign: 'center', padding: '12px' }}>Нет запланированных событий</p>}
              {events.map(function(e: any) {
                var d = new Date(e.event_date);
                return (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#111118', borderRadius: '10px' }}>
                    <span style={{ fontSize: '20px' }}>{getEventIcon[e.template] || '📝'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{e.title}</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                        {d.toLocaleDateString('ru-RU')} в {d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        {e.max_participants > 0 ? ' • ' + e.max_participants + ' мест' : ' • Безлимит'}
                      </div>
                    </div>
                    <button onClick={function() { notifyEvent(e) }} style={{ padding: '5px 10px', background: '#EF4444', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>📢</button>
                    <button onClick={function() { deleteEvent(e.id) }} style={{ padding: '5px 8px', background: 'transparent', color: '#EF4444', border: '1px solid #374151', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>✕</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Логи */}
        {showLogs && (
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', marginBottom: '16px', border: '1px solid #F59E0B20' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>📋 Логи отправленных сообщений</h3>
            {logsLoading ? <p style={{ color: '#94A3B8', fontSize: '13px' }}>⏳ Загрузка...</p> :
              logs.length === 0 ? <p style={{ color: '#64748B', fontSize: '13px' }}>Логов пока нет</p> :
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflow: 'auto' }}>
                {logs.map(function(log: any, i: number) {
                  return (
                    <div key={i} style={{ display: 'flex', gap: '10px', padding: '8px 12px', background: '#111118', borderRadius: '8px', fontSize: '12px', alignItems: 'center' }}>
                      <span style={{ color: '#00E5FF', whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString('ru-RU')}</span>
                      <span style={{ color: log.platform === 'lolka' ? '#5865F2' : '#0077FF' }}>{log.platform?.toUpperCase()}</span>
                      <span style={{ color: '#94A3B8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.message}</span>
                    </div>
                  );
                })}
              </div>
            }
          </div>
        )}

        {/* Авто-форвард */}
        {showAutoForward && (
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', marginBottom: '16px', border: '1px solid #10B98120' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>🔄 Авто-форвард между платформами</h3>
            <p style={{ color: '#94A3B8', fontSize: '12px', marginBottom: '16px' }}>Сообщения автоматически пересылаются между VK и Lolka</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px' }}>Включить авто-форвард</span>
                <div onClick={function() { setAutoForward({ ...autoForward, enabled: !autoForward.enabled }) }} style={{ width: '44px', height: '26px', background: autoForward.enabled ? '#10B981' : '#374151', borderRadius: '26px', cursor: 'pointer', position: 'relative' }}><div style={{ position: 'absolute', height: '20px', width: '20px', left: autoForward.enabled ? '22px' : '4px', top: '3px', background: '#FFF', borderRadius: '50%', transition: '0.25s' }} /></div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                <input type="checkbox" checked={autoForward.from_lolka_to_vk} onChange={function(e) { setAutoForward({ ...autoForward, from_lolka_to_vk: e.target.checked }) }} style={{ accentColor: '#5865F2' }} />
                🎮 Lolka → 💙 VK
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                <input type="checkbox" checked={autoForward.from_vk_to_lolka} onChange={function(e) { setAutoForward({ ...autoForward, from_vk_to_lolka: e.target.checked }) }} style={{ accentColor: '#0077FF' }} />
                💙 VK → 🎮 Lolka
              </label>
              <button onClick={saveAutoForward} style={{ padding: '10px 20px', background: '#10B981', color: '#000', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', marginTop: '6px' }}>💾 Сохранить</button>
            </div>
          </div>
        )}

        {showForward && (
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', marginBottom: '16px', border: '1px solid #EC489920' }}><h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>↗ Переслать контент</h3><div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}><input type="text" value={forwardUrl} onChange={function(e) { setForwardUrl(e.target.value) }} placeholder="https://ссылка..." style={{ flex: 1, minWidth: '250px', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none' }} /><select value={forwardType} onChange={function(e) { setForwardType(e.target.value) }} style={{ padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '13px' }}><option value="posts">📝 Пост</option><option value="videos">🎬 Видео</option><option value="articles">📄 Статья</option><option value="music">🎵 Музыка</option><option value="other">📎 Другое</option></select></div><div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><input type="text" value={forwardComment} onChange={function(e) { setForwardComment(e.target.value) }} placeholder="💬 Комментарий" style={{ flex: 1, padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none' }} /><button onClick={forwardContent} disabled={sending || !forwardUrl.trim()} style={{ padding: '10px 20px', background: sending ? '#374151' : '#EC4899', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: sending ? 'wait' : 'pointer', fontSize: '13px' }}>{sending ? '⏳' : '🚀'}</button></div>{forwardResult && <div style={{ marginTop: '8px', fontSize: '13px', color: forwardResult.includes('✅') ? '#22C55E' : '#EF4444' }}>{forwardResult}</div>}</div>
        )}

        {showBroadcast && (
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', marginBottom: '16px', border: '1px solid #A855F720' }}><h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>📢 Рассылка</h3>
            <textarea value={broadcastMsg} onChange={function(e) { setBroadcastMsg(e.target.value) }} placeholder="Текст..." rows={2} style={{ width: '100%', padding: '12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '12px' }} />
            <div style={{ marginBottom: '12px' }}><label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>🖼️ Аватар бота (URL)</label><input type="text" value={broadcastAvatarUrl} onChange={function(e) { setBroadcastAvatarUrl(e.target.value) }} placeholder="https://..." style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} /></div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              {['lolka', 'vk'].map(function(p) { return (<label key={p} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}><input type="checkbox" checked={broadcastPlatforms.includes(p)} onChange={function() { setBroadcastPlatforms(function(prev) { return prev.includes(p) ? prev.filter(function(x) { return x !== p }) : [...prev, p] }) }} />{p === 'lolka' ? '🎮' : '💙'} {p}</label>) })}
              <button onClick={sendBroadcast} disabled={sending || !broadcastMsg.trim()} style={{ padding: '10px 24px', background: sending ? '#374151' : '#A855F7', color: '#FFF', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: sending ? 'wait' : 'pointer', fontSize: '14px' }}>{sending ? '⏳' : '🚀'}</button>
              {sendResult && <span style={{ fontSize: '13px', color: sendResult.includes('✅') ? '#22C55E' : '#EF4444' }}>{sendResult}</span>}
            </div>
          </div>
        )}

        {showAdd && (
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', marginBottom: '16px', border: '1px solid #1F2937', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '10px' }}>
            <div><label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>URL вебхука</label><input type="text" value={newWebhook.url} onChange={function(e) { handleUrlChange(e.target.value) }} placeholder="https://..." style={{ width: '100%', padding: '10px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }} /></div>
            <div><label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Платформа</label><select value={newWebhook.platform} onChange={function(e) { setNewWebhook({ ...newWebhook, platform: e.target.value }) }} style={{ width: '100%', padding: '10px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px' }}><option value="">Авто</option><option value="Lolka">🎮 Lolka</option><option value="VK">💙 VK</option></select></div>
            <div><label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Канал</label><select value={newWebhook.channel} onChange={function(e) { setNewWebhook({ ...newWebhook, channel: e.target.value }) }} style={{ width: '100%', padding: '10px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px' }}><option value="">📋 Выберите...</option>{(newWebhook.platform ? channelsFor(newWebhook.platform) : []).map(function(ch) { return <option key={ch} value={ch}>{ch}</option> })}</select></div>
            <button onClick={addWebhook} style={{ padding: '10px 20px', background: '#00E5FF', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px', alignSelf: 'flex-end' }}>✅</button>
            <input type="text" value={newWebhook.serverName} onChange={function(e) { setNewWebhook({ ...newWebhook, serverName: e.target.value }) }} placeholder="Название сервера/группы" style={{ padding: '10px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px', gridColumn: '1 / 3', boxSizing: 'border-box' }} />
            {newWebhook.platform === 'VK' && <input type="text" value={newWebhook.groupId} onChange={function(e) { setNewWebhook({ ...newWebhook, groupId: e.target.value }) }} placeholder="ID группы VK" style={{ padding: '10px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px', gridColumn: '1 / 3', boxSizing: 'border-box' }} />}
          </div>
        )}

        {/* Список вебхуков */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {webhooks.map(function(w) { return (
            <div key={w.id} style={{ background: '#16161F', borderRadius: '14px', padding: '16px 20px', border: '1px solid #1F2937', opacity: w.active ? 1 : 0.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: (editingRules === w.id || editingScan === w.id || editingChannel === w.id) ? '12px' : '0' }}>
                <span style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', background: w.platform === 'Lolka' ? 'rgba(88,101,242,0.15)' : 'rgba(0,119,255,0.15)', color: w.platform === 'Lolka' ? '#5865F2' : '#0077FF' }}>{w.platform === 'Lolka' ? '🎮 Lolka' : '💙 VK'}</span>
                {w.serverName && <span style={{ fontSize: '12px', color: '#FFF', fontWeight: '600' }}>{w.serverName}</span>}
                {w.autoScan && <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '10px', background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>🔄</span>}
                <code style={{ flex: 1, minWidth: '120px', padding: '5px 10px', background: '#0A0A0F', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace', color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.url}</code>
                <div onClick={function() { setEditingChannel(editingChannel === w.id ? null : w.id) }} style={{ fontSize: '12px', color: '#94A3B8', cursor: 'pointer', padding: '4px 10px', borderRadius: '6px', background: '#0A0A0F', border: '1px solid #1F2937', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}><span>{w.channel || '📋 выбрать'}</span><span style={{ fontSize: '10px' }}>▾</span></div>
                <div style={{ display: 'flex', gap: '4px' }}>{Object.entries(w.rules).filter(function(e) { return e[1] }).map(function(e) { return <span key={e[0]} style={{ fontSize: '14px' }} title={getTypeLabel[e[0]] || e[0]}>{getTypeIcon[e[0]] || '📎'}</span> })}</div>
                <div onClick={function() { toggle(w.id) }} style={{ width: '36px', height: '20px', background: w.active ? '#00E5FF' : '#374151', borderRadius: '20px', cursor: 'pointer', position: 'relative' }}><div style={{ position: 'absolute', height: '14px', width: '14px', left: w.active ? '20px' : '3px', top: '3px', background: w.active ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} /></div>
                <button onClick={function() { setEditingRules(editingRules === w.id ? null : w.id) }} style={{ padding: '5px 10px', background: 'transparent', color: '#F59E0B', border: '1px solid #374151', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>⚙️</button>
                <button onClick={function() { setEditingScan(editingScan === w.id ? null : w.id) }} style={{ padding: '5px 10px', background: 'transparent', color: '#10B981', border: '1px solid #374151', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>🔍</button>
                <button onClick={function() { scanWebhook(w) }} disabled={scanning} style={{ padding: '5px 10px', background: 'transparent', color: '#3B82F6', border: '1px solid #1F2937', borderRadius: '6px', cursor: scanning ? 'wait' : 'pointer', fontSize: '11px' }}>▶️</button>
                <button onClick={function() { testWebhook(w) }} style={{ padding: '5px 10px', background: 'transparent', color: '#00E5FF', border: '1px solid #1F2937', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>🧪</button>
                <button onClick={function() { deleteWebhook(w.id) }} style={{ padding: '5px 8px', background: 'transparent', color: '#EF4444', border: '1px solid #374151', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>✕</button>
              </div>
              {editingChannel === w.id && (<div style={{ background: '#111118', borderRadius: '10px', padding: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}><span style={{ fontSize: '12px', color: '#94A3B8' }}>📋 Канал:</span>{channelsFor(w.platform).map(function(ch) { return <button key={ch} onClick={function() { updateWebhook(w.id, 'channel', ch); setEditingChannel(null) }} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #1F2937', background: w.channel === ch ? 'rgba(0,229,255,0.1)' : 'transparent', color: w.channel === ch ? '#00E5FF' : '#94A3B8', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}>{ch}</button> })}<input type="text" placeholder="Свой канал..." onKeyDown={function(e) { if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) { updateWebhook(w.id, 'channel', (e.target as HTMLInputElement).value.trim()); setEditingChannel(null) } }} style={{ padding: '6px 10px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '6px', color: '#FFF', fontSize: '12px', width: '120px' }} /></div>)}
              {editingRules === w.id && (<div style={{ background: '#111118', borderRadius: '10px', padding: '14px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}><span style={{ fontSize: '12px', color: '#94A3B8' }}>Пересылать:</span>{Object.entries(w.rules).map(function(e) { var key = e[0]; var value = e[1]; return <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', padding: '6px 12px', borderRadius: '8px', background: value ? 'rgba(0,229,255,0.1)' : '#0A0A0F', border: '1px solid ' + (value ? '#00E5FF40' : '#1F2937') }}><input type="checkbox" checked={value} onChange={function() { toggleRule(w.id, key) }} style={{ accentColor: '#00E5FF' }} />{getTypeIcon[key] || '📎'} {getTypeLabel[key] || key}</label>; })}</div>)}
              {editingScan === w.id && (<div style={{ background: '#111118', borderRadius: '10px', padding: '14px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}><span style={{ fontSize: '12px', color: '#94A3B8' }}>🔍 Автосканирование:</span><label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}><input type="checkbox" checked={w.autoScan} onChange={function() { updateWebhook(w.id, 'autoScan', !w.autoScan) }} style={{ accentColor: '#10B981' }} /> Вкл</label><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ fontSize: '12px', color: '#94A3B8' }}>Интервал:</span><select value={w.scanInterval} onChange={function(e) { updateWebhook(w.id, 'scanInterval', parseInt(e.target.value)) }} style={{ padding: '4px 8px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '6px', color: '#FFF', fontSize: '12px' }}><option value="15">15м</option><option value="30">30м</option><option value="60">1ч</option><option value="120">2ч</option></select></div><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ fontSize: '12px', color: '#94A3B8' }}>Мин 👍:</span><input type="number" value={w.minLikes} onChange={function(e) { updateWebhook(w.id, 'minLikes', parseInt(e.target.value) || 1) }} style={{ width: '50px', padding: '4px 8px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '6px', color: '#FFF', fontSize: '12px' }} /></div></div>)}
            </div>
          )})}
        </div>

        {saved && <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#22C55E', color: '#000', padding: '10px 20px', borderRadius: '12px', fontWeight: '600', fontSize: '13px', zIndex: 1000, boxShadow: '0 4px 20px rgba(34,197,94,0.3)', animation: 'slideUp 0.3s ease' }}>✅ Сохранено</div>}
        <style>{`@keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      </main>
    </div>
  )
}
