import { Card } from '@/components/ui/card';

/**
 * Заглушка для страниц дашборда, привязанных к конкретному серверу
 * (commands, moderation, ranking, ai). Показывается, пока пользователь
 * не выбрал реальный сервер через ServerSwitcher — без этого сохранять
 * настройки некуда (backend вернёт 404 "Сервер не найден").
 */
export function NoServerSelected({ title }: { title?: string }) {
  return (
    <div className="p-8 max-w-2xl">
      {title && <h1 className="text-3xl font-bold text-[rgb(var(--text))] mb-6">{title}</h1>}
      <Card className="p-10 text-center">
        <div className="text-5xl mb-4">🌐</div>
        <h3 className="text-lg font-semibold text-[rgb(var(--text))] mb-2">Сервер не выбран</h3>
        <p className="text-[rgb(var(--text-secondary))] text-sm">
          Выберите сервер в разделе{' '}
          <a href="/dashboard/servers" className="text-primary hover:underline">
            «Серверы»
          </a>
          , чтобы настроить эту страницу.
        </p>
      </Card>
    </div>
  );
}
