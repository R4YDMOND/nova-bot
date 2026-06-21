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
  const [shareAnim, setShareAnim] = useState(false)
  const [shareToast, setShareToast] = useState('')
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
      case 'minimal': return { border: '1px solid var(--border)', boxShadow: 'none', background: cardBgColor }
      case 'gaming': return { border: `2px solid ${cardAccentColor}`, boxShadow: `0 4px 15px rgba(0,0,0,0.5)`, background: `linear-gradient(135deg, ${cardBgColor} 0%, #0a1628 100%)` }
      case 'anime': return { border: `2px solid ${cardAccentColor}`, boxShadow: `0 0 15px ${cardAccentColor}30`, background: `linear-gradient(135deg, ${cardBgColor} 0%, #2a1040 100%)` }
      default: return { border: `2px solid ${cardAccentColor}`, boxShadow: 'none', background: cardBgColor }
    }
  }

  const firstMember = members[0] || {}

  const shareCard = function() {
    var text = '🏆 ' + (sanitize(cardNickname).length>25?sanitize(cardNickname).slice(0,25)+'...':sanitize(cardNickname)) + '\n📊 Уровень: ' + (firstMember.level||42) + '\n⭐ XP: ' + ((firstMember.xp||15420).toLocaleString()) + '\n💬 Сообщений: ' + ((firstMember.messages||2400).toLocaleString()) + '\n🎤 Голос: ' + (firstMember.voiceHours||120) + 'ч\n🚀 Создано в Nova Bot'
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function() {
        setShareAnim(true); setShareToast('✅ Текст карточки скопирован!')
        setTimeout(function() { setShareAnim(false); setShareToast('') }, 2500)
      })
    }
  }

  const shareToVK = function() {
    var text = encodeURIComponent('🏆 Моя карточка в Nova Bot!\n📊 Уровень: ' + (firstMember.level||42) + '\n⭐ XP: ' + ((firstMember.xp||15420).toLocaleString()) + '\n🚀 Попробуй: https://nova-bot-4vmp.vercel.app')
    window.open('https://vk.com/share.php?url=https://nova-bot-4vmp.vercel.app&title=' + text, '_blank')
  }

  const shareToLolka = function() {
    var text = '🏆 Моя карточка в Nova Bot!\n📊 Уровень: ' + (firstMember.level||42) + '\n⭐ XP: ' + ((firstMember.xp||15420).toLocaleString()) + '\n🚀 Попробуй: https://nova-bot-4vmp.vercel.app'
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function() {
        setShareToast('✅ Текст скопирован! Отправьте в Lolka через /forward')
        setTimeout(function() { setShareToast('') }, 3000)
      })
    }
  }

  return (
    <div style={{ padding: '28px 36px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 700, marginBottom: 2, color: 'var(--text-primary)' }}>🏆 Система уровней</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-md)' }}>Настройки опыта, наград и рейтинга</p>
        </div>
        <button onClick={save} style={{ padding: '10px 22px', background: saved ? 'var(--success)' : 'var(--accent)', color: '#000', border: 'none', borderRadius: 'var(--radius-lg)', fontWeight: 600, fontSize: 'var(--font-lg)', cursor: 'pointer', transition: 'all 0.25s', whiteSpace: 'nowrap' }}>{saved ? '✅ Сохранено!' : '💾 Сохранить'}</button>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto' }}>
        {TABS.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '10px 18px', borderRadius: 'var(--radius-lg)', border: 'none', background: activeTab===tab.id?'var(--border)':'transparent', color: activeTab===tab.id?'var(--text-primary)':'var(--text-secondary)', fontWeight: activeTab===tab.id?600:400, cursor: 'pointer', fontSize: 'var(--font-md)', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>{sanitize(tab.label)}</button>))}
      </div>

      {activeTab === 'settings' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: 18, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>📊 Источники XP</h3>
              {xpSources.map((s,i)=>(<div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: 10, marginBottom: 6, opacity: s.enabled?1:0.5 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div onClick={()=>toggleSource(i)} style={{ width: 34, height: 20, background: s.enabled?'var(--accent)':'var(--border)', borderRadius: 20, cursor: 'pointer', position: 'relative' }}><div style={{ position: 'absolute', height: 14, width: 14, left: s.enabled?18:3, top: 3, background: s.enabled?'#000':'#FFF', borderRadius: '50%', transition: '0.25s' }} /></div><span style={{ fontSize: 'var(--font-md)', color: 'var(--text-primary)' }}>{sanitize(s.name)}</span></div><input type="number" value={s.value} onChange={(e)=>{ const arr=[...xpSources]; arr[i].value=parseInt(e.target.value)||0; setXpSources(arr) }} style={{ width: 50, padding: '4px 6px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', textAlign: 'center', fontSize: 'var(--font-sm)' }} /></div><input type="range" min="1" max="100" value={s.value} onChange={(e)=>{ const arr=[...xpSources]; arr[i].value=parseInt(e.target.value); setXpSources(arr) }} style={{ width: '100%', accentColor: 'var(--accent)', height: 3 }} /></div>))}
            </div>
            <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: 18, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>🎚️ Множители</h3>
              <div style={{ marginBottom: 10 }}><label style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Буст-каналы</label><input type="text" value={sanitize(boostChannels)} onChange={(e)=>{ setBoostChannels(e.target.value) }} placeholder="#general, #чат" style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--font-md)', outline: 'none', boxSizing: 'border-box' }} /></div>
              <div style={{ marginBottom: 10 }}><label style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Буст-роли</label><input type="text" value={sanitize(boostRoles)} onChange={(e)=>{ setBoostRoles(e.target.value) }} placeholder="@vip, @boost" style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--font-md)', outline: 'none', boxSizing: 'border-box' }} /></div>
              <div><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>Множитель XP</span><span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>x{multiplier}</span></div><input type="range" min="1" max="5" step="0.5" value={multiplier} onChange={(e)=>setMultiplier(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} /></div>
            </div>
            <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: 18, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>🔔 Уведомления</h3>
              <input type="text" value={sanitize(notifyChannel)} onChange={(e)=>setNotifyChannel(e.target.value)} placeholder="#канал" style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--font-md)', marginBottom: 8, outline: 'none', boxSizing: 'border-box' }} />
              <textarea value={sanitize(notifyMessage)} onChange={(e)=>setNotifyMessage(e.target.value)} rows={2} style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--font-sm)', marginBottom: 6, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace' }} />
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: 8 }}>{'{user} {level} {role} {xp}'}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><span style={{ fontSize: 'var(--font-md)', color: 'var(--text-primary)' }}>Пинговать</span><div onClick={()=>setPingUser(!pingUser)} style={{ width: 34, height: 20, background: pingUser?'var(--accent)':'var(--border)', borderRadius: 20, cursor: 'pointer', position: 'relative' }}><div style={{ position: 'absolute', height: 14, width: 14, left: pingUser?18:3, top: 3, background: pingUser?'#000':'#FFF', borderRadius: '50%', transition: '0.25s' }} /></div></div>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, margin: '12px 0 6px', color: 'var(--text-primary)' }}>🚫 Ограничения</h3>
              <input type="text" value={sanitize(blacklistChannels)} onChange={(e)=>setBlacklistChannels(e.target.value)} placeholder="Каналы без XP" style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--font-md)', marginBottom: 8, outline: 'none', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}><span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>Снижение XP</span><div onClick={()=>setDecayEnabled(!decayEnabled)} style={{ width: 34, height: 20, background: decayEnabled?'var(--accent)':'var(--border)', borderRadius: 20, cursor: 'pointer', position: 'relative' }}><div style={{ position: 'absolute', height: 14, width: 14, left: decayEnabled?18:3, top: 3, background: decayEnabled?'#000':'#FFF', borderRadius: '50%', transition: '0.25s' }} /></div></div>
              {decayEnabled&&(<div style={{ display: 'flex', gap: 6, marginTop: 6 }}><input type="number" value={decayDays} onChange={(e)=>setDecayDays(parseInt(e.target.value)||7)} placeholder="Дней" style={{ flex: 1, padding: 6, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 'var(--font-sm)' }} /><input type="number" value={decayPercent} onChange={(e)=>setDecayPercent(parseInt(e.target.value)||10)} placeholder="%" style={{ flex: 1, padding: 6, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 'var(--font-sm)' }} /></div>)}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rewards' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}><button onClick={()=>setShowAddRew(!showAddRew)} style={{ padding: '9px 18px', background: showAddRew?'var(--border)':'var(--accent)', color: showAddRew?'var(--text-primary)':'#000', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', fontSize: 'var(--font-md)' }}>{showAddRew?'✕ Отмена':'+ Добавить награду'}</button></div>
          {showAddRew&&(<div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: 16, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 14, border: '1px solid var(--border)' }}><div><label style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Уровень</label><input type="number" value={newRewLevel} onChange={(e)=>setNewRewLevel(e.target.value)} placeholder="5" style={{ width: 70, padding: 8, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--font-lg)' }} /></div><div><label style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Роль</label><input type="text" value={sanitize(newRewRole)} onChange={(e)=>setNewRewRole(e.target.value)} placeholder="@роль" style={{ width: 140, padding: 8, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--font-lg)' }} /></div><div><label style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Сообщение</label><input type="text" value={sanitize(newRewMsg)} onChange={(e)=>setNewRewMsg(e.target.value)} placeholder="Поздравляем!" style={{ width: 180, padding: 8, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--font-lg)' }} /></div><button onClick={addReward} style={{ padding: '8px 18px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer' }}>Добавить</button></div>)}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>{rewards.map((r,i)=>(<div key={i} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: 14, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border)' }}><span style={{ background: r.color, color: '#000', fontWeight: 'bold', padding: '6px 12px', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-lg)', minWidth: 55, textAlign: 'center' }}>Ур. {r.level}</span><div style={{ flex: 1 }}><span style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>{sanitize(r.role)}</span>{r.message&&<p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>💬 {sanitize(r.message)}</p>}</div><span onClick={()=>setRewards(rewards.filter((_,j)=>j!==i))} style={{ color: 'var(--danger)', cursor: 'pointer', fontSize: 16 }}>✕</span></div>))}</div>
        </div>
      )}

      {activeTab === 'voice' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}><button onClick={()=>setShowAddVoice(!showAddVoice)} style={{ padding: '9px 18px', background: showAddVoice?'var(--border)':'var(--accent)', color: showAddVoice?'var(--text-primary)':'#000', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', fontSize: 'var(--font-md)' }}>{showAddVoice?'✕ Отмена':'+ Добавить'}</button></div>
          {showAddVoice&&(<div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: 16, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 14, border: '1px solid var(--border)' }}><div><label style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Минут</label><input type="number" value={newVoiceMin} onChange={(e)=>setNewVoiceMin(e.target.value)} placeholder="60" style={{ width: 80, padding: 8, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--font-lg)' }} /></div><div><label style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Роль</label><input type="text" value={sanitize(newVoiceRole)} onChange={(e)=>setNewVoiceRole(e.target.value)} placeholder="@роль" style={{ width: 160, padding: 8, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--font-lg)' }} /></div><button onClick={addVoiceReward} style={{ padding: '8px 18px', background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer' }}>Добавить</button></div>)}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>{voiceRewards.map((r,i)=>(<div key={i} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: 14, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border)' }}><span style={{ background: r.color, color: '#000', fontWeight: 'bold', padding: '6px 12px', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-lg)', minWidth: 70, textAlign: 'center' }}>{r.minutes} мин</span><span style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{sanitize(r.role)}</span><span onClick={()=>setVoiceRewards(voiceRewards.filter((_,j)=>j!==i))} style={{ color: 'var(--danger)', cursor: 'pointer', fontSize: 16 }}>✕</span></div>))}</div>
        </div>
      )}

      {activeTab === 'card' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: 18, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>🎨 Дизайн</h3>
              <div style={{ marginBottom: 12 }}><label style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Цвет фона</label><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="color" value={cardBgColor} onChange={(e)=>setCardBgColor(e.target.value)} style={{ width: 36, height: 36, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }} /><input type="text" value={sanitize(cardBgColor)} onChange={(e)=>setCardBgColor(e.target.value)} style={{ flex: 1, padding: 8, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--font-lg)' }} /></div></div>
              <div style={{ marginBottom: 12 }}><label style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Акцентный цвет</label><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="color" value={cardAccentColor} onChange={(e)=>setCardAccentColor(e.target.value)} style={{ width: 36, height: 36, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }} /><input type="text" value={sanitize(cardAccentColor)} onChange={(e)=>setCardAccentColor(e.target.value)} style={{ flex: 1, padding: 8, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--font-lg)' }} /></div></div>
              <div style={{ marginBottom: 12 }}><label style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Никнейм (макс. 25)</label><input type="text" value={sanitize(cardNickname)} onChange={(e)=>setCardNickname(e.target.value.slice(0,25))} maxLength={25} style={{ width: '100%', padding: 8, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--font-lg)', boxSizing: 'border-box' }} /></div>
              <div style={{ marginBottom: 12 }}><label style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>URL аватара</label><input type="text" value={sanitize(cardAvatarUrl)} onChange={(e)=>setCardAvatarUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: 8, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--font-lg)', boxSizing: 'border-box' }} /></div>
              <div><label style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Стиль</label><select value={cardStyle} onChange={(e)=>setCardStyle(e.target.value)} style={{ width: '100%', padding: 8, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: 'var(--font-lg)' }}>{cardStyles.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
            </div>
            <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: 18, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>📋 Отображение</h3>
              {[{ key: 'cardShowAvatar', label: '👤 Аватар', value: cardShowAvatar, set: setCardShowAvatar },{ key: 'cardShowXP', label: '📊 Прогресс XP', value: cardShowXP, set: setCardShowXP },{ key: 'cardShowRank', label: '🏆 Место', value: cardShowRank, set: setCardShowRank },{ key: 'cardShowAchievements', label: '🏅 Достижения', value: cardShowAchievements, set: setCardShowAchievements },{ key: 'cardShowShare', label: '🔗 Поделиться', value: cardShowShare, set: setCardShowShare }].map((item,i)=>(<div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i<4?'1px solid var(--border)':'none' }}><span style={{ fontSize: 'var(--font-md)', color: 'var(--text-primary)' }}>{sanitize(item.label)}</span><div onClick={()=>item.set(!item.value)} style={{ width: 40, height: 22, background: item.value?'var(--accent)':'var(--border)', borderRadius: 22, cursor: 'pointer', position: 'relative' }}><div style={{ position: 'absolute', height: 16, width: 16, left: item.value?22:3, top: 3, background: item.value?'#000':'#FFF', borderRadius: '50%', transition: '0.25s' }} /></div></div>))}
            </div>
          </div>
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: 18, border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>👁️ Предпросмотр карточки</h3>
            <div style={{ ...getCardStyle(), borderRadius: 'var(--radius-xl)', padding: 20, position: 'relative', overflow: 'hidden', maxWidth: 380 }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>{cardShowRank&&<div style={{ background: cardAccentColor, color: '#000', fontWeight: 'bold', padding: '3px 10px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-xs)' }}>🏆 #{firstMember.rank||1}</div>}<div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>Ур. {firstMember.level||42}</div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {cardShowAvatar&&<div style={{ width: 50, height: 50, minWidth: 50, borderRadius: 'var(--radius-xl)', border: `3px solid ${cardAccentColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, overflow: 'hidden' }}>{cardAvatarUrl?<img src={cardAvatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e)=>{e.currentTarget.style.display='none'}} />:<span>{firstMember.avatar||'👤'}</span>}</div>}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: 'var(--font-lg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{sanitize(cardNickname).length>25?sanitize(cardNickname).slice(0,25)+'...':sanitize(cardNickname)}</div>
                    {cardShowXP&&<div style={{ marginTop: 6 }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: 3 }}><span>XP</span><span>{(firstMember.xp||15420).toLocaleString()} / 20,000</span></div><div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${Math.min(100,((firstMember.xp||15420)/20000)*100)}%`, height: '100%', background: cardAccentColor, borderRadius: 3 }} /></div></div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 12 }}><div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', padding: '5px 8px', textAlign: 'center' }}><div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>💬</div><div style={{ fontSize: 'var(--font-md)', fontWeight: 'bold', color: cardAccentColor }}>{(firstMember.messages||2400).toLocaleString()}</div></div><div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', padding: '5px 8px', textAlign: 'center' }}><div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>🎤</div><div style={{ fontSize: 'var(--font-md)', fontWeight: 'bold', color: cardAccentColor }}>{firstMember.voiceHours||120}ч</div></div><div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', padding: '5px 8px', textAlign: 'center' }}><div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>⭐</div><div style={{ fontSize: 'var(--font-md)', fontWeight: 'bold', color: cardAccentColor }}>{(firstMember.reactions||856).toLocaleString()}</div></div></div>
                {cardShowShare&&(<div style={{ marginTop: 10, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}><button onClick={shareCard} style={{ padding: '6px 12px', background: shareAnim?'var(--success)':cardAccentColor, color: '#000', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 'var(--font-xs)', cursor: 'pointer', transition: 'all 0.3s', transform: shareAnim?'scale(1.05)':'scale(1)' }}>{shareAnim?'✅ Скопировано!':'📋 Копировать'}</button><button onClick={shareToVK} style={{ padding: '6px 12px', background: '#0077FF', color: '#FFF', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 'var(--font-xs)', cursor: 'pointer' }}>💙 VK</button><button onClick={shareToLolka} style={{ padding: '6px 12px', background: '#5865F2', color: '#FFF', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 'var(--font-xs)', cursor: 'pointer' }}>🎮 Lolka</button>{shareToast && <div style={{ width: '100%', marginTop: 6, padding: '5px 10px', background: 'rgba(34,197,94,0.2)', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: 'var(--font-xs)', color: 'var(--success)' }}>{shareToast}</div>}</div>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div>
          <div style={{ marginBottom: 16 }}><input type="text" value={sanitize(searchMember)} onChange={(e)=>setSearchMember(e.target.value)} placeholder="🔍 Поиск участника..." style={{ width: '100%', maxWidth: 400, padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)', fontSize: 'var(--font-lg)', outline: 'none', boxSizing: 'border-box' }} /></div>
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {membersLoading?(<div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>⏳ Загрузка...</div>):members.length===0?(<div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>👥<p>Нет данных</p></div>):(
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['#','Участник','Уровень','XP','Прогресс'].map((h,i)=>(<th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>))}</tr></thead>
                <tbody>{filteredMembers.map((m,i)=>(<tr key={i} style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '12px 16px' }}><span style={{ fontWeight: 'bold', color: i<3?'var(--warning)':'var(--text-secondary)', fontSize: 'var(--font-lg)' }}>#{m.rank||i+1}</span></td><td style={{ padding: '12px 16px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 'var(--icon-lg)' }}>{m.avatar||'👤'}</span><span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{sanitize(m.name)}</span></div></td><td style={{ padding: '12px 16px' }}><span style={{ background: 'var(--bg-input)', padding: '3px 10px', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 'var(--font-md)', color: 'var(--text-primary)' }}>{m.level||0}</span></td><td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>{(m.xp||0).toLocaleString()}</td><td style={{ padding: '12px 16px' }}><div style={{ height: 5, background: 'var(--border)', borderRadius: 3, width: 100 }}><div style={{ width: `${Math.min(100,((m.xp||0)/30000)*100)}%`, height: '100%', background: 'var(--accent)', borderRadius: 3 }} /></div></td></tr>))}</tbody></table>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, gap: 10, flexWrap: 'wrap' }}>
        <button onClick={resetAll} style={{ padding: '10px 18px', background: 'transparent', color: 'var(--danger)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', fontWeight: 600, cursor: 'pointer', fontSize: 'var(--font-md)' }}>🔄 Сбросить</button>
        <button onClick={save} style={{ padding: '10px 24px', background: saved?'var(--success)':'var(--accent)', color: '#000', border: 'none', borderRadius: 'var(--radius-lg)', fontWeight: 600, cursor: 'pointer', fontSize: 'var(--font-md)', transition: 'all 0.3s' }}>{saved?'✅ Сохранено!':'💾 Сохранить всё'}</button>
      </div>
      {saved&&<div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--success)', color: '#000', padding: '12px 22px', borderRadius: 'var(--radius-lg)', fontWeight: 600, fontSize: 'var(--font-md)', zIndex: 1000, boxShadow: '0 4px 25px rgba(34,197,94,0.4)', animation: 'slideUp 0.3s ease' }}>✅ Все настройки сохранены!</div>}
      <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  )
}
