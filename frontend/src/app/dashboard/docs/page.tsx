'use client';

const COMMANDS = [
  { cmd: '/ping', desc: 'Проверка работы бота' },
  { cmd: '/help', desc: 'Список всех команд' },
  { cmd: '/stats', desc: 'Статистика сервера или пользователя' },
  { cmd: '/rank', desc: 'Показать уровень участника' },
  { cmd: '/top', desc: 'Топ участников по уровню' },
  { cmd: '/ai [вопрос]', desc: 'Задать вопрос AI-помощнику' },
  { cmd: '/play [название]', desc: 'Включить музыку' },
  { cmd: '/ban @user', desc: 'Забанить пользователя (модерация)' },
];

const MODULES = [
  { name: '🛡️ Модерация', desc: 'Антиспам, фильтр мата, авто-предупреждения' },
  { name: '📊 Уровни', desc: 'Система опыта, награды, лидерборд' },
  { name: '🤖 AI-помощник', desc: 'Умные ответы, генерация, поддержка' },
  { name: '🎵 Музыка', desc: 'Воспроизведение треков, плейлисты' },
  { name: '⚡ Команды', desc: 'Кастомные команды, автопостинг' },
  { name: '📈 Аналитика', desc: 'Статистика, графики, отчёты' },
];

const API_ENDPOINTS = [
  { method: 'GET', path: '/api/servers', desc: 'Список серверов' },
  { method: 'POST', path: '/api/servers', desc: 'Добавить сервер' },
  { method: 'POST', path: '/api/webhook/lolka', desc: 'Вебхук Lolka' },
  { method: 'GET', path: '/api/settings/modules', desc: 'Настройки модулей' },
  { method: 'POST', path: '/api/settings/ai', desc: 'AI-настройки' },
];

export default function DocsPage() {
  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">📚 Документация</h1>
        <p className="text-white/50 mt-1">Всё что нужно для подключения и настройки Nova</p>
      </div>

      {/* Quick start */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">🚀 Быстрый старт</h2>
        <ol className="space-y-2 text-white/60 leading-relaxed">
          <li>1. Перейдите на страницу <a href="/login" className="text-cyan-400 hover:underline">авторизации</a></li>
          <li>2. Выберите способ входа: <strong className="text-white">Lolka.app</strong> или <strong className="text-white">VK</strong></li>
          <li>3. Подтвердите доступ к вашему серверу</li>
          <li>4. Настройте модули в <a href="/dashboard/modules" className="text-cyan-400 hover:underline">Центре управления</a></li>
          <li>5. Бот готов к работе! 🎉</li>
        </ol>
      </div>

      {/* Auth methods */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">🔐 Способы авторизации</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-2">🎮 Lolka.app</h3>
            <p className="text-white/50 text-sm mb-3">Авторизация через платформу Lolka. Поддерживаются вебхуки, OAuth2 (скоро).</p>
            <div className="bg-black/30 rounded-lg p-3 font-mono text-xs text-cyan-400">
              GET /oauth/lolka/callback<br/>
              Scopes: identify, servers, webhook
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-white font-semibold mb-2">🌐 ВКонтакте</h3>
            <p className="text-white/50 text-sm mb-3">Вход через VK ID. Поддерживается авторизация через сообщества и приложения.</p>
            <div className="bg-black/30 rounded-lg p-3 font-mono text-xs text-cyan-400">
              GET /oauth/vk/callback<br/>
              Scopes: email, groups, messages
            </div>
          </div>
        </div>
      </div>

      {/* Commands */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">⚡ Команды бота</h2>
        <div className="space-y-1">
          {COMMANDS.map((c, i) => (
            <div key={i} className={`flex gap-4 items-center py-2 ${i < COMMANDS.length - 1 ? 'border-b border-white/5' : ''}`}>
              <code className="bg-black/30 px-3 py-1 rounded-lg text-cyan-400 text-sm font-mono min-w-36 shrink-0">{c.cmd}</code>
              <span className="text-white/50 text-sm">{c.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modules */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">🧩 Модули</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MODULES.map((m, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-white font-semibold text-sm mb-1">{m.name}</div>
              <div className="text-white/40 text-xs">{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* API */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-2">🔧 API</h2>
        <p className="text-white/50 text-sm mb-4">
          Документация доступна по адресу:{' '}
          <a href="https://nova-bot-rpsy.onrender.com/docs" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
            nova-bot-rpsy.onrender.com/docs
          </a>
        </p>
        <div className="space-y-1">
          {API_ENDPOINTS.map((a, i) => (
            <div key={i} className="flex gap-3 items-center py-1.5">
              <span className={`px-2 py-0.5 rounded-lg text-xs font-bold min-w-12 text-center ${a.method === 'GET' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-cyan-500/15 text-cyan-400'}`}>
                {a.method}
              </span>
              <code className="text-white text-sm font-mono">{a.path}</code>
              <span className="text-white/40 text-sm ml-auto">{a.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Support */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <h2 className="text-xl font-semibold text-white mb-2">🛟 Нужна помощь?</h2>
        <p className="text-white/50 mb-4">Присоединяйтесь к нашему сообществу или напишите в поддержку</p>
        <div className="flex gap-3 justify-center">
          <a href="#" className="px-5 py-2.5 bg-cyan-400 text-black font-semibold rounded-xl text-sm hover:bg-cyan-300 transition-colors">💬 Сообщество Lolka</a>
          <a href="/login" className="px-5 py-2.5 border border-white/20 text-white font-medium rounded-xl text-sm hover:bg-white/10 transition-colors">🔧 Поддержка</a>
        </div>
      </div>
    </div>
  );
}
