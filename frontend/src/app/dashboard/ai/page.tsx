"use client"

import { useState, useEffect } from 'react'

export default function AIPage() {
  const [settings, setSettings] = useState({
    // Основные
    botName: 'Нова',
    language: 'ru',
    activeModel: 'auto',
    
    // Gemini
    geminiEnabled: true,
    geminiTemperature: 0.8,
    geminiStyle: 'friendly',
    geminiCustomPrompt: '',
    
    // DeepSeek
    deepseekEnabled: true,
    deepseekTemperature: 0.7,
    deepseekStyle: 'creative',
    deepseekCustomPrompt: '',
    
    // Общие
    useContext: true,
    contextMessages: 10,
    systemPrompt: 'Ты — дружелюбный AI-помощник. Отвечай на русском языке.',
    forbiddenTopics: 'политика, религия, NSFW',
    autoModeration: false,
    
    // Привязка к серверу
    serverName: '',
    platform: 'Lolka',
    
    // Аватар
    avatarStyle: 'nova',
    avatarUrl: '',
  })

  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  const update = (key: string, value: any) => setSettings({ ...settings, [key]: value })
  const toggle = (key: string) => update(key, !settings[key as keyof typeof settings])
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  // Стили для Gemini
  const geminiStyles = [
    { value: 'friendly', label: '😊 Дружелюбный', desc: 'Тёплое, приветливое общение' },
    { value: 'gaming', label: '🎮 Игровой', desc: 'Энергичный, с игровым сленгом' },
    { value: 'professional', label: '💼 Профессиональный', desc: 'Серьёзный, деловой тон' },
  ]

  // Стили для DeepSeek
  const deepseekStyles = [
    { value: 'creative', label: '🎨 Креативный', desc: 'Нестандартные, яркие ответы' },
    { value: 'humorous', label: '😂 Юмористический', desc: 'С шутками и мемами' },
    { value: 'anime', label: '🌸 Аниме', desc: 'В стиле аниме-персонажа' },
  ]

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

      <main style={{ padding: '32px 40px', maxWidth: '1000px', margin: '0 auto' }}>
        
        <h1 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '4px' }}>✨ AI-Настройки</h1>
        <p style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '24px' }}>Гибкая настройка моделей и стилей общения</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
          {[
            { id: 'general', label: '⚙️ Общие' },
            { id: 'gemini', label: '🔵 Gemini' },
            { id: 'deepseek', label: '🟣 DeepSeek' },
            { id: 'server', label: '🖥️ Сервер' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '10px 18px', borderRadius: '10px', border: 'none',
              background: activeTab === tab.id ? '#1F2937' : 'transparent',
              color: activeTab === tab.id ? '#FFF' : '#94A3B8',
              fontWeight: activeTab === tab.id ? '600' : '400',
              cursor: 'pointer', fontSize: '13px', transition: 'all 0.15s'
            }}>{tab.label}</button>
          ))}
        </div>

        {/* Tab: General */}
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Модель */}
            <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', border: '1px solid #1F2937' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '14px' }}>🤖 Активная модель</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[
                  { value: 'auto', label: '🔄 Авто', desc: 'Gemini → DeepSeek' },
                  { value: 'gemini', label: '🔵 Gemini', desc: 'Google AI' },
                  { value: 'deepseek', label: '🟣 DeepSeek', desc: 'DeepSeek AI' },
                ].map(m => (
                  <div key={m.value} onClick={() => update('activeModel', m.value)} style={{
                    flex: 1, padding: '14px', borderRadius: '12px', cursor: 'pointer',
                    background: settings.activeModel === m.value ? 'rgba(0,229,255,0.08)' : '#111118',
                    border: `2px solid ${settings.activeModel === m.value ? '#00E5FF' : '#1F2937'}`,
                    transition: 'all 0.2s'
                  }}>
                    <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{m.label}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{m.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Имя и язык */}
            <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', border: '1px solid #1F2937', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Имя бота</label>
                <input type="text" value={settings.botName} onChange={(e) => update('botName', e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Язык</label>
                <select value={settings.language} onChange={(e) => update('language', e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', cursor: 'pointer' }}>
                  <option value="ru">🇷🇺 Русский</option>
                  <option value="en">🇬🇧 English</option>
                </select>
              </div>
            </div>

            {/* Системный промпт */}
            <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', border: '1px solid #1F2937' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>📝 Системный промпт</h3>
              <textarea value={settings.systemPrompt} onChange={(e) => update('systemPrompt', e.target.value)} rows={3}
                style={{ width: '100%', padding: '12px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace' }} />
            </div>

            {/* Переключатели */}
            <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', border: '1px solid #1F2937' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '14px' }}>⚙️ Дополнительно</h3>
              {[
                { key: 'useContext', label: 'Запоминать контекст', desc: 'Помнить последние сообщения' },
                { key: 'autoModeration', label: 'Автомодерация AI', desc: 'Фильтровать ответы бота' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i === 0 ? '1px solid #1F2937' : 'none' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.label}</div>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>{item.desc}</div>
                  </div>
                  <div onClick={() => toggle(item.key)} style={{ width: '44px', height: '26px', background: settings[item.key as keyof typeof settings] ? '#00E5FF' : '#374151', borderRadius: '26px', cursor: 'pointer', position: 'relative' }}>
                    <div style={{ position: 'absolute', height: '20px', width: '20px', left: settings[item.key as keyof typeof settings] ? '22px' : '4px', top: '3px', background: settings[item.key as keyof typeof settings] ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} />
                  </div>
                </div>
              ))}
              {settings.useContext && (
                <div style={{ marginTop: '12px' }}>
                  <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Сообщений для контекста</label>
                  <input type="number" value={settings.contextMessages} onChange={(e) => update('contextMessages', parseInt(e.target.value) || 10)}
                    style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Gemini */}
        {activeTab === 'gemini' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', border: '1px solid #1F2937' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600' }}>🔵 Google Gemini</h3>
                <div onClick={() => toggle('geminiEnabled')} style={{ width: '44px', height: '26px', background: settings.geminiEnabled ? '#00E5FF' : '#374151', borderRadius: '26px', cursor: 'pointer', position: 'relative' }}>
                  <div style={{ position: 'absolute', height: '20px', width: '20px', left: settings.geminiEnabled ? '22px' : '4px', top: '3px', background: settings.geminiEnabled ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} />
                </div>
              </div>

              {settings.geminiEnabled && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#94A3B8' }}>Температура</span>
                      <span style={{ color: '#3B82F6', fontWeight: '600' }}>{settings.geminiTemperature}</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.1" value={settings.geminiTemperature}
                      onChange={(e) => update('geminiTemperature', parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#3B82F6' }} />
                  </div>

                  <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px', color: '#94A3B8' }}>🎨 Стили общения (3 шаблона)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {geminiStyles.map(style => (
                      <div key={style.value} onClick={() => update('geminiStyle', style.value)} style={{
                        padding: '14px', borderRadius: '12px', cursor: 'pointer',
                        background: settings.geminiStyle === style.value ? 'rgba(59,130,246,0.1)' : '#111118',
                        border: `2px solid ${settings.geminiStyle === style.value ? '#3B82F6' : '#1F2937'}`,
                        transition: 'all 0.2s'
                      }}>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{style.label}</div>
                        <div style={{ fontSize: '12px', color: '#94A3B8' }}>{style.desc}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Кастомный промпт для Gemini</label>
                    <textarea value={settings.geminiCustomPrompt} onChange={(e) => update('geminiCustomPrompt', e.target.value)} rows={2}
                      placeholder="Дополнительные инструкции для Gemini..."
                      style={{ width: '100%', padding: '10px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace' }} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tab: DeepSeek */}
        {activeTab === 'deepseek' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', border: '1px solid #1F2937' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600' }}>🟣 DeepSeek AI</h3>
                <div onClick={() => toggle('deepseekEnabled')} style={{ width: '44px', height: '26px', background: settings.deepseekEnabled ? '#A855F7' : '#374151', borderRadius: '26px', cursor: 'pointer', position: 'relative' }}>
                  <div style={{ position: 'absolute', height: '20px', width: '20px', left: settings.deepseekEnabled ? '22px' : '4px', top: '3px', background: settings.deepseekEnabled ? '#000' : '#FFF', borderRadius: '50%', transition: '0.25s' }} />
                </div>
              </div>

              {settings.deepseekEnabled && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#94A3B8' }}>Температура</span>
                      <span style={{ color: '#A855F7', fontWeight: '600' }}>{settings.deepseekTemperature}</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.1" value={settings.deepseekTemperature}
                      onChange={(e) => update('deepseekTemperature', parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#A855F7' }} />
                  </div>

                  <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px', color: '#94A3B8' }}>🎨 Стили общения (3 шаблона)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {deepseekStyles.map(style => (
                      <div key={style.value} onClick={() => update('deepseekStyle', style.value)} style={{
                        padding: '14px', borderRadius: '12px', cursor: 'pointer',
                        background: settings.deepseekStyle === style.value ? 'rgba(168,85,247,0.1)' : '#111118',
                        border: `2px solid ${settings.deepseekStyle === style.value ? '#A855F7' : '#1F2937'}`,
                        transition: 'all 0.2s'
                      }}>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{style.label}</div>
                        <div style={{ fontSize: '12px', color: '#94A3B8' }}>{style.desc}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Кастомный промпт для DeepSeek</label>
                    <textarea value={settings.deepseekCustomPrompt} onChange={(e) => update('deepseekCustomPrompt', e.target.value)} rows={2}
                      placeholder="Дополнительные инструкции для DeepSeek..."
                      style={{ width: '100%', padding: '10px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace' }} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tab: Server */}
        {activeTab === 'server' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <div style={{ background: '#16161F', borderRadius: '14px', padding: '20px', border: '1px solid #1F2937' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>🖥️ Привязка к серверу</h3>
              <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '16px' }}>
                AI будет адаптировать стиль общения под название сервера или группы
              </p>
              
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Платформа</label>
                <select value={settings.platform} onChange={(e) => update('platform', e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', cursor: 'pointer' }}>
                  <option value="Lolka">🎮 Lolka</option>
                  <option value="VK">💙 VK</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94A3B8', display: 'block', marginBottom: '6px' }}>Название сервера/группы</label>
                <input type="text" value={settings.serverName} onChange={(e) => update('serverName', e.target.value)}
                  placeholder="Например: Phoenix Gaming"
                  style={{ width: '100%', padding: '10px 14px', background: '#0A0A0F', border: '1px solid #1F2937', borderRadius: '10px', color: '#FFF', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Предпросмотр */}
              <div style={{ marginTop: '16px', background: '#111118', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>📝 Пример обращения:</div>
                <div style={{ fontSize: '14px', color: '#00E5FF', fontStyle: 'italic' }}>
                  {settings.platform === 'VK' 
                    ? `«Привет, подписчики ${settings.serverName || 'нашего паблика'}! ${settings.botName} на связи!»`
                    : `«Всем привет с сервера ${settings.serverName || 'Lolka'}! Я ${settings.botName}, ваш помощник!»`
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Кнопки */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
          <button onClick={() => window.location.href = '/dashboard/modules'} style={{
            padding: '10px 20px', background: 'transparent', color: '#94A3B8',
            border: '1px solid #1F2937', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px'
          }}>← Назад</button>
          <button onClick={save} style={{
            padding: '10px 24px', background: saved ? '#22C55E' : '#00E5FF', color: '#000',
            border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px',
            transition: 'all 0.3s', boxShadow: saved ? '0 0 15px rgba(34,197,94,0.3)' : 'none'
          }}>{saved ? '✅ Сохранено!' : '💾 Сохранить'}</button>
        </div>

        {saved && (
          <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#22C55E', color: '#000', padding: '10px 20px', borderRadius: '12px', fontWeight: '600', fontSize: '13px', zIndex: 1000, boxShadow: '0 4px 20px rgba(34,197,94,0.3)', animation: 'slideUp 0.3s ease' }}>✅ Настройки AI сохранены</div>
        )}
        <style>{`@keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
      </main>
    </div>
  )
}
