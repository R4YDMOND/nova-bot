"use client"

import { useState } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    setLoading(true)
    // Здесь будет OAuth через Lolka
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0A0A0F 0%, #111118 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      
      {/* Фоновое свечение */}
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 229, 255, 0.03) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Карточка логина */}
      <div style={{
        background: '#16161F',
        borderRadius: '24px',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '440px',
        border: '1px solid rgba(0, 229, 255, 0.1)',
        boxShadow: '0 0 40px rgba(0, 229, 255, 0.05)',
        position: 'relative',
        zIndex: 1
      }}>
        
        {/* Логотип */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: '#111118',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 0 25px rgba(0, 229, 255, 0.15)'
          }}>
            <span style={{
              fontSize: '38px',
              fontWeight: 'bold',
              color: '#00E5FF'
            }}>N</span>
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#FFFFFF',
            marginBottom: '6px'
          }}>Вход в Нова</h1>
          <p style={{ color: '#94A3B8', fontSize: '15px' }}>
            Подключайся и управляй серверами
          </p>
        </div>

        {/* Кнопка входа через Lolka */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            background: loading ? '#0E8A9E' : '#00E5FF',
            color: '#000000',
            border: 'none',
            borderRadius: '14px',
            fontSize: '17px',
            fontWeight: '600',
            cursor: loading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            transition: 'all 0.2s',
            boxShadow: loading ? 'none' : '0 0 20px rgba(0, 229, 255, 0.2)'
          }}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(1.02)' }}
          onMouseLeave={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(1)' }}
        >
          {loading ? (
            <>
              <span style={{
                width: '20px', height: '20px', border: '2px solid #000000',
                borderTopColor: 'transparent', borderRadius: '50%',
                display: 'inline-block', animation: 'spin 0.8s linear infinite'
              }} />
              Загрузка...
            </>
          ) : (
            <>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15 9H22L16 14L18 21L12 17L6 21L8 14L2 9H9L12 2Z"/>
              </svg>
              Войти через Lolka
            </>
          )}
        </button>

        {/* Разделитель */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          margin: '24px 0'
        }}>
          <div style={{ flex: 1, height: '1px', background: '#1F2937' }} />
          <span style={{ color: '#64748B', fontSize: '14px' }}>или</span>
          <div style={{ flex: 1, height: '1px', background: '#1F2937' }} />
        </div>

        {/* Информация */}
        <div style={{
          background: '#111118',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.6' }}>
            Пока доступна интеграция через вебхуки.
            <br />
            Полноценная OAuth-авторизация появится после запуска от Lolka.
          </p>
        </div>

        {/* Ссылка на документацию */}
        <p style={{
          textAlign: 'center',
          marginTop: '24px',
          color: '#64748B',
          fontSize: '14px'
        }}>
          Нет аккаунта?{' '}
          <a href="/docs" style={{
            color: '#00E5FF',
            textDecoration: 'none',
            fontWeight: '500'
          }}>
            Узнайте как подключить
          </a>
        </p>
      </div>

      {/* Стиль для анимации загрузки */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
