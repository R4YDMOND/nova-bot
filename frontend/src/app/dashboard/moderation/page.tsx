"use client"

import { useState } from 'react'

// Защита от краша, эмодзи и спецсимволов
const sanitize = (text: string): string => {
  if (!text) return ''
  return text
    .replace(/[\u0000-\u001F]/g, '')
    .replace(/[\u200B-\u200D]/g, '')
    .replace(/[\uFEFF]/g, '')
    .trim()
}

export default function ModerationPage() {
  const [settings, setSettings] = useState({
    // Защита
    antiSpam: true,
    antiRaid: true,
    badWordsFilter: true,
    badWordsList: 'спам, реклама, казино, продам 🚫',
    maxWarnings: 3,
    muteDuration: 10,
    banDuration: 1440,
    autoDeleteLinks: false,
    allowedLinks: 'youtube.com, twitch.tv, discord.gg',
    captchaForNew: true,
    logChannel: '#логи-модерации 📋',
    
    // Автомодерация
    autoModMentions: true,
    maxMentions: 5,
    autoModEmoji: false,
    maxEmoji: 10,
    autoModCaps: true,
    capsThreshold: 70,
    autoModRepeats: true,
    repeatThreshold: 3,
    
    // Уведомления
    deleteAfterWarn: true,
    dmOnWarn: true,
    dmOnMute: true,
    appealChannel: '',
    
    // Правила
    rulesChannel: '#правила 📜',
    rulesUrl: '',
    rulesText: '1. Без спама\n2. Без оскорблений\n3. Без рекламы\n4. Уважать участников',
    
    // AI-модератор
    modBotName: 'Нова Модератор 🛡️',
    modAvatarStyle: 'shield',
    modAvatarUrl: '',
    useAIResponses: true,
    aiModel: 'auto',
    
    // Наказания
    warnMessage: '{user}, вы нарушили правило {rule}. Предупреждение {count}/{max}.',
    muteMessage: '{user}, вы замьючены на {duration} минут. Причина: {reason}',
    banMessage: '{user}, вы забанены. Причина: {reason}. Апелляция: {appeal}',
  })

  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('protection')
  const update = (key: string, value: any) => setSettings({ ...settings, [key]: value })
  const toggle = (key: string) => update(key, !settings[key as keyof typeof settings])
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  // Журнал нарушений
  const [logFilter, setLogFilter] = useState('all')
  const [logSearch, setLogSearch] = useState('')
  const [auditLog] = useState([
    { id: 1, user: '👩 Alice', action: '⚠️ Предупреждение', reason: 'Спам', moderator: 'Нова 🛡️', time: '14:30', rule: '№1' },
    { id: 2, user: '👨 Bob', action: '🔇 Мут 10м', reason: 'Оскорбления', moderator: 'Нова 🛡️', time: '15:45', rule: '№2' },
    { id: 3, user: '🧑 Charlie', action: '⚠️ Предупреждение', reason: 'Капс', moderator: 'Авто 🤖', time: '16:20', rule: '№3' },
    { id: 4, user: '👩‍🦰 Diana', action: '🔨 Бан 24ч', reason: 'Рейд', moderator: 'Admin', time: '17:00', rule: '№4' },
    { id: 5, user: '👩‍🦱 Eve', action: '⚠️ Предупреждение', reason: 'Ссылки', moderator: 'Нова 🛡️', time: '18:10', rule: '№1' },
    { id: 6, user: '👩 Alice', action: '🔇 Мут 30м', reason: 'Повторный спам', moderator: 'Нова 🛡️', time: '19:00', rule: '№1' },
  ])

  const filteredLog = auditLog.filter(entry => {
    const matchType = logFilter === 'all' || 
      (logFilter === 'warn' && entry.action.includes('Предупреждение')) ||
      (logFilter === 'mute' && entry.action.includes('Мут')) ||
      (logFilter === 'ban' && entry.action.includes('Бан'))
    const matchSearch = entry.user.toLowerCase().includes(logSearch.toLowerCase()) ||
      entry.reason.toLowerCase().includes(logSearch.toLowerCase())
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
          <span style={{ color: '#00E5FF', fontSize: '14px', fontWeight: '500' }}>🛡️ Модерация</span>
        </div>
        <button onClick={save} style={{
          padding: '10px 22px', background: saved ? '#22C55E' : '#00E5FF', color: '#000',
          border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
          transition: 'all 0.25s'
        }}>{saved ? '✅ Сохранено!' : '💾 Сохранить'}</button>
      </header>

      <main style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto' }}>
        
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '6px' }}>🛡️ Модерация</h1>
        <p style={{ color: '#94A3B8', fontSize: '15px', marginBottom: '24px' }}>Гибкая настройка защиты, AI-модератор, правила и журнал</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { id: 'protection', label: '🛡️ Защита' },
            { id: 'auto', label: '🤖 Автомодерация' },
            { id: 'punish', label: '⚡ Наказания' },
            { id: 'rules', label: '📜 Правила' },
            { id: 'moderator', label: '👤 Модератор' },
            { id: 'log', label: '📋 Журнал' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '10px 18px', borderRadius: '10px', border: 'none',
              background: activeTab === tab.id ? '#1F2937' : 'transparent',
              color: activeTab === tab.id ? '#FFF' : '#94A3B8',
              fontWeight: activeTab === tab.id ? '600' : '400',
              cursor: 'pointer', fontSize: '13px', transition: 'all 0.15s'
            }}>{sanitize(tab.label)}</button>
          ))}
        </div>

        {/* Tab: Защита */}
        {activeTab === 'protection' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#16161F', borderRadius: '18px', padding: '24px', border: '1px solid #1F2937' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>🛡️ Базовая защита</h3>
              {[
                { key: 'antiSpam', label: '🚫 Антиспам', desc: 'Автоудаление спам-сообщений' },
                { key: 'antiRaid', label: '🛡️ Антирейд', desc: 'Защита от массовых атак' },
                { key: 'badWordsFilter', label: '🔇 Фильтр мата', desc: 'Удаление запрещённых слов' },
                { key: 'captchaForNew', label: '🤖 Капча для новых', desc: 'Проверка участников при входе' },
                { key: 'autoDeleteLinks', label: '🔗 Удаление ссылок', desc: 'Автоудаление всех ссылок' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 4 ? '1px solid #1F2937' : 'none' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{sanitize(item.label)}</div>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>{sanitize(item.desc)}</div>
                  </div>
                  <div onClick={() => toggle(item.key)} style={{ width: '44px', height: '26px', background: settings[item.key as keyof typeof settings] ? '#00E5FF' : '#374151', borderRadius: '26px', cursor: 'pointer', transition: '0.25s', position: 'relative', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', height: '20px', width: '20px', left: settings[item.key as keyof typeof settings] ? '22px' : '4px', top: '3px', background: settings[item.key as keyof typeof settings] ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Автомодерация */}
        {activeTab === 'auto' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#16161F', borderRadius: '18px', padding: '24px', border: '1px solid #1F2937' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>🤖 Автомодерация</h3>
              {[
                { key: 'autoModMentions', label: '👥 Лимит упоминаний', value: settings.maxMentions, set: (v: number) => update('maxMentions', v) },
                { key: 'autoModEmoji', label: '😀 Лимит эмодзи', value: settings.maxEmoji, set: (v: number) => update('maxEmoji', v) },
                { key: 'autoModCaps', label: '🔊 CAPS (порог %)', value: settings.capsThreshold, set: (v: number) => update('capsThreshold', v) },
                { key: 'autoModRepeats', label: '🔄 Повторы сообщений', value: settings.repeatThreshold, set: (v: number) => update('repeatThreshold', v) },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 3 ? '1px solid #1F2937' : 'none' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>{sanitize(item.label)}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="number" value={item.value} onChange={(e) => item.set(parseInt(e.target.value) || 0)}
                      style={{ width: '55px', padding: '6px 8px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', textAlign: 'center', fontSize: '13px' }} />
                    <div onClick={() => toggle(item.key)} style={{ width: '38px', height: '22px', background: settings[item.key as keyof typeof settings] ? '#00E5FF' : '#374151', borderRadius: '22px', cursor: 'pointer', transition: '0.25s', position: 'relative', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', height: '16px', width: '16px', left: settings[item.key as keyof typeof settings] ? '20px' : '3px', top: '3px', background: settings[item.key as keyof typeof settings] ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Наказания */}
        {activeTab === 'punish' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#16161F', borderRadius: '18px', padding: '24px', border: '1px solid #1F2937' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>⚡ Система наказаний</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>⚠️ Максимум предупреждений до мута</label>
                  <input type="number" value={settings.maxWarnings} onChange={(e) => update('maxWarnings', parseInt(e.target.value) || 3)}
                    style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>🔇 Длительность мута (минут)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="range" min="1" max="1440" step="5" value={settings.muteDuration} onChange={(e) => update('muteDuration', parseInt(e.target.value))}
                      style={{ flex: 1, accentColor: '#00E5FF' }} />
                    <span style={{ color: '#00E5FF', fontWeight: '600', fontSize: '14px', minWidth: '45px', textAlign: 'right' }}>{settings.muteDuration}м</span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>🔨 Длительность бана (минут, 0 = навсегда)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="range" min="0" max="10080" step="60" value={settings.banDuration} onChange={(e) => update('banDuration', parseInt(e.target.value))}
                      style={{ flex: 1, accentColor: '#EF4444' }} />
                    <span style={{ color: '#EF4444', fontWeight: '600', fontSize: '14px', minWidth: '50px', textAlign: 'right' }}>{settings.banDuration === 0 ? '🔒 Навсегда' : `${Math.floor(settings.banDuration / 60)}ч`}</span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>📋 Канал логов</label>
                  <input type="text" value={sanitize(settings.logChannel)} onChange={(e) => update('logChannel', e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>📬 Канал для апелляций</label>
                  <input type="text" value={sanitize(settings.appealChannel)} onChange={(e) => update('appealChannel', e.target.value)}
                    placeholder="#апелляции"
                    style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>

            {/* Сообщения наказаний */}
            <div style={{ background: '#16161F', borderRadius: '18px', padding: '24px', border: '1px solid #1F2937' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>💬 Шаблоны сообщений</h3>
              <p style={{ fontSize: '11px', color: '#64748B', marginBottom: '12px' }}>
                Переменные: {'{user}'}, {'{rule}'}, {'{count}'}, {'{max}'}, {'{duration}'}, {'{reason}'}, {'{appeal}'}, {'{rulesChannel}'}
              </p>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>⚠️ Предупреждение</label>
                <input type="text" value={sanitize(settings.warnMessage)} onChange={(e) => update('warnMessage', e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>🔇 Мут</label>
                <input type="text" value={sanitize(settings.muteMessage)} onChange={(e) => update('muteMessage', e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>🔨 Бан</label>
                <input type="text" value={sanitize(settings.banMessage)} onChange={(e) => update('banMessage', e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>
        )}

        {/* Tab: Правила */}
        {activeTab === 'rules' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#16161F', borderRadius: '18px', padding: '24px', border: '1px solid #1F2937' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>📜 Правила сервера</h3>
              <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '16px' }}>
                Правила будут автоматически прикрепляться к предупреждениям и наказаниям
              </p>
              
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>🔗 Ссылка на канал с правилами (автоопределение)</label>
                <input type="text" value={sanitize(settings.rulesUrl)} onChange={(e) => {
                  const value = e.target.value
                  update('rulesUrl', value)
                  if (value.includes('#')) {
                    const channelName = value.split('#').pop()?.split('/')[0]
                    if (channelName) update('rulesChannel', '#' + channelName)
                  }
                }}
                  placeholder="https://lolka.app/.../rules или https://vk.com/..."
                  style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>📢 Название канала (авто или вручную)</label>
                <input type="text" value={sanitize(settings.rulesChannel)} onChange={(e) => update('rulesChannel', e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>📝 Текст правил</label>
                <textarea value={sanitize(settings.rulesText)} onChange={(e) => update('rulesText', e.target.value)}
                  rows={6}
                  placeholder="1. Без спама&#10;2. Без оскорблений&#10;3. ..."
                  style={{ width: '100%', padding: '12px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace', lineHeight: '1.6' }} />
              </div>

              <div style={{ marginTop: '16px', background: '#111118', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>📝 Пример сообщения при нарушении:</div>
                <div style={{ fontSize: '13px', color: '#94A3B8', fontStyle: 'italic', lineHeight: '1.6' }}>
                  ⚠️ Alice, вы нарушили правило №2. Предупреждение 1/3.<br/>
                  📜 Ознакомьтесь с правилами: {sanitize(settings.rulesChannel) || '#правила'}<br/>
                  {settings.appealChannel ? `📬 Апелляция: ${sanitize(settings.appealChannel)}` : ''}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Модератор */}
        {activeTab === 'moderator' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#16161F', borderRadius: '18px', padding: '24px', border: '1px solid #1F2937' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>👤 Бот-модератор</h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Имя бота-модератора</label>
                <input type="text" value={sanitize(settings.modBotName)} onChange={(e) => update('modBotName', e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '10px' }}>Аватар модератора</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {modAvatars.map(av => (
                    <div key={av.id} onClick={() => update('modAvatarStyle', av.id)} style={{
                      padding: '14px', borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
                      background: settings.modAvatarStyle === av.id ? 'rgba(0,229,255,0.08)' : '#111118',
                      border: `2px solid ${settings.modAvatarStyle === av.id ? av.color : '#1F2937'}`,
                      transition: 'all 0.2s'
                    }}>
                      <div style={{ fontSize: '28px', marginBottom: '6px' }}>{av.icon}</div>
                      <div style={{ fontSize: '11px', fontWeight: '500', color: settings.modAvatarStyle === av.id ? av.color : '#94A3B8' }}>{av.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Свой URL аватара */}
              <div style={{ marginTop: '16px' }}>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>
                  Или укажите URL своего аватара
                </label>
                <input type="text" value={sanitize(settings.modAvatarUrl)} onChange={(e) => update('modAvatarUrl', e.target.value)}
                  placeholder="https://example.com/mod-avatar.png"
                  style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                {settings.modAvatarUrl && (
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={settings.modAvatarUrl} alt="Аватар" style={{ width: '48px', height: '48px', borderRadius: '14px', objectFit: 'cover', border: '2px solid #00E5FF40' }} />
                    <span style={{ fontSize: '12px', color: '#22C55E' }}>✅ Аватар загружен</span>
                  </div>
                )}
              </div>
            </div>

            {/* AI-ответы */}
            <div style={{ background: '#16161F', borderRadius: '18px', padding: '24px', border: '1px solid #1F2937' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>🤖 AI-модератор</h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>Использовать AI для ответов</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>Gemini/DeepSeek вместо шаблонов</div>
                </div>
                <div onClick={() => toggle('useAIResponses')} style={{ width: '44px', height: '26px', background: settings.useAIResponses ? '#00E5FF' : '#374151', borderRadius: '26px', cursor: 'pointer', position: 'relative' }}>
                  <div style={{ position: 'absolute', height: '20px', width: '20px', left: settings.useAIResponses ? '22px' : '4px', top: '3px', background: settings.useAIResponses ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} />
                </div>
              </div>

              {settings.useAIResponses && (
                <div>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>AI модель</label>
                  <select value={settings.aiModel} onChange={(e) => update('aiModel', e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', cursor: 'pointer' }}>
                    <option value="auto">🔄 Авто (Gemini → DeepSeek)</option>
                    <option value="gemini">🔵 Gemini</option>
                    <option value="deepseek">🟣 DeepSeek</option>
                  </select>
                </div>
              )}
            </div>

            {/* Уведомления */}
            <div style={{ background: '#16161F', borderRadius: '18px', padding: '24px', border: '1px solid #1F2937' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>🔔 Уведомления</h3>
              {[
                { key: 'deleteAfterWarn', label: '🗑️ Удалять сообщение при предупреждении' },
                { key: 'dmOnWarn', label: '💬 Отправлять ЛС при предупреждении' },
                { key: 'dmOnMute', label: '🔕 Отправлять ЛС при муте' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 2 ? '1px solid #1F2937' : 'none' }}>
                  <span style={{ fontSize: '13px' }}>{sanitize(item.label)}</span>
                  <div onClick={() => toggle(item.key)} style={{ width: '44px', height: '26px', background: settings[item.key as keyof typeof settings] ? '#00E5FF' : '#374151', borderRadius: '26px', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', height: '20px', width: '20px', left: settings[item.key as keyof typeof settings] ? '22px' : '4px', top: '3px', background: settings[item.key as keyof typeof settings] ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Журнал */}
        {activeTab === 'log' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: '#16161F', borderRadius: '18px', padding: '24px', border: '1px solid #1F2937' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600' }}>📋 Журнал нарушений</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input type="text" value={sanitize(logSearch)} onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="🔍 Поиск..."
                    style={{ padding: '8px 12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', fontSize: '12px', outline: 'none', width: '160px' }} />
                  {[
                    { id: 'all', label: 'Все' },
                    { id: 'warn', label: '⚠️ Варны' },
                    { id: 'mute', label: '🔇 Муты' },
                    { id: 'ban', label: '🔨 Баны' },
                  ].map(f => (
                    <button key={f.id} onClick={() => setLogFilter(f.id)} style={{
                      padding: '6px 12px', borderRadius: '8px', border: '1px solid #1F2937',
                      background: logFilter === f.id ? '#1F2937' : 'transparent',
                      color: logFilter === f.id ? '#FFF' : '#94A3B8',
                      cursor: 'pointer', fontSize: '11px', transition: 'all 0.15s'
                    }}>{f.label}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'Всего', value: auditLog.length, color: '#94A3B8' },
                  { label: 'Варнов', value: auditLog.filter(e => e.action.includes('Предупреждение')).length, color: '#F59E0B' },
                  { label: 'Мутов', value: auditLog.filter(e => e.action.includes('Мут')).length, color: '#F59E0B' },
                  { label: 'Банов', value: auditLog.filter(e => e.action.includes('Бан')).length, color: '#EF4444' },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#111118', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1F2937' }}>
                      {['Пользователь', 'Действие', 'Причина', 'Правило', 'Модератор', 'Время'].map((h, i) => (
                        <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLog.map(entry => (
                      <tr key={entry.id} style={{ borderBottom: '1px solid #1F2937' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#1A1A24'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '10px 14px', fontWeight: '500' }}>{sanitize(entry.user)}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: '6px', fontSize: '11px',
                            background: entry.action.includes('Бан') ? 'rgba(239,68,68,0.15)' : entry.action.includes('Мут') ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
                            color: entry.action.includes('Бан') ? '#EF4444' : entry.action.includes('Мут') ? '#F59E0B' : '#3B82F6'
                          }}>{sanitize(entry.action)}</span>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#94A3B8' }}>{sanitize(entry.reason)}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', background: '#0A0A0F', color: '#F59E0B' }}>{entry.rule}</span>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#94A3B8' }}>{sanitize(entry.moderator)}</td>
                        <td style={{ padding: '10px 14px', color: '#64748B', fontSize: '12px' }}>{entry.time}</td>
                      </tr>
                    ))}
                    {filteredLog.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>Записи не найдены</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Кнопки */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
          <button onClick={() => window.location.href = '/dashboard/modules'} style={{
            padding: '12px 24px', background: 'transparent', color: '#94A3B8',
            border: '1px solid #1F2937', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '14px'
          }}>← Назад к модулям</button>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => {
              setSettings({
                antiSpam: true, antiRaid: true, badWordsFilter: true, badWordsList: 'спам, реклама, казино, продам 🚫',
                maxWarnings: 3, muteDuration: 10, banDuration: 1440, autoDeleteLinks: false,
                allowedLinks: 'youtube.com, twitch.tv, discord.gg', captchaForNew: true,
                logChannel: '#логи-модерации 📋', autoModMentions: true, maxMentions: 5,
                autoModEmoji: false, maxEmoji: 10, autoModCaps: true, capsThreshold: 70,
                autoModRepeats: true, repeatThreshold: 3, deleteAfterWarn: true, dmOnWarn: true,
                dmOnMute: true, appealChannel: '',
                rulesChannel: '#правила 📜', rulesUrl: '', rulesText: '1. Без спама\n2. Без оскорблений\n3. Без рекламы\n4. Уважать участников',
                modBotName: 'Нова Модератор 🛡️', modAvatarStyle: 'shield', modAvatarUrl: '',
                useAIResponses: true, aiModel: 'auto',
                warnMessage: '{user}, вы нарушили правило {rule}. Предупреждение {count}/{max}.',
                muteMessage: '{user}, вы замьючены на {duration} минут. Причина: {reason}',
                banMessage: '{user}, вы забанены. Причина: {reason}. Апелляция: {appeal}',
              })
            }} style={{
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
            ✅ Настройки модерации сохранены!
          </div>
        )}
        <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      </main>
    </div>
  )
}
