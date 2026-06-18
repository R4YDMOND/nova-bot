"use client"

import { useState } from 'react'

export default function AIPage() {
  const [settings, setSettings] = useState({
    botName: 'Нова',
    personality: 'friendly',
    temperature: 0.7,
    maxLength: 500,
    useEmoji: true,
    useContext: true,
    contextMessages: 10,
    systemPrompt: 'Ты — дружелюбный AI-помощник сервера. Отвечай на русском языке, помогай участникам с вопросами.',
    forbiddenTopics: 'политика, религия, NSFW',
    autoModeration: false,
    language: 'ru',
    responseStyle: 'detailed',
    creativityLevel: 0.6,
    respectRoles: true,
    ignoredRoles: '',
    allowedChannels: '',
    cooldownSeconds: 5,
    maxTokensPerUser: 1000,
    dailyLimit: 50,
    greetingMessage: '',
    customInstructions: '',
  })

  const [saved, setSaved] = useState(false)
  const update = (key: string, value: any) => setSettings({ ...settings, [key]: value })
  const toggle = (key: string) => update(key, !settings[key as keyof typeof settings])
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const resetAll = () => {
    setSettings({
      botName: 'Нова', personality: 'friendly', temperature: 0.7, maxLength: 500,
      useEmoji: true, useContext: true, contextMessages: 10,
      systemPrompt: 'Ты — дружелюбный AI-помощник сервера. Отвечай на русском языке, помогай участникам с вопросами.',
      forbiddenTopics: 'политика, религия, NSFW', autoModeration: false, language: 'ru',
      responseStyle: 'detailed', creativityLevel: 0.6, respectRoles: true,
      ignoredRoles: '', allowedChannels: '', cooldownSeconds: 5, maxTokensPerUser: 1000,
      dailyLimit: 50, greetingMessage: '', customInstructions: '',
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', color: '#F1F5F9' }}>
      
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 40px', background: '#111118', borderBottom: '1px solid #1F2937',
        position: 'sticky', top: 0, zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{ width: '32px', height: '32px', background: '#16161F', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#00E5FF', fontSize: '16px' }}>N</div>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFF' }}>Нова</span>
          </a>
          <span style={{ color: '#374151' }}>|</span>
          <a href="/dashboard/modules" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: '14px' }}>← Модули</a>
          <span style={{ color: '#374151' }}>/</span>
          <span style={{ color: '#00E5FF', fontSize: '14px', fontWeight: '500' }}>AI-Настройки</span>
        </div>
        <button onClick={save} style={{
          padding: '10px 22px', background: saved ? '#22C55E' : '#00E5FF', color: '#000',
          border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
          transition: 'all 0.25s'
        }}>{saved ? '✅ Сохранено!' : '💾 Сохранить'}</button>
      </header>

      <main style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '6px' }}>✨ AI-Настройки</h1>
          <p style={{ color: '#94A3B8', fontSize: '15px' }}>Тонкая настройка искусственного интеллекта Нова</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          {/* === Личность === */}
          <div style={{ background: '#16161F', borderRadius: '18px', padding: '24px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>🤖 Личность бота</h3>
            
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Имя бота</label>
              <input type="text" value={settings.botName} onChange={(e) => update('botName', e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Стиль общения</label>
              <select value={settings.personality} onChange={(e) => update('personality', e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', cursor: 'pointer' }}>
                <option value="friendly">😊 Дружественный</option>
                <option value="gaming">🎮 Игровой</option>
                <option value="serious">🤵 Серьёзный</option>
                <option value="funny">😂 Юмористический</option>
                <option value="anime">🌸 Аниме</option>
                <option value="cyber">🤖 Киберпанк</option>
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Язык ответов</label>
              <select value={settings.language} onChange={(e) => update('language', e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', cursor: 'pointer' }}>
                <option value="ru">🇷🇺 Русский</option>
                <option value="en">🇬🇧 English</option>
                <option value="auto">🌐 Автоопределение</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Стиль ответов</label>
              <select value={settings.responseStyle} onChange={(e) => update('responseStyle', e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', cursor: 'pointer' }}>
                <option value="detailed">📝 Подробный</option>
                <option value="concise">✂️ Краткий</option>
                <option value="balanced">⚖️ Сбалансированный</option>
              </select>
            </div>
          </div>

          {/* === Параметры генерации === */}
          <div style={{ background: '#16161F', borderRadius: '18px', padding: '24px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>🌡️ Параметры генерации</h3>
            
            {[
              { label: 'Температура', key: 'temperature', min: 0, max: 1, step: 0.1, desc: 'Креативность ответов' },
              { label: 'Креативность', key: 'creativityLevel', min: 0, max: 1, step: 0.1, desc: 'Уровень нестандартности' },
            ].map((s, i) => (
              <div key={i} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', color: '#94A3B8' }}>{s.label}</span>
                  <span style={{ color: '#00E5FF', fontWeight: '600', fontSize: '14px' }}>{settings[s.key as keyof typeof settings]}</span>
                </div>
                <input type="range" min={s.min} max={s.max} step={s.step} value={settings[s.key as keyof typeof settings] as number}
                  onChange={(e) => update(s.key, parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#00E5FF' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                  <span style={{ fontSize: '10px', color: '#64748B' }}>Точный</span>
                  <span style={{ fontSize: '10px', color: '#64748B' }}>Креативный</span>
                </div>
              </div>
            ))}

            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#94A3B8' }}>Макс. длина ответа</span>
                <span style={{ color: '#00E5FF', fontWeight: '600' }}>{settings.maxLength} симв.</span>
              </div>
              <input type="range" min="100" max="2000" step="100" value={settings.maxLength}
                onChange={(e) => update('maxLength', parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#00E5FF' }} />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#94A3B8' }}>Макс. токенов на пользователя</span>
                <span style={{ color: '#00E5FF', fontWeight: '600' }}>{settings.maxTokensPerUser}</span>
              </div>
              <input type="range" min="100" max="5000" step="100" value={settings.maxTokensPerUser}
                onChange={(e) => update('maxTokensPerUser', parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#00E5FF' }} />
            </div>
          </div>

          {/* === Контекст и ограничения === */}
          <div style={{ background: '#16161F', borderRadius: '18px', padding: '24px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>🧠 Контекст и память</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>Запоминать контекст</div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Помнить последние сообщения</div>
              </div>
              <div onClick={() => toggle('useContext')} style={{ width: '44px', height: '26px', background: settings.useContext ? '#00E5FF' : '#374151', borderRadius: '26px', cursor: 'pointer', transition: '0.25s', position: 'relative', flexShrink: 0 }}>
                <div style={{ position: 'absolute', height: '20px', width: '20px', left: settings.useContext ? '22px' : '4px', top: '3px', background: settings.useContext ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} />
              </div>
            </div>

            {settings.useContext && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Сообщений для контекста</label>
                <input type="number" value={settings.contextMessages} onChange={(e) => update('contextMessages', parseInt(e.target.value) || 10)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>Уважать роли</div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Учитывать иерархию сервера</div>
              </div>
              <div onClick={() => toggle('respectRoles')} style={{ width: '44px', height: '26px', background: settings.respectRoles ? '#00E5FF' : '#374151', borderRadius: '26px', cursor: 'pointer', transition: '0.25s', position: 'relative', flexShrink: 0 }}>
                <div style={{ position: 'absolute', height: '20px', width: '20px', left: settings.respectRoles ? '22px' : '4px', top: '3px', background: settings.respectRoles ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>Автомодерация AI</div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Фильтровать ответы бота</div>
              </div>
              <div onClick={() => toggle('autoModeration')} style={{ width: '44px', height: '26px', background: settings.autoModeration ? '#00E5FF' : '#374151', borderRadius: '26px', cursor: 'pointer', transition: '0.25s', position: 'relative', flexShrink: 0 }}>
                <div style={{ position: 'absolute', height: '20px', width: '20px', left: settings.autoModeration ? '22px' : '4px', top: '3px', background: settings.autoModeration ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} />
              </div>
            </div>
          </div>

          {/* === Каналы и квоты === */}
          <div style={{ background: '#16161F', borderRadius: '18px', padding: '24px', border: '1px solid #1F2937' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>📋 Каналы и квоты</h3>
            
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Разрешённые каналы (через запятую)</label>
              <input type="text" value={settings.allowedChannels} onChange={(e) => update('allowedChannels', e.target.value)}
                placeholder="#общий, #бот-команды (пусто = все)"
                style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Игнорируемые роли (через запятую)</label>
              <input type="text" value={settings.ignoredRoles} onChange={(e) => update('ignoredRoles', e.target.value)}
                placeholder="@бот, @гость"
                style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Кулдаун (секунд)</label>
              <input type="number" value={settings.cooldownSeconds} onChange={(e) => update('cooldownSeconds', parseInt(e.target.value) || 5)}
                style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Дневной лимит запросов</label>
              <input type="number" value={settings.dailyLimit} onChange={(e) => update('dailyLimit', parseInt(e.target.value) || 50)}
                style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* === Системный промпт === */}
          <div style={{ background: '#16161F', borderRadius: '18px', padding: '24px', border: '1px solid #1F2937', gridColumn: '1 / 3' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>📝 Системный промпт</h3>
            <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '10px' }}>Основные инструкции, определяющие поведение AI</p>
            <textarea value={settings.systemPrompt} onChange={(e) => update('systemPrompt', e.target.value)}
              rows={4}
              style={{ width: '100%', padding: '12px 16px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '12px', color: '#FFF', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace', lineHeight: '1.6' }} />
          </div>

          {/* === Дополнительно === */}
          <div style={{ background: '#16161F', borderRadius: '18px', padding: '24px', border: '1px solid #1F2937', gridColumn: '1 / 3' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>⚙️ Дополнительно</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Приветственное сообщение</label>
                <input type="text" value={settings.greetingMessage} onChange={(e) => update('greetingMessage', e.target.value)}
                  placeholder="Привет! Я Нова. Спроси у меня что угодно!"
                  style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Запрещённые темы</label>
                <input type="text" value={settings.forbiddenTopics} onChange={(e) => update('forbiddenTopics', e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Кастомные инструкции</label>
              <textarea value={settings.customInstructions} onChange={(e) => update('customInstructions', e.target.value)}
                rows={2}
                placeholder="Дополнительные правила для бота..."
                style={{ width: '100%', padding: '12px 16px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '12px', color: '#FFF', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace', lineHeight: '1.6' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '12px 0', borderTop: '1px solid #1F2937' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>Использовать эмодзи</div>
                <div style={{ fontSize: '12px', color: '#94A3B8' }}>Добавлять эмодзи в ответы</div>
              </div>
              <div onClick={() => toggle('useEmoji')} style={{ width: '44px', height: '26px', background: settings.useEmoji ? '#00E5FF' : '#374151', borderRadius: '26px', cursor: 'pointer', transition: '0.25s', position: 'relative', flexShrink: 0 }}>
                <div style={{ position: 'absolute', height: '20px', width: '20px', left: settings.useEmoji ? '22px' : '4px', top: '3px', background: settings.useEmoji ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} />
              </div>
            </div>
          </div>

        </div>

        {/* Кнопки */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
          <button onClick={() => window.location.href = '/dashboard/modules'} style={{
            padding: '12px 24px', background: 'transparent', color: '#94A3B8',
            border: '1px solid #1F2937', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '14px'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00E5FF'; e.currentTarget.style.color = '#FFF'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1F2937'; e.currentTarget.style.color = '#94A3B8'; }}
          >← Назад к модулям</button>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={resetAll} style={{
              padding: '12px 20px', background: 'transparent', color: '#EF4444',
              border: '1px solid #374151', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '14px'
            }}>🔄 Сбросить</button>
            <button onClick={save} style={{
              padding: '12px 28px', background: saved ? '#22C55E' : '#00E5FF', color: '#000',
              border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '14px',
              transition: 'all 0.3s', boxShadow: saved ? '0 0 20px rgba(34,197,94,0.3)' : '0 0 20px rgba(0,229,255,0.2)'
            }}>{saved ? '✅ Сохранено!' : '💾 Сохранить настройки'}</button>
          </div>
        </div>

        {saved && (
          <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#22C55E', color: '#000', padding: '14px 24px', borderRadius: '14px', fontWeight: '600', fontSize: '15px', zIndex: 1000, boxShadow: '0 4px 25px rgba(34,197,94,0.4)', animation: 'slideUp 0.3s ease' }}>
            ✅ Настройки AI сохранены!
          </div>
        )}
        <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      </main>
    </div>
  )
}
