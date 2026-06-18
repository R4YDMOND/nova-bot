"use client"

import { useState } from 'react'

interface XpSource {
  name: string; key: string; value: number; enabled: boolean
}

interface Reward {
  level: number; role: string; color: string
}

export default function RankingPage() {
  const [xpSources, setXpSources] = useState<XpSource[]>([
    { name: 'За сообщение', key: 'message', value: 10, enabled: true },
    { name: 'За минуту в голосовом', key: 'voice', value: 5, enabled: true },
    { name: 'За реакцию', key: 'reaction', value: 2, enabled: false },
    { name: 'За участие в ивенте', key: 'event', value: 50, enabled: false },
  ])

  const [boostChannels, setBoostChannels] = useState('#general, #чат')
  const [boostRoles, setBoostRoles] = useState('@vip, @boost')
  const [multiplier, setMultiplier] = useState(2)

  const [rewards, setRewards] = useState<Reward[]>([
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
  const [decayDays, setDecayDays] = useState(7)
  const [decayPercent, setDecayPercent] = useState(10)
  const [saved, setSaved] = useState(false)

  // Для новой награды
  const [newRewardLevel, setNewRewardLevel] = useState('')
  const [newRewardRole, setNewRewardRole] = useState('')
  const [showAddReward, setShowAddReward] = useState(false)

  const colors = ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#A855F7', '#EC4899', '#00E5FF']

  const toggleSource = (index: number) => {
    const arr = [...xpSources]
    arr[index].enabled = !arr[index].enabled
    setXpSources(arr)
  }

  const updateSourceValue = (index: number, val: number) => {
    const arr = [...xpSources]
    arr[index].value = val
    setXpSources(arr)
  }

  const addReward = () => {
    if (!newRewardLevel || !newRewardRole) return
    const level = parseInt(newRewardLevel)
    if (isNaN(level) || level < 1) return
    setRewards([...rewards, {
      level,
      role: newRewardRole,
      color: colors[Math.floor(Math.random() * colors.length)]
    }])
    setNewRewardLevel('')
    setNewRewardRole('')
    setShowAddReward(false)
  }

  const removeReward = (index: number) => {
    setRewards(rewards.filter((_, i) => i !== index))
  }

  const saveSettings = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', color: '#F1F5F9' }}>
      
      {/* Top Bar */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 40px', background: '#111118', borderBottom: '1px solid #1F2937'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="/dashboard/modules" style={{
            color: '#94A3B8', textDecoration: 'none', fontSize: '14px',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>← Модули</a>
          <span style={{ color: '#374151' }}>/</span>
          <span style={{ color: '#00E5FF', fontSize: '14px', fontWeight: '500' }}>Система уровней</span>
        </div>
        <button onClick={saveSettings} style={{
          padding: '10px 24px', background: saved ? '#22C55E' : '#00E5FF', color: '#000',
          border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px',
          transition: 'all 0.3s'
        }}>
          {saved ? '✅ Сохранено!' : '💾 Сохранить'}
        </button>
      </header>

      {/* Content */}
      <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>🏆 Система уровней</h1>
          <p style={{ color: '#94A3B8', fontSize: '15px' }}>Гибкая настройка опыта, наград и множителей для вашего сервера</p>
        </div>

        {/* Основная сетка */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>

          {/* === ИСТОЧНИКИ XP === */}
          <div style={{
            background: '#16161F', borderRadius: '20px', padding: '28px',
            border: '1px solid #1F2937'
          }}>
            <h2 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📊</span> Источники опыта
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {xpSources.map((source, i) => (
                <div key={i} style={{
                  background: '#111118', borderRadius: '12px', padding: '14px 16px',
                  opacity: source.enabled ? 1 : 0.5
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={source.enabled} onChange={() => toggleSource(i)} style={{ opacity: 0, width: 0, height: 0 }} />
                        <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: source.enabled ? '#00E5FF' : '#374151', borderRadius: '22px', transition: '0.3s' }}>
                          <span style={{ position: 'absolute', height: '16px', width: '16px', left: source.enabled ? '20px' : '3px', bottom: '3px', background: '#FFF', borderRadius: '50%', transition: '0.3s' }} />
                        </span>
                      </label>
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>{source.name}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '48px' }}>
                    <input type="number" value={source.value} onChange={(e) => updateSourceValue(i, parseInt(e.target.value) || 0)}
                      disabled={!source.enabled}
                      style={{
                        width: '65px', padding: '6px 10px', background: '#0A0A0F',
                        border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF',
                        textAlign: 'center', fontSize: '14px'
                      }} />
                    <span style={{ fontSize: '13px', color: '#94A3B8' }}>XP</span>
                    <input type="range" min="1" max="100" value={source.value} onChange={(e) => updateSourceValue(i, parseInt(e.target.value))}
                      disabled={!source.enabled} style={{ flex: 1, accentColor: '#00E5FF', height: '4px' }} />
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
            <h2 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎚️</span> Множители
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '13px', marginBottom: '6px', fontWeight: '500' }}>Буст-каналы</label>
              <input type="text" value={boostChannels} onChange={(e) => setBoostChannels(e.target.value)}
                placeholder="#канал1, #канал2"
                style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '13px', marginBottom: '6px', fontWeight: '500' }}>Буст-роли</label>
              <input type="text" value={boostRoles} onChange={(e) => setBoostRoles(e.target.value)}
                placeholder="@role1, @role2"
                style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94A3B8', fontSize: '13px', fontWeight: '500' }}>Множитель XP</span>
                <span style={{ color: '#00E5FF', fontWeight: 'bold', fontSize: '18px' }}>x{multiplier}</span>
              </div>
              <input type="range" min="1" max="5" step="0.5" value={multiplier} onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#00E5FF', height: '6px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '11px', color: '#64748B' }}>x1</span>
                <span style={{ fontSize: '11px', color: '#64748B' }}>x5</span>
              </div>
            </div>
          </div>

          {/* === УВЕДОМЛЕНИЯ === */}
          <div style={{
            background: '#16161F', borderRadius: '20px', padding: '28px',
            border: '1px solid #1F2937'
          }}>
            <h2 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔔</span> Уведомления
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '13px', marginBottom: '6px', fontWeight: '500' }}>Канал</label>
              <input type="text" value={notifyChannel} onChange={(e) => setNotifyChannel(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '13px', marginBottom: '6px', fontWeight: '500' }}>Сообщение</label>
              <textarea value={notifyMessage} onChange={(e) => setNotifyMessage(e.target.value)} rows={3}
                style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace' }} />
              <p style={{ fontSize: '11px', color: '#64748B', marginTop: '6px' }}>Переменные: {'{user}'}, {'{level}'}, {'{role}'}, {'{xp}'}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111118', borderRadius: '12px', padding: '14px 16px' }}>
              <span style={{ fontSize: '14px' }}>Пинговать @user</span>
              <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px', cursor: 'pointer' }}>
                <input type="checkbox" checked={pingUser} onChange={() => setPingUser(!pingUser)} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: pingUser ? '#00E5FF' : '#374151', borderRadius: '22px', transition: '0.3s' }}>
                  <span style={{ position: 'absolute', height: '16px', width: '16px', left: pingUser ? '20px' : '3px', bottom: '3px', background: '#FFF', borderRadius: '50%', transition: '0.3s' }} />
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* === НАГРАДЫ (на всю ширину) === */}
        <div style={{
          background: '#16161F', borderRadius: '20px', padding: '28px',
          border: '1px solid #1F2937', marginTop: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎖️</span> Награды за уровни
            </h2>
            <button onClick={() => setShowAddReward(!showAddReward)} style={{
              padding: '10px 18px', background: showAddReward ? '#1F2937' : '#00E5FF',
              color: showAddReward ? '#FFF' : '#000', border: 'none', borderRadius: '10px',
              fontWeight: '600', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s'
            }}>
              {showAddReward ? '✕ Отмена' : '+ Добавить награду'}
            </button>
          </div>

          {/* Форма добавления */}
          {showAddReward && (
            <div style={{
              background: '#111118', borderRadius: '12px', padding: '16px',
              display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '16px',
              flexWrap: 'wrap'
            }}>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '12px', marginBottom: '4px' }}>Уровень</label>
                <input type="number" value={newRewardLevel} onChange={(e) => setNewRewardLevel(e.target.value)}
                  placeholder="5" min="1"
                  style={{ width: '80px', padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '12px', marginBottom: '4px' }}>Роль</label>
                <input type="text" value={newRewardRole} onChange={(e) => setNewRewardRole(e.target.value)}
                  placeholder="@роль"
                  style={{ width: '160px', padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '14px' }} />
              </div>
              <button onClick={addReward} style={{
                padding: '8px 20px', background: '#00E5FF', color: '#000',
                border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px'
              }}>Добавить</button>
            </div>
          )}

          {/* Список наград */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
            {rewards.length === 0 ? (
              <p style={{ color: '#64748B', fontSize: '14px', padding: '20px', textAlign: 'center', gridColumn: '1 / -1' }}>
                Нет настроенных наград. Нажмите "Добавить награду".
              </p>
            ) : (
              rewards.map((reward, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: '#111118', borderRadius: '12px', padding: '14px 16px',
                  transition: 'all 0.2s', border: '1px solid transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#1F2937'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                >
                  <span style={{
                    color: reward.color, fontWeight: 'bold', fontSize: '16px',
                    minWidth: '45px', background: '#0A0A0F', borderRadius: '8px',
                    padding: '4px 8px', textAlign: 'center'
                  }}>Ур. {reward.level}</span>
                  <span style={{ color: '#64748B', fontSize: '16px' }}>→</span>
                  <span style={{ color: '#FFF', fontSize: '14px', fontWeight: '500', flex: 1 }}>{reward.role}</span>
                  <span onClick={() => removeReward(i)} style={{
                    color: '#EF4444', cursor: 'pointer', fontSize: '16px',
                    padding: '4px', borderRadius: '6px', transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >✕</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* === ОГРАНИЧЕНИЯ === */}
        <div style={{
          background: '#16161F', borderRadius: '20px', padding: '28px',
          border: '1px solid #1F2937', marginTop: '24px'
        }}>
          <h2 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🚫</span> Ограничения и деградация
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: '13px', marginBottom: '6px', fontWeight: '500' }}>Каналы без XP</label>
              <input type="text" value={blacklistChannels} onChange={(e) => setBlacklistChannels(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>Снижение XP при неактивности</span>
                  <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Потеря опыта если неактивен</p>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={decayEnabled} onChange={() => setDecayEnabled(!decayEnabled)} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: decayEnabled ? '#00E5FF' : '#374151', borderRadius: '22px', transition: '0.3s' }}>
                    <span style={{ position: 'absolute', height: '16px', width: '16px', left: decayEnabled ? '20px' : '3px', bottom: '3px', background: '#FFF', borderRadius: '50%', transition: '0.3s' }} />
                  </span>
                </label>
              </div>

              {decayEnabled && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: '#94A3B8', fontSize: '11px', marginBottom: '4px' }}>Дней неактивности</label>
                    <input type="number" value={decayDays} onChange={(e) => setDecayDays(parseInt(e.target.value) || 7)}
                      style={{ width: '100%', padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: '#94A3B8', fontSize: '11px', marginBottom: '4px' }}>% потери XP</label>
                    <input type="number" value={decayPercent} onChange={(e) => setDecayPercent(parseInt(e.target.value) || 10)}
                      style={{ width: '100%', padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Кнопки внизу */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
          <button onClick={() => window.location.href = '/dashboard/modules'} style={{
            padding: '12px 24px', background: 'transparent', color: '#94A3B8',
            border: '1px solid #1F2937', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '14px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00E5FF'; e.currentTarget.style.color = '#FFF'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1F2937'; e.currentTarget.style.color = '#94A3B8'; }}
          >← Назад к модулям</button>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => {
              setXpSources(xpSources.map(s => ({...s, enabled: true, value: s.key === 'message' ? 10 : s.key === 'voice' ? 5 : s.key === 'reaction' ? 2 : 50})))
              setMultiplier(2)
              setBoostChannels('#general, #чат')
              setBoostRoles('@vip, @boost')
              setRewards([
                { level: 5, role: '@новичок', color: '#22C55E' },
                { level: 10, role: '@продвинутый', color: '#3B82F6' },
                { level: 25, role: '@эксперт', color: '#F59E0B' },
                { level: 50, role: '@легенда', color: '#EF4444' },
              ])
              setDecayEnabled(false)
              setDecayDays(7)
              setDecayPercent(10)
            }} style={{
              padding: '12px 20px', background: 'transparent', color: '#EF4444',
              border: '1px solid #374151', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '14px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#EF4444'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#374151'; }}
            >🔄 Сбросить</button>

            <button onClick={saveSettings} style={{
              padding: '12px 28px', background: saved ? '#22C55E' : '#00E5FF', color: '#000',
              border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '14px',
              transition: 'all 0.3s', boxShadow: saved ? '0 0 20px rgba(34,197,94,0.3)' : '0 0 20px rgba(0,229,255,0.2)'
            }}>
              {saved ? '✅ Сохранено!' : '💾 Сохранить настройки'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
