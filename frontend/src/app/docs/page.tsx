"use client"

export default function DocsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', padding: '60px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <a href="/" style={{ color: '#00E5FF', textDecoration: 'none', fontSize: '14px' }}>← На главную</a>
        <h1 style={{ fontSize: '40px', fontWeight: 'bold', color: '#FFFFFF', marginTop: '20px', marginBottom: '10px' }}>Документация</h1>
        <p style={{ color: '#94A3B8', marginBottom: '40px' }}>Как подключить и настроить Нова</p>
        
        <div style={{ background: '#16161F', borderRadius: '16px', padding: '30px', marginBottom: '20px', border: '1px solid #1F2937' }}>
          <h2 style={{ color: '#FFFFFF', marginBottom: '16px' }}>1. Интеграция</h2>
          <p style={{ color: '#94A3B8', lineHeight: '1.8' }}>
            Для подключения Нова к вашему серверу Lolka, перейдите на страницу <a href="/login" style={{ color: '#00E5FF' }}>авторизации</a>.
            Пока доступна интеграция через вебхуки. Полноценная OAuth-авторизация появится после запуска от Lolka.
          </p>
        </div>

        <div style={{ background: '#16161F', borderRadius: '16px', padding: '30px', marginBottom: '20px', border: '1px solid #1F2937' }}>
          <h2 style={{ color: '#FFFFFF', marginBottom: '16px' }}>2. Команды</h2>
          <p style={{ color: '#94A3B8', lineHeight: '1.8' }}>
            Нова поддерживает команды: <code style={{ background: '#0A0A0F', padding: '2px 8px', borderRadius: '4px', color: '#00E5FF' }}>/ping</code>, <code style={{ background: '#0A0A0F', padding: '2px 8px', borderRadius: '4px', color: '#00E5FF' }}>/help</code>, <code style={{ background: '#0A0A0F', padding: '2px 8px', borderRadius: '4px', color: '#00E5FF' }}>/stats</code>, <code style={{ background: '#0A0A0F', padding: '2px 8px', borderRadius: '4px', color: '#00E5FF' }}>/hello</code>
          </p>
        </div>

        <div style={{ background: '#16161F', borderRadius: '16px', padding: '30px', marginBottom: '20px', border: '1px solid #1F2937' }}>
          <h2 style={{ color: '#FFFFFF', marginBottom: '16px' }}>3. API</h2>
          <p style={{ color: '#94A3B8', lineHeight: '1.8' }}>
            API доступен по адресу: <a href="https://nova-bot-rpsy.onrender.com/docs" target="_blank" style={{ color: '#00E5FF' }}>nova-bot-rpsy.onrender.com/docs</a>
          </p>
        </div>
      </div>
    </div>
  )
}
