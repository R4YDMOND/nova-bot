'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Book, Terminal } from 'lucide-react';

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

const SUPPORT_LINKS = [
  {
    icon: '🌐',
    title: 'Сообщество VK',
    desc: 'Новости, обновления и помощь от сообщества',
    href: 'https://vk.com/nova_bot_official',
    label: 'Перейти в VK',
  },
  {
    icon: '🛠️',
    title: 'Dev Server Lolka',
    desc: 'Помощь по интеграции платформы, обсуждение разработки',
    href: 'https://lolka.gg/gcAyrZ1cO',
    label: 'Открыть Lolka',
  },
  {
    icon: '💬',
    title: 'Чат поддержки MAX',
    desc: 'Быстрый контакт с командой',
    href: 'https://max.ru/join/Tx_efS7L_T4g04mUlq17pUrDLzveAPB4z43VU4zpakE',
    label: 'Написать в MAX',
  },
];

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<'guide' | 'api'>('guide');

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[rgb(var(--text))]">📚 Документация</h1>
        <p className="text-[rgb(var(--text-secondary))] mt-1">Всё что нужно для подключения и настройки Nova</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'guide' | 'api')}>
        <TabsList>
          <TabsTrigger value="guide" className="flex items-center gap-2">
            <Book className="w-4 h-4" />
            Руководство
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            Для разработчиков (API)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guide" className="space-y-6">
          <GuideContent />
        </TabsContent>

        <TabsContent value="api">
          <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-[rgb(var(--text))] mb-2 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary" />
              API Документация
            </h2>
            <p className="text-[rgb(var(--text-secondary))] text-sm mb-4">
              Интерактивная документация по REST API Nova Bot (Swagger UI). Можно пробовать запросы прямо здесь — кнопка &quot;Try it out&quot;.
            </p>
            <div className="rounded-xl overflow-hidden border border-[rgb(var(--border))] bg-white">
              <iframe
                src="https://nova-bot-rpsy.onrender.com/docs"
                className="w-full h-[75vh] min-h-[500px]"
                title="Nova Bot API Documentation"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>
            <p className="text-[rgb(var(--text-secondary))] text-xs mt-3">
              Если документация не загрузилась, откройте её напрямую:{' '}
              <a href="https://nova-bot-rpsy.onrender.com/docs" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
                nova-bot-rpsy.onrender.com/docs
              </a>
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GuideContent() {
  return (
    <>
      {/* Quick start */}
      <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-[rgb(var(--text))] mb-4">🚀 Быстрый старт</h2>
        <ol className="space-y-2 text-[rgb(var(--text-secondary))] leading-relaxed">
          <li>1. Перейдите на страницу <a href="/" className="text-cyan-400 hover:underline">авторизации</a></li>
          <li>2. Выберите способ входа: <strong className="text-[rgb(var(--text))]">VK</strong> или <strong className="text-[rgb(var(--text))]">Lolka</strong></li>
          <li>3. Подтвердите доступ к вашему серверу</li>
          <li>4. Настройте модули в <a href="/dashboard/servers" className="text-cyan-400 hover:underline">Центре управления</a></li>
          <li>5. Бот готов к работе! 🎉</li>
        </ol>
      </div>

      {/* Auth methods */}
      <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-[rgb(var(--text))] mb-4">🔐 Способы авторизации</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-xl p-4">
            <h3 className="text-[rgb(var(--text))] font-semibold mb-2">🎮 Lolka.app</h3>
            <p className="text-[rgb(var(--text-secondary))] text-sm mb-3">Авторизация через платформу Lolka. Поддерживаются вебхуки, OAuth2 (скоро).</p>
            <div className="bg-[rgb(var(--surface-2))] rounded-lg p-3 font-mono text-xs text-cyan-400">
              GET /oauth/lolka/callback<br/>
              Scopes: identify, servers, webhook
            </div>
          </div>
          <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-xl p-4">
            <h3 className="text-[rgb(var(--text))] font-semibold mb-2">🌐 ВКонтакте</h3>
            <p className="text-[rgb(var(--text-secondary))] text-sm mb-3">Вход через VK ID (OAuth 2.1 + PKCE). Поддерживается авторизация через сообщества и приложения.</p>
            <div className="bg-[rgb(var(--surface-2))] rounded-lg p-3 font-mono text-xs text-cyan-400">
              GET /api/auth/vk/callback<br/>
              Scopes: vkid.personal_info, email
            </div>
          </div>
        </div>
      </div>

      {/* Commands */}
      <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-[rgb(var(--text))] mb-4">⚡ Команды бота</h2>
        <div className="space-y-1">
          {COMMANDS.map((c, i) => (
            <div key={i} className={`flex gap-4 items-center py-2 ${i < COMMANDS.length - 1 ? 'border-b border-[rgb(var(--border))]' : ''}`}>
              <code className="bg-[rgb(var(--surface-2))] px-3 py-1 rounded-lg text-cyan-400 text-sm font-mono min-w-36 shrink-0">{c.cmd}</code>
              <span className="text-[rgb(var(--text-secondary))] text-sm">{c.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modules */}
      <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-[rgb(var(--text))] mb-4">🧩 Модули</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MODULES.map((m, i) => (
            <div key={i} className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-xl p-4">
              <div className="text-[rgb(var(--text))] font-semibold text-sm mb-1">{m.name}</div>
              <div className="text-[rgb(var(--text-secondary))] text-xs">{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* API */}
      <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-[rgb(var(--text))] mb-2">🔧 API</h2>
        <p className="text-[rgb(var(--text-secondary))] text-sm mb-4">
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
              <code className="text-[rgb(var(--text))] text-sm font-mono">{a.path}</code>
              <span className="text-[rgb(var(--text-secondary))] text-sm ml-auto">{a.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Support */}
      <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-[rgb(var(--text))] mb-1 text-center">🛟 Нужна помощь?</h2>
        <p className="text-[rgb(var(--text-secondary))] mb-6 text-center">Мы поможем решить вопросы по настройке и работе Nova Bot</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SUPPORT_LINKS.map((s, i) => (
            <a
              key={i}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center text-center bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-xl p-5 hover:border-cyan-400/40 hover:bg-[rgb(var(--surface-2))] transition-colors"
            >
              <span className="text-3xl mb-3">{s.icon}</span>
              <div className="text-[rgb(var(--text))] font-semibold mb-1">{s.title}</div>
              <div className="text-[rgb(var(--text-secondary))] text-xs mb-4">{s.desc}</div>
              <span className="mt-auto px-4 py-2 bg-cyan-400 text-black font-semibold rounded-xl text-sm">
                {s.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
