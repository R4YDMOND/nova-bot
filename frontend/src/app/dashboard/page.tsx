"use client"

import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const navigate = (url: string) => window.location.href = url

const SIDEBAR_ITEMS = [
  { icon: '📊', label: 'Обзор', href: '/dashboard' },
  { icon: '🖥️', label: 'Мои серверы', href: '/dashboard' },
  { icon: '🧩', label: 'Модули', href: '/dashboard/modules' },
  { icon: '✨', label: 'AI-Настройки', href: '/dashboard/ai' },
  { icon: '⚡', label: 'Команды', href: '/dashboard/commands' },
]

function Sidebar({ activeLabel }: { activeLabel: string }) {
  return (
    <aside style={{ width: '240px', minWidth: '240px', background: '#111118', borderRight: '1px solid #1F2937', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '32px' }}>
        <div style={{ width: '34px', height: '34px', background: '#16161F', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#00E5FF', fontSize: '17px' }}>N</div>
        <span style={{ fontSize: '19px', fontWeight: 'bold', color: '#FFF' }}>Нова</span>
      </a>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        {SIDEBAR_ITEMS.map((item, i) => {
          const isActive = item.label === activeLabel
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
  )
}

export default function Dashboard() {
  const [servers, setServers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/api/servers`)
      .then(res => res.json())
      .then(data => { setServers(data.servers || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', color: '#F1F5F9' }}>
      <Sidebar activeLabel="Мои серверы" />
      
      <main style={{ flex: 1, padding: '40px 48px', overflow: 'auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>Мои серверы</h1>
          <p style={{ color: '#94A3B8', fontSize: '14px' }}>Управляйте серверами где установлен бот Нова</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Всего серверов', value: servers.length, color: '#00E5FF' },
            { label: 'Активных', value: servers.length, color: '#22C55E' },
            { label: 'Модулей доступно', value: '6', color: '#7B5EFF' },
            { label: 'Время ответа', value: '<0.8s', color: '#F59E0B' },
          ].map((stat, i) => (
            <div key={i} style={{ background: '#16161F', borderRadius: '14px', padding: '20px 24px', border: '1px solid #1F2937' }}>
              <div style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '8px' }}>{stat.label}</div>
              <div style={{ color: stat.color, fontSize: '28px', fontWeight: 'bold' }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#16161F', borderRadius: '14px', border: '1px solid #1F2937', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #1F2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Список серверов</h2>
            <button onClick={() => navigate('/login')} style={{ padding: '10px 20px', background: '#00E5FF', color: '#000', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
              + Добавить сервер
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>Загрузка...</div>
          ) : servers.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🖥️</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Нет подключённых серверов</h3>
              <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '20px' }}>Добавьте ваш первый сервер</p>
              <button onClick={() => navigate('/login')} style={{ padding: '12px 24px', background: '#00E5FF', color: '#000', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>
                ⭐ Интегрировать Нова
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1F2937' }}>
                  {['Сервер', 'ID', 'Статус', 'Действия'].map((h, i) => (
                    <th key={i} style={{ padding: '14px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {servers.map((server: any) => (
                  <tr key={server.id} style={{ borderBottom: '1px solid #1F2937' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', background: '#0A0A0F', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🖥️</div>
                        <span style={{ fontWeight: '500' }}>{server.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', color: '#94A3B8', fontSize: '14px' }}>{server.id}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>🟢 Активен</span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <button onClick={() => navigate('/dashboard/modules')} style={{ padding: '8px 16px', background: 'transparent', color: '#00E5FF', border: '1px solid #1F2937', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', marginRight: '8px' }}>Настроить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
