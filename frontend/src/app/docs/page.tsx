import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--text))] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">📖 Документация</h1>
          <p className="text-[rgb(var(--text-secondary))] mt-2">Всё что нужно для подключения и настройки Nova Bot</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">🚀 Быстрый старт</h2>
          <ol className="space-y-2 text-[rgb(var(--text-secondary))] list-decimal list-inside">
            <li>Перейдите на страницу <Link href="/login" className="text-nova-400">авторизации</Link></li>
            <li>Выберите способ входа: <strong className="text-white">Lolka.app</strong> или <strong className="text-white">VK</strong></li>
            <li>Подтвердите доступ к вашему серверу</li>
            <li>Настройте модули в <Link href="/dashboard/modules" className="text-nova-400">Центре управления</Link></li>
            <li>Бот готов к работе!</li>
          </ol>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">⚡ Команды</h2>
          <div className="space-y-2">
            {[
              { cmd: '/ping', desc: 'Проверка работы бота' },
              { cmd: '/help', desc: 'Список всех команд' },
              { cmd: '/stats', desc: 'Статистика сервера' },
              { cmd: '/rank', desc: 'Уровень участника' },
              { cmd: '/top', desc: 'Топ участников' },
              { cmd: '/ai', desc: 'Спросить AI' },
              { cmd: '/play', desc: 'Включить музыку' },
              { cmd: '/ban', desc: 'Забанить (модерация)' },
            ].map((c, i) => (
              <div key={i} className="flex gap-4 py-2 border-b border-[rgb(var(--border))] last:border-0">
                <code className="bg-[rgb(var(--surface-2))] px-3 py-1 rounded-lg text-nova-400 font-mono text-sm min-w-[120px]">{c.cmd}</code>
                <span>{c.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">🧩 Модули</h2>
          <div className="grid grid-cols-2 gap-3">
            {['🛡️ Модерация', '📊 Уровни', '🤖 AI', '🎵 Музыка', '⚡ Команды', '📈 Аналитика'].map((m, i) => (
              <div key={i} className="bg-[rgb(var(--surface-2))] rounded-2xl p-4 text-sm font-medium">{m}</div>
            ))}
          </div>
        </div>

        <div className="card text-center">
          <h2 className="text-xl font-semibold mb-2">🛟 Нужна помощь?</h2>
          <p className="text-[rgb(var(--text-secondary))] mb-4">Присоединяйтесь к сообществу</p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard" className="px-5 py-2.5 bg-nova-500 hover:bg-nova-600 text-black rounded-2xl font-semibold text-sm">🚀 Перейти к панели</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
