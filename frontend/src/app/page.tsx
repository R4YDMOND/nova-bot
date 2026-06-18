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

  return (
    <main style={{ background: '#0A0A0F', minHeight: '100vh' }}>
      
      {/* === HERO === */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 20px',
        background: 'linear-gradient(180deg, #0A0A0F 0%, #111118 100%)'
      }}>
        
        <div style={{
          width: '100px',
          height: '100px',
          background: '#16161F',
          borderRadius: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '30px',
          boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)'
        }}>
          <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#00E5FF' }}>N</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(40px, 8vw, 72px)',
          fontWeight: '800',
          color: '#FFFFFF',
          lineHeight: '1.1',
          marginBottom: '16px'
        }}>
          НОВА
        </h1>
        
        <p style={{
          fontSize: 'clamp(18px, 3vw, 24px)',
          color: '#94A3B8',
          maxWidth: '500px',
          marginBottom: '8px'
        }}>
          Умный помощник для Lolka-серверов
        </p>

        <p style={{
          fontSize: '16px',
          color: '#64748B',
          marginBottom: '40px'
        }}>
          Вспышка энергии для твоего сообщества
        </p>

        <button style={{
          padding: '16px 40px',
          fontSize: '18px',
          fontWeight: '600',
          background: '#00E5FF',
          color: '#000000',
          border: 'none',
          borderRadius: '16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span>⭐</span>
          Интегрировать Нова
        </button>

        <p style={{
          fontSize: '14px',
          color: '#64748B',
          marginTop: '16px'
        }}>
          Вебхуки уже работают • Полная версия скоро
        </p>

        {/* Статистика */}
        <div style={{
          display: 'flex',
          gap: 'clamp(20px, 5vw, 60px)',
          marginTop: '60px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00E5FF' }}>{serverCount}+</div>
            <div style={{ fontSize: '14px', color: '#94A3B8' }}>Серверов</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00E5FF' }}>85K+</div>
            <div style={{ fontSize: '14px', color: '#94A3B8' }}>Пользователей</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00E5FF' }}>&lt;0.8s</div>
            <div style={{ fontSize: '14px', color: '#94A3B8' }}>Ответ</div>
          </div>
        </div>
      </section>

      {/* === FEATURES === */}
      <section style={{ padding: '100px 20px', background: '#111118' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 'bold', marginBottom: '60px', color: '#FFFFFF' }}>
          Возможности <span style={{ color: '#00E5FF' }}>Нова</span>
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', maxWidth: '1100px', margin: '0 auto' }}>
          {[
            { icon: '🛡️', title: 'Модерация', desc: 'Автоматическая фильтрация спама и мата. Безопасность 24/7.' },
            { icon: '📊', title: 'Система уровней', desc: 'Награждайте участников опытом за активность.' },
            { icon: '🤖', title: 'AI-помощник', desc: 'Умные ответы и поддержка разговоров с участниками.' },
            { icon: '🎵', title: 'Музыка', desc: 'Воспроизведение музыки в голосовых каналах.' },
            { icon: '⚡', title: 'Кастомные команды', desc: 'Создавайте свои команды без программирования.' },
            { icon: '📈', title: 'Аналитика', desc: 'Отслеживайте рост и активность сообщества.' },
          ].map((f, i) => (
            <div key={i} style={{ background: '#16161F', borderRadius: '20px', padding: '30px', transition: 'all 0.3s ease', cursor: 'default' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 229, 255, 0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#FFFFFF' }}>{f.title}</h3>
              <p style={{ fontSize: '15px', color: '#94A3B8', lineHeight: '1.5' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* === HOW TO === */}
      <section style={{ padding: '100px 20px', background: '#0A0A0F' }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 'bold', marginBottom: '60px', color: '#FFFFFF' }}>
          Как <span style={{ color: '#00E5FF' }}>подключить</span> Нова
        </h2>

        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {[
            { step: '01', title: 'Нажмите «Интегрировать Нова»', desc: 'Перейдите на страницу интеграции.' },
            { step: '02', title: 'Настройте вебхуки', desc: 'Следуйте инструкции для вашего сервера.' },
            { step: '03', title: 'Выберите модули', desc: 'Включите нужные функции бота.' },
            { step: '04', title: 'Готово!', desc: 'Нова начинает работать на сервере.' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', background: '#16161F', borderRadius: '16px', padding: '24px' }}>
              <div style={{ width: '56px', height: '56px', minWidth: '56px', background: '#0A0A0F', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 'bold', color: '#00E5FF', boxShadow: '0 0 10px rgba(0, 229, 255, 0.2)' }}>
                {item.step}
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#FFFFFF' }}>{item.title}</h3>
                <p style={{ fontSize: '15px', color: '#94A3B8' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* === FOOTER === */}
      <footer style={{ padding: '40px 20px', borderTop: '1px solid #1F2937', background: '#111118' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: '#16161F', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#00E5FF' }}>N</div>
            <span style={{ fontWeight: '600', color: '#FFFFFF' }}>Нова 2026</span>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {['Возможности', 'Демо', 'Документация', 'Поддержка'].map((link, i) => (
              <a key={i} href="#" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '14px' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
              >{link}</a>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px', color: '#94A3B8' }}>LOLKA-сообщество разработчика</span>
            <div style={{ width: '36px', height: '36px', background: '#16161F', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <span style={{ fontSize: '18px' }}>💬</span>
            </div>
          </div>
        </div>
      </footer>

    </main>
  )
}
