"use client"

import { useState } from 'react'

const navigate = (url: string) => window.location.href = url

export default function MusicPage() {
  const [settings, setSettings] = useState({
    defaultVolume: 50,
    autoPlay: true,
    djOnly: false,
    djRole: 'DJ',
    maxQueue: 50,
    autoDisconnect: 30,
    allowPlaylists: true,
    announceTrack: true,
    historyLimit: 20,
  })

  const [saved, setSaved] = useState(false)
  const update = (key: string, value: any) => setSettings({ ...settings, [key]: value })
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

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
            { icon: '🎵', label: 'Музыка', href: '/dashboard/music' },
          ].map((item, i) => {
            const isActive = item.label === 'Музыка'
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
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>🎵 Музыка</h1>
            <p style={{ color: '#94A3B8', fontSize: '14px' }}>Настройте музыкального бота</p>
          </div>
          <button onClick={save} style={{
            padding: '10px 22px', background: saved ? '#22C55E' : '#00E5FF', color: '#000',
            border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
            transition: 'all 0.25s'
          }}>{saved ? '✅ Сохранено' : '💾 Сохранить'}</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px 24px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>🔊 Основные настройки</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#94A3B8' }}>Громкость по умолчанию</span>
                <span style={{ color: '#00E5FF', fontWeight: '600' }}>{settings.defaultVolume}%</span>
              </div>
              <input type="range" min="10" max="100" value={settings.defaultVolume} onChange={(e) => update('defaultVolume', parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#00E5FF' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#94A3B8' }}>Автоотключение (мин)</span>
                <span style={{ color: '#00E5FF', fontWeight: '600' }}>{settings.autoDisconnect}</span>
              </div>
              <input type="range" min="5" max="120" step="5" value={settings.autoDisconnect} onChange={(e) => update('autoDisconnect', parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#00E5FF' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#94A3B8' }}>Макс. очередь треков</span>
                <span style={{ color: '#00E5FF', fontWeight: '600' }}>{settings.maxQueue}</span>
              </div>
              <input type="range" min="10" max="200" step="10" value={settings.maxQueue} onChange={(e) => update('maxQueue', parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#00E5FF' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Лимит истории</label>
              <input type="number" value={settings.historyLimit} onChange={(e) => update('historyLimit', parseInt(e.target.value) || 20)}
                style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px 24px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>⚙️ Дополнительно</h3>
            
            {[
              { key: 'autoPlay', label: 'Автовоспроизведение', desc: 'Автоматически включать следующий трек' },
              { key: 'djOnly', label: 'Только DJ', desc: 'Управлять музыкой может только DJ-роль' },
              { key: 'allowPlaylists', label: 'Плейлисты', desc: 'Разрешить добавление плейлистов' },
              { key: 'announceTrack', label: 'Объявлять трек', desc: 'Писать название трека перед воспроизведением' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 3 ? '1px solid #1F2937' : 'none' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.label}</div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>{item.desc}</div>
                </div>
                <div onClick={() => update(item.key, !settings[item.key as keyof typeof settings])} style={{ width: '44px', height: '26px', background: settings[item.key as keyof typeof settings] ? '#00E5FF' : '#374151', borderRadius: '26px', cursor: 'pointer', transition: '0.25s', position: 'relative', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', height: '20px', width: '20px', left: settings[item.key as keyof typeof settings] ? '22px' : '4px', top: '3px', background: settings[item.key as keyof typeof settings] ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} />
                </div>
              </div>
            ))}

            {settings.djOnly && (
              <div style={{ marginTop: '12px' }}>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>DJ-роль</label>
                <input type="text" value={settings.djRole} onChange={(e) => update('djRole', e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            )}
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
