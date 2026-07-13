'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthProvider';

export default function RegisterPage() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ emailSent: boolean } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Пароль должен быть не короче 8 символов');
      return;
    }
    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }

    setSubmitting(true);
    const res = await register(email, password);
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error || 'Не удалось зарегистрироваться');
      return;
    }
    setDone({ emailSent: !!res.emailSent });
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))]">
        <div className="w-full max-w-sm mx-4">
          <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-3xl p-8 shadow-2xl text-center">
            <div className="text-5xl mb-4">📬</div>
            <h1 className="text-xl font-semibold text-white mb-2">Проверьте почту</h1>
            <p className="text-[rgb(var(--text-secondary))] text-sm leading-relaxed">
              {done.emailSent ? (
                <>
                  Мы отправили письмо на <span className="text-white">{email}</span>. Перейдите по ссылке в письме, чтобы
                  подтвердить аккаунт (проверьте и папку «Спам»).
                </>
              ) : (
                'Аккаунт создан, но письмо отправить не удалось. Попробуйте войти позже.'
              )}
            </p>
            <Link href="/login" className="inline-block mt-6 text-primary hover:opacity-80 transition-opacity font-medium">
              Вернуться ко входу
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))]">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">✨</div>
          <h1 className="text-3xl font-bold text-white">Nova Bot</h1>
          <p className="text-[rgb(var(--text-secondary))] mt-1 text-sm">Создайте аккаунт</p>
        </div>

        <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white text-center mb-6">Регистрация по e-mail</h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] text-white placeholder:text-[rgb(var(--text-secondary))] outline-none focus:border-primary transition-colors"
            />
            <input
              type="password"
              required
              placeholder="Пароль (минимум 8 символов)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] text-white placeholder:text-[rgb(var(--text-secondary))] outline-none focus:border-primary transition-colors"
            />
            <input
              type="password"
              required
              placeholder="Повторите пароль"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] text-white placeholder:text-[rgb(var(--text-secondary))] outline-none focus:border-primary transition-colors"
            />

            {error && (
              <div className="px-4 py-2.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? 'Создание аккаунта...' : 'Зарегистрироваться'}
            </button>
          </form>

          <p className="text-center text-sm mt-5">
            <span className="text-[rgb(var(--text-secondary))]">Уже есть аккаунт? </span>
            <Link href="/login" className="text-primary hover:opacity-80 transition-opacity font-medium">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}