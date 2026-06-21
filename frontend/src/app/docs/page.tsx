"use client"

export default function DocsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', color: '#F1F5F9' }}>
      
      {/* Header */}
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
          <span style={{ color: '#374151' }}>/</span>
          <span style={{ color: '#00E5FF', fontSize: '14px', fontWeight: '500' }}>Документация</span>
        </div>
        <a href="/login" style={{
          padding: '8px 18px', background: '#00E5FF', color: '#000', borderRadius: '10px',
          fontWeight: '600', fontSize: '14px', textDecoration: 'none'
        }}>Войти</a>
      </header>

      <main style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
        
        <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px' }}>📖 Документация</h1>
        <p style={{ color: '#94A3B8', fontSize: '15px', marginBottom: '40px' }}>
          Всё что нужно для подключения и настройки Нова
        </p>

        {/* Быстрый старт */}
        <div style={{ background: '#16161F', borderRadius: '18px', padding: '28px', marginBottom: '20px', border: '1px solid #1F2937' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>🚀 Быстрый старт</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: '#94A3B8', lineHeight: '1.8', fontSize: '14px' }}>
            <p>1. Перейдите на страницу <a href="/login" style={{ color: '#00E5FF' }}>авторизации</a></p>
            <p>2. Выберите способ входа: <strong style={{ color: '#FFF' }}>Lolka.app</strong> или <strong style={{ color: '#FFF' }}>VK</strong></p>
            <p>3. Подтвердите доступ к вашему серверу</p>
            <p>4. Настройте модули в <a href="/dashboard/modules" style={{ color: '#00E5FF' }}>Центре управления</a></p>
            <p>5. Бот готов к работе! 🎉</p>
          </div>
        </div>

        {/* Способы авторизации */}
        <div style={{ background: '#16161F', borderRadius: '18px', padding: '28px', marginBottom: '20px', border: '1px solid #1F2937' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>🔐 Способы авторизации</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Lolka */}
            <div style={{ background: '#111118', borderRadius: '14px', padding: '20px', border: '1px solid #1F2937' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>🎮 Lolka.app</h3>
              <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.6', marginBottom: '12px' }}>
                Авторизация через платформу Lolka. Поддерживаются вебхуки, OAuth2 (скоро).
              </p>
              <div style={{ background: '#0A0A0F', borderRadius: '10px', padding: '12px', fontFamily: 'monospace', fontSize: '12px', color: '#00E5FF' }}>
                GET /oauth/lolka/callback<br/>
                Scopes: identify, servers, webhook
              </div>
            </div>

            {/* VK */}
            <div style={{ background: '#111118', borderRadius: '14px', padding: '20px', border: '1px solid #1F2937' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>💙 ВКонтакте</h3>
              <p style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.6', marginBottom: '12px' }}>
                Вход через VK ID. Поддерживается авторизация через сообщества и приложения.
              </p>
              <div style={{ background: '#0A0A0F', borderRadius: '10px', padding: '12px', fontFamily: 'monospace', fontSize: '12px', color: '#00E5FF' }}>
                GET /oauth/vk/callback<br/>
                Scopes: email, groups, messages
              </div>
            </div>
          </div>
        </div>

        {/* Команды */}
        <div style={{ background: '#16161F', borderRadius: '18px', padding: '28px', marginBottom: '20px', border: '1px solid #1F2937' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>⚡ Команды бота</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { cmd: '/ping', desc: 'Проверка работы бота' },
              { cmd: '/help', desc: 'Список всех команд' },
              { cmd: '/stats', desc: 'Статистика сервера или пользователя' },
              { cmd: '/rank', desc: 'Показать уровень участника' },
              { cmd: '/top', desc: 'Топ участников по уровню' },
              { cmd: '/ai [вопрос]', desc: 'Задать вопрос AI-помощнику' },
              { cmd: '/play [название]', desc: 'Включить музыку' },
              { cmd: '/ban @user', desc: 'Забанить пользователя (модерация)' },
            ].map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', padding: '8px 0', borderBottom: i < 7 ? '1px solid #1F2937' : 'none' }}>
                <code style={{ background: '#0A0A0F', padding: '4px 12px', borderRadius: '6px', color: '#00E5FF', fontSize: '13px', fontFamily: 'monospace', minWidth: '140px' }}>{c.cmd}</code>
                <span style={{ color: '#94A3B8', fontSize: '14px' }}>{c.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Модули */}
        <div style={{ background: '#16161F', borderRadius: '18px', padding: '28px', marginBottom: '20px', border: '1px solid #1F2937' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>🧩 Модули</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { name: '🛡️ Модерация', desc: 'Антиспам, фильтр мата, авто-предупреждения' },
              { name: '📊 Уровни', desc: 'Система опыта, награды, лидерборд' },
              { name: '🤖 AI-помощник', desc: 'Умные ответы, генерация, поддержка' },
              { name: '🎵 Музыка', desc: 'Воспроизведение треков, плейлисты' },
              { name: '⚡ Команды', desc: 'Кастомные команды, автопостинг' },
              { name: '📈 Аналитика', desc: 'Статистика, графики, отчёты' },
            ].map((m, i) => (
              <div key={i} style={{ background: '#111118', borderRadius: '12px', padding: '14px' }}>
                <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{m.name}</div>
                <div style={{ color: '#94A3B8', fontSize: '12px' }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* API */}
        <div style={{ background: '#16161F', borderRadius: '18px', padding: '28px', marginBottom: '20px', border: '1px solid #1F2937' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>🔧 API</h2>
          <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '16px' }}>
            API доступен по адресу: <a href="https://nova-bot-rpsy.onrender.com/docs" target="_blank" style={{ color: '#00E5FF' }}>nova-bot-rpsy.onrender.com/docs</a>
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { method: 'GET', path: '/api/servers', desc: 'Список серверов' },
              { method: 'POST', path: '/api/servers', desc: 'Добавить сервер' },
              { method: 'POST', path: '/api/webhook/lolka', desc: 'Вебхук Lolka' },
              { method: 'GET', path: '/api/settings/modules', desc: 'Настройки модулей' },
              { method: 'POST', path: '/api/settings/ai', desc: 'AI-настройки' },
            ].map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '6px 0' }}>
                <span style={{
                  padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600',
                  background: a.method === 'GET' ? 'rgba(34,197,94,0.15)' : 'rgba(0,229,255,0.15)',
                  color: a.method === 'GET' ? '#22C55E' : '#00E5FF', minWidth: '45px', textAlign: 'center'
                }}>{a.method}</span>
                <code style={{ color: '#FFF', fontSize: '13px', fontFamily: 'monospace' }}>{a.path}</code>
                <span style={{ color: '#94A3B8', fontSize: '13px', marginLeft: 'auto' }}>{a.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Поддержка */}
        <div style={{ background: '#16161F', borderRadius: '18px', padding: '28px', border: '1px solid #1F2937', textAlign: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>🛟 Нужна помощь?</h2>
          <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '16px' }}>
            Присоединяйтесь к нашему сообществу или напишите в поддержку
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <a href="#" style={{
              padding: '10px 20px', background: '#00E5FF', color: '#000', borderRadius: '10px',
              fontWeight: '600', fontSize: '14px', textDecoration: 'none'
            }}>💬 Сообщество Lolka</a>
            <a href="/login" style={{
              padding: '10px 20px', background: '#1F2937', color: '#FFF', borderRadius: '10px',
              fontWeight: '600', fontSize: '14px', textDecoration: 'none'
            }}>🔧 Поддержка</a>
          </div>
        </div>
      </main>
    </div>
  )
}
