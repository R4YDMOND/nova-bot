"use client"

import { useState, useEffect } from 'react'

interface Feature {
  icon: string
  title: string
  desc: string
  settings: string[]
  link?: string
}

export default function Home() {
  const [serverCount, setServerCount] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [activeFeature, setActiveFeature] = useState<Feature | null>(null)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    fetch(`${API_URL}/api/servers`)
      .then(res => res.json())
      .then(data => setServerCount(data.total))
      .catch(() => setServerCount(0))
  }, [])

  const features: Feature[] = [
    {
      icon: '🛡️', title: 'Модерация',
      desc: 'Антиспам, антимат, антирейд. Безопасность 24/7.',
      settings: ['Фильтр мата', 'Антиспам', 'Защита от рейдов', 'Авто-предупреждения', 'Чёрный список слов']
    },
    {
      icon: '📊', title: 'Система уровней',
      desc: 'Награждайте участников опытом за активность.',
      settings: ['Опыт за сообщения', 'Бонусы за голос', 'Роли за уровни', 'Лидерборд', 'Кастомные награды'],
      link: '/dashboard/ranking'
    },
    {
      icon: '🤖', title: 'AI-помощник',
      desc: 'Умные ответы и поддержка разговоров.',
      settings: ['Стиль общения', 'Автоответы', 'Запрещённые темы', 'Контекст диалога', 'Кастомный промпт'],
      link: '/dashboard/ai'
    },
    {
      icon: '🎵', title: 'Музыка',
      desc: 'Воспроизведение музыки в голосовых каналах.',
      settings: ['Поиск треков', 'Плейлисты', 'Очередь', 'Громкость', 'DJ-роль']
    },
    {
      icon: '⚡', title: 'Кастомные команды',
      desc: 'Создавайте свои команды без кода.',
      settings: ['Текстовые команды', 'Команды с ответом', 'Автопостинг', 'Расписание', 'Переменные'],
      link: '/dashboard/commands'
    },
    {
      icon: '📈', title: 'Аналитика',
      desc: 'Отслеживайте рост и активность.',
      settings: ['Активность по дням', 'Популярные команды', 'Рост участников', 'Отчёты', 'Экспорт данных']
    },
  ]

  const openModal = (feature: Feature) => {
    setActiveFeature(feature)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setActiveFeature(null)
  }

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

        {/* === HERO === */}
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

        {/* === FEATURES === */}
        <div style={{
          background: '#111118', borderRadius: '24px', padding: '28px',
          border: '1px solid #1F2937'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>⚡ Возможности</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {features.map((f, i) => (
              <div key={i} style={{
                background: '#16161F', borderRadius: '12px', padding: '14px',
                transition: 'all 0.2s', cursor: 'pointer',
                border: '1px solid transparent'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'; e.currentTarget.style.background = '#1A1A26'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = '#16161F'; }}
              >
                <span style={{ fontSize: '20px' }}>{f.icon}</span>
                <div style={{ fontSize: '13px', fontWeight: '600', marginTop: '6px' }}>{f.title}</div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', marginBottom: '8px' }}>{f.desc}</div>
                <span onClick={(e) => { e.stopPropagation(); openModal(f); }} style={{
                  fontSize: '11px', color: '#00E5FF', cursor: 'pointer', fontWeight: '500'
                }}>Настроить →</span>
              </div>
            ))}
          </div>
        </div>

        {/* === HOW TO === */}
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

      {/* ===== MODAL ===== */}
      {modalOpen && activeFeature && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={closeModal}>
          <div style={{
            background: '#16161F', borderRadius: '24px', padding: '32px',
            width: '440px', maxWidth: '90vw', border: '1px solid #1F2937',
            boxShadow: '0 0 40px rgba(0,229,255,0.1)'
          }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '32px' }}>{activeFeature.icon}</span>
                <h2 style={{ fontSize: '22px', fontWeight: 'bold' }}>{activeFeature.title}</h2>
              </div>
              <span onClick={closeModal} style={{ fontSize: '24px', cursor: 'pointer', color: '#94A3B8' }}>✕</span>
            </div>

            <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '24px' }}>{activeFeature.desc}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeFeature.settings.map((setting, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#111118', borderRadius: '12px', padding: '12px 16px'
                }}>
                  <span style={{ fontSize: '14px' }}>{setting}</span>
                  <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked={i < 3} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: i < 3 ? '#00E5FF' : '#374151', borderRadius: '22px', transition: '0.3s' }}>
                      <span style={{ position: 'absolute', height: '16px', width: '16px', left: i < 3 ? '22px' : '3px', bottom: '3px', background: '#FFF', borderRadius: '50%', transition: '0.3s' }} />
                    </span>
                  </label>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{
                padding: '10px 20px', background: 'transparent', color: '#94A3B8',
                border: '1px solid #1F2937', borderRadius: '10px', cursor: 'pointer', fontSize: '14px'
              }}>Закрыть</button>
              {activeFeature.link ? (
                <a href={activeFeature.link} style={{
                  padding: '10px 24px', background: '#00E5FF', color: '#000',
                  border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer',
                  fontSize: '14px', textDecoration: 'none', display: 'inline-block'
                }}>Расширенные настройки →</a>
              ) : (
                <button onClick={closeModal} style={{
                  padding: '10px 24px', background: '#00E5FF', color: '#000',
                  border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px'
                }}>Сохранить</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
