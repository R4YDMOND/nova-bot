"use client"

import { useState } from 'react'

const navigate = (url: string) => window.location.href = url

export default function ModerationPage() {
  const [settings, setSettings] = useState({
    antiSpam: true,
    antiRaid: true,
    badWordsFilter: true,
    badWordsList: 'спам, реклама, казино',
    maxWarnings: 3,
    muteDuration: 10,
    autoDeleteLinks: false,
    allowedLinks: '',
    captchaForNew: true,
    logChannel: '#логи-модерации',
  })

  const [saved, setSaved] = useState(false)

  const update = (key: string, value: any) => setSettings({ ...settings, [key]: value })
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const toggle = (key: string) => update(key, !settings[key as keyof typeof settings])

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', display: 'flex', color: '#F1F5F9' }}>
      
      <aside style={{ width: '240px', minWidth: '240px', background: '#111118', borderRight: '1px solid #1F2937', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '32px' }}>
          <div style={{ width: '34px', height: '34px', background: '#16161F', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#00E5FF', fontSize: '17px' }}>N</div>
          <span style={{ fontSize: '19px', fontWeight: 'bold', color: '#FFF' }}>Нова</span>
        </a>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          {[
            { icon: '📊', label: 'Обзор', href: '/dashboard' },
            { icon: '🖥️', label: 'Мои серверы', href: '/dashboard' },
            { icon: '🧩', label: 'Модули', href: '/dashboard/modules' },
            { icon: '🛡️', label: 'Модерация', href: '/dashboard/moderation' },
          ].map((item, i) => {
            const isActive = item.label === 'Модерация'
            return (
              <span key={i} onClick={() => navigate(item.href)} style={{
                padding: '10px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center',
                gap: '10px', fontSize: '14px', cursor: 'pointer', fontWeight: isActive ? '500' : '400',
                color: isActive ? '#FFF' : '#94A3B8', background: isActive ? '#1F2937' : 'transparent',
                transition: 'all 0.15s'
              }}>
                <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </span>
            )
          })}
        </nav>
      </aside>

      <main style={{ flex: 1, padding: '40px 48px', overflow: 'auto', maxWidth: '800px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>🛡️ Модерация</h1>
            <p style={{ color: '#94A3B8', fontSize: '14px' }}>Настройте автоматическую защиту сервера</p>
          </div>
          <button onClick={save} style={{
            padding: '10px 22px', background: saved ? '#22C55E' : '#00E5FF', color: '#000',
            border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
            transition: 'all 0.25s'
          }}>{saved ? '✅ Сохранено' : '💾 Сохранить'}</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Защита */}
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px 24px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>🛡️ Защита</h3>
            
            {[
              { key: 'antiSpam', label: 'Антиспам', desc: 'Автоматическое удаление спам-сообщений' },
              { key: 'antiRaid', label: 'Антирейд', desc: 'Защита от массовых атак' },
              { key: 'badWordsFilter', label: 'Фильтр мата', desc: 'Удаление сообщений с запрещёнными словами' },
              { key: 'autoDeleteLinks', label: 'Удаление ссылок', desc: 'Автоматически удалять сообщения со ссылками' },
              { key: 'captchaForNew', label: 'Капча для новых', desc: 'Проверка новых участников' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 4 ? '1px solid #1F2937' : 'none' }}>
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

          {/* Настройки фильтров */}
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px 24px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>📝 Настройки фильтров</h3>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Запрещённые слова (через запятую)</label>
              <input type="text" value={settings.badWordsList} onChange={(e) => update('badWordsList', e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Разрешённые ссылки (через запятую)</label>
              <input type="text" value={settings.allowedLinks} onChange={(e) => update('allowedLinks', e.target.value)}
                placeholder="youtube.com, twitch.tv"
                style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Наказания */}
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px 24px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>⚡ Наказания</h3>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Макс. предупреждений</label>
                <input type="number" value={settings.maxWarnings} onChange={(e) => update('maxWarnings', parseInt(e.target.value) || 3)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Длительность мута (мин)</label>
                <input type="number" value={settings.muteDuration} onChange={(e) => update('muteDuration', parseInt(e.target.value) || 10)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Канал логов</label>
                <input type="text" value={settings.logChannel} onChange={(e) => update('logChannel', e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>
        </div>

        {saved && (
          <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#22C55E', color: '#000', padding: '12px 24px', borderRadius: '12px', fontWeight: '600', fontSize: '14px', zIndex: 1000, boxShadow: '0 4px 20px rgba(34,197,94,0.3)', animation: 'slideUp 0.3s ease' }}>
            ✅ Настройки сохранены
          </div>
        )}
        <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      </main>
    </div>
  )
}
