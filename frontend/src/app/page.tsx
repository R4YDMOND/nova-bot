"use client"

import { useState, useEffect } from 'react'

export default function Home() {
  const [serverCount, setServerCount] = useState(0)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetch(`${API_URL}/api/servers`)
      .then(res => res.json())
      .then(data => setServerCount(data.total))
      .catch(() => setServerCount(0))
  }, [])

  const features = [
    { icon: '🛡️', title: 'Модерация', desc: 'Спам, мат, рейды — автофильтрация 24/7' },
    { icon: '📊', title: 'Уровни', desc: 'Опыт за активность, награды, лидерборд' },
    { icon: '🤖', title: 'AI-чат', desc: 'Умные ответы, генерация, поддержка' },
    { icon: '🎵', title: 'Музыка', desc: 'Плеер в голосовых каналах' },
    { icon: '⚡', title: 'Команды', desc: 'Кастомные команды без кода' },
    { icon: '📈', title: 'Аналитика', desc: 'Рост, активность, статистика' },
  ]

  const steps = ['Интегрировать', 'Настроить вебхуки', 'Выбрать модули', 'Готово!']

  return (
    <div style={{ background: '#0A0A0F', minHeight: '100vh', color: '#F1F5F9', fontFamily: 'Inter, sans-serif' }}>
      
      {/* ===== HEADER ===== */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 40px', background: 'rgba(10,10,15,0.95)',
        borderBottom: '1px solid #1F2937', position: 'sticky', top: 0, zIndex: 100
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '36px', height: '36px', background: '#16161F', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#00E5FF', fontSize: '18px' }}>N</div>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#FFF' }}>Нова</span>
        </a>
        <nav style={{ display: 'flex', gap: '20px', alignItems: 'center', fontSize: '14px' }}>
          <a href="/dashboard" style={{ color: '#94A3B8', textDecoration: 'none' }}>Центр управления</a>
          <a href="/docs" style={{ color: '#94A3B8', textDecoration: 'none' }}>Документация</a>
          <span style={{ color: '#64748B' }}>LOLKA-сообщество</span>
          <a href="/login" style={{ padding: '8px 18px', background: '#00E5FF', color: '#000', borderRadius: '10px', fontWeight: '600', textDecoration: 'none' }}>Войти</a>
        </nav>
      </header>

      {/* ===== MAIN GRID ===== */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* === HERO (левая колонка, на всю высоту) === */}
        <div style={{
          background: 'linear-gradient(135deg, #111118 0%, #16161F 100%)',
          borderRadius: '24px', padding: '48px 40px',
          border: '1px solid #1F2937',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          gridRow: '1 / 3'
        }}>
          <div style={{ width: '64px', height: '64px', background: '#0A0A0F', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: '0 0 20px rgba(0,229,255,0.2)' }}>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#00E5FF' }}>N</span>
          </div>
          <h1 style={{ fontSize: '52px', fontWeight: '800', lineHeight: '1.1', marginBottom: '16px' }}>Нова</h1>
          <p style={{ fontSize: '18px', color: '#94A3B8', marginBottom: '8px' }}>Умный помощник для Lolka</p>
          <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '32px' }}>Вспышка энергии для твоего сообщества</p>
          
          <a href="/login" style={{
            padding: '14px 32px', background: '#00E5FF', color: '#000',
            borderRadius: '14px', fontWeight: '600', fontSize: '16px',
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
            gap: '8px', width: 'fit-content', transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,229,255,0.4)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
          >⭐ Интегрировать Нова</a>
          
          <p style={{ fontSize: '12px', color: '#64748B', marginTop: '12px' }}>Вебхуки работают • Полная версия скоро</p>

          <div style={{ display: 'flex', gap: '32px', marginTop: 'auto', paddingTop: '40px' }}>
            <div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00E5FF' }}>{serverCount}+</div><div style={{ fontSize: '12px', color: '#64748B' }}>Серверов</div></div>
            <div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00E5FF' }}>85K+</div><div style={{ fontSize: '12px', color: '#64748B' }}>Пользователей</div></div>
            <div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00E5FF' }}>&lt;0.8s</div><div style={{ fontSize: '12px', color: '#64748B' }}>Ответ</div></div>
          </div>
        </div>

        {/* === FEATURES (правая колонка, верх) === */}
        <div style={{
          background: '#111118', borderRadius: '24px', padding: '28px',
          border: '1px solid #1F2937'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>⚡ Возможности</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {features.map((f, i) => (
              <div key={i} style={{
                background: '#16161F', borderRadius: '12px', padding: '14px',
                transition: 'all 0.2s', cursor: 'default',
                border: '1px solid transparent'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'; e.currentTarget.style.background = '#1A1A26'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = '#16161F'; }}
              >
                <span style={{ fontSize: '20px' }}>{f.icon}</span>
                <div style={{ fontSize: '13px', fontWeight: '600', marginTop: '6px' }}>{f.title}</div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* === HOW TO (правая колонка, низ) === */}
        <div style={{
          background: '#111118', borderRadius: '24px', padding: '28px',
          border: '1px solid #1F2937'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>🚀 Как подключить</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            {steps.map((step, i) => (
              <div key={i} style={{
                flex: 1, background: '#16161F', borderRadius: '12px',
                padding: '14px', textAlign: 'center'
              }}>
                <div style={{ width: '28px', height: '28px', background: '#0A0A0F', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold', color: '#00E5FF', margin: '0 auto 8px' }}>{i + 1}</div>
                <div style={{ fontSize: '12px', fontWeight: '500' }}>{step}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
