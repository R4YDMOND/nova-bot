"use client"

import { useState } from 'react'

export default function ModerationPage() {
  const [settings, setSettings] = useState({
    antiSpam: true,
    antiRaid: true,
    badWordsFilter: true,
    badWordsList: 'спам, реклама, казино, продам',
    maxWarnings: 3,
    muteDuration: 10,
    banDuration: 1440,
    autoDeleteLinks: false,
    allowedLinks: 'youtube.com, twitch.tv, discord.gg',
    captchaForNew: true,
    logChannel: '#логи-модерации',
    autoModMentions: true,
    maxMentions: 5,
    autoModEmoji: false,
    maxEmoji: 10,
    autoModCaps: true,
    capsThreshold: 70,
    autoModRepeats: true,
    repeatThreshold: 3,
    deleteAfterWarn: true,
    dmOnWarn: true,
    dmOnMute: true,
    appealChannel: '',
  })

  const [saved, setSaved] = useState(false)
  const update = (key: string, value: any) => setSettings({ ...settings, [key]: value })
  const toggle = (key: string) => update(key, !settings[key as keyof typeof settings])
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', color: '#F1F5F9' }}>
      
      {/* Top Bar */}
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
          <span style={{ color: '#00E5FF', fontSize: '14px', fontWeight: '500' }}>Модерация</span>
        </div>
        <button onClick={save} style={{
          padding: '10px 22px', background: saved ? '#22C55E' : '#00E5FF', color: '#000',
          border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
          transition: 'all 0.25s'
        }}>{saved ? '✅ Сохранено!' : '💾 Сохранить'}</button>
      </header>

      <main style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '6px' }}>🛡️ Модерация</h1>
          <p style={{ color: '#94A3B8', fontSize: '15px' }}>Гибкая настройка автоматической защиты сервера</p>
        </div>

        {/* Сетка */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          {/* === Защита === */}
          <div style={{ background: '#16161F', borderRadius: '18px', padding: '24px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>🛡️ Базовая защита</h3>
            {[
              { key: 'antiSpam', label: 'Антиспам', desc: 'Автоудаление спам-сообщений' },
              { key: 'antiRaid', label: 'Антирейд', desc: 'Защита от массовых атак' },
              { key: 'badWordsFilter', label: 'Фильтр мата', desc: 'Удаление запрещённых слов' },
              { key: 'captchaForNew', label: 'Капча для новых', desc: 'Проверка участников при входе' },
              { key: 'autoDeleteLinks', label: 'Удаление ссылок', desc: 'Автоудаление всех ссылок' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 4 ? '1px solid #1F2937' : 'none' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.label}</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>{item.desc}</div>
                </div>
                <div onClick={() => toggle(item.key)} style={{ width: '44px', height: '26px', background: settings[item.key as keyof typeof settings] ? '#00E5FF' : '#374151', borderRadius: '26px', cursor: 'pointer', transition: '0.25s', position: 'relative', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', height: '20px', width: '20px', left: settings[item.key as keyof typeof settings] ? '22px' : '4px', top: '3px', background: settings[item.key as keyof typeof settings] ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} />
                </div>
              </div>
            ))}
          </div>

          {/* === Автомодерация === */}
          <div style={{ background: '#16161F', borderRadius: '18px', padding: '24px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>🤖 Автомодерация</h3>
            
            {/* Упоминания */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Лимит упоминаний</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="number" value={settings.maxMentions} onChange={(e) => update('maxMentions', parseInt(e.target.value) || 5)}
                    style={{ width: '55px', padding: '6px 8px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', textAlign: 'center', fontSize: '13px' }} />
                  <div onClick={() => toggle('autoModMentions')} style={{ width: '38px', height: '22px', background: settings.autoModMentions ? '#00E5FF' : '#374151', borderRadius: '22px', cursor: 'pointer', transition: '0.25s', position: 'relative', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', height: '16px', width: '16px', left: settings.autoModMentions ? '20px' : '3px', top: '3px', background: settings.autoModMentions ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Эмодзи */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Лимит эмодзи</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="number" value={settings.maxEmoji} onChange={(e) => update('maxEmoji', parseInt(e.target.value) || 10)}
                    style={{ width: '55px', padding: '6px 8px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', textAlign: 'center', fontSize: '13px' }} />
                  <div onClick={() => toggle('autoModEmoji')} style={{ width: '38px', height: '22px', background: settings.autoModEmoji ? '#00E5FF' : '#374151', borderRadius: '22px', cursor: 'pointer', transition: '0.25s', position: 'relative', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', height: '16px', width: '16px', left: settings.autoModEmoji ? '20px' : '3px', top: '3px', background: settings.autoModEmoji ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* CAPS */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>CAPS (порог %)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="number" value={settings.capsThreshold} onChange={(e) => update('capsThreshold', parseInt(e.target.value) || 70)}
                    style={{ width: '55px', padding: '6px 8px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', textAlign: 'center', fontSize: '13px' }} />
                  <div onClick={() => toggle('autoModCaps')} style={{ width: '38px', height: '22px', background: settings.autoModCaps ? '#00E5FF' : '#374151', borderRadius: '22px', cursor: 'pointer', transition: '0.25s', position: 'relative', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', height: '16px', width: '16px', left: settings.autoModCaps ? '20px' : '3px', top: '3px', background: settings.autoModCaps ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Повторы */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Повторы сообщений</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="number" value={settings.repeatThreshold} onChange={(e) => update('repeatThreshold', parseInt(e.target.value) || 3)}
                    style={{ width: '55px', padding: '6px 8px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '8px', color: '#FFF', textAlign: 'center', fontSize: '13px' }} />
                  <div onClick={() => toggle('autoModRepeats')} style={{ width: '38px', height: '22px', background: settings.autoModRepeats ? '#00E5FF' : '#374151', borderRadius: '22px', cursor: 'pointer', transition: '0.25s', position: 'relative', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', height: '16px', width: '16px', left: settings.autoModRepeats ? '20px' : '3px', top: '3px', background: settings.autoModRepeats ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* === Наказания === */}
          <div style={{ background: '#16161F', borderRadius: '18px', padding: '24px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>⚡ Наказания</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Максимум предупреждений до мута</label>
                <input type="number" value={settings.maxWarnings} onChange={(e) => update('maxWarnings', parseInt(e.target.value) || 3)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Длительность мута (минут)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="range" min="1" max="1440" step="5" value={settings.muteDuration} onChange={(e) => update('muteDuration', parseInt(e.target.value))}
                    style={{ flex: 1, accentColor: '#00E5FF' }} />
                  <span style={{ color: '#00E5FF', fontWeight: '600', fontSize: '14px', minWidth: '45px', textAlign: 'right' }}>{settings.muteDuration}м</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Длительность бана (минут, 0 = навсегда)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="range" min="0" max="10080" step="60" value={settings.banDuration} onChange={(e) => update('banDuration', parseInt(e.target.value))}
                    style={{ flex: 1, accentColor: '#EF4444' }} />
                  <span style={{ color: '#EF4444', fontWeight: '600', fontSize: '14px', minWidth: '50px', textAlign: 'right' }}>{settings.banDuration === 0 ? '🔒 Навсегда' : `${Math.floor(settings.banDuration / 60)}ч`}</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Канал логов</label>
                <input type="text" value={settings.logChannel} onChange={(e) => update('logChannel', e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Канал для апелляций</label>
                <input type="text" value={settings.appealChannel} onChange={(e) => update('appealChannel', e.target.value)}
                  placeholder="#апелляции (оставьте пустым чтобы отключить)"
                  style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          {/* === Уведомления и фильтры === */}
          <div style={{ background: '#16161F', borderRadius: '18px', padding: '24px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>📝 Фильтры и уведомления</h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Запрещённые слова (через запятую)</label>
              <textarea value={settings.badWordsList} onChange={(e) => update('badWordsList', e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Разрешённые ссылки (через запятую)</label>
              <input type="text" value={settings.allowedLinks} onChange={(e) => update('allowedLinks', e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { key: 'deleteAfterWarn', label: 'Удалять сообщение при предупреждении' },
                { key: 'dmOnWarn', label: 'Отправлять ЛС при предупреждении' },
                { key: 'dmOnMute', label: 'Отправлять ЛС при муте' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px' }}>{item.label}</span>
                  <div onClick={() => toggle(item.key)} style={{ width: '44px', height: '26px', background: settings[item.key as keyof typeof settings] ? '#00E5FF' : '#374151', borderRadius: '26px', cursor: 'pointer', transition: '0.25s', position: 'relative', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', height: '20px', width: '20px', left: settings[item.key as keyof typeof settings] ? '22px' : '4px', top: '3px', background: settings[item.key as keyof typeof settings] ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Кнопки внизу */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
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
              setSettings({
                antiSpam: true, antiRaid: true, badWordsFilter: true, badWordsList: 'спам, реклама, казино, продам',
                maxWarnings: 3, muteDuration: 10, banDuration: 1440, autoDeleteLinks: false,
                allowedLinks: 'youtube.com, twitch.tv, discord.gg', captchaForNew: true,
                logChannel: '#логи-модерации', autoModMentions: true, maxMentions: 5,
                autoModEmoji: false, maxEmoji: 10, autoModCaps: true, capsThreshold: 70,
                autoModRepeats: true, repeatThreshold: 3, deleteAfterWarn: true, dmOnWarn: true,
                dmOnMute: true, appealChannel: '',
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

        {/* Toast */}
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
