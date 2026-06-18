"use client"

import { useState } from 'react'

const TABS = [
  { id: 'settings', label: '⚙️ Настройки' },
  { id: 'rewards', label: '🎖️ Награды' },
  { id: 'voice', label: '🎤 Голосовые' },
  { id: 'card', label: '🪪 Карточка' },
  { id: 'members', label: '👥 Участники' },
]

export default function RankingPage() {
  const [activeTab, setActiveTab] = useState('settings')
  const [saved, setSaved] = useState(false)

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', color: '#F1F5F9' }}>
      
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

      <div style={{ display: 'flex', gap: '4px', padding: '16px 40px', background: '#0A0A0F', borderBottom: '1px solid #1F2937', overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '10px 20px', borderRadius: '10px', border: 'none',
            background: activeTab === tab.id ? '#1F2937' : 'transparent',
            color: activeTab === tab.id ? '#FFF' : '#94A3B8',
            fontWeight: activeTab === tab.id ? '600' : '400',
            cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s', whiteSpace: 'nowrap'
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '60px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
          {activeTab === 'settings' && '⚙️'}
          {activeTab === 'rewards' && '🎖️'}
          {activeTab === 'voice' && '🎤'}
          {activeTab === 'card' && '🪪'}
          {activeTab === 'members' && '👥'}
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          {TABS.find(t => t.id === activeTab)?.label}
        </h2>
        <p style={{ color: '#94A3B8' }}>Расширенные настройки в разработке</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', padding: '20px' }}>
        <button onClick={() => window.location.href = '/dashboard/modules'} style={{
          padding: '12px 24px', background: 'transparent', color: '#94A3B8',
          border: '1px solid #1F2937', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '14px'
        }}>← Назад к модулям</button>
        <button onClick={save} style={{
          padding: '12px 28px', background: '#00E5FF', color: '#000',
          border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '14px'
        }}>💾 Сохранить настройки</button>
      </div>
    </div>
  )
}
