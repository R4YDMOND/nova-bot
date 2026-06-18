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

  const toggleSource = (index: number) => {
    const newSources = [...xpSources]
    newSources[index].enabled = !newSources[index].enabled
    setXpSources(newSources)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', color: '#F1F5F9' }}>
      
      {/* Top Bar */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '16px 40px', background: '#111118',
        borderBottom: '1px solid #1F2937'
      }}>
        <a href="/dashboard/modules" style={{
          color: '#94A3B8', textDecoration: 'none', fontSize: '14px',
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>← Модули</a>
        <span style={{ color: '#374151' }}>/</span>
        <span style={{ color: '#00E5FF', fontSize: '14px', fontWeight: '500' }}>Система уровней</span>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
        
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>🏆 Система уровней</h1>
          <p style={{ color: '#94A3B8', fontSize: '15px' }}>Гибкая настройка опыта, наград и множителей для вашего сервера</p>
        </div>

        {/* Сетка из двух колонок */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          {/* === ИСТОЧНИКИ XP === */}
          <div style={{
            background: '#16161F', borderRadius: '20px', padding: '28px',
            border: '1px solid #1F2937'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📊</span> Источники опыта
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {xpSources.map((source, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#111118', borderRadius: '10px', padding: '12px 14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={source.enabled} onChange={() => toggleSource(i)} style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: source.enabled ? '#00E5FF' : '#374151', borderRadius: '20px', transition: '0.3s' }}>
                        <span style={{ position: 'absolute', height: '14px', width: '14px', left: source.enabled ? '20px' : '3px', bottom: '3px', background: '#FFF', borderRadius: '50%', transition: '0.3s' }} />
                      </span>
                    </label>
                    <span style={{ fontSize: '13px', color: source.enabled ? '#FFF' : '#64748B' }}>{source.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input type="number" value={source.value} readOnly={!source.enabled} style={{
                      width: '55px', padding: '6px 8px', background: '#0A0A0F',
                      border: '1px solid #1F2937', borderRadius: '8px', color: source.enabled ? '#FFF' : '#374151',
                      textAlign: 'center', fontSize: '13px', opacity: source.enabled ? 1 : 0.5
                    }} />
                    <span style={{ fontSize: '11px', color: '#64748B' }}>XP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* === МНОЖИТЕЛИ === */}
          <div style={{
            background: '#16161F', borderRadius: '20px', padding: '28px',
            border: '1px solid #1F2937'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎚️</span> Множители
            </h2>
            
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '12px', marginBottom: '4px' }}>Буст-каналы</label>
              <input type="text" value={boostChannels} onChange={(e) => setBoostChannels(e.target.value)} style={{
                width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937',
                borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none'
              }} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '12px', marginBottom: '4px' }}>Буст-роли</label>
              <input type="text" value={boostRoles} onChange={(e) => setBoostRoles(e.target.value)} style={{
                width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937',
                borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none'
              }} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#94A3B8', fontSize: '12px' }}>Множитель XP</span>
                <span style={{ color: '#00E5FF', fontWeight: 'bold', fontSize: '14px' }}>x{multiplier}</span>
              </div>
              <input type="range" min="1" max="5" step="0.5" value={multiplier} onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#00E5FF' }} />
            </div>
          </div>

          {/* === НАГРАДЫ === */}
          <div style={{
            background: '#16161F', borderRadius: '20px', padding: '28px',
            border: '1px solid #1F2937', gridColumn: '1 / 3'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🎖️</span> Награды за уровни
              </h2>
              <button style={{
                padding: '8px 16px', background: '#00E5FF', color: '#000',
                border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px'
              }}>+ Добавить</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {rewards.map((reward, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: '#111118', borderRadius: '10px', padding: '12px 14px'
                }}>
                  <span style={{ color: reward.color, fontWeight: 'bold', fontSize: '14px', minWidth: '40px' }}>Ур. {reward.level}</span>
                  <span style={{ color: '#94A3B8' }}>→</span>
                  <span style={{ color: '#FFF', fontSize: '13px', flex: 1 }}>{reward.role}</span>
                  <span style={{ color: '#EF4444', cursor: 'pointer', fontSize: '14px' }}>✕</span>
                </div>
              ))}
            </div>
          </div>

          {/* === УВЕДОМЛЕНИЯ === */}
          <div style={{
            background: '#16161F', borderRadius: '20px', padding: '28px',
            border: '1px solid #1F2937'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔔</span> Уведомления
            </h2>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '12px', marginBottom: '4px' }}>Канал</label>
              <input type="text" value={notifyChannel} onChange={(e) => setNotifyChannel(e.target.value)} style={{
                width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937',
                borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none'
              }} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '12px', marginBottom: '4px' }}>Сообщение</label>
              <input type="text" value={notifyMessage} onChange={(e) => setNotifyMessage(e.target.value)} style={{
                width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937',
                borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none'
              }} />
              <p style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>{'{user}, {level}, {role}'}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px' }}>Пинговать</span>
              <label style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px', cursor: 'pointer' }}>
                <input type="checkbox" checked={pingUser} onChange={() => setPingUser(!pingUser)} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: pingUser ? '#00E5FF' : '#374151', borderRadius: '20px', transition: '0.3s' }}>
                  <span style={{ position: 'absolute', height: '14px', width: '14px', left: pingUser ? '20px' : '3px', bottom: '3px', background: '#FFF', borderRadius: '50%', transition: '0.3s' }} />
                </span>
              </label>
            </div>
          </div>

          {/* === ОГРАНИЧЕНИЯ === */}
          <div style={{
            background: '#16161F', borderRadius: '20px', padding: '28px',
            border: '1px solid #1F2937'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🚫</span> Ограничения
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '12px', marginBottom: '4px' }}>Каналы без XP</label>
              <input type="text" value={blacklistChannels} onChange={(e) => setBlacklistChannels(e.target.value)} style={{
                width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937',
                borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none'
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '13px' }}>Снижение XP при неактивности</span>
                <p style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Потеря опыта через 7 дней</p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px', cursor: 'pointer' }}>
                <input type="checkbox" checked={decayEnabled} onChange={() => setDecayEnabled(!decayEnabled)} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: decayEnabled ? '#00E5FF' : '#374151', borderRadius: '20px', transition: '0.3s' }}>
                  <span style={{ position: 'absolute', height: '14px', width: '14px', left: decayEnabled ? '20px' : '3px', bottom: '3px', background: '#FFF', borderRadius: '50%', transition: '0.3s' }} />
                </span>
              </label>
            </div>
          </div>

        </div>

        {/* Кнопки */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px' }}>
          <button onClick={() => window.location.href = '/dashboard/modules'} style={{
            padding: '12px 24px', background: 'transparent', color: '#94A3B8',
            border: '1px solid #1F2937', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '14px'
          }}>← Назад к модулям</button>
          <button style={{
            padding: '12px 28px', background: '#00E5FF', color: '#000',
            border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '14px'
          }}>Сохранить настройки</button>
        </div>

      </div>
    </div>
  )
}
