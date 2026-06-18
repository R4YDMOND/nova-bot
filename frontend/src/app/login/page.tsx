"use client"

import { useState } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState('')

  const handleLogin = (provider: string) => {
    setLoading(provider)
    setTimeout(() => setLoading(''), 2000)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0A0A0F 0%, #111118 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', color: '#F1F5F9'
    }}>
      
      <div style={{
        background: '#16161F', borderRadius: '24px', padding: '48px 40px',
        width: '100%', maxWidth: '440px', border: '1px solid rgba(0, 229, 255, 0.1)',
        boxShadow: '0 0 40px rgba(0, 229, 255, 0.05)', textAlign: 'center'
      }}>
        
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginBottom: '32px' }}>
          <div style={{ width: '40px', height: '40px', background: '#111118', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#00E5FF', fontSize: '20px', boxShadow: '0 0 15px rgba(0,229,255,0.15)' }}>N</div>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFF' }}>Нова</span>
        </a>

        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '6px' }}>Вход в Нова</h1>
        <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '32px' }}>Выберите способ авторизации</p>

        {/* Кнопки */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Lolka */}
          <button onClick={() => handleLogin('lolka')} disabled={loading !== ''} style={{
            width: '100%', padding: '14px', background: loading === 'lolka' ? '#0E8A9E' : '#5865F2',
            color: '#FFF', border: 'none', borderRadius: '14px', fontSize: '16px',
            fontWeight: '600', cursor: loading ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(88, 101, 242, 0.3)'
          }}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(1.01)'; }}
          onMouseLeave={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {loading === 'lolka' ? (
              <span style={{ width: '20px', height: '20px', border: '2px solid #FFF', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <span style={{ fontSize: '20px' }}>🎮</span>
            )}
            {loading === 'lolka' ? 'Загрузка...' : 'Войти через Lolka'}
          </button>

          {/* VK */}
          <button onClick={() => handleLogin('vk')} disabled={loading !== ''} style={{
            width: '100%', padding: '14px', background: loading === 'vk' ? '#1A5A9E' : '#0077FF',
            color: '#FFF', border: 'none', borderRadius: '14px', fontSize: '16px',
            fontWeight: '600', cursor: loading ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0, 119, 255, 0.3)'
          }}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(1.01)'; }}
          onMouseLeave={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {loading === 'vk' ? (
              <span style={{ width: '20px', height: '20px', border: '2px solid #FFF', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <span style={{ fontSize: '20px' }}>💙</span>
            )}
            {loading === 'vk' ? 'Загрузка...' : 'Войти через VK'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '24px 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#1F2937' }} />
          <span style={{ color: '#64748B', fontSize: '13px' }}>или</span>
          <div style={{ flex: 1, height: '1px', background: '#1F2937' }} />
        </div>

        <div style={{ background: '#111118', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.6' }}>
            Пока доступна интеграция через вебхуки.<br/>
            Полноценная OAuth-авторизация появится после запуска от платформ.
          </p>
        </div>

        <p style={{ marginTop: '20px', color: '#64748B', fontSize: '13px' }}>
          Нет аккаунта?{' '}
          <a href="/docs" style={{ color: '#00E5FF', textDecoration: 'none', fontWeight: '500' }}>
            Узнайте как подключить
          </a>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
