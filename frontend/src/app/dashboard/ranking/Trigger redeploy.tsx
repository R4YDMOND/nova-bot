"use client" 

import { useState, useEffect } from 'react'

const sanitize = (text: string): string => {
  if (!text) return ''
  return text.replace(/[\u0000-\u001F]/g, '').replace(/[\u200B-\u200D]/g, '').replace(/[\uFEFF]/g, '').trim()
}

const TABS = [
  { id: 'settings', label: '⚙️ Настройки' },
  { id: 'rewards', label: '🎖️ Награды за уровни' },
  { id: 'voice', label: '🎤 Голосовые награды' },
  { id: 'card', label: '🪪 Карточка' },
  { id: 'members', label: '👥 Участники' },
]

export default function RankingPage() {
  const [activeTab, setActiveTab] = useState('settings')
  const [saved, setSaved] = useState(false)
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const [xpSources, setXpSources] = useState([
    { name: '💬 Сообщение', value: 10, enabled: true },
    { name: '🎤 Голос (мин)', value: 5, enabled: true },
    { name: '👍 Реакция', value: 2, enabled: false },
    { name: '🎉 Ивент', value: 50, enabled: false },
  ])
  const [multiplier, setMultiplier] = useState(2)
  const [boostChannels, setBoostChannels] = useState('#general, #чат')
  const [boostRoles, setBoostRoles] = useState('@vip, @boost ⭐')
  const [notifyChannel, setNotifyChannel] = useState('#уровни 🏆')
  const [notifyMessage, setNotifyMessage] = useState('🎉 {user} достиг {level} уровня!')
  const [pingUser, setPingUser] = useState(true)
  const [blacklistChannels, setBlacklistChannels] = useState('#спам, #флуд')
  const [decayEnabled, setDecayEnabled] = useState(false)
  const [decayDays, setDecayDays] = useState(7)
  const [decayPercent, setDecayPercent] = useState(10)

  const toggleSource = (i: number) => { const arr = [...xpSources]; arr[i].enabled = !arr[i].enabled; setXpSources(arr) }

  const [rewards, setRewards] = useState([
    { level: 5, role: '@новичок 🌱', color: '#22C55E', message: 'Добро пожаловать!' },
    { level: 10, role: '@продвинутый 📈', color: '#3B82F6' },
    { level: 25, role: '@эксперт 🎯', color: '#F59E0B' },
    { level: 50, role: '@легенда 👑', color: '#EF4444' },
  ])
  const [newRewLevel, setNewRewLevel] = useState('')
  const [newRewRole, setNewRewRole] = useState('')
  const [newRewMsg, setNewRewMsg] = useState('')
  const [showAddRew, setShowAddRew] = useState(false)
  const COLORS = ['#22C55E','#3B82F6','#F59E0B','#EF4444','#A855F7','#EC4899','#00E5FF','#14B8A6']

  const addReward = () => {
    if (!newRewLevel || !newRewRole) return
    setRewards([...rewards, { level: parseInt(newRewLevel), role: sanitize(newRewRole), color: COLORS[Math.floor(Math.random()*COLORS.length)], message: sanitize(newRewMsg) || undefined }])
    setNewRewLevel(''); setNewRewRole(''); setNewRewMsg(''); setShowAddRew(false)
  }

  const [voiceRewards, setVoiceRewards] = useState([
    { minutes: 60, role: '@меломан 🎧', color: '#3B82F6' },
    { minutes: 300, role: '@аудиофил 🎼', color: '#F59E0B' },
    { minutes: 1000, role: '@звукореж 🎛️', color: '#A855F7' },
  ])
  const [newVoiceMin, setNewVoiceMin] = useState('')
  const [newVoiceRole, setNewVoiceRole] = useState('')
  const [showAddVoice, setShowAddVoice] = useState(false)

  const addVoiceReward = () => {
    if (!newVoiceMin || !newVoiceRole) return
    setVoiceRewards([...voiceRewards, { minutes: parseInt(newVoiceMin), role: sanitize(newVoiceRole), color: COLORS[Math.floor(Math.random()*COLORS.length)] }])
    setNewVoiceMin(''); setNewVoiceRole(''); setShowAddVoice(false)
  }

  const [cardBgColor, setCardBgColor] = useState('#111118')
  const [cardAccentColor, setCardAccentColor] = useState('#00E5FF')
  const [cardShowAvatar, setCardShowAvatar] = useState(true)
  const [cardShowXP, setCardShowXP] = useState(true)
  const [cardShowRank, setCardShowRank] = useState(true)
  const [cardShowAchievements, setCardShowAchievements] = useState(true)
  const [cardShowShare, setCardShowShare] = useState(true)
  const [cardStyle, setCardStyle] = useState('modern')
  const [cardNickname, setCardNickname] = useState('Пользователь')
  const [cardAvatarUrl, setCardAvatarUrl] = useState('')

  const [members, setMembers] = useState<any[]>([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [searchMember, setSearchMember] = useState('')

  useEffect(() => {
    fetch('https://nova-bot-rpsy.onrender.com/api/ranking/members')
      .then(res => res.json())
      .then(data => { setMembers(data.members || []); setMembersLoading(false) })
      .catch(() => setMembersLoading(false))
  }, [])

  const filteredMembers = members.filter(m => (m.name||'').toLowerCase().includes(searchMember.toLowerCase()))

  const resetAll = () => {
    setXpSources([{ name: '💬 Сообщение', value: 10, enabled: true },{ name: '🎤 Голос (мин)', value: 5, enabled: true },{ name: '👍 Реакция', value: 2, enabled: false },{ name: '🎉 Ивент', value: 50, enabled: false }])
    setMultiplier(2); setBoostChannels('#general, #чат'); setBoostRoles('@vip, @boost ⭐')
    setRewards([{ level: 5, role: '@новичок 🌱', color: '#22C55E', message: 'Добро пожаловать!' },{ level: 10, role: '@продвинутый 📈', color: '#3B82F6' },{ level: 25, role: '@эксперт 🎯', color: '#F59E0B' },{ level: 50, role: '@легенда 👑', color: '#EF4444' }])
    setVoiceRewards([{ minutes: 60, role: '@меломан 🎧', color: '#3B82F6' },{ minutes: 300, role: '@аудиофил 🎼', color: '#F59E0B' },{ minutes: 1000, role: '@звукореж 🎛️', color: '#A855F7' }])
    setDecayEnabled(false); setDecayDays(7); setDecayPercent(10)
  }

  const cardStyles = [
    { value: 'modern', label: 'Современный' },{ value: 'minimal', label: 'Минимализм' },{ value: 'gaming', label: 'Игровой' },
    { value: 'anime', label: 'Аниме' },{ value: 'cyberpunk', label: 'Киберпанк' },{ value: 'neon', label: 'Неон' },
  ]

  const getCardStyle = () => {
    switch(cardStyle) {
      case 'cyberpunk': return { border: `2px solid ${cardAccentColor}`, boxShadow: `0 0 20px ${cardAccentColor}40`, background: `linear-gradient(135deg, ${cardBgColor} 0%, #1a0a2e 100%)` }
      case 'neon': return { border: `2px solid ${cardAccentColor}`, boxShadow: `0 0 30px ${cardAccentColor}60, inset 0 0 30px ${cardAccentColor}10`, background: cardBgColor }
      case 'minimal': return { border: '1px solid #1F2937', boxShadow: 'none', background: cardBgColor }
      case 'gaming': return { border: `2px solid ${cardAccentColor}`, boxShadow: `0 4px 15px rgba(0,0,0,0.5)`, background: `linear-gradient(135deg, ${cardBgColor} 0%, #0a1628 100%)` }
      case 'anime': return { border: `2px solid ${cardAccentColor}`, boxShadow: `0 0 15px ${cardAccentColor}30`, background: `linear-gradient(135deg, ${cardBgColor} 0%, #2a1040 100%)` }
      default: return { border: `2px solid ${cardAccentColor}`, boxShadow: 'none', background: cardBgColor }
    }
  }

  const firstMember = members[0] || {}

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', color: '#F1F5F9' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 40px', background: '#111118', borderBottom: '1px solid #1F2937', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}><div style={{ width: '32px', height: '32px', background: '#16161F', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#00E5FF', fontSize: '16px' }}>N</div><span style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFF' }}>Нова</span></a>
          <span style={{ color: '#374151' }}>|</span><a href="/dashboard/modules" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '14px' }}>← Модули</a><span style={{ color: '#374151' }}>/</span><span style={{ color: '#00E5FF', fontSize: '14px', fontWeight: '500' }}>Система уровней</span>
        </div>
        <button onClick={save} style={{ padding: '10px 22px', background: saved ? '#22C55E' : '#00E5FF', color: '#000', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.25s' }}>{saved ? '✅ Сохранено!' : '💾 Сохранить'}</button>
      </header>
      <div style={{ display: 'flex', gap: '4px', padding: '16px 40px', background: '#0A0A0F', borderBottom: '1px solid #1F2937', overflowX: 'auto' }}>
        {TABS.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: activeTab===tab.id?'#1F2937':'transparent', color: activeTab===tab.id?'#FFF':'#94A3B8', fontWeight: activeTab===tab.id?'600':'400', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>{sanitize(tab.label)}</button>))}
      </div>
      <main style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto' }}>

        {activeTab === 'settings' && (
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '6px' }}>⚙️ Настройки уровней</h1>
            <p style={{ color: '#94A3B8', fontSize: '15px', marginBottom: '32px' }}>Источники опыта, множители и ограничения</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
              <div style={{ background: '#16161F', borderRadius: '18px', padding: '24px', border: '1px solid #1F2937' }}><h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>📊 Источники XP</h3>{xpSources.map((s,i)=>(<div key={i} style={{ background: '#111118', borderRadius: '10px', padding: '12px', marginBottom: '8px', opacity: s.enabled?1:0.5 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div onClick={()=>toggleSource(i)} style={{ width: '34px', height: '20px', background: s.enabled?'#00E5FF':'#374151', borderRadius: '20px', cursor: 'pointer', transition: '0.25s', position: 'relative' }}><div style={{ position: 'absolute', height: '14px', width: '14px', left: s.enabled?'18px':'3px', top: '3px', background: s.enabled?'#000':'#FFF', borderRadius: '50%', transition: '0.25s' }} /></div><span style={{ fontSize: '13px' }}>{sanitize(s.name)}</span></div><input type="number" value={s.value} onChange={(e)=>{ const arr=[...xpSources]; arr[i].value=parseInt(e.target.value)||0; setXpSources(arr) }} style={{ width: '50px', padding: '4px 6px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '6px', color: '#FFF', textAlign: 'center', fontSize: '12px' }} /></div><input type="range" min="1" max="100" value={s.value} onChange={(e)=>{ const arr=[...xpSources]; arr[i].value=parseInt(e.target.value); setXpSources(arr) }} style={{ width: '100%', accentColor: '#00E5FF', height: '3px' }} /></div>))}</div>
              <div style={{ background: '#16161F', borderRadius: '18px', padding: '24px', border: '1px solid #1F2937' }}><h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>🎚️ Множители</h3><div style={{ marginBottom: '12px' }}><label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Буст-каналы (ID или #канал)</label><input type="text" value={sanitize(boostChannels)} onChange={(e)=>{ const v=e.target.value; setBoostChannels(v); if(v.includes('lolka.app')||v.includes('vk.com')){ const ch=v.match(/#[a-zA-Zа-яА-Я0-9_-]+/g); if(ch) setBoostChannels(ch.join(', ')) } }} placeholder="#general, #чат или ссылка" style={{ width: '100%', padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }} /><div style={{ fontSize: '10px', color: '#64748B', marginTop: '4px' }}>💡 Вставьте ссылку — каналы определятся автоматически</div></div><div style={{ marginBottom: '12px' }}><label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Буст-роли (@роль или ID)</label><input type="text" value={sanitize(boostRoles)} onChange={(e)=>{ const v=e.target.value; setBoostRoles(v); if(v.includes('lolka.app')||v.includes('vk.com')){ const rl=v.match(/@[a-zA-Zа-яА-Я0-9_-]+/g); if(rl) setBoostRoles(rl.join(', ')) } }} placeholder="@vip, @boost или ссылка" style={{ width: '100%', padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px', boxSizing: 'border-box' }} /><div style={{ fontSize: '10px', color: '#64748B', marginTop: '4px' }}>💡 Вставьте ссылку — роли определятся автоматически</div></div><div><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '12px', color: '#94A3B8' }}>Множитель XP</span><span style={{ color: '#00E5FF', fontWeight: 'bold' }}>x{multiplier}</span></div><input type="range" min="1" max="5" step="0.5" value={multiplier} onChange={(e)=>setMultiplier(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#00E5FF' }} /></div></div>
              <div style={{ background: '#16161F', borderRadius: '18px', padding: '24px', border: '1px solid #1F2937' }}><h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>🔔 Уведомления</h3><input type="text" value={sanitize(notifyChannel)} onChange={(e)=>setNotifyChannel(e.target.value)} placeholder="#канал" style={{ width: '100%', padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }} /><textarea value={sanitize(notifyMessage)} onChange={(e)=>setNotifyMessage(e.target.value)} rows={2} style={{ width: '100%', padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '12px', marginBottom: '6px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace' }} /><p style={{ fontSize: '10px', color: '#64748B', marginBottom: '10px' }}>{'{user} {level} {role} {xp}'}</p><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}><span style={{ fontSize: '13px' }}>Пинговать</span><div onClick={()=>setPingUser(!pingUser)} style={{ width: '34px', height: '20px', background: pingUser?'#00E5FF':'#374151', borderRadius: '20px', cursor: 'pointer', position: 'relative' }}><div style={{ position: 'absolute', height: '14px', width: '14px', left: pingUser?'18px':'3px', top: '3px', background: pingUser?'#000':'#FFF', borderRadius: '50%', transition: '0.25s' }} /></div></div><h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', marginTop: '16px' }}>🚫 Ограничения</h3><input type="text" value={sanitize(blacklistChannels)} onChange={(e)=>setBlacklistChannels(e.target.value)} placeholder="Каналы без XP" style={{ width: '100%', padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }} /><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}><span style={{ fontSize: '12px' }}>Снижение XP</span><div onClick={()=>setDecayEnabled(!decayEnabled)} style={{ width: '34px', height: '20px', background: decayEnabled?'#00E5FF':'#374151', borderRadius: '20px', cursor: 'pointer', position: 'relative' }}><div style={{ position: 'absolute', height: '14px', width: '14px', left: decayEnabled?'18px':'3px', top: '3px', background: decayEnabled?'#000':'#FFF', borderRadius: '50%', transition: '0.25s' }} /></div></div>{decayEnabled&&(<div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}><input type="number" value={decayDays} onChange={(e)=>setDecayDays(parseInt(e.target.value)||7)} placeholder="Дней" style={{ flex: 1, padding: '6px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '6px', color: '#FFF', fontSize: '12px' }} /><input type="number" value={decayPercent} onChange={(e)=>setDecayPercent(parseInt(e.target.value)||10)} placeholder="%" style={{ flex: 1, padding: '6px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '6px', color: '#FFF', fontSize: '12px' }} /></div>)}</div>
            </div>
          </div>
        )}

        {activeTab === 'rewards' && (
          <div><h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '6px' }}>🎖️ Награды за уровни</h1><p style={{ color: '#94A3B8', fontSize: '15px', marginBottom: '24px' }}>Роли и сообщения при достижении уровней</p><div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}><button onClick={()=>setShowAddRew(!showAddRew)} style={{ padding: '10px 20px', background: showAddRew?'#1F2937':'#00E5FF', color: showAddRew?'#FFF':'#000', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>{showAddRew?'✕ Отмена':'+ Добавить награду'}</button></div>{showAddRew&&(<div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '16px', border: '1px solid #1F2937' }}><div><label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Уровень</label><input type="number" value={newRewLevel} onChange={(e)=>setNewRewLevel(e.target.value)} placeholder="5" style={{ width: '70px', padding: '8px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '14px' }} /></div><div><label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Роль</label><input type="text" value={sanitize(newRewRole)} onChange={(e)=>setNewRewRole(e.target.value)} placeholder="@роль" style={{ width: '140px', padding: '8px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '14px' }} /></div><div><label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Сообщение</label><input type="text" value={sanitize(newRewMsg)} onChange={(e)=>setNewRewMsg(e.target.value)} placeholder="Поздравляем!" style={{ width: '180px', padding: '8px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '14px' }} /></div><button onClick={addReward} style={{ padding: '8px 20px', background: '#00E5FF', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Добавить</button></div>)}<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>{rewards.map((r,i)=>(<div key={i} style={{ background: '#16161F', borderRadius: '14px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid #1F2937' }}><span style={{ background: r.color, color: '#000', fontWeight: 'bold', padding: '8px 14px', borderRadius: '10px', fontSize: '16px', minWidth: '60px', textAlign: 'center' }}>Ур. {r.level}</span><div style={{ flex: 1 }}><span style={{ fontSize: '15px', fontWeight: '600' }}>{sanitize(r.role)}</span>{r.message&&<p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>💬 {sanitize(r.message)}</p>}</div><span onClick={()=>setRewards(rewards.filter((_,j)=>j!==i))} style={{ color: '#EF4444', cursor: 'pointer', fontSize: '18px' }}>✕</span></div>))}</div></div>
        )}

        {activeTab === 'voice' && (
          <div><h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '6px' }}>🎤 Голосовые награды</h1><p style={{ color: '#94A3B8', fontSize: '15px', marginBottom: '24px' }}>Награды за время в голосовых каналах</p><div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}><button onClick={()=>setShowAddVoice(!showAddVoice)} style={{ padding: '10px 20px', background: showAddVoice?'#1F2937':'#00E5FF', color: showAddVoice?'#FFF':'#000', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>{showAddVoice?'✕ Отмена':'+ Добавить'}</button></div>{showAddVoice&&(<div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '16px', border: '1px solid #1F2937' }}><div><label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Минут</label><input type="number" value={newVoiceMin} onChange={(e)=>setNewVoiceMin(e.target.value)} placeholder="60" style={{ width: '80px', padding: '8px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '14px' }} /></div><div><label style={{ fontSize: '11px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>Роль</label><input type="text" value={sanitize(newVoiceRole)} onChange={(e)=>setNewVoiceRole(e.target.value)} placeholder="@роль" style={{ width: '160px', padding: '8px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '14px' }} /></div><button onClick={addVoiceReward} style={{ padding: '8px 20px', background: '#00E5FF', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Добавить</button></div>)}<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>{voiceRewards.map((r,i)=>(<div key={i} style={{ background: '#16161F', borderRadius: '14px', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid #1F2937' }}><span style={{ background: r.color, color: '#000', fontWeight: 'bold', padding: '8px 14px', borderRadius: '10px', fontSize: '16px', minWidth: '80px', textAlign: 'center' }}>{r.minutes} мин</span><span style={{ fontSize: '15px', fontWeight: '600', flex: 1 }}>{sanitize(r.role)}</span><span onClick={()=>setVoiceRewards(voiceRewards.filter((_,j)=>j!==i))} style={{ color: '#EF4444', cursor: 'pointer', fontSize: '18px' }}>✕</span></div>))}</div></div>
        )}

        {activeTab === 'card' && (
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '6px' }}>🪪 Карточка рейтинга</h1>
            <p style={{ color: '#94A3B8', fontSize: '15px', marginBottom: '32px' }}>Настройте внешний вид карточки уровня</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ background: '#16161F', borderRadius: '18px', padding: '28px', border: '1px solid #1F2937' }}><h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>🎨 Дизайн</h3><div style={{ marginBottom: '16px' }}><label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Цвет фона</label><div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><input type="color" value={cardBgColor} onChange={(e)=>setCardBgColor(e.target.value)} style={{ width: '36px', height: '36px', border: 'none', borderRadius: '8px', cursor: 'pointer' }} /><input type="text" value={sanitize(cardBgColor)} onChange={(e)=>setCardBgColor(e.target.value)} style={{ flex: 1, padding: '8px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '14px' }} /></div></div><div style={{ marginBottom: '16px' }}><label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Акцентный цвет</label><div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><input type="color" value={cardAccentColor} onChange={(e)=>setCardAccentColor(e.target.value)} style={{ width: '36px', height: '36px', border: 'none', borderRadius: '8px', cursor: 'pointer' }} /><input type="text" value={sanitize(cardAccentColor)} onChange={(e)=>setCardAccentColor(e.target.value)} style={{ flex: 1, padding: '8px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '14px' }} /></div></div><div style={{ marginBottom: '16px' }}><label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Никнейм (макс. 25 символов)</label><input type="text" value={sanitize(cardNickname)} onChange={(e)=>setCardNickname(e.target.value.slice(0,25))} placeholder="Пользователь" maxLength={25} style={{ width: '100%', padding: '10px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }} /></div><div style={{ marginBottom: '16px' }}><label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>URL аватара (VK/Lolka)</label><input type="text" value={sanitize(cardAvatarUrl)} onChange={(e)=>setCardAvatarUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '10px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '14px', boxSizing: 'border-box' }} /></div><div><label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Стиль</label><select value={cardStyle} onChange={(e)=>setCardStyle(e.target.value)} style={{ width: '100%', padding: '10px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '14px' }}>{cardStyles.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select></div></div>
              <div style={{ background: '#16161F', borderRadius: '18px', padding: '28px', border: '1px solid #1F2937' }}><h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>📋 Отображение</h3>{[{ key: 'cardShowAvatar', label: '👤 Аватар', value: cardShowAvatar, set: setCardShowAvatar },{ key: 'cardShowXP', label: '📊 Прогресс XP', value: cardShowXP, set: setCardShowXP },{ key: 'cardShowRank', label: '🏆 Место в рейтинге', value: cardShowRank, set: setCardShowRank },{ key: 'cardShowAchievements', label: '🏅 Достижения', value: cardShowAchievements, set: setCardShowAchievements },{ key: 'cardShowShare', label: '🔗 Поделиться', value: cardShowShare, set: setCardShowShare }].map((item,i)=>(<div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i<4?'1px solid #1F2937':'none' }}><span style={{ fontSize: '14px' }}>{sanitize(item.label)}</span><div onClick={()=>item.set(!item.value)} style={{ width: '44px', height: '26px', background: item.value?'#00E5FF':'#374151', borderRadius: '26px', cursor: 'pointer', position: 'relative' }}><div style={{ position: 'absolute', height: '20px', width: '20px', left: item.value?'22px':'4px', top: '3px', background: item.value?'#000':'#FFF', borderRadius: '50%', transition: '0.25s' }} /></div></div>))}</div>
            </div>
            <div style={{ marginTop: '24px' }}><h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>👁️ Предпросмотр карточки</h3>
              <div style={{ ...getCardStyle(), borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden', maxWidth: '400px' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05, background: `radial-gradient(circle at 80% 20%, ${cardAccentColor} 0%, transparent 50%)` }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>{cardShowRank&&<div style={{ background: cardAccentColor, color: '#000', fontWeight: 'bold', padding: '4px 12px', borderRadius: '8px', fontSize: '12px' }}>🏆 #{firstMember.rank||1} в рейтинге</div>}<div style={{ fontSize: '11px', color: '#94A3B8' }}>Ур. {firstMember.level||42}</div></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {cardShowAvatar&&(<div style={{ width: '56px', height: '56px', minWidth: '56px', borderRadius: '16px', border: `3px solid ${cardAccentColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', position: 'relative', overflow: 'hidden' }}>{cardAvatarUrl?<img src={cardAvatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e)=>{e.currentTarget.style.display='none'}} />:<span>{firstMember.avatar||'👤'}</span>}<div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '14px', height: '14px', background: '#22C55E', borderRadius: '50%', border: '2px solid #000' }} /></div>)}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sanitize(cardNickname).length>25?sanitize(cardNickname).slice(0,25)+'...':sanitize(cardNickname)}</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '8px' }}>Активный участник</div>
                      {cardShowXP&&(<div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94A3B8', marginBottom: '4px' }}><span>XP</span><span>{(firstMember.xp||15420).toLocaleString()} / 20,000</span></div><div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}><div style={{ width: `${Math.min(100,((firstMember.xp||15420)/20000)*100)}%`, height: '100%', background: `linear-gradient(90deg, ${cardAccentColor}, ${cardAccentColor}88)`, borderRadius: '4px' }} /></div></div>)}
                    </div>
                  </div>
                  {cardShowAchievements&&(<div style={{ display: 'flex', gap: '6px', marginTop: '14px' }}>{['🏅','⭐','💎','🔥','👑'].map((a,i)=><div key={i} style={{ width: '28px', height: '28px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>{a}</div>)}</div>)}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}><div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '6px 10px', textAlign: 'center' }}><div style={{ fontSize: '10px', color: '#94A3B8' }}>💬 Сообщений</div><div style={{ fontSize: '14px', fontWeight: 'bold', color: cardAccentColor }}>{(firstMember.messages||2400).toLocaleString()}</div></div><div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '6px 10px', textAlign: 'center' }}><div style={{ fontSize: '10px', color: '#94A3B8' }}>🎤 Голос</div><div style={{ fontSize: '14px', fontWeight: 'bold', color: cardAccentColor }}>{firstMember.voiceHours||120}ч</div></div><div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '6px 10px', textAlign: 'center' }}><div style={{ fontSize: '10px', color: '#94A3B8' }}>⭐ Реакций</div><div style={{ fontSize: '14px', fontWeight: 'bold', color: cardAccentColor }}>{(firstMember.reactions||856).toLocaleString()}</div></div></div>
                  {cardShowShare&&(<div style={{ marginTop: '12px', textAlign: 'center' }}><button style={{ padding: '6px 16px', background: cardAccentColor, color: '#000', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '11px', cursor: 'pointer' }}>🔗 Поделиться карточкой</button></div>)}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div><h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '6px' }}>👥 Участники</h1><p style={{ color: '#94A3B8', fontSize: '15px', marginBottom: '24px' }}>Рейтинг участников сервера</p><div style={{ marginBottom: '20px' }}><input type="text" value={sanitize(searchMember)} onChange={(e)=>setSearchMember(e.target.value)} placeholder="🔍 Поиск участника..." style={{ width: '100%', padding: '10px 16px', background: '#16161F', border: '1px solid #1F2937', borderRadius: '12px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box', maxWidth: '400px' }} /></div><div style={{ background: '#16161F', borderRadius: '16px', border: '1px solid #1F2937', overflow: 'hidden' }}>{membersLoading?(<div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>⏳ Загрузка участников...</div>):members.length===0?(<div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}><div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div><p>Нет данных об участниках</p><p style={{ fontSize: '12px', color: '#64748B', marginTop: '8px' }}>Данные появятся когда бот начнёт отслеживать активность</p></div>):(<table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr style={{ borderBottom: '1px solid #1F2937' }}>{['#','Участник','Уровень','XP','Прогресс'].map((h,i)=>(<th key={i} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' }}>{h}</th>))}</tr></thead><tbody>{filteredMembers.map((m,i)=>(<tr key={i} style={{ borderBottom: '1px solid #1F2937' }} onMouseEnter={(e)=>e.currentTarget.style.background='#1A1A24'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}><td style={{ padding: '14px 20px' }}><span style={{ fontWeight: 'bold', color: i<3?'#F59E0B':'#94A3B8', fontSize: '16px' }}>#{m.rank||i+1}</span></td><td style={{ padding: '14px 20px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ fontSize: '20px' }}>{m.avatar||'👤'}</span><span style={{ fontWeight: '500' }}>{sanitize(m.name)}</span></div></td><td style={{ padding: '14px 20px' }}><span style={{ background: '#0A0A0F', padding: '4px 12px', borderRadius: '8px', fontWeight: '600', fontSize: '14px' }}>{m.level||0}</span></td><td style={{ padding: '14px 20px', color: '#94A3B8', fontSize: '13px' }}>{(m.xp||0).toLocaleString()}</td><td style={{ padding: '14px 20px' }}><div style={{ height: '6px', background: '#1F2937', borderRadius: '3px', width: '120px' }}><div style={{ width: `${Math.min(100,((m.xp||0)/30000)*100)}%`, height: '100%', background: '#00E5FF', borderRadius: '3px' }} /></div></td></tr>))}</tbody></table>)}</div></div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}><button onClick={()=>window.location.href='/dashboard/modules'} style={{ padding: '12px 24px', background: 'transparent', color: '#94A3B8', border: '1px solid #1F2937', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>← Назад к модулям</button><div style={{ display: 'flex', gap: '12px' }}><button onClick={resetAll} style={{ padding: '12px 20px', background: 'transparent', color: '#EF4444', border: '1px solid #374151', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>🔄 Сбросить</button><button onClick={save} style={{ padding: '12px 28px', background: saved?'#22C55E':'#00E5FF', color: '#000', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', transition: 'all 0.3s', boxShadow: saved?'0 0 20px rgba(34,197,94,0.3)':'0 0 20px rgba(0,229,255,0.2)' }}>{saved?'✅ Сохранено!':'💾 Сохранить всё'}</button></div></div>
        {saved&&(<div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#22C55E', color: '#000', padding: '14px 24px', borderRadius: '14px', fontWeight: '600', fontSize: '15px', zIndex: 1000, boxShadow: '0 4px 25px rgba(34,197,94,0.4)', animation: 'slideUp 0.3s ease' }}>✅ Все настройки сохранены!</div>)}
        <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      </main>
    </div>
  )
}
