"use client"

import { useState, useEffect } from 'react'

const sanitize = (text: string): string => {
  if (!text) return ''
  return text.replace(/[\u0000-\u001F]/g, '').replace(/[\u200B-\u200D]/g, '').replace(/[\uFEFF]/g, '').trim()
}

export default function ModerationPage() {
  const [settings, setSettings] = useState({
    antiSpam: true, antiRaid: true, badWordsFilter: true, badWordsList: 'спам, реклама, казино, продам 🚫',
    maxWarnings: 3, muteDuration: 10, banDuration: 1440, autoDeleteLinks: false,
    allowedLinks: 'youtube.com, twitch.tv, discord.gg', captchaForNew: true, logChannel: '#логи-модерации 📋',
    autoModMentions: true, maxMentions: 5, autoModEmoji: false, maxEmoji: 10,
    autoModCaps: true, capsThreshold: 70, autoModRepeats: true, repeatThreshold: 3,
    deleteAfterWarn: true, dmOnWarn: true, dmOnMute: true, appealChannel: '',
    rulesChannel: '#правила 📜', rulesUrl: '', rulesText: '1. Без спама\n2. Без оскорблений\n3. Без рекламы\n4. Уважать участников',
    modBotName: 'Нова Модератор 🛡️', modAvatarStyle: 'shield', modAvatarUrl: '',
    useAIResponses: true, aiModel: 'auto',
    warnMessage: '{user}, вы нарушили правило {rule}. Предупреждение {count}/{max}.',
    muteMessage: '{user}, вы замьючены на {duration} минут. Причина: {reason}',
    banMessage: '{user}, вы забанены. Причина: {reason}. Апелляция: {appeal}',
  })

  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('protection')
  const update = (key: string, value: any) => setSettings({ ...settings, [key]: value })
  const toggle = (key: string) => update(key, !settings[key as keyof typeof settings])
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const [logFilter, setLogFilter] = useState('all')
  const [logSearch, setLogSearch] = useState('')
  const [auditLog, setAuditLog] = useState<any[]>([])
  const [logLoading, setLogLoading] = useState(true)

  useEffect(() => {
    fetch('https://nova-bot-rpsy.onrender.com/api/moderation/log')
      .then(res => res.json())
      .then(data => { setAuditLog(data.entries || []); setLogLoading(false) })
      .catch(() => setLogLoading(false))
  }, [])

  const filteredLog = auditLog.filter(entry => {
    const matchType = logFilter === 'all' || 
      (logFilter === 'warn' && (entry.action || '').includes('Предупреждение')) ||
      (logFilter === 'mute' && (entry.action || '').includes('Мут')) ||
      (logFilter === 'ban' && (entry.action || '').includes('Бан'))
    const matchSearch = (entry.user || '').toLowerCase().includes(logSearch.toLowerCase()) ||
      (entry.reason || '').toLowerCase().includes(logSearch.toLowerCase())
    return matchType && matchSearch
  })

  const modAvatars = [
    { id: 'shield', icon: '🛡️', label: 'Щит', color: '#00E5FF' },
    { id: 'sword', icon: '⚔️', label: 'Меч', color: '#EF4444' },
    { id: 'eye', icon: '👁️', label: 'Око', color: '#A855F7' },
    { id: 'hammer', icon: '🔨', label: 'Молот', color: '#F59E0B' },
    { id: 'lock', icon: '🔒', label: 'Замок', color: '#22C55E' },
    { id: 'robot', icon: '🤖', label: 'Робот', color: '#3B82F6' },
  ]

  return (
    <div style={{ padding: '32px 40px', maxWidth: '1100px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>🛡️ Модерация</h1>
      <p style={{ color: '#94A3B8', fontSize: 14, marginBottom: 24 }}>Гибкая настройка защиты, AI-модератор, правила и журнал</p>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { id: 'protection', label: '🛡️ Защита' }, { id: 'auto', label: '🤖 Автомодерация' },
          { id: 'punish', label: '⚡ Наказания' }, { id: 'rules', label: '📜 Правила' },
          { id: 'moderator', label: '👤 Модератор' }, { id: 'log', label: '📋 Журнал' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: activeTab === tab.id ? '#1F2937' : 'transparent', color: activeTab === tab.id ? '#FFF' : '#94A3B8', fontWeight: activeTab === tab.id ? 600 : 400, cursor: 'pointer', fontSize: 13, transition: 'all 0.15s' }}>{sanitize(tab.label)}</button>
        ))}
      </div>

      {activeTab === 'protection' && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>🛡️ Базовая защита</h3>
          {[
            { key: 'antiSpam', label: '🚫 Антиспам', desc: 'Автоудаление спам-сообщений' },
            { key: 'antiRaid', label: '🛡️ Антирейд', desc: 'Защита от массовых атак' },
            { key: 'badWordsFilter', label: '🔇 Фильтр мата', desc: 'Удаление запрещённых слов' },
            { key: 'captchaForNew', label: '🤖 Капча для новых', desc: 'Проверка участников при входе' },
            { key: 'autoDeleteLinks', label: '🔗 Удаление ссылок', desc: 'Автоудаление всех ссылок' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 4 ? '1px solid #1F2937' : 'none' }}>
              <div><div style={{ fontSize: 14, fontWeight: 500 }}>{sanitize(item.label)}</div><div style={{ fontSize: 12, color: '#94A3B8' }}>{sanitize(item.desc)}</div></div>
              <div onClick={() => toggle(item.key)} style={toggleStyle(settings[item.key as keyof typeof settings] as boolean)}><div style={toggleDotStyle(settings[item.key as keyof typeof settings] as boolean)} /></div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'auto' && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>🤖 Автомодерация</h3>
          {[
            { key: 'autoModMentions', label: '👥 Лимит упоминаний', value: settings.maxMentions, set: (v: number) => update('maxMentions', v) },
            { key: 'autoModEmoji', label: '😀 Лимит эмодзи', value: settings.maxEmoji, set: (v: number) => update('maxEmoji', v) },
            { key: 'autoModCaps', label: '🔊 CAPS (порог %)', value: settings.capsThreshold, set: (v: number) => update('capsThreshold', v) },
            { key: 'autoModRepeats', label: '🔄 Повторы сообщений', value: settings.repeatThreshold, set: (v: number) => update('repeatThreshold', v) },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 3 ? '1px solid #1F2937' : 'none' }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{sanitize(item.label)}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="number" value={item.value} onChange={(e) => item.set(parseInt(e.target.value) || 0)} style={{ width: 55, padding: '6px 8px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: 8, color: '#FFF', textAlign: 'center', fontSize: 13 }} />
                <div onClick={() => toggle(item.key)} style={{ ...toggleStyle(settings[item.key as keyof typeof settings] as boolean), width: 38, height: 22 }}><div style={{ ...toggleDotStyle(settings[item.key as keyof typeof settings] as boolean), height: 16, width: 16, left: settings[item.key as keyof typeof settings] ? 20 : 3 }} /></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'punish' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>⚡ Система наказаний</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: '⚠️ Максимум предупреждений до мута', key: 'maxWarnings', type: 'number' },
                { label: '📋 Канал логов', key: 'logChannel', type: 'text' },
                { label: '📬 Канал для апелляций', key: 'appealChannel', type: 'text' },
              ].map((f, i) => (
                <div key={i}><label style={styles.label}>{f.label}</label><input type={f.type} value={sanitize(String(settings[f.key as keyof typeof settings]))} onChange={(e) => update(f.key, f.type === 'number' ? parseInt(e.target.value) || 3 : e.target.value)} style={styles.input} /></div>
              ))}
              <div><label style={styles.label}>🔇 Длительность мута (минут)</label><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><input type="range" min="1" max="1440" step="5" value={settings.muteDuration} onChange={(e) => update('muteDuration', parseInt(e.target.value))} style={{ flex: 1, accentColor: '#00E5FF' }} /><span style={{ color: '#00E5FF', fontWeight: 600, fontSize: 14, minWidth: 45, textAlign: 'right' }}>{settings.muteDuration}м</span></div></div>
              <div><label style={styles.label}>🔨 Длительность бана (0 = навсегда)</label><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><input type="range" min="0" max="10080" step="60" value={settings.banDuration} onChange={(e) => update('banDuration', parseInt(e.target.value))} style={{ flex: 1, accentColor: '#EF4444' }} /><span style={{ color: '#EF4444', fontWeight: 600, fontSize: 14, minWidth: 50, textAlign: 'right' }}>{settings.banDuration === 0 ? '🔒 Навсегда' : `${Math.floor(settings.banDuration / 60)}ч`}</span></div></div>
            </div>
          </div>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>💬 Шаблоны сообщений</h3>
            <p style={{ fontSize: 11, color: '#64748B', marginBottom: 12 }}>Переменные: {'{user}'}, {'{rule}'}, {'{count}'}, {'{max}'}, {'{duration}'}, {'{reason}'}, {'{appeal}'}</p>
            {['warnMessage', 'muteMessage', 'banMessage'].map((key, i) => (
              <div key={i} style={{ marginBottom: 12 }}><label style={styles.label}>{key === 'warnMessage' ? '⚠️ Предупреждение' : key === 'muteMessage' ? '🔇 Мут' : '🔨 Бан'}</label><input type="text" value={sanitize(String(settings[key as keyof typeof settings]))} onChange={(e) => update(key, e.target.value)} style={styles.input} /></div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>📜 Правила сервера</h3>
          <div style={{ marginBottom: 14 }}><label style={styles.label}>🔗 Ссылка на канал с правилами</label><input type="text" value={sanitize(settings.rulesUrl)} onChange={(e) => { const value = e.target.value; update('rulesUrl', value); if (value.includes('#')) { const channelName = value.split('#').pop()?.split('/')[0]; if (channelName) update('rulesChannel', '#' + channelName) } }} placeholder="https://lolka.app/.../rules" style={styles.input} /></div>
          <div style={{ marginBottom: 14 }}><label style={styles.label}>📢 Название канала</label><input type="text" value={sanitize(settings.rulesChannel)} onChange={(e) => update('rulesChannel', e.target.value)} style={styles.input} /></div>
          <div><label style={styles.label}>📝 Текст правил</label><textarea value={sanitize(settings.rulesText)} onChange={(e) => update('rulesText', e.target.value)} rows={6} placeholder="1. Без спама..." style={{ ...styles.input, resize: 'vertical', fontFamily: 'monospace', lineHeight: 1.6, boxSizing: 'border-box' }} /></div>
        </div>
      )}

      {activeTab === 'moderator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>👤 Бот-модератор</h3>
            <div style={{ marginBottom: 16 }}><label style={styles.label}>Имя бота-модератора</label><input type="text" value={sanitize(settings.modBotName)} onChange={(e) => update('modBotName', e.target.value)} style={styles.input} /></div>
            <label style={styles.label}>Аватар модератора</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>{modAvatars.map(av => (<div key={av.id} onClick={() => update('modAvatarStyle', av.id)} style={{ padding: 14, borderRadius: 12, cursor: 'pointer', textAlign: 'center', background: settings.modAvatarStyle === av.id ? 'rgba(0,229,255,0.08)' : '#111118', border: `2px solid ${settings.modAvatarStyle === av.id ? av.color : '#1F2937'}`, transition: 'all 0.2s' }}><div style={{ fontSize: 28, marginBottom: 6 }}>{av.icon}</div><div style={{ fontSize: 11, fontWeight: 500, color: settings.modAvatarStyle === av.id ? av.color : '#94A3B8' }}>{av.label}</div></div>))}</div>
            <label style={styles.label}>Или укажите URL своего аватара</label>
            <input type="text" value={sanitize(settings.modAvatarUrl)} onChange={(e) => update('modAvatarUrl', e.target.value)} placeholder="https://example.com/mod-avatar.png" style={styles.input} />
          </div>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🤖 AI-модератор</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div><div style={{ fontSize: 14, fontWeight: 500 }}>Использовать AI для ответов</div><div style={{ fontSize: 12, color: '#94A3B8' }}>Gemini/DeepSeek вместо шаблонов</div></div>
              <div onClick={() => toggle('useAIResponses')} style={toggleStyle(settings.useAIResponses)}><div style={toggleDotStyle(settings.useAIResponses)} /></div>
            </div>
            {settings.useAIResponses && <div><label style={styles.label}>AI модель</label><select value={settings.aiModel} onChange={(e) => update('aiModel', e.target.value)} style={styles.input}><option value="auto">🔄 Авто</option><option value="gemini">🔵 Gemini</option><option value="deepseek">🟣 DeepSeek</option></select></div>}
          </div>
        </div>
      )}

      {activeTab === 'log' && (
        <div style={styles.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>📋 Журнал нарушений</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input type="text" value={sanitize(logSearch)} onChange={(e) => setLogSearch(e.target.value)} placeholder="🔍 Поиск..." style={{ padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: 8, color: '#FFF', fontSize: 12, outline: 'none', width: 160 }} />
              {[{ id: 'all', label: 'Все' },{ id: 'warn', label: '⚠️' },{ id: 'mute', label: '🔇' },{ id: 'ban', label: '🔨' }].map(f => (<button key={f.id} onClick={() => setLogFilter(f.id)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #1F2937', background: logFilter === f.id ? '#1F2937' : 'transparent', color: logFilter === f.id ? '#FFF' : '#94A3B8', cursor: 'pointer', fontSize: 11 }}>{f.label}</button>))}
            </div>
          </div>
          {logLoading ? <p style={{ color: '#94A3B8', textAlign: 'center', padding: 40 }}>⏳ Загрузка...</p> :
            filteredLog.length === 0 ? <p style={{ color: '#64748B', textAlign: 'center', padding: 40 }}>Записи не найдены</p> :
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}><thead><tr style={{ borderBottom: '1px solid #1F2937' }}>{['Пользователь','Действие','Причина','Модератор','Время'].map((h,i)=>(<th key={i} style={{padding:'10px 14px',textAlign:'left',fontSize:11,fontWeight:600,color:'#94A3B8',textTransform:'uppercase'}}>{h}</th>))}</tr></thead>
            <tbody>{filteredLog.map((entry,i)=>(<tr key={i} style={{borderBottom:'1px solid #1F2937'}}><td style={{padding:'10px 14px',fontWeight:500}}>{sanitize(entry.user)}</td><td style={{padding:'10px 14px'}}><span style={{padding:'3px 10px',borderRadius:6,fontSize:11,background:(entry.action||'').includes('Бан')?'rgba(239,68,68,0.15)':(entry.action||'').includes('Мут')?'rgba(245,158,11,0.15)':'rgba(59,130,246,0.15)',color:(entry.action||'').includes('Бан')?'#EF4444':(entry.action||'').includes('Мут')?'#F59E0B':'#3B82F6'}}>{sanitize(entry.action)}</span></td><td style={{padding:'10px 14px',color:'#94A3B8'}}>{sanitize(entry.reason)}</td><td style={{padding:'10px 14px',color:'#94A3B8'}}>{sanitize(entry.moderator)}</td><td style={{padding:'10px 14px',color:'#64748B',fontSize:12}}>{entry.time}</td></tr>))}</tbody></table>
          }
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <button onClick={save} style={{ padding: '12px 28px', background: saved ? '#22C55E' : '#00E5FF', color: '#000', border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer', fontSize: 14, transition: 'all 0.3s', boxShadow: saved ? '0 0 20px rgba(34,197,94,0.3)' : '0 0 20px rgba(0,229,255,0.2)' }}>{saved ? '✅ Сохранено!' : '💾 Сохранить настройки'}</button>
      </div>

      {saved && <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#22C55E', color: '#000', padding: '14px 24px', borderRadius: 14, fontWeight: 600, fontSize: 15, zIndex: 1000, boxShadow: '0 4px 25px rgba(34,197,94,0.4)', animation: 'slideUp 0.3s ease' }}>✅ Настройки модерации сохранены!</div>}
      <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  section: { background: '#16161F', borderRadius: 14, padding: 20, border: '1px solid #1F2937', marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: 600, margin: '0 0 14px 0' },
  label: { fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 6 },
  input: { width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: 10, color: '#FFF', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
}

const toggleStyle = (active: boolean): React.CSSProperties => ({ width: 44, height: 26, background: active ? '#00E5FF' : '#374151', borderRadius: 26, cursor: 'pointer', position: 'relative', flexShrink: 0 })
const toggleDotStyle = (active: boolean): React.CSSProperties => ({ position: 'absolute', height: 20, width: 20, left: active ? 22 : 4, top: 3, background: active ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' })
