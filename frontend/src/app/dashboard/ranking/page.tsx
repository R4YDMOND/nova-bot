"use client"

import { useState } from 'react'

// ===== TABS =====
const TABS = [
  { id: 'settings', label: '⚙️ Настройки' },
  { id: 'rewards', label: '🎖️ Награды' },
  { id: 'voice', label: '🎤 Голосовые награды' },
  { id: 'card', label: '🪪 Карточка' },
  { id: 'members', label: '👥 Участники' },
]

// ===== TYPES =====
interface XpSource { name: string; key: string; value: number; enabled: boolean }
interface Reward { level: number; role: string; color: string; message?: string }
interface VoiceReward { minutes: number; role: string; color: string }
interface Member { name: string; level: number; xp: number; avatar: string }

const COLORS = ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#A855F7', '#EC4899', '#00E5FF', '#14B8A6']

export default function RankingPage() {
  const [activeTab, setActiveTab] = useState('settings')
  const [saved, setSaved] = useState(false)

  // Settings
  const [xpSources, setXpSources] = useState<XpSource[]>([
    { name: 'Сообщение', key: 'msg', value: 10, enabled: true },
    { name: 'Голос (мин)', key: 'voice', value: 5, enabled: true },
    { name: 'Реакция', key: 'reaction', value: 2, enabled: false },
    { name: 'Ивент', key: 'event', value: 50, enabled: false },
  ])
  const [boostChannels, setBoostChannels] = useState('#general, #чат')
  const [boostRoles, setBoostRoles] = useState('@vip, @boost')
  const [multiplier, setMultiplier] = useState(2)
  const [notifyChannel, setNotifyChannel] = useState('#уровни')
  const [notifyMessage, setNotifyMessage] = useState('🎉 {user} достиг {level} уровня!')
  const [pingUser, setPingUser] = useState(true)
  const [blacklistChannels, setBlacklistChannels] = useState('#спам, #флуд')
  const [decayEnabled, setDecayEnabled] = useState(false)
  const [decayDays, setDecayDays] = useState(7)
  const [decayPercent, setDecayPercent] = useState(10)

  // Rewards
  const [rewards, setRewards] = useState<Reward[]>([
    { level: 5, role: '@новичок', color: '#22C55E', message: 'Добро пожаловать!' },
    { level: 10, role: '@продвинутый', color: '#3B82F6' },
    { level: 25, role: '@эксперт', color: '#F59E0B' },
    { level: 50, role: '@легенда', color: '#EF4444' },
  ])
  const [newRewardLevel, setNewRewardLevel] = useState('')
  const [newRewardRole, setNewRewardRole] = useState('')
  const [newRewardMsg, setNewRewardMsg] = useState('')
  const [showAddReward, setShowAddReward] = useState(false)

  // Voice Rewards
  const [voiceRewards, setVoiceRewards] = useState<VoiceReward[]>([
    { minutes: 60, role: '@меломан', color: '#3B82F6' },
    { minutes: 300, role: '@аудиофил', color: '#F59E0B' },
    { minutes: 1000, role: '@звукореж', color: '#A855F7' },
  ])
  const [newVoiceMin, setNewVoiceMin] = useState('')
  const [newVoiceRole, setNewVoiceRole] = useState('')
  const [showAddVoice, setShowAddVoice] = useState(false)

  // Card
  const [cardBgColor, setCardBgColor] = useState('#111118')
  const [cardAccentColor, setCardAccentColor] = useState('#00E5FF')
  const [cardShowAvatar, setCardShowAvatar] = useState(true)
  const [cardShowXP, setCardShowXP] = useState(true)
  const [cardStyle, setCardStyle] = useState('modern')

  // Members
  const [members] = useState<Member[]>([
    { name: 'Alice', level: 42, xp: 15420, avatar: '👩' },
    { name: 'Bob', level: 38, xp: 12800, avatar: '👨' },
    { name: 'Charlie', level: 27, xp: 7650, avatar: '🧑' },
    { name: 'Diana', level: 55, xp: 23100, avatar: '👩‍🦰' },
    { name: 'Eve', level: 15, xp: 3200, avatar: '👩‍🦱' },
    { name: 'Frank', level: 61, xp: 28500, avatar: '👨‍🦰' },
    { name: 'Grace', level: 33, xp: 9200, avatar: '👩‍🦲' },
    { name: 'Henry', level: 8, xp: 1400, avatar: '👨‍🦱' },
  ])
  const [searchMember, setSearchMember] = useState('')

  const filteredMembers = members.filter(m => m.name.toLowerCase().includes(searchMember.toLowerCase()))

  // Helpers
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2200) }
  const toggleSource = (i: number) => { const a = [...xpSources]; a[i].enabled = !a[i].enabled; setXpSources(a) }
  const updateSource = (i: number, v: number) => { const a = [...xpSources]; a[i].value = v; setXpSources(a) }

  const addReward = () => {
    if (!newRewardLevel || !newRewardRole) return
    const lvl = parseInt(newRewardLevel)
    if (isNaN(lvl) || lvl < 1) return
    setRewards([...rewards, { level: lvl, role: newRewardRole, color: COLORS[Math.floor(Math.random() * COLORS.length)], message: newRewardMsg || undefined }])
    setNewRewardLevel(''); setNewRewardRole(''); setNewRewardMsg(''); setShowAddReward(false)
  }

  const addVoiceReward = () => {
    if (!newVoiceMin || !newVoiceRole) return
    const min = parseInt(newVoiceMin)
    if (isNaN(min) || min < 1) return
    setVoiceRewards([...voiceRewards, { minutes: min, role: newVoiceRole, color: COLORS[Math.floor(Math.random() * COLORS.length)] }])
    setNewVoiceMin(''); setNewVoiceRole(''); setShowAddVoice(false)
  }

  const resetAll = () => {
    setXpSources(xpSources.map(s => ({...s, enabled: true, value: s.key === 'msg' ? 10 : s.key === 'voice' ? 5 : s.key === 'reaction' ? 2 : 50})))
    setMultiplier(2); setBoostChannels('#general, #чат'); setBoostRoles('@vip, @boost')
    setRewards([{ level: 5, role: '@новичок', color: '#22C55E' }, { level: 10, role: '@продвинутый', color: '#3B82F6' }, { level: 25, role: '@эксперт', color: '#F59E0B' }, { level: 50, role: '@легенда', color: '#EF4444' }])
    setVoiceRewards([{ minutes: 60, role: '@меломан', color: '#3B82F6' }, { minutes: 300, role: '@аудиофил', color: '#F59E0B' }, { minutes: 1000, role: '@звукореж', color: '#A855F7' }])
    setDecayEnabled(false); setDecayDays(7); setDecayPercent(10)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', color: '#F1F5F9' }}>
      
      {/* === TOP BAR === */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 40px', background: '#111118', borderBottom: '1px solid #1F2937'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{ width: '32px', height: '32px', background: '#16161F', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#00E5FF', fontSize: '16px' }}>N</div>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFF' }}>Нова</span>
          </a>
          <span style={{ color: '#374151' }}>|</span>
          <a href="/dashboard/modules" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '14px' }}>← Модули</a>
          <span style={{ color: '#374151' }}>/</span>
          <span style={{ color: '#00E5FF', fontSize: '14px', fontWeight: '500' }}>Система уровней</span>
        </div>
        <button onClick={save} style={{
          padding: '10px 24px', background: saved ? '#22C55E' : '#00E5FF', color: '#000',
          border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px',
          transition: 'all 0.3s'
        }}>
          {saved ? '✅ Сохранено!' : '💾 Сохранить'}
        </button>
      </header>

      {/* === TABS === */}
      <div style={{
        display: 'flex', gap: '4px', padding: '16px 40px',
        background: '#0A0A0F', borderBottom: '1px solid #1F2937', overflowX: 'auto'
      }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '10px 20px', borderRadius: '10px', border: 'none',
            background: activeTab === tab.id ? '#1F2937' : 'transparent',
            color: activeTab === tab.id ? '#FFF' : '#94A3B8',
            fontWeight: activeTab === tab.id ? '600' : '400',
            cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* === CONTENT === */}
      <div style={{ padding: '40px', maxWidth: '1300px', margin: '0 auto' }}>

        {/* ============ TAB: SETTINGS ============ */}
        {activeTab === 'settings' && (
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>🏆 Система уровней</h1>
            <p style={{ color: '#94A3B8', marginBottom: '32px' }}>Гибкая настройка опыта, множителей и уведомлений</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              {/* XP Sources */}
              <div style={{ background: '#16161F', borderRadius: '18px', padding: '24px', border: '1px solid #1F2937' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>📊 Источники XP</h3>
                {xpSources.map((s, i) => (
                  <div key={i} style={{ background: '#111118', borderRadius: '10px', padding: '12px', marginBottom: '8px', opacity: s.enabled ? 1 : 0.5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ position: 'relative', display: 'inline-block', width: '34px', height: '20px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={s.enabled} onChange={() => toggleSource(i)} style={{ opacity: 0, width: 0, height: 0 }} />
                          <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: s.enabled ? '#00E5FF' : '#374151', borderRadius: '20px', transition: '0.3s' }}>
                            <span style={{ position: 'absolute', height: '14px', width: '14px', left: s.enabled ? '18px' : '3px', bottom: '3px', background: '#FFF', borderRadius: '50%', transition: '0.3s' }} />
                          </span>
                        </label>
                        <span style={{ fontSize: '13px' }}>{s.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input type="number" value={s.value} onChange={(e) => updateSource(i, parseInt(e.target.value) || 0)} disabled={!s.enabled}
                          style={{ width: '50px', padding: '4px 6px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '6px', color: '#FFF', textAlign: 'center', fontSize: '12px' }} />
                        <span style={{ fontSize: '11px', color: '#64748B' }}>XP</span>
                      </div>
                    </div>
                    <input type="range" min="1" max="100" value={s.value} onChange={(e) => updateSource(i, parseInt(e.target.value))} disabled={!s.enabled}
                      style={{ width: '100%', accentColor: '#00E5FF', height: '3px' }} />
                  </div>
                ))}
              </div>

              {/* Multipliers */}
              <div style={{ background: '#16161F', borderRadius: '18px', padding: '24px', border: '1px solid #1F2937' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>🎚️ Множители</h3>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Буст-каналы</label>
                  <input type="text" value={boostChannels} onChange={(e) => setBoostChannels(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Буст-роли</label>
                  <input type="text" value={boostRoles} onChange={(e) => setBoostRoles(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>Множитель</span>
                    <span style={{ color: '#00E5FF', fontWeight: 'bold', fontSize: '16px' }}>x{multiplier}</span>
                  </div>
                  <input type="range" min="1" max="5" step="0.5" value={multiplier} onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#00E5FF' }} />
                </div>
              </div>

              {/* Notifications + Restrictions */}
              <div style={{ background: '#16161F', borderRadius: '18px', padding: '24px', border: '1px solid #1F2937' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>🔔 Уведомления</h3>
                <input type="text" value={notifyChannel} onChange={(e) => setNotifyChannel(e.target.value)} placeholder="#канал"
                  style={{ width: '100%', padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }} />
                <textarea value={notifyMessage} onChange={(e) => setNotifyMessage(e.target.value)} rows={2}
                  style={{ width: '100%', padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '12px', marginBottom: '8px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace' }} />
                <p style={{ fontSize: '10px', color: '#64748B', marginBottom: '12px' }}>{'{user} {level} {role} {xp}'}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111118', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px' }}>Пинговать @user</span>
                  <label style={{ position: 'relative', display: 'inline-block', width: '34px', height: '20px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={pingUser} onChange={() => setPingUser(!pingUser)} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: pingUser ? '#00E5FF' : '#374151', borderRadius: '20px', transition: '0.3s' }}>
                      <span style={{ position: 'absolute', height: '14px', width: '14px', left: pingUser ? '18px' : '3px', bottom: '3px', background: '#FFF', borderRadius: '50%', transition: '0.3s' }} />
                    </span>
                  </label>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', marginTop: '16px' }}>🚫 Ограничения</h3>
                <input type="text" value={blacklistChannels} onChange={(e) => setBlacklistChannels(e.target.value)} placeholder="Каналы без XP"
                  style={{ width: '100%', padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px' }}>Снижение XP</span>
                  <label style={{ position: 'relative', display: 'inline-block', width: '34px', height: '20px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={decayEnabled} onChange={() => setDecayEnabled(!decayEnabled)} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: decayEnabled ? '#00E5FF' : '#374151', borderRadius: '20px', transition: '0.3s' }}>
                      <span style={{ position: 'absolute', height: '14px', width: '14px', left: decayEnabled ? '18px' : '3px', bottom: '3px', background: '#FFF', borderRadius: '50%', transition: '0.3s' }} />
                    </span>
                  </label>
                </div>
                {decayEnabled && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input type="number" value={decayDays} onChange={(e) => setDecayDays(parseInt(e.target.value) || 7)}
                      style={{ flex: 1, padding: '6px 8px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '6px', color: '#FFF', fontSize: '12px' }} placeholder="Дней" />
                    <input type="number" value={decayPercent} onChange={(e) => setDecayPercent(parseInt(e.target.value) || 10)}
                      style={{ flex: 1, padding: '6px 8px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '6px', color: '#FFF', fontSize: '12px' }} placeholder="% потери" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============ TAB: REWARDS ============ */}
        {activeTab === 'rewards' && (
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>🎖️ Награды за уровни</h1>
            <p style={{ color: '#94A3B8', marginBottom: '24px' }}>Назначайте роли и сообщения при достижении уровней</p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button onClick={() => setShowAddReward(!showAddReward)} style={{
                padding: '10px 20px', background: showAddReward ? '#1F2937' : '#00E5FF',
                color: showAddReward ? '#FFF' : '#000', border: 'none', borderRadius: '10px',
                fontWeight: '600', cursor: 'pointer', fontSize: '14px'
              }}>{showAddReward ? '✕ Отмена' : '+ Добавить'}</button>
            </div>

            {showAddReward && (
              <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '16px', border: '1px solid #1F2937' }}>
                <div><label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Уровень</label><input type="number" value={newRewardLevel} onChange={(e) => setNewRewardLevel(e.target.value)} placeholder="5" style={{ width: '70px', padding: '8px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '14px' }} /></div>
                <div><label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Роль</label><input type="text" value={newRewardRole} onChange={(e) => setNewRewardRole(e.target.value)} placeholder="@роль" style={{ width: '140px', padding: '8px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '14px' }} /></div>
                <div><label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Сообщение</label><input type="text" value={newRewardMsg} onChange={(e) => setNewRewardMsg(e.target.value)} placeholder="Поздравляем!" style={{ width: '180px', padding: '8px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '14px' }} /></div>
                <button onClick={addReward} style={{ padding: '8px 20px', background: '#00E5FF', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Добавить</button>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
              {rewards.map((r, i) => (
                <div key={i} style={{ background: '#16161F', borderRadius: '14px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid #1F2937', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = r.color}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#1F2937'}
                >
                  <span style={{ background: r.color, color: '#000', fontWeight: 'bold', padding: '8px 14px', borderRadius: '10px', fontSize: '16px', minWidth: '60px', textAlign: 'center' }}>Ур. {r.level}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '15px', fontWeight: '600' }}>{r.role}</span>
                    {r.message && <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>💬 {r.message}</p>}
                  </div>
                  <span onClick={() => setRewards(rewards.filter((_, j) => j !== i))} style={{ color: '#EF4444', cursor: 'pointer', fontSize: '18px', padding: '4px' }}>✕</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============ TAB: VOICE REWARDS ============ */}
        {activeTab === 'voice' && (
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>🎤 Голосовые награды</h1>
            <p style={{ color: '#94A3B8', marginBottom: '24px' }}>Награды за время проведённое в голосовых каналах</p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button onClick={() => setShowAddVoice(!showAddVoice)} style={{
                padding: '10px 20px', background: showAddVoice ? '#1F2937' : '#00E5FF',
                color: showAddVoice ? '#FFF' : '#000', border: 'none', borderRadius: '10px',
                fontWeight: '600', cursor: 'pointer', fontSize: '14px'
              }}>{showAddVoice ? '✕ Отмена' : '+ Добавить'}</button>
            </div>

            {showAddVoice && (
              <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '16px', border: '1px solid #1F2937' }}>
                <div><label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Минут</label><input type="number" value={newVoiceMin} onChange={(e) => setNewVoiceMin(e.target.value)} placeholder="60" style={{ width: '80px', padding: '8px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '14px' }} /></div>
                <div><label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Роль</label><input type="text" value={newVoiceRole} onChange={(e) => setNewVoiceRole(e.target.value)} placeholder="@роль" style={{ width: '160px', padding: '8px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '14px' }} /></div>
                <button onClick={addVoiceReward} style={{ padding: '8px 20px', background: '#00E5FF', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Добавить</button>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
              {voiceRewards.map((r, i) => (
                <div key={i} style={{ background: '#16161F', borderRadius: '14px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid #1F2937' }}>
                  <span style={{ background: r.color, color: '#000', fontWeight: 'bold', padding: '8px 14px', borderRadius: '10px', fontSize: '16px', minWidth: '80px', textAlign: 'center' }}>{r.minutes} мин</span>
                  <span style={{ fontSize: '15px', fontWeight: '600', flex: 1 }}>{r.role}</span>
                  <span onClick={() => setVoiceRewards(voiceRewards.filter((_, j) => j !== i))} style={{ color: '#EF4444', cursor: 'pointer', fontSize: '18px' }}>✕</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============ TAB: CARD ============ */}
        {activeTab === 'card' && (
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>🪪 Карточка рейтинга</h1>
            <p style={{ color: '#94A3B8', marginBottom: '32px' }}>Настройте внешний вид карточки уровня</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Settings */}
              <div style={{ background: '#16161F', borderRadius: '18px', padding: '28px', border: '1px solid #1F2937' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Цвет фона</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input type="color" value={cardBgColor} onChange={(e) => setCardBgColor(e.target.value)} style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                    <input type="text" value={cardBgColor} onChange={(e) => setCardBgColor(e.target.value)} style={{ flex: 1, padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '14px' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Акцентный цвет</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input type="color" value={cardAccentColor} onChange={(e) => setCardAccentColor(e.target.value)} style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                    <input type="text" value={cardAccentColor} onChange={(e) => setCardAccentColor(e.target.value)} style={{ flex: 1, padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '14px' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Стиль</label>
                  <select value={cardStyle} onChange={(e) => setCardStyle(e.target.value)} style={{ width: '100%', padding: '
