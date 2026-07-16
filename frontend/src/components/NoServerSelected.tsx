import Link from 'next/link';
import { Card } from '@/components/ui/card';

interface NoServerSelectedProps {
  title?: string;          // legacy, для обратной совместимости
  heading?: string;
  description?: string;
  link?: string;
  linkText?: string;
}

/**
 * Заглушка для страниц дашборда, привязанных к конкретному серверу
 * (commands, moderation, ranking, ai). Показывается, пока пользователь
 * не выбрал реальный сервер через ServerSwitcher — без этого сохранять
 * настройки некуда (backend вернёт 404 "Сервер не найден").
 */
export function NoServerSelected({
  title,
  heading = title || 'Сервер не выбран',
  description = 'Выберите сервер в разделе «Серверы», чтобы настроить эту страницу.',
  link = '/dashboard/servers',
  linkText = 'Перейти к серверам',
}: NoServerSelectedProps) {
  return (
    <div className="p-8 max-w-2xl">
      {title && <h1 className="text-3xl font-bold text-[rgb(var(--text))] mb-6">{title}</h1>}
      <Card className="p-10 text-center">
        <div className="text-5xl mb-4">🌐</div>
        <h3 className="text-lg font-semibold text-[rgb(var(--text))] mb-2">{heading}</h3>
        <p className="text-[rgb(var(--text-secondary))] text-sm mb-6">
          {description}
        </p>
        <Link
          href={link}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transition-all active:scale-95"
        >
          <span>{linkText}</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </Card>
    </div>
  );
}