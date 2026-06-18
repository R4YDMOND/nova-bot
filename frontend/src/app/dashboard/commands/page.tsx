"use client"

import { useState } from 'react'

interface Command {
  name: string; desc: string; category: string; enabled: boolean; usage: string; cooldown: number;
  allowedRoles: string; deleteAfter: boolean; logUsage: boolean; replyStyle: string;
}

export default function CommandsPage() {
  const [commands, setCommands] = useState<Command[]>([
    { name: '/ping', desc: 'Проверка работы бота', category: 'Основные', enabled: true, usage: '/ping', cooldown: 3, allowedRoles: '', deleteAfter: false, logUsage: false, replyStyle: 'text' },
    { name: '/help', desc: 'Список всех команд', category: 'Основные', enabled: true, usage: '/help [команда]', cooldown: 5, allowedRoles: '', deleteAfter: false, logUsage: true, replyStyle: 'embed' },
    { name: '/stats', desc: 'Статистика сервера', category: 'Основные', enabled: true, usage: '/stats [@user]', cooldown: 10, allowedRoles: '', deleteAfter: false, logUsage: true, replyStyle: 'embed' },
    { name: '/ban', desc: 'Забанить пользователя', category: 'Модерация', enabled: true, usage: '/ban @user [причина]', cooldown: 0, allowedRoles: '@модер, @админ', deleteAfter: true, logUsage: true, replyStyle: 'text' },
    { name: '/kick', desc: 'Выгнать пользователя', category: 'Модерация', enabled: true, usage: '/kick @user [причина]', cooldown: 0, allowedRoles: '@модер, @админ', deleteAfter: true, logUsage: true, replyStyle: 'text' },
    { name: '/mute', desc: 'Замутить пользователя', category: 'Модерация', enabled: true, usage: '/mute @user [минуты]', cooldown: 0, allowedRoles: '@модер, @админ', deleteAfter: true, logUsage: true, replyStyle: 'text' },
    { name: '/clear', desc: 'Очистить сообщения', category: 'Модерация', enabled: false, usage: '/clear [количество]', cooldown: 5, allowedRoles: '@модер, @админ', deleteAfter: true, logUsage: true, replyStyle: 'text' },
    { name: '/rank', desc: 'Показать уровень', category: 'Уровни', enabled: true, usage: '/rank [@user]', cooldown: 5, allowedRoles: '', deleteAfter: false, logUsage: false, replyStyle: 'embed' },
    { name: '/top', desc: 'Топ участников', category: 'Уровни', enabled: true, usage: '/top [количество]', cooldown: 15, allowedRoles: '', deleteAfter: false, logUsage: false, replyStyle: 'embed' },
    { name: '/play', desc: 'Включить музыку', category: 'Музыка', enabled: false, usage: '/play [название/ссылка]', cooldown: 3, allowedRoles: '@DJ', deleteAfter: true, logUsage: true, replyStyle: 'text' },
    { name: '/skip', desc: 'Пропустить трек', category: 'Музыка', enabled: false, usage: '/skip', cooldown: 2, allowedRoles: '@DJ', deleteAfter: true, logUsage: true, replyStyle: 'text' },
    { name: '/ai', desc: 'Спросить у AI', category: 'AI', enabled: true, usage: '/ai [вопрос]', cooldown: 5, allowedRoles: '', deleteAfter: false, logUsage: true, replyStyle: 'text' },
  ])

  const [saved, setSaved] = useState(false)
  const [activeCategory, setActiveCategory] = useState('Все')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingCommand, setEditingCommand] = useState<Command | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCommand, setNewCommand] = useState<Command>({
    name: '', desc: '', category: 'Основные', enabled: true, usage: '', cooldown: 3,
    allowedRoles: '', deleteAfter: false, logUsage: false, replyStyle: 'text'
  })

  const categories = ['Все', 'Основные', 'Модерация', 'Уровни', 'Музыка', 'AI']

  const filtered = commands.filter(c => {
    const matchCat = activeCategory === 'Все' || c.category === activeCategory
    const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.desc.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCat && matchSearch
  })

  const toggle = (name: string) => {
    setCommands(commands.map(c => c.name === name ? { ...c, enabled: !c.enabled } : c))
  }

  const deleteCommand = (name: string) => {
    setCommands(commands.filter(c => c.name !== name))
  }

  const addCommand = () => {
    if (!newCommand.name || !newCommand.desc) return
    setCommands([...commands, { ...newCommand, name: newCommand.name.startsWith('/') ? newCommand.name : '/' + newCommand.name }])
    setNewCommand({ name: '', desc: '', category: 'Основные', enabled: true, usage: '', cooldown: 3, allowedRoles: '', deleteAfter: false, logUsage: false, replyStyle: 'text' })
    setShowAddForm(false)
  }

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const resetAll = () => {
    setCommands([
      { name: '/ping', desc: 'Проверка работы бота', category: 'Основные', enabled: true, usage: '/ping', cooldown: 3, allowedRoles: '', deleteAfter: false, logUsage: false, replyStyle: 'text' },
      { name: '/help', desc: 'Список всех команд', category: 'Основные', enabled: true, usage: '/help [команда]', cooldown: 5, allowedRoles: '', deleteAfter: false, logUsage: true, replyStyle: 'embed' },
      { name: '/stats', desc: 'Статистика сервера', category: 'Основные', enabled: true, usage: '/stats [@user]', cooldown: 10, allowedRoles: '', deleteAfter: false, logUsage: true, replyStyle: 'embed' },
      { name: '/ban', desc: 'Забанить пользователя', category: 'Модерация', enabled: true, usage: '/ban @user [причина]', cooldown: 0, allowedRoles: '@модер, @админ', deleteAfter: true, logUsage: true, replyStyle: 'text' },
      { name: '/kick', desc: 'Выгнать пользователя', category: 'Модерация', enabled: true, usage: '/kick @user [причина]', cooldown: 0, allowedRoles: '@модер, @админ', deleteAfter: true, logUsage: true, replyStyle: 'text' },
      { name: '/rank', desc: 'Показать уровень', category: 'Уровни', enabled: true, usage: '/rank [@user]', cooldown: 5, allowedRoles: '', deleteAfter: false, logUsage: false, replyStyle: 'embed' },
      { name: '/ai', desc: 'Спросить у AI', category: 'AI', enabled: true, usage: '/ai [вопрос]', cooldown: 5, allowedRoles: '', deleteAfter: false, logUsage: true, replyStyle: 'text' },
    ])
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', color: '#F1F5F9' }}>
      
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 40px', background: '#111118', borderBottom: '1px solid #1F2937',
        position: 'sticky', top: 0, zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{ width: '32px', height: '32px', background: '#16161F', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#00E5FF', fontSize: '16px' }}>N</div>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFF' }}>Нова</span>
          </a>
          <span style={{ color: '#374151' }}>|</span>
          <a href="/dashboard/modules" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '14px' }}>← Модули</a>
          <span style={{ color: '#374151' }}>/</span>
          <span style={{ color: '#00E5FF', fontSize: '14px', fontWeight: '500' }}>Команды</span>
        </div>
        <button onClick={save} style={{
          padding: '10px 22px', background: saved ? '#22C55E' : '#00E5FF', color: '#000',
          border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
          transition: 'all 0.25s'
        }}>{saved ? '✅ Сохранено!' : '💾 Сохранить'}</button>
      </header>

      <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '6px' }}>⚡ Команды</h1>
            <p style={{ color: '#94A3B8', fontSize: '15px' }}>Управляйте командами бота и создавайте новые</p>
          </div>
        </div>

        {/* Панель инструментов */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                padding: '7px 16px', borderRadius: '20px', border: '1px solid #1F2937',
                background: activeCategory === cat ? '#1F2937' : 'transparent',
                color: activeCategory === cat ? '#FFF' : '#94A3B8',
                cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.15s'
              }}>{cat}</button>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Поиск команд..."
              style={{ padding: '8px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none', width: '200px' }} />
            <button onClick={() => setShowAddForm(!showAddForm)} style={{
              padding: '8px 16px', background: showAddForm ? '#1F2937' : '#00E5FF', color: showAddForm ? '#FFF' : '#000',
              border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px', transition: 'all 0.15s'
            }}>{showAddForm ? '✕ Отмена' : '+ Добавить'}</button>
          </div>
        </div>

        {/* Форма добавления */}
        {showAddForm && (
          <div style={{ background: '#16161F', borderRadius: '16px', padding: '20px', marginBottom: '20px', border: '1px solid #1F2937', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <input type="text" value={newCommand.name} onChange={(e) => setNewCommand({ ...newCommand, name: e.target.value })}
              placeholder="/команда" style={{ padding: '10px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px' }} />
            <input type="text" value={newCommand.desc} onChange={(e) => setNewCommand({ ...newCommand, desc: e.target.value })}
              placeholder="Описание" style={{ padding: '10px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px' }} />
            <select value={newCommand.category} onChange={(e) => setNewCommand({ ...newCommand, category: e.target.value })}
              style={{ padding: '10px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px' }}>
              {categories.filter(c => c !== 'Все').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={addCommand} style={{ gridColumn: '1 / 4', padding: '10px', background: '#00E5FF', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              ✅ Добавить команду
            </button>
          </div>
        )}

        {/* Статистика */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Всего команд', value: commands.length, color: '#00E5FF' },
            { label: 'Активных', value: commands.filter(c => c.enabled).length, color: '#22C55E' },
            { label: 'Отключено', value: commands.filter(c => !c.enabled).length, color: '#EF4444' },
            { label: 'Категорий', value: categories.length - 1, color: '#A855F7' },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, background: '#16161F', borderRadius: '12px', padding: '16px', border: '1px solid #1F2937' }}>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Таблица команд */}
        <div style={{ background: '#16161F', borderRadius: '16px', border: '1px solid #1F2937', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1F2937' }}>
                {['Команда', 'Описание', 'Категория', 'Кулдаун', 'Роли', 'Статус', ''].map((h, i) => (
                  <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((cmd, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1F2937', transition: 'all 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#1A1A24'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <code style={{ background: '#0A0A0F', padding: '4px 10px', borderRadius: '6px', color: '#00E5FF', fontSize: '13px', fontFamily: 'monospace' }}>{cmd.name}</code>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cmd.desc}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', background: '#0A0A0F', color: '#94A3B8' }}>{cmd.category}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: '#94A3B8' }}>{cmd.cooldown}с</td>
                  <td style={{ padding: '12px 16px', fontSize: '11px', color: '#64748B', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cmd.allowedRoles || 'Все'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div onClick={() => toggle(cmd.name)} style={{ width: '40px', height: '24px', background: cmd.enabled ? '#00E5FF' : '#374151', borderRadius: '24px', cursor: 'pointer', transition: '0.25s', position: 'relative' }}>
                      <div style={{ position: 'absolute', height: '18px', width: '18px', left: cmd.enabled ? '20px' : '3px', top: '3px', background: cmd.enabled ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} />
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => deleteCommand(cmd.name)} style={{
                      padding: '4px 8px', background: 'transparent', color: '#EF4444', border: '1px solid #374151',
                      borderRadius: '6px', cursor: 'pointer', fontSize: '11px'
                    }}>✕</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Команды не найдены</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Кнопки */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
          <button onClick={() => window.location.href = '/dashboard/modules'} style={{
            padding: '12px 24px', background: 'transparent', color: '#94A3B8',
            border: '1px solid #1F2937', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '14px'
          }}>← Назад к модулям</button>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={resetAll} style={{
              padding: '12px 20px', background: 'transparent', color: '#EF4444',
              border: '1px solid #374151', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '14px'
            }}>🔄 Сбросить</button>
            <button onClick={save} style={{
              padding: '12px 28px', background: saved ? '#22C55E' : '#00E5FF', color: '#000',
              border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '14px',
              transition: 'all 0.3s', boxShadow: saved ? '0 0 20px rgba(34,197,94,0.3)' : '0 0 20px rgba(0,229,255,0.2)'
            }}>{saved ? '✅ Сохранено!' : '💾 Сохранить настройки'}</button>
          </div>
        </div>

        {saved && (
          <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#22C55E', color: '#000', padding: '14px 24px', borderRadius: '14px', fontWeight: '600', fontSize: '15px', zIndex: 1000, boxShadow: '0 4px 25px rgba(34,197,94,0.4)', animation: 'slideUp 0.3s ease' }}>
            ✅ Настройки команд сохранены!
          </div>
        )}
        <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      </main>
    </div>
  )
}
