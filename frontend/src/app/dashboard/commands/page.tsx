"use client"

import { useState } from 'react'

interface Command {
  name: string
  description: string
  usage: string
  category: string
  enabled: boolean
}

export default function CommandsPage() {
  const [commands, setCommands] = useState<Command[]>([
    { name: '/ping', description: 'Проверка работы бота', usage: '/ping', category: 'Основные', enabled: true },
    { name: '/help', description: 'Список всех команд', usage: '/help', category: 'Основные', enabled: true },
    { name: '/stats', description: 'Статистика сервера', usage: '/stats', category: 'Основные', enabled: true },
    { name: '/hello', description: 'Приветствие', usage: '/hello', category: 'Основные', enabled: true },
    { name: '/ban', description: 'Забанить пользователя', usage: '/ban @user причина', category: 'Модерация', enabled: true },
    { name: '/kick', description: 'Выгнать пользователя', usage: '/kick @user причина', category: 'Модерация', enabled: true },
    { name: '/clear', description: 'Очистить чат', usage: '/clear 10', category: 'Модерация', enabled: false },
    { name: '/rank', description: 'Показать уровень', usage: '/rank', category: 'Уровни', enabled: true },
    { name: '/top', description: 'Топ участников', usage: '/top 10', category: 'Уровни', enabled: true },
    { name: '/play', description: 'Включить музыку', usage: '/play название', category: 'Музыка', enabled: false },
    { name: '/skip', description: 'Пропустить трек', usage: '/skip', category: 'Музыка', enabled: false },
    { name: '/ai', description: 'Спросить у AI', usage: '/ai вопрос', category: 'AI', enabled: true },
  ])

  const [activeCategory, setActiveCategory] = useState('Все')

  const categories = ['Все', 'Основные', 'Модерация', 'Уровни', 'Музыка', 'AI']

  const filteredCommands = activeCategory === 'Все' 
    ? commands 
    : commands.filter(c => c.category === activeCategory)

  const toggleCommand = (index: number) => {
    const newCommands = [...commands]
    const realIndex = commands.findIndex(c => c.name === filteredCommands[index].name)
    newCommands[realIndex].enabled = !newCommands[realIndex].enabled
    setCommands(newCommands)
  }

  const navigate = (url: string) => {
    window.location.href = url
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex' }}>
      
      {/* Sidebar */}
      <aside style={{
        width: '260px', background: '#111118', borderRight: '1px solid #1F2937',
        padding: '30px 20px', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <div style={{ width: '40px', height: '40px', background: '#16161F', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#00E5FF', fontSize: '20px' }}>N</div>
          <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#FFFFFF' }}>Нова</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {[
            { icon: '📊', label: 'Обзор', href: '/dashboard' },
            { icon: '🖥️', label: 'Мои серверы', href: '/dashboard' },
            { icon: '🧩', label: 'Модули', href: '/dashboard/modules' },
            { icon: '✨', label: 'AI-Настройки', href: '/dashboard/ai' },
            { icon: '⚡', label: 'Команды', href: '/dashboard/commands' },
          ].map((item, i) => {
            const isActive = item.label === 'Команды'
            return (
              <span key={i} onClick={() => navigate(item.href)} style={{
                padding: '12px 16px', borderRadius: '12px', display: 'flex',
                alignItems: 'center', gap: '12px', fontSize: '15px', cursor: 'pointer',
                fontWeight: isActive ? '600' : '400',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                background: isActive ? '#1F2937' : 'transparent',
                transition: 'all 0.2s'
              }}>
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                {item.label}
              </span>
            )
          })}
        </nav>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '40px', overflow: 'auto' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '8px' }}>Команды Нова</h1>
          <p style={{ color: '#94A3B8', fontSize: '15px' }}>Управляйте доступными командами бота</p>
        </div>

        {/* Категории */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '30px', flexWrap: 'wrap' }}>
          {categories.map((cat, i) => (
            <button key={i} onClick={() => setActiveCategory(cat)} style={{
              padding: '8px 20px', borderRadius: '10px', border: '1px solid #1F2937',
              background: activeCategory === cat ? '#1F2937' : 'transparent',
              color: activeCategory === cat ? '#FFFFFF' : '#94A3B8',
              cursor: 'pointer', fontSize: '14px', fontWeight: '500',
              transition: 'all 0.2s'
            }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Статистика */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '30px' }}>
          <div style={{ background: '#16161F', borderRadius: '12px', padding: '16px', border: '1px solid #1F2937' }}>
            <div style={{ color: '#94A3B8', fontSize: '12px' }}>Всего команд</div>
            <div style={{ color: '#00E5FF', fontSize: '24px', fontWeight: 'bold' }}>{commands.length}</div>
          </div>
          <div style={{ background: '#16161F', borderRadius: '12px', padding: '16px', border: '1px solid #1F2937' }}>
            <div style={{ color: '#94A3B8', fontSize: '12px' }}>Активных</div>
            <div style={{ color: '#22C55E', fontSize: '24px', fontWeight: 'bold' }}>{commands.filter(c => c.enabled).length}</div>
          </div>
          <div style={{ background: '#16161F', borderRadius: '12px', padding: '16px', border: '1px solid #1F2937' }}>
            <div style={{ color: '#94A3B8', fontSize: '12px' }}>Категорий</div>
            <div style={{ color: '#7B5EFF', fontSize: '24px', fontWeight: 'bold' }}>{categories.length - 1}</div>
          </div>
        </div>

        {/* Таблица команд */}
        <div style={{ background: '#16161F', borderRadius: '16px', border: '1px solid #1F2937', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Команда', 'Описание', 'Категория', 'Статус'].map((h, i) => (
                  <th key={i} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCommands.map((cmd, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1F2937' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#1A1A24' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <td style={{ padding: '14px 20px' }}>
                    <code style={{ background: '#0A0A0F', padding: '4px 10px', borderRadius: '6px', color: '#00E5FF', fontSize: '14px', fontFamily: 'monospace' }}>{cmd.name}</code>
                  </td>
                  <td style={{ padding: '14px 20px', color: '#FFFFFF', fontSize: '14px' }}>{cmd.description}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', background: '#0A0A0F', color: '#94A3B8' }}>{cmd.category}</span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={cmd.enabled} onChange={() => toggleCommand(i)} style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: cmd.enabled ? '#00E5FF' : '#374151', borderRadius: '24px', transition: '0.3s' }}>
                        <span style={{ position: 'absolute', height: '18px', width: '18px', left: cmd.enabled ? '24px' : '3px', bottom: '3px', background: '#FFFFFF', borderRadius: '50%', transition: '0.3s' }} />
                      </span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Кнопка сохранения */}
        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{
            padding: '14px 32px', background: '#00E5FF', color: '#000000',
            border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer',
            fontSize: '15px', boxShadow: '0 0 15px rgba(0, 229, 255, 0.2)'
          }}>
            Сохранить изменения
          </button>
        </div>
      </main>
    </div>
  )
}
