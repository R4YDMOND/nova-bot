"use client"

import { useState } from 'react'

export default function AnalyticsPage() {
  const [settings, setSettings] = useState({
    trackMessages: true, trackVoice: true, trackCommands: true,
    weeklyReport: true, reportChannel: '#отчёты', retentionDays: 30,
    publicStats: false, notifyGrowth: true, growthThreshold: 10,
  })
  const [saved, setSaved] = useState(false)
  const update = (key: string, value: any) => setSettings({ ...settings, [key]: value })
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', color: '#F1F5F9' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 40px', background: '#111118', borderBottom: '1px solid #1F2937' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{ width: '32px', height: '32px', background: '#16161F', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#00E5FF', fontSize: '16px' }}>N</div>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFF' }}>Нова</span>
          </a>
          <span style={{ color: '#374151' }}>|</span>
          <a href="/dashboard/modules" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '14px' }}>← Модули</a>
          <span style={{ color: '#374151' }}>/</span>
          <span style={{ color: '#00E5FF', fontSize: '14px', fontWeight: '500' }}>Аналитика</span>
        </div>
        <button onClick={save} style={{ padding: '10px 22px', background: saved ? '#22C55E' : '#00E5FF', color: '#000', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.25s' }}>{saved ? '✅ Сохранено' : '💾 Сохранить'}</button>
      </header>

      <main style={{ padding: '40px 48px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>📈 Аналитика</h1>
        <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '32px' }}>Настройте сбор и отображение статистики</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px 24px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>📊 Отслеживание</h3>
            {[
              { key: 'trackMessages', label: 'Сообщения', desc: 'Количество сообщений' },
              { key: 'trackVoice', label: 'Голосовые', desc: 'Время в голосовых каналах' },
              { key: 'trackCommands', label: 'Команды', desc: 'Использование команд' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 2 ? '1px solid #1F2937' : 'none' }}>
                <div><div style={{ fontSize: '14px', fontWeight: '500' }}>{item.label}</div><div style={{ fontSize: '12px', color: '#94A3B8' }}>{item.desc}</div></div>
                <div onClick={() => update(item.key, !settings[item.key as keyof typeof settings])} style={{ width: '44px', height: '26px', background: settings[item.key as keyof typeof settings] ? '#00E5FF' : '#374151', borderRadius: '26px', cursor: 'pointer', transition: '0.25s', position: 'relative', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', height: '20px', width: '20px', left: settings[item.key as keyof typeof settings] ? '22px' : '4px', top: '3px', background: settings[item.key as keyof typeof settings] ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px 24px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px' }}>📋 Отчёты</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Канал для отчётов</label>
              <input type="text" value={settings.reportChannel} onChange={(e) => update('reportChannel', e.target.value)} style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {[
              { label: 'Хранение данных (дней)', key: 'retentionDays', min: 7, max: 90, step: 7 },
              { label: 'Порог роста (%)', key: 'growthThreshold', min: 5, max: 50, step: 5 },
            ].map((s, i) => (
              <div key={i} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#94A3B8' }}>{s.label}</span>
                  <span style={{ color: '#00E5FF', fontWeight: '600' }}>{settings[s.key as keyof typeof settings]}</span>
                </div>
                <input type="range" min={s.min} max={s.max} step={s.step} value={settings[s.key as keyof typeof settings] as number} onChange={(e) => update(s.key, parseInt(e.target.value))} style={{ width: '100%', accentColor: '#00E5FF' }} />
              </div>
            ))}
          </div>

          <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px 24px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>⚙️ Дополнительно</h3>
            {[
              { key: 'weeklyReport', label: 'Еженедельный отчёт', desc: 'Автоматический отчёт' },
              { key: 'publicStats', label: 'Публичная статистика', desc: 'Видна всем участникам' },
              { key: 'notifyGrowth', label: 'Уведомления о росте', desc: 'При значительном росте' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 2 ? '1px solid #1F2937' : 'none' }}>
                <div><div style={{ fontSize: '14px', fontWeight: '500' }}>{item.label}</div><div style={{ fontSize: '12px', color: '#94A3B8' }}>{item.desc}</div></div>
                <div onClick={() => update(item.key, !settings[item.key as keyof typeof settings])} style={{ width: '44px', height: '26px', background: settings[item.key as keyof typeof settings] ? '#00E5FF' : '#374151', borderRadius: '26px', cursor: 'pointer', transition: '0.25s', position: 'relative', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', height: '20px', width: '20px', left: settings[item.key as keyof typeof settings] ? '22px' : '4px', top: '3px', background: settings[item.key as keyof typeof settings] ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
          <button onClick={() => window.location.href = '/dashboard/modules'} style={{ padding: '12px 24px', background: 'transparent', color: '#94A3B8', border: '1px solid #1F2937', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>← Назад</button>
          <button onClick={save} style={{ padding: '12px 28px', background: '#00E5FF', color: '#000', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>💾 Сохранить</button>
        </div>

        {saved && <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#22C55E', color: '#000', padding: '12px 24px', borderRadius: '12px', fontWeight: '600', fontSize: '14px', zIndex: 1000, boxShadow: '0 4px 20px rgba(34,197,94,0.3)', animation: 'slideUp 0.3s ease' }}>✅ Сохранено</div>}
        <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      </main>
    </div>
  )
}
