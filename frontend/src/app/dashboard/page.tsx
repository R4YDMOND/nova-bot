"use client"

import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const navigate = (url: string) => window.location.href = url

export default function Dashboard() {
  const [servers, setServers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/api/servers`)
      .then(res => res.json())
      .then(data => { setServers(data.servers || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const stats = {
    totalMessages: 125430,
    activeUsers: 342,
    commandsUsed: 8940,
    voiceHours: 1560,
    growth: 12.5,
    messagesChart: [30, 45, 28, 60, 52, 70, 65],
  }

  const recentActivity = [
    { user: 'Alice', action: 'достигла 42 уровня', time: '2 мин назад', icon: '📊' },
    { user: 'Bob', action: 'использовал /play', time: '5 мин назад', icon: '🎵' },
    { user: 'Charlie', action: 'получил предупреждение', time: '12 мин назад', icon: '⚠️' },
    { user: 'Diana', action: 'присоединилась к серверу', time: '28 мин назад', icon: '👋' },
    { user: 'Eve', action: 'создала команду /meme', time: '45 мин назад', icon: '⚡' },
  ]

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
            { icon: '🖥️', label: 'Мои серверы', href: '/dashboard/servers' },
            { icon: '🧩', label: 'Модули', href: '/dashboard/modules' },
            { icon: '⚡', label: 'Команды', href: '/dashboard/commands' },
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
                {item.label}
              </span>
            )
          })}
        </nav>
      </aside>

      <main style={{ flex: 1, padding: '40px 48px', overflow: 'auto' }}>
        
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>📊 Обзор сервера</h1>
          <p style={{ color: '#94A3B8', fontSize: '14px' }}>Добро пожаловать! Вот сводка за сегодня.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Всего сообщений', value: stats.totalMessages.toLocaleString(), color: '#00E5FF', icon: '💬' },
            { label: 'Активных пользователей', value: stats.activeUsers, color: '#22C55E', icon: '👥' },
            { label: 'Команд использовано', value: stats.commandsUsed.toLocaleString(), color: '#A855F7', icon: '⚡' },
            { label: 'Часов в голосовых', value: stats.voiceHours.toLocaleString(), color: '#F59E0B', icon: '🎤' },
            { label: 'Рост за неделю', value: `+${stats.growth}%`, color: '#22C55E', icon: '📈' },
            { label: 'Серверов', value: servers.length, color: '#EC4899', icon: '🖥️' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: '#16161F', borderRadius: '16px', padding: '20px 24px',
              border: '1px solid #1F2937', transition: 'all 0.2s', cursor: 'default'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = stat.color; e.currentTarget.style.boxShadow = `0 0 15px ${stat.color}20`; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1F2937'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontSize: '24px' }}>{stat.icon}</span>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', color: stat.color, marginBottom: '4px' }}>{stat.value}</div>
              <div style={{ fontSize: '13px', color: '#94A3B8' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          <div style={{ background: '#16161F', borderRadius: '16px', padding: '24px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>📈 Сообщения за 7 дней</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '140px' }}>
              {stats.messagesChart.map((val, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>{val}</span>
                  <div style={{
                    width: '100%', background: 'linear-gradient(180deg, #00E5FF 0%, #7B5EFF 100%)',
                    borderRadius: '6px 6px 0 0', height: `${val}%`, maxHeight: '100px',
                    transition: 'all 0.3s', opacity: 0.8
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
                  />
                  <span style={{ fontSize: '10px', color: '#64748B' }}>{['Пн','Вт','Ср','Чт','Пт','Сб','Вс'][i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#16161F', borderRadius: '16px', padding: '24px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>🕐 Последняя активность</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {recentActivity.map((act, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0',
                  borderBottom: i < recentActivity.length - 1 ? '1px solid #1F2937' : 'none'
                }}>
                  <span style={{ fontSize: '20px' }}>{act.icon}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: '500', fontSize: '14px' }}>{act.user}</span>
                    <span style={{ color: '#94A3B8', fontSize: '13px' }}> {act.action}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '32px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { label: '🧩 Модули', href: '/dashboard/modules', color: '#00E5FF' },
            { label: '⚡ Команды', href: '/dashboard/commands', color: '#A855F7' },
            { label: '🖥️ Серверы', href: '/dashboard/servers', color: '#F59E0B' },
            { label: '📖 Документация', href: '/docs', color: '#22C55E' },
          ].map((btn, i) => (
            <button key={i} onClick={() => navigate(btn.href)} style={{
              padding: '12px 20px', background: '#16161F', color: btn.color,
              border: '1px solid #1F2937', borderRadius: '12px', fontWeight: '600',
              cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = btn.color; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1F2937'; }}
            >{btn.label}</button>
          ))}
        </div>
      </main>
    </div>
  )
}
