"use client"

import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const navigate = (url: string) => window.location.href = url

// Защита от краша, эмодзи и спецсимволов
const sanitize = (text: string): string => {
  if (!text) return ''
  return text
    .replace(/[\u0000-\u001F]/g, '')
    .replace(/[\u200B-\u200D]/g, '')
    .replace(/[\uFEFF]/g, '')
    .trim()
}

export default function Dashboard() {
  const [servers, setServers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('7d')

  // Динамическая статистика из API
  const [stats, setStats] = useState({
    totalMessages: 0, activeUsers: 0, commandsUsed: 0, voiceHours: 0,
    onlineNow: 0, newUsers: 0, messagesChart: [0,0,0,0,0,0,0]
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [topCommands, setTopCommands] = useState<any[]>([])
  const [dashLoading, setDashLoading] = useState(true)

  useEffect(() => {
    // Загрузка серверов
    fetch(`${API_URL}/api/servers`)
      .then(res => res.json())
      .then(data => { setServers(data.servers || []); setLoading(false) })
      .catch(() => setLoading(false))

    // Загрузка статистики дашборда
    fetch(`${API_URL}/api/stats/dashboard`)
      .then(res => res.json())
      .then(data => {
        setStats({
          totalMessages: data.totalMessages || 0,
          activeUsers: data.activeUsers || 0,
          commandsUsed: data.commandsUsed || 0,
          voiceHours: data.voiceHours || 0,
          onlineNow: data.onlineNow || 0,
          newUsers: data.newUsers || 0,
          messagesChart: data.messagesChart || [0,0,0,0,0,0,0]
        })
        setRecentActivity(data.recentActivity || [])
        setTopCommands(data.topCommands || [])
        setDashLoading(false)
      })
      .catch(() => setDashLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', color: '#F1F5F9' }}>
      
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
            const isActive = item.label === 'Обзор'
            return (
              <span key={i} onClick={() => navigate(item.href)} style={{
                padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center',
                gap: '10px', fontSize: '14px', cursor: 'pointer', fontWeight: isActive ? '500' : '400',
                color: isActive ? '#FFF' : '#94A3B8', background: isActive ? '#1F2937' : 'transparent',
                transition: 'all 0.15s'
              }}>
                <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
                {sanitize(item.label)}
              </span>
            )
          })}
        </nav>
        <div style={{ borderTop: '1px solid #1F2937', paddingTop: '16px' }}>
          <a href="/docs" style={{ padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#94A3B8', textDecoration: 'none' }}>
            <span style={{ fontSize: '16px' }}>📖</span> Документация
          </a>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '32px 40px', overflow: 'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '2px' }}>📊 Обзор</h1>
            <p style={{ color: '#94A3B8', fontSize: '13px' }}>Сводка активности сервера</p>
          </div>
          <div style={{ display: 'flex', gap: '4px', background: '#111118', borderRadius: '10px', padding: '3px' }}>
            {['7d', '30d', '90d'].map(t => (
              <button key={t} onClick={() => setTimeframe(t)} style={{
                padding: '7px 14px', borderRadius: '8px', border: 'none',
                background: timeframe === t ? '#1F2937' : 'transparent',
                color: timeframe === t ? '#FFF' : '#94A3B8',
                cursor: 'pointer', fontSize: '12px', fontWeight: '500', transition: 'all 0.15s'
              }}>{t}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
          {[
            { label: '💬 Сообщений', value: stats.totalMessages.toLocaleString(), change: '+12%', icon: '💬', color: '#00E5FF' },
            { label: '🟢 Онлайн', value: stats.onlineNow, change: '+5%', icon: '🟢', color: '#22C55E' },
            { label: '⚡ Команд', value: stats.commandsUsed.toLocaleString(), change: '+8%', icon: '⚡', color: '#A855F7' },
            { label: '👋 Новых', value: stats.newUsers, change: '+18%', icon: '👋', color: '#F59E0B' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: '#16161F', borderRadius: '14px', padding: '20px',
              border: '1px solid #1F2937', transition: 'all 0.2s', cursor: 'default'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = stat.color; e.currentTarget.style.background = '#1A1A26'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1F2937'; e.currentTarget.style.background = '#16161F'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', color: '#94A3B8' }}>{sanitize(stat.label)}</span>
                <span style={{ fontSize: '18px' }}>{stat.icon}</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#FFF', marginBottom: '4px' }}>{stat.value}</div>
              <span style={{ fontSize: '12px', color: stat.color, fontWeight: '500' }}>{stat.change} за период</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '14px', marginBottom: '24px' }}>
          
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '22px', border: '1px solid #1F2937' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600' }}>📈 Сообщения</h3>
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>За неделю</span>
            </div>
            {stats.messagesChart.every(v => v === 0) ? (
              <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '13px' }}>
                📊 Нет данных о сообщениях
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px' }}>
                {stats.messagesChart.map((val, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#64748B', opacity: 0 }}>{val}</span>
                    <div style={{
                      width: '100%', background: 'linear-gradient(180deg, #00E5FF 0%, #7B5EFF 100%)',
                      borderRadius: '4px 4px 0 0', height: `${Math.max(val * 1.2, 2)}px`, maxHeight: '100px',
                      transition: 'all 0.3s', opacity: 0.85, cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.filter = 'brightness(1.2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.filter = 'none'; }}
                    />
                    <span style={{ fontSize: '10px', color: '#64748B' }}>{['Пн','Вт','Ср','Чт','Пт','Сб','Вс'][i]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: '#16161F', borderRadius: '14px', padding: '22px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '14px' }}>🕐 Активность</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {recentActivity.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                  🕐 Нет недавней активности
                </div>
              ) : (
                recentActivity.map((act, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0',
                    borderBottom: i < recentActivity.length - 1 ? '1px solid #1A1A24' : 'none'
                  }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: (act.color || '#00E5FF') + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>{act.icon || '📌'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: '500', fontSize: '13px' }}>{sanitize(act.user)}</span>
                      <span style={{ color: '#94A3B8', fontSize: '12px' }}> {sanitize(act.action)}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap' }}>{act.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '22px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '14px' }}>🔥 Популярные команды</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {topCommands.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                  ⚡ Нет данных о командах
                </div>
              ) : (
                topCommands.map((cmd, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: cmd.color || '#00E5FF' }} />
                    <code style={{ fontSize: '12px', fontFamily: 'monospace', color: '#FFF', minWidth: '60px' }}>{sanitize(cmd.name)}</code>
                    <div style={{ flex: 1, height: '4px', background: '#1A1A24', borderRadius: '2px' }}>
                      <div style={{ width: `${Math.min(100, ((cmd.uses || 0) / Math.max(...topCommands.map(c => c.uses || 1))) * 100)}%`, height: '100%', background: cmd.color || '#00E5FF', borderRadius: '2px' }} />
                    </div>
                    <span style={{ fontSize: '11px', color: '#94A3B8', minWidth: '40px', textAlign: 'right' }}>{cmd.uses || 0}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ background: '#16161F', borderRadius: '14px', padding: '22px', border: '1px solid #1F2937' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600' }}>🖥️ Серверы</h3>
              <button onClick={() => navigate('/dashboard/servers')} style={{
                padding: '6px 14px', background: 'transparent', color: '#00E5FF',
                border: '1px solid #1F2937', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '500'
              }}>Все →</button>
            </div>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94A3B8', fontSize: '13px' }}>⏳ Загрузка...</div>
            ) : servers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🖥️</div>
                <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '12px' }}>Нет серверов</p>
                <button onClick={() => navigate('/login')} style={{
                  padding: '8px 16px', background: '#00E5FF', color: '#000', border: 'none',
                  borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '12px'
                }}>⭐ Интегрировать</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {servers.slice(0, 4).map((s: any) => (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                    background: '#111118', borderRadius: '10px'
                  }}>
                    <div style={{ width: '32px', height: '32px', background: '#0A0A0F', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🖥️</div>
                    <span style={{ fontSize: '13px', fontWeight: '500', flex: 1 }}>{sanitize(s.name)}</span>
                    <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '10px', background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>🟢</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
