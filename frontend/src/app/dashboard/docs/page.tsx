"use client"

export default function DocsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📖 Документация</h1>
        <p className="text-zinc-400 mt-2">Всё что нужно для подключения и настройки Нова</p>
      </div>

      {/* Быстрый старт */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">🚀 Быстрый старт</h2>
        <div className="space-y-3 text-zinc-400 leading-relaxed">
          <p>1. Перейдите на страницу <a href="/login" className="text-nova-400">авторизации</a></p>
          <p>2. Выберите способ входа: <strong className="text-white">Lolka.app</strong> или <strong className="text-white">VK</strong></p>
          <p>3. Подтвердите доступ к вашему серверу</p>
          <p>4. Настройте модули в <a href="/dashboard/modules" className="text-nova-400">Центре управления</a></p>
          <p>5. Бот готов к работе! 🎉</p>
        </div>
      </div>

      {/* Способы авторизации */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">🔐 Способы авторизации</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#111118] rounded-2xl p-5 border border-[#1F2937]">
            <h3 className="text-lg font-semibold mb-2">🎮 Lolka.app</h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-3">Авторизация через платформу Lolka. Поддерживаются вебхуки, OAuth2 (скоро).</p>
            <div className="bg-[#0A0A0F] rounded-xl p-3 font-mono text-xs text-nova-400">
              GET /oauth/lolka/callback<br/>
              Scopes: identify, servers, webhook
            </div>
          </div>
          <div className="bg-[#111118] rounded-2xl p-5 border border-[#1F2937]">
            <h3 className="text-lg font-semibold mb-2">💙 ВКонтакте</h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-3">Вход через VK ID. Поддерживается авторизация через сообщества и приложения.</p>
            <div className="bg-[#0A0A0F] rounded-xl p-3 font-mono text-xs text-nova-400">
              GET /oauth/vk/callback<br/>
              Scopes: email, groups, messages
            </div>
          </div>
        </div>
      </div>

      {/* Команды */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">⚡ Команды бота</h2>
        <div className="space-y-2">
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
            <div key={i} className={`flex gap-4 py-2 ${i < 7 ? 'border-b border-[#1F2937]' : ''}`}>
              <code className="bg-[#0A0A0F] px-3 py-1 rounded-lg text-nova-400 text-sm font-mono min-w-[140px]">{c.cmd}</code>
              <span className="text-zinc-400">{c.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Модули */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">🧩 Модули</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: '🛡️ Модерация', desc: 'Антиспам, фильтр мата, авто-предупреждения' },
            { name: '📊 Уровни', desc: 'Система опыта, награды, лидерборд' },
            { name: '🤖 AI-помощник', desc: 'Умные ответы, генерация, поддержка' },
            { name: '🎵 Музыка', desc: 'Воспроизведение треков, плейлисты' },
            { name: '⚡ Команды', desc: 'Кастомные команды, автопостинг' },
            { name: '📈 Аналитика', desc: 'Статистика, графики, отчёты' },
          ].map((m, i) => (
            <div key={i} className="bg-[#111118] rounded-xl p-4">
              <div className="font-semibold mb-1">{m.name}</div>
              <div className="text-zinc-400 text-xs">{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* API */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">🔧 API</h2>
        <p className="text-zinc-400 mb-4">
          API доступен по адресу: <a href="https://nova-bot-rpsy.onrender.com/docs" target="_blank" className="text-nova-400">nova-bot-rpsy.onrender.com/docs</a>
        </p>
        <div className="space-y-2">
          {[
            { method: 'GET', path: '/api/servers', desc: 'Список серверов' },
            { method: 'POST', path: '/api/servers', desc: 'Добавить сервер' },
            { method: 'POST', path: '/api/webhook/lolka', desc: 'Вебхук Lolka' },
            { method: 'GET', path: '/api/settings/modules', desc: 'Настройки модулей' },
            { method: 'POST', path: '/api/settings/ai', desc: 'AI-настройки' },
          ].map((a, i) => (
            <div key={i} className="flex gap-4 items-center py-1.5">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold min-w-[45px] text-center ${a.method === 'GET' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-cyan-500/15 text-cyan-400'}`}>{a.method}</span>
              <code className="text-white text-sm font-mono">{a.path}</code>
              <span className="text-zinc-400 text-sm ml-auto">{a.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Поддержка */}
      <div className="card text-center">
        <h2 className="text-xl font-semibold mb-2">🛟 Нужна помощь?</h2>
        <p className="text-zinc-400 mb-4">Присоединяйтесь к нашему сообществу или напишите в поддержку</p>
        <div className="flex gap-3 justify-center">
          <a href="#" className="btn-primary">💬 Сообщество Lolka</a>
          <a href="/login" className="btn-secondary">🔧 Поддержка</a>
        </div>
      </div>
    </div>
  )
}
