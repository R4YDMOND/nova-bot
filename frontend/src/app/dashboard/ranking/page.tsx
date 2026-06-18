"use client"

import { useState } from 'react'

export default function RankingPage() {
  const [xpSources, setXpSources] = useState([
    { name: 'За сообщение', key: 'message', value: 10, enabled: true },
    { name: 'За минуту в голосовом', key: 'voice', value: 5, enabled: true },
    { name: 'За реакцию', key: 'reaction', value: 2, enabled: false },
    { name: 'За участие в ивенте', key: 'event', value: 50, enabled: false },
  ])

  const [boostChannels, setBoostChannels] = useState('#general, #чат')
  const [boostRoles, setBoostRoles] = useState('@vip, @boost')
  const [multiplier, setMultiplier] = useState(2)

  const [rewards, setRewards] = useState([
    { level: 5, role: '@новичок', color: '#22C55E' },
    { level: 10, role: '@продвинутый', color: '#3B82F6' },
    { level: 25, role: '@эксперт', color: '#F59E0B' },
    { level: 50, role: '@легенда', color: '#EF4444' },
  ])

  const [notifyChannel, setNotifyChannel] = useState('#уровни')
  const [notifyMessage, setNotifyMessage] = useState('🎉 {user} достиг {level} уровня!')
  const [pingUser, setPingUser] = useState(true)

  const [blacklistChannels, setBlacklistChannels] = useState('#спам, #флуд')
  const [decayEnabled, setDecayEnabled] = useState(false)

  const navigate = (url: string) => window.location.href = url

  const toggleSource = (index: number) => {
    const newSources = [...xpSources]
    newSources[index].enabled = !newSources[index].enabled
    setXpSources(newSources)
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
            const isActive = item.label === 'Система уровней'
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
      <main style={{ flex: 1, padding: '40px', overflow: 'auto', maxWidth: '900px' }}>
        
        {/* Хлебные крошки */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px', fontSize: '13px', color: '#64748B' }}>
          <a href="/dashboard" style={{ color: '#64748B', textDecoration: 'none' }}>Центр управления</a>
          <span>/</span>
          <a href="/dashboard/modules" style={{ color: '#64748B', textDecoration: 'none' }}>Модули</a>
          <span>/</span>
          <span style={{ color: '#00E5FF' }}>Система уровней</span>
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '8px' }}>🏆 Система уровней</h1>
        <p style={{ color: '#94A3B8', fontSize: '15px', marginBottom: '40px' }}>Гибкая настройка опыта, наград и множителей</p>

        {/* Источники XP */}
        <div style={{ background: '#16161F', borderRadius: '20px', padding: '28px', marginBottom: '20px', border: '1px solid #1F2937' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', marginBottom: '20px' }}>📊 Источники опыта</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {xpSources.map((source, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#111118', borderRadius: '12px', padding: '14px 18px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={source.enabled} onChange={() => toggleSource(i)} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: source.enabled ? '#00E5FF' : '#374151', borderRadius: '22px', transition: '0.3s' }}>
                      <span style={{ position: 'absolute', height: '16px', width: '16px', left: source.enabled ? '22px' : '3px', bottom: '3px', background: '#FFF', borderRadius: '50%', transition: '0.3s' }} />
                    </span>
                  </label>
                  <span style={{ fontSize: '15px', color: source.enabled ? '#FFFFFF' : '#64748B' }}>{source.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="number" value={source.value} readOnly={!source.enabled} style={{
                    width: '70px', padding: '8px 12px', background: source.enabled ? '#0A0A0F' : '#0A0A0F',
                    border: '1px solid #1F2937', borderRadius: '8px', color: source.enabled ? '#FFFFFF' : '#374151',
                    textAlign: 'center', fontSize: '14px', opacity: source.enabled ? 1 : 0.5
                  }} />
                  <span style={{ fontSize: '13px', color: '#94A3B8' }}>XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Множители */}
        <div style={{ background: '#16161F', borderRadius: '20px', padding: '28px', marginBottom: '20px', border: '1px solid #1F2937' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', marginBottom: '20px' }}>🎚️ Множители и буст</h2>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '13px', marginBottom: '6px' }}>Буст-каналы (через запятую)</label>
            <input type="text" value={boostChannels} onChange={(e) => setBoostChannels(e.target.value)} style={{
              width: '100%', padding: '12px 16px', background: '#0A0A0F', border: '1px solid #1F2937',
              borderRadius: '12px', color: '#FFFFFF', fontSize: '14px', outline: 'none'
            }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '13px', marginBottom: '6px' }}>Буст-роли (через запятую)</label>
            <input type="text" value={boostRoles} onChange={(e) => setBoostRoles(e.target.value)} style={{
              width: '100%', padding: '12px 16px', background: '#0A0A0F', border: '1px solid #1F2937',
              borderRadius: '12px', color: '#FFFFFF', fontSize: '14px', outline: 'none'
            }} />
          </div>

          <div>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '13px', marginBottom: '6px' }}>Множитель XP</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input type="range" min="1" max="5" step="0.5" value={multiplier} onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: '#00E5FF' }} />
              <span style={{ color: '#00E5FF', fontWeight: 'bold', fontSize: '18px', minWidth: '30px', textAlign: 'center' }}>x{multiplier}</span>
            </div>
          </div>
        </div>

        {/* Награды за уровни */}
        <div style={{ background: '#16161F', borderRadius: '20px', padding: '28px', marginBottom: '20px', border: '1px solid #1F2937' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>🏆 Награды за уровни</h2>
            <button style={{ padding: '8px 16px', background: '#00E5FF', color: '#000', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
              + Добавить
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rewards.map((reward, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                background: '#111118', borderRadius: '12px', padding: '14px 18px'
              }}>
                <span style={{ color: reward.color, fontWeight: 'bold', fontSize: '16px', minWidth: '50px' }}>Ур. {reward.level}</span>
                <span style={{ color: '#64748B' }}>→</span>
                <span style={{ color: '#FFFFFF', fontSize: '15px', flex: 1 }}>{reward.role}</span>
                <button style={{
                  padding: '6px 12px', background: 'transparent', color: '#EF4444',
                  border: '1px solid #374151', borderRadius: '8px', cursor: 'pointer', fontSize: '12px'
                }}>✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* Уведомления */}
        <div style={{ background: '#16161F', borderRadius: '20px', padding: '28px', marginBottom: '20px', border: '1px solid #1F2937' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', marginBottom: '20px' }}>🔔 Уведомления о повышении</h2>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '13px', marginBottom: '6px' }}>Канал для уведомлений</label>
            <input type="text" value={notifyChannel} onChange={(e) => setNotifyChannel(e.target.value)} style={{
              width: '100%', padding: '12px 16px', background: '#0A0A0F', border: '1px solid #1F2937',
              borderRadius: '12px', color: '#FFFFFF', fontSize: '14px', outline: 'none'
            }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#94A3B8', fontSize: '13px', marginBottom: '6px' }}>Текст сообщения</label>
            <input type="text" value={notifyMessage} onChange={(e) => setNotifyMessage(e.target.value)} style={{
              width: '100%', padding: '12px 16px', background: '#0A0A0F', border: '1px solid #1F2937',
              borderRadius: '12px', color: '#FFFFFF', fontSize: '14px', outline: 'none'
            }} />
            <p style={{ fontSize: '11px', color: '#64748B', marginTop: '6px' }}>Переменные: {'{user}'}, {'{level}'}, {'{role}'}</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '15px', color: '#FFFFFF' }}>Пинговать пользователя</span>
            <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px', cursor: 'pointer' }}>
              <input type="checkbox" checked={pingUser} onChange={() => setPingUser(!pingUser)} style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: pingUser ? '#00E5FF' : '#374151', borderRadius: '22px', transition: '0.3s' }}>
                <span style={{ position: 'absolute', height: '16px', width: '16px', left: pingUser ? '22px' : '3px', bottom: '3px', background: '#FFF', borderRadius: '50%', transition: '0.3s' }} />
              </span>
            </label>
          </div>
        </div>

        {/* Чёрный список */}
        <div style={{ background: '#16161F', borderRadius: '20px', padding: '28px', marginBottom: '20px', border: '1px solid #1F2937' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', marginBottom: '20px' }}>🚫 Чёрный список каналов</h2>
          <label style={{ display: 'block', color: '#94A3B8', fontSize: '13px', marginBottom: '6px' }}>Каналы без XP (через запятую)</label>
          <input type="text" value={blacklistChannels} onChange={(e) => setBlacklistChannels(e.target.value)} style={{
            width: '100%', padding: '12px 16px', background: '#0A0A0F', border: '1px solid #1F2937',
            borderRadius: '12px', color: '#FFFFFF', fontSize: '14px', outline: 'none'
          }} />
        </div>

        {/* Деградация */}
        <div style={{ background: '#16161F', borderRadius: '20px', padding: '28px', marginBottom: '20px', border: '1px solid #1F2937' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', marginBottom: '4px' }}>📉 Снижение XP при неактивности</h2>
              <p style={{ fontSize: '13px', color: '#64748B' }}>Участники теряют опыт если не активны более 7 дней</p>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer' }}>
              <input type="checkbox" checked={decayEnabled} onChange={() => setDecayEnabled(!decayEnabled)} style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: decayEnabled ? '#00E5FF' : '#374151', borderRadius: '26px', transition: '0.3s' }}>
                <span style={{ position: 'absolute', height: '20px', width: '20px', left: decayEnabled ? '26px' : '3px', bottom: '3px', background: '#FFF', borderRadius: '50%', transition: '0.3s' }} />
              </span>
            </label>
          </div>
        </div>

        {/* Кнопки */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px' }}>
          <button style={{
            padding: '14px 28px', background: 'transparent', color: '#94A3B8',
            border: '1px solid #1F2937', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '15px'
          }}>Сбросить</button>
          <button style={{
            padding: '14px 32px', background: '#00E5FF', color: '#000000',
            border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer',
            fontSize: '15px', boxShadow: '0 0 15px rgba(0, 229, 255, 0.2)'
          }}>Сохранить настройки</button>
        </div>
      </main>
    </div>
  )
}
