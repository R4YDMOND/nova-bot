"use client"

import { useState, useEffect } from 'react'

interface Server {
  id: number
  name: string
}

export default function Dashboard() {
  const [servers, setServers] = useState<Server[]>([])
  const [loading, setLoading] = useState(true)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetch(`${API_URL}/api/servers`)
      .then(res => res.json())
      .then(data => {
        setServers(data.servers || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex' }}>
      
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: '#111118',
        borderRight: '1px solid #1F2937',
        padding: '30px 20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Логотип */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <div style={{
            width: '40px', height: '40px', background: '#16161F',
            borderRadius: '12px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 'bold', color: '#00E5FF', fontSize: '20px'
          }}>N</div>
          <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#FFFFFF' }}>Нова</span>
        </div>

        {/* Навигация */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {[
            { icon: '📊', label: 'Обзор', href: '/dashboard', active: false },
            { icon: '🖥️', label: 'Мои серверы', href: '/dashboard', active: true },
            { icon: '🧩', label: 'Модули', href: '/dashboard/modules', active: false },
            { icon: '✨', label: 'AI-Настройки', href: '/dashboard/ai', active: false },
            { icon: '⚡', label: 'Команды', href: '/dashboard/commands', active: false },
          ].map((item, i) => (
            <a key={i} href={item.href} style={{
              padding: '12px 16px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '15px',
              fontWeight: item.active ? '600' : '400',
              color: item.active ? '#FFFFFF' : '#94A3B8',
              background: item.active ? '#1F2937' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { if (!item.active) e.currentTarget.style.background = '#1A1A24' }}
            onMouseLeave={(e) => { if (!item.active) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        {/* Нижняя часть */}
        <div style={{ borderTop: '1px solid #1F2937', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { icon: '📖', label: 'Документация' },
            { icon: '🛟', label: 'Поддержка' },
          ].map((item, i) => (
            <a key={i} href="#" style={{
              padding: '12px 16px', borderRadius: '12px', display: 'flex',
              alignItems: 'center', gap: '12px', fontSize: '15px',
              color: '#94A3B8', textDecoration: 'none', transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1A1A24' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px', overflow: 'auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '8px' }}>
            Мои серверы
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '15px' }}>
            Управляйте серверами где установлен бот Нова
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          {[
            { label: 'Всего серверов', value: servers.length, color: '#00E5FF' },
            { label: 'Активных', value: servers.length, color: '#22C55E' },
            { label: 'Модулей доступно', value: '6', color: '#7B5EFF' },
            { label: 'Время ответа', value: '<0.8s', color: '#F59E0B' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: '#16161F', borderRadius: '16px', padding: '20px 24px',
              border: '1px solid #1F2937'
            }}>
              <div style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '8px' }}>{stat.label}</div>
              <div style={{ color: stat.color, fontSize: '28px', fontWeight: 'bold' }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Servers Table */}
        <div style={{ background: '#16161F', borderRadius: '16px', border: '1px solid #1F2937', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #1F2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>Список серверов</h2>
            <button style={{
              padding: '10px 20px', background: '#00E5FF', color: '#000000',
              border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer',
              fontSize: '14px'
            }}>
              + Добавить сервер
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>
              Загрузка...
            </div>
          ) : servers.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🖥️</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', marginBottom: '8px' }}>
                Нет подключённых серверов
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '20px' }}>
                Добавьте ваш первый сервер и начните использовать Нова
              </p>
              <button style={{
                padding: '12px 24px', background: '#00E5FF', color: '#000000',
                border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer'
              }}>
                Интегрировать Нова
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1F2937' }}>
                  {['Сервер', 'ID', 'Статус', 'Действия'].map((h, i) => (
                    <th key={i} style={{
                      padding: '14px 24px', textAlign: 'left', fontSize: '13px',
                      fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {servers.map((server) => (
                  <tr key={server.id} style={{ borderBottom: '1px solid #1F2937' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#1A1A24' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px', height: '40px', background: '#0A0A0F',
                          borderRadius: '10px', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '18px'
                        }}>🖥️</div>
                        <span style={{ fontWeight: '500', color: '#FFFFFF' }}>{server.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', color: '#94A3B8', fontSize: '14px' }}>{server.id}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        padding: '4px 12px', borderRadius: '20px', fontSize: '12px',
                        fontWeight: '600', background: 'rgba(34, 197, 94, 0.15)',
                        color: '#22C55E'
                      }}>🟢 Активен</span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <button style={{
                        padding: '8px 16px', background: 'transparent', color: '#00E5FF',
                        border: '1px solid #1F2937', borderRadius: '8px', cursor: 'pointer',
                        fontSize: '13px', marginRight: '8px'
                      }}>Настроить</button>
                      <button style={{
                        padding: '8px 16px', background: 'transparent', color: '#94A3B8',
                        border: '1px solid #1F2937', borderRadius: '8px', cursor: 'pointer',
                        fontSize: '13px'
                      }}>...</button>
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
