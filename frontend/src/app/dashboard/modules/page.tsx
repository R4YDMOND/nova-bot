"use client"

import { useState } from 'react'

interface Module {
  name: string
  icon: string
  desc: string
  enabled: boolean
  settings: { label: string; key: string; type: string; value: string | number | boolean }[]
  link?: string
}

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([
    {
      name: 'Модерация', icon: '🛡️', enabled: true,
      desc: 'Антиспам, антимат, антирейд. Безопасность 24/7.',
      settings: [
        { label: 'Уровень фильтра (1-5)', key: 'filterLevel', type: 'number', value: 3 },
        { label: 'Авто-предупреждение', key: 'autoWarn', type: 'toggle', value: true },
        { label: 'Запрещённые слова', key: 'bannedWords', type: 'text', value: 'спам,реклама' },
      ]
    },
    {
      name: 'Система уровней', icon: '📊', enabled: true,
      desc: 'Награждайте участников опытом за активность.',
      settings: [
        { label: 'XP за сообщение', key: 'xpPerMsg', type: 'number', value: 10 },
        { label: 'Множитель XP', key: 'xpMultiplier', type: 'number', value: 1.5 },
        { label: 'Показывать лидерборд', key: 'showLeaderboard', type: 'toggle', value: true },
      ],
      link: '/dashboard/ranking'
    },
    {
      name: 'AI-помощник', icon: '🤖', enabled: false,
      desc: 'Умные ответы и поддержка разговоров.',
      settings: [
        { label: 'Стиль общения', key: 'style', type: 'select', value: 'friendly' },
        { label: 'Температура (0-1)', key: 'temperature', type: 'number', value: 0.7 },
        { label: 'Использовать эмодзи', key: 'useEmoji', type: 'toggle', value: true },
      ],
      link: '/dashboard/ai'
    },
    {
      name: 'Музыка', icon: '🎵', enabled: false,
      desc: 'Воспроизведение музыки в голосовых каналах.',
      settings: [
        { label: 'Громкость по умолчанию', key: 'volume', type: 'number', value: 50 },
        { label: 'DJ-роль', key: 'djRole', type: 'text', value: 'DJ' },
        { label: 'Авто-отключение (мин)', key: 'autoDisconnect', type: 'number', value: 30 },
      ]
    },
    {
      name: 'Кастомные команды', icon: '⚡', enabled: true,
      desc: 'Создавайте свои команды без кода.',
      settings: [
        { label: 'Префикс команд', key: 'prefix', type: 'text', value: '/' },
        { label: 'Разрешить всем', key: 'allowAll', type: 'toggle', value: false },
      ],
      link: '/dashboard/commands'
    },
    {
      name: 'Аналитика', icon: '📈', enabled: false,
      desc: 'Отслеживайте рост и активность.',
      settings: [
        { label: 'Еженедельный отчёт', key: 'weeklyReport', type: 'toggle', value: true },
        { label: 'Уведомления', key: 'notifications', type: 'toggle', value: true },
      ]
    },
  ])

  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const toggleModule = (index: number) => {
    const newModules = [...modules]
    newModules[index].enabled = !newModules[index].enabled
    setModules(newModules)
  }

  const openSettings = (mod: Module) => {
    if (mod.link) {
      window.location.href = mod.link
      return
    }
    setSelectedModule(mod)
    setIsModalOpen(true)
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
            const isActive = item.label === 'Модули'
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
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '8px' }}>Модули Нова</h1>
          <p style={{ color: '#94A3B8', fontSize: '15px' }}>Сервер: TestServer • 🟢 Активен</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {modules.map((mod, i) => (
            <div key={i} style={{
              background: '#16161F', borderRadius: '16px', padding: '24px',
              border: mod.enabled ? '1px solid rgba(0, 229, 255, 0.2)' : '1px solid #1F2937',
              transition: 'all 0.2s',
              boxShadow: mod.enabled ? '0 0 15px rgba(0, 229, 255, 0.05)' : 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', background: mod.enabled ? 'rgba(0, 229, 255, 0.1)' : '#0A0A0F', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                  {mod.icon}
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={mod.enabled} onChange={() => toggleModule(i)} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: mod.enabled ? '#00E5FF' : '#374151', borderRadius: '26px', transition: '0.3s' }}>
                    <span style={{ position: 'absolute', height: '20px', width: '20px', left: mod.enabled ? '26px' : '3px', bottom: '3px', background: '#FFFFFF', borderRadius: '50%', transition: '0.3s' }} />
                  </span>
                </label>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', marginBottom: '8px' }}>{mod.name}</h3>
              <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: '1.5', marginBottom: '16px' }}>{mod.desc}</p>

              <button onClick={() => openSettings(mod)} style={{
                padding: '8px 18px', borderRadius: '8px', border: '1px solid #1F2937',
                background: 'transparent', color: '#00E5FF', cursor: 'pointer',
                fontSize: '13px', fontWeight: '500', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#00E5FF'; e.currentTarget.style.color = '#000'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#00E5FF'; }}
              >
                {mod.link ? 'Открыть настройки →' : 'Настроить →'}
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{
            padding: '14px 32px', background: '#00E5FF', color: '#000000',
            border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer',
            fontSize: '15px', boxShadow: '0 0 15px rgba(0, 229, 255, 0.2)'
          }}>
            Сохранить изменения
          </button>
        </div>
      </main>

      {/* ===== MODAL ===== */}
      {isModalOpen && selectedModule && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setIsModalOpen(false)}>
          <div style={{
            background: '#16161F', borderRadius: '24px', padding: '36px',
            width: '480px', maxWidth: '90vw', border: '1px solid #1F2937',
            boxShadow: '0 0 40px rgba(0,229,255,0.1)'
          }} onClick={(e) => e.stopPropagation()}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '32px' }}>{selectedModule.icon}</span>
                <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#FFFFFF' }}>{selectedModule.name}</h2>
              </div>
              <span onClick={() => setIsModalOpen(false)} style={{ fontSize: '22px', cursor: 'pointer', color: '#94A3B8' }}>✕</span>
            </div>

            <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '24px' }}>{selectedModule.desc}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedModule.settings.map((setting, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#111118', borderRadius: '12px', padding: '12px 16px'
                }}>
                  <span style={{ fontSize: '14px', color: '#FFFFFF' }}>{setting.label}</span>
                  
                  {setting.type === 'toggle' ? (
                    <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px', cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked={setting.value as boolean} style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: setting.value ? '#00E5FF' : '#374151', borderRadius: '22px', transition: '0.3s' }}>
                        <span style={{ position: 'absolute', height: '16px', width: '16px', left: setting.value ? '22px' : '3px', bottom: '3px', background: '#FFF', borderRadius: '50%', transition: '0.3s' }} />
                      </span>
                    </label>
                  ) : setting.type === 'number' ? (
                    <input type="number" defaultValue={setting.value as number} style={{
                      width: '80px', padding: '6px 10px', background: '#0A0A0F',
                      border: '1px solid #1F2937', borderRadius: '8px', color: '#FFFFFF',
                      textAlign: 'center', fontSize: '14px'
                    }} />
                  ) : setting.type === 'select' ? (
                    <select defaultValue={setting.value as string} style={{
                      padding: '6px 10px', background: '#0A0A0F',
                      border: '1px solid #1F2937', borderRadius: '8px', color: '#FFFFFF', fontSize: '14px'
                    }}>
                      <option value="friendly">Дружелюбный</option>
                      <option value="gaming">Игровой</option>
                      <option value="serious">Серьёзный</option>
                    </select>
                  ) : (
                    <input type="text" defaultValue={setting.value as string} style={{
                      width: '120px', padding: '6px 10px', background: '#0A0A0F',
                      border: '1px solid #1F2937', borderRadius: '8px', color: '#FFFFFF', fontSize: '14px'
                    }} />
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsModalOpen(false)} style={{
                padding: '10px 20px', background: 'transparent', color: '#94A3B8',
                border: '1px solid #1F2937', borderRadius: '10px', cursor: 'pointer', fontSize: '14px'
              }}>Закрыть</button>
              <button onClick={() => {
                alert(`Настройки модуля «${selectedModule.name}» сохранены!`)
                setIsModalOpen(false)
              }} style={{
                padding: '10px 24px', background: '#00E5FF', color: '#000',
                border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px'
              }}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
