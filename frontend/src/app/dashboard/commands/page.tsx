"use client"

import { useState } from 'react'

const navigate = (url: string) => window.location.href = url

export default function CommandsPage() {
  const [commands, setCommands] = useState([
    { name: '/ping', desc: 'Проверка бота', category: 'Основные', enabled: true },
    { name: '/help', desc: 'Список команд', category: 'Основные', enabled: true },
    { name: '/stats', desc: 'Статистика', category: 'Основные', enabled: true },
    { name: '/ban', desc: 'Забанить', category: 'Модерация', enabled: true },
    { name: '/kick', desc: 'Выгнать', category: 'Модерация', enabled: true },
    { name: '/rank', desc: 'Уровень', category: 'Уровни', enabled: true },
    { name: '/play', desc: 'Музыка', category: 'Музыка', enabled: false },
    { name: '/ai', desc: 'Спросить AI', category: 'AI', enabled: true },
  ])

  const [saved, setSaved] = useState(false)
  const [activeCategory, setActiveCategory] = useState('Все')
  const categories = ['Все', 'Основные', 'Модерация', 'Уровни', 'Музыка', 'AI']
  const filtered = activeCategory === 'Все' ? commands : commands.filter(c => c.category === activeCategory)

  const toggle = (name: string) => {
    setCommands(commands.map(c => c.name === name ? { ...c, enabled: !c.enabled } : c))
  }

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

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
            { icon: '🖥️', label: 'Мои серверы', href: '/dashboard' },
            { icon: '🧩', label: 'Модули', href: '/dashboard/modules' },
            { icon: '⚡', label: 'Команды', href: '/dashboard/commands' },
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

      <main style={{ flex: 1, padding: '40px 48px', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>Команды</h1>
            <p style={{ color: '#94A3B8', fontSize: '14px' }}>Управляйте доступными командами</p>
          </div>
          <button onClick={save} style={{
            padding: '10px 22px', background: saved ? '#22C55E' : '#00E5FF', color: '#000',
            border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
            transition: 'all 0.25s'
          }}>{saved ? '✅ Сохранено' : '💾 Сохранить'}</button>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              padding: '7px 16px', borderRadius: '20px', border: '1px solid #1F2937',
              background: activeCategory === cat ? '#1F2937' : 'transparent',
              color: activeCategory === cat ? '#FFF' : '#94A3B8',
              cursor: 'pointer', fontSize: '13px', fontWeight: '500'
            }}>{cat}</button>
          ))}
        </div>

        <div style={{ background: '#16161F', borderRadius: '14px', border: '1px solid #1F2937', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Команда', 'Описание', 'Категория', 'Статус'].map((h, i) => (
                  <th key={i} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((cmd, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1F2937' }}>
                  <td style={{ padding: '14px 20px' }}><code style={{ background: '#0A0A0F', padding: '4px 10px', borderRadius: '6px', color: '#00E5FF', fontSize: '13px', fontFamily: 'monospace' }}>{cmd.name}</code></td>
                  <td style={{ padding: '14px 20px', fontSize: '14px' }}>{cmd.desc}</td>
                  <td style={{ padding: '14px 20px' }}><span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', background: '#0A0A0F', color: '#94A3B8' }}>{cmd.category}</span></td>
                  <td style={{ padding: '14px 20px' }}>
                    <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '26px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={cmd.enabled} onChange={() => toggle(cmd.name)} style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: cmd.enabled ? '#00E5FF' : '#374151', borderRadius: '26px', transition: '0.25s' }}>
                        <span style={{ position: 'absolute', height: '20px', width: '20px', left: cmd.enabled ? '22px' : '4px', top: '3px', background: cmd.enabled ? '#000' : '#94A3B8', borderRadius: '50%', transition: '0.25s' }} />
                      </span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
