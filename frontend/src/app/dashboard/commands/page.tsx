"use client"

import { useState } from 'react'

const navigate = (url: string) => window.location.href = url

export default function CommandsPage() {
  const [commands, setCommands] = useState([
    { name: '/ping', desc: 'Проверка бота', category: 'Основные', enabled: true, cooldown: 3, allowedRoles: '' },
    { name: '/help', desc: 'Список команд', category: 'Основные', enabled: true, cooldown: 5, allowedRoles: '' },
    { name: '/stats', desc: 'Статистика', category: 'Основные', enabled: true, cooldown: 10, allowedRoles: '' },
    { name: '/ban', desc: 'Забанить', category: 'Модерация', enabled: true, cooldown: 0, allowedRoles: '@модер, @админ' },
    { name: '/kick', desc: 'Выгнать', category: 'Модерация', enabled: true, cooldown: 0, allowedRoles: '@модер, @админ' },
    { name: '/mute', desc: 'Замутить', category: 'Модерация', enabled: true, cooldown: 0, allowedRoles: '@модер, @админ' },
    { name: '/clear', desc: 'Очистить чат', category: 'Модерация', enabled: false, cooldown: 5, allowedRoles: '@админ' },
    { name: '/rank', desc: 'Уровень', category: 'Уровни', enabled: true, cooldown: 5, allowedRoles: '' },
    { name: '/top', desc: 'Топ участников', category: 'Уровни', enabled: true, cooldown: 15, allowedRoles: '' },
    { name: '/play', desc: 'Музыка', category: 'Музыка', enabled: false, cooldown: 3, allowedRoles: '@DJ' },
    { name: '/ai', desc: 'Спросить AI', category: 'AI', enabled: true, cooldown: 5, allowedRoles: '' },
  ])

  const [saved, setSaved] = useState(false)
  const [activeCategory, setActiveCategory] = useState('Все')
  const [searchQuery, setSearchQuery] = useState('')
  const categories = ['Все', 'Основные', 'Модерация', 'Уровни', 'Музыка', 'AI']

  const filtered = commands.filter(c => {
    const matchCat = activeCategory === 'Все' || c.category === activeCategory
    const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.desc.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchSearch
  })

  const toggle = (name: string) => setCommands(commands.map(c => c.name === name ? { ...c, enabled: !c.enabled } : c))
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

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
            const isActive = item.label === 'Команды'
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
      <main style={{ flex: 1, padding: '40px 48px', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>⚡ Команды</h1>
            <p style={{ color: '#94A3B8', fontSize: '14px' }}>Управляйте доступными командами бота</p>
          </div>
          <button onClick={save} style={{
            padding: '10px 22px', background: saved ? '#22C55E' : '#00E5FF', color: '#000',
            border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
            transition: 'all 0.25s'
          }}>{saved ? '✅ Сохранено' : '💾 Сохранить'}</button>
        </div>

        {/* Поиск + фильтры */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Поиск команд..."
            style={{ padding: '8px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none', width: '220px' }} />
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                padding: '7px 14px', borderRadius: '20px', border: '1px solid #1F2937',
                background: activeCategory === cat ? '#1F2937' : 'transparent',
                color: activeCategory === cat ? '#FFF' : '#94A3B8',
                cursor: 'pointer', fontSize: '12px', fontWeight: '500', transition: 'all 0.15s'
              }}>{cat}</button>
            ))}
          </div>
        </div>

        {/* Таблица */}
        <div style={{ background: '#16161F', borderRadius: '14px', border: '1px solid #1F2937', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Команда', 'Описание', 'Категория', 'Кулдаун', 'Роли', 'Статус'].map((h, i) => (
                  <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((cmd, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1F2937' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#1A1A24'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px' }}><code style={{ background: '#0A0A0F', padding: '4px 10px', borderRadius: '6px', color: '#00E5FF', fontSize: '13px', fontFamily: 'monospace' }}>{cmd.name}</code></td>
                  <td style={{ padding: '12px 16px', fontSize: '13px' }}>{cmd.desc}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', background: '#0A0A0F', color: '#94A3B8' }}>{cmd.category}</span></td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94A3B8' }}>{cmd.cooldown}с</td>
                  <td style={{ padding: '12px 16px', fontSize: '11px', color: '#64748B' }}>{cmd.allowedRoles || 'Все'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div onClick={() => toggle(cmd.name)} style={{ width: '40px', height: '24px', background: cmd.enabled ? '#00E5FF' : '#374151', borderRadius: '24px', cursor: 'pointer', transition: '0.25s', position: 'relative' }}>
                      <div style={{ position: 'absolute', height: '18px', width: '18px', left: cmd.enabled ? '20px' : '3px', top: '3px', background: cmd.enabled ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} />
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Команды не найдены</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {saved && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#22C55E', color: '#000', padding: '12px 24px', borderRadius: '12px', fontWeight: '600', fontSize: '14px', zIndex: 1000, boxShadow: '0 4px 20px rgba(34,197,94,0.3)', animation: 'slideUp 0.3s ease' }}>✅ Сохранено</div>
      )}
      <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  )
}
