"use client"

import { useState, useEffect } from 'react'

export default function Home() {
  const [serverCount, setServerCount] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [visibleCards, setVisibleCards] = useState<number[]>([])
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetch(`${API_URL}/api/servers`)
      .then(res => res.json())
      .then(data => setServerCount(data.total))
      .catch(() => setServerCount(0))

    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      [0, 1, 2, 3, 4, 5].forEach((_, i) => {
        setTimeout(() => setVisibleCards(prev => [...prev, i]), i * 100)
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  const features = [
    { icon: '🛡️', title: 'Модерация', desc: 'Автофильтрация спама, мата и рейдов. Полная безопасность 24/7.' },
    { icon: '📊', title: 'Уровни', desc: 'Опыт за активность, награды и лидерборд для участников.' },
    { icon: '🤖', title: 'AI-помощник', desc: 'Умные ответы, генерация контента и поддержка чата.' },
    { icon: '🎵', title: 'Музыка', desc: 'Воспроизведение треков из YouTube и Spotify в голосовых.' },
    { icon: '⚡', title: 'Команды', desc: 'Создавайте кастомные команды без программирования.' },
    { icon: '📈', title: 'Аналитика', desc: 'Отслеживайте статистику сервера и рост сообщества.' },
  ]

  return (
    <main style={{ background: '#0A0A0F', minHeight: '100vh', color: '#F1F5F9', overflow: 'hidden' }}>
      
      {/* Анимированный фон */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 229, 255, 0.06), transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(123, 94, 255, 0.04), transparent 60%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      {/* Сетка */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
        backgroundSize: '60px 60px', pointerEvents: 'none', zIndex: 0
      }} />

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '16px 40px',
        background: scrolled ? 'rgba(10, 10, 15, 0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        transition: 'all 0.3s ease'
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '36px', height: '36px', background: '#16161F', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#00E5FF', fontSize: '18px', boxShadow: '0 0 10px rgba(0,229,255,0.2)' }}>N</div>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFF' }}>Нова</span>
        </a>
        <nav style={{ display: 'flex', gap: '24px', alignItems: 'center', fontSize: '14px' }}>
          <a href="/dashboard" style={{ color: '#94A3B8', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#FFF'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
          >Центр управления</a>
          <a href="/docs" style={{ color: '#94A3B8', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#FFF'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
          >Документация</a>
          <a href="/login" style={{
            padding: '8px 20px', background: '#00E5FF', color: '#000',
            borderRadius: '10px', fontWeight: '600', fontSize: '14px',
            textDecoration: 'none', transition: 'all 0.2s',
            boxShadow: '0 0 10px rgba(0,229,255,0.2)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 20px rgba(0,229,255,0.4)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 10px rgba(0,229,255,0.2)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >Войти</a>
        </nav>
      </header>

      {/* Hero */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '120px 20px 80px',
        position: 'relative', zIndex: 1
      }}>
        
        {/* Логотип */}
        <div style={{
          width: '88px', height: '88px', background: '#16161F',
          borderRadius: '22px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginBottom: '32px',
          boxShadow: '0 0 30px rgba(0, 229, 255, 0.2)',
          animation: 'pulse 3s ease-in-out infinite'
        }}>
          <span style={{ fontSize: '44px', fontWeight: 'bold', color: '#00E5FF' }}>N</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(44px, 8vw, 80px)', fontWeight: '800',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #00E5FF 50%, #7B5EFF 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: '16px', lineHeight: '1.1'
        }}>
          НОВА
        </h1>
        
        <p style={{ fontSize: 'clamp(18px, 3vw, 24px)', color: '#94A3B8', maxWidth: '500px', marginBottom: '8px' }}>
          Умный помощник для серверов
        </p>
        <p style={{ fontSize: '15px', color: '#64748B', marginBottom: '40px' }}>
          Вспышка энергии для твоего сообщества
        </p>

        <a href="/login" style={{
          padding: '16px 40px', fontSize: '17px', fontWeight: '600',
          background: '#00E5FF', color: '#000', border: 'none',
          borderRadius: '16px', cursor: 'pointer', display: 'inline-flex',
          alignItems: 'center', gap: '10px', textDecoration: 'none',
          transition: 'all 0.3s ease',
          boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)',
          animation: 'pulseBtn 2s ease-in-out infinite'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 229, 255, 0.5)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 229, 255, 0.3)'; }}
        >
          <span>⭐</span>
          Интегрировать Нова
        </a>

        <p style={{ fontSize: '13px', color: '#64748B', marginTop: '16px' }}>
          Вебхуки работают • Полная версия скоро
        </p>

        {/* Статистика */}
        <div style={{ display: 'flex', gap: 'clamp(24px, 5vw, 60px)', marginTop: '64px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { num: `${serverCount}+`, label: 'Серверов' },
            { num: '85K+', label: 'Пользователей' },
            { num: '<0.8s', label: 'Ответ' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00E5FF' }}>{s.num}</div>
              <div style={{ fontSize: '13px', color: '#64748B' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 20px 100px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{
            textAlign: 'center', fontSize: 'clamp(28px, 5vw, 40px)',
            fontWeight: '700', marginBottom: '12px'
          }}>
            ⚡ Возможности <span style={{ color: '#00E5FF' }}>Нова</span>
          </h2>
          <p style={{ textAlign: 'center', color: '#94A3B8', marginBottom: '48px', fontSize: '15px' }}>
            Всё что нужно для управления сервером
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {features.map((f, i) => (
              <div key={i} style={{
                background: '#16161F', borderRadius: '20px', padding: '28px',
                border: '1px solid #1F2937',
                transition: 'all 0.35s ease',
                opacity: visibleCards.includes(i) ? 1 : 0,
                transform: visibleCards.includes(i) ? 'translateY(0)' : 'translateY(20px)',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00E5FF';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 229, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1F2937';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              >
                <div style={{
                  width: '48px', height: '48px', background: '#0A0A0F',
                  borderRadius: '14px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '24px', marginBottom: '16px'
                }}>{f.icon}</div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: '1.6' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px 20px', borderTop: '1px solid #1F2937',
        background: '#0A0A0F', position: 'relative', zIndex: 1
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: '#16161F', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#00E5FF' }}>N</div>
            <span style={{ fontWeight: '600', color: '#FFF' }}>Нова 2026</span>
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <a href="/dashboard" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#FFF'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
            >Центр управления</a>
            <a href="/docs" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#FFF'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
            >Документация</a>
            <a href="/login" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#FFF'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
            >Войти</a>
          </div>
          <span style={{ fontSize: '13px', color: '#64748B' }}>LOLKA-сообщество</span>
        </div>
      </footer>

      {/* Анимации */}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 30px rgba(0, 229, 255, 0.2); }
          50% { box-shadow: 0 0 50px rgba(0, 229, 255, 0.4); }
        }
        @keyframes pulseBtn {
          0%, 100% { boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)'; }
          50% { boxShadow: '0 0 35px rgba(0, 229, 255, 0.5)'; }
        }
      `}</style>
    </main>
  )
}
