'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

function ResetPasswordContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = (params.get('token') || '').trim();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Ссылка недействительна — токен отсутствует');
      return;
    }
    if (password.length < 8) {
      setError('Пароль должен быть не короче 8 символов');
      return;
    }
    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }

    setSubmitting(true);
    try {
      await api.auth.resetPassword({ token, new_password: password });
      setDone(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (e) {
      setError((e as Error).message || 'Не удалось сбросить пароль');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))]">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔒</div>
          <h1 className="text-3xl font-bold text-white">Nova Bot</h1>
          <p className="text-[rgb(var(--text-secondary))] mt-1 text-sm">Новый пароль</p>
        </div>

        <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-3xl p-8 shadow-2xl">
          {done ? (
            <div className="text-center">
              <div className="text-4xl mb-3">✅</div>
              <h2 className="text-lg font-semibold text-white mb-2">Пароль изменён</h2>
              <p className="text-[rgb(var(--text-secondary))] text-sm">Сейчас перенаправим вас на страницу входа...</p>
            </div>
          ) : (
            <>
              {!token && (
                <div className="mb-4 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                  ⚠️ Ссылка недействительна. Запросите восстановление пароля заново.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="password"
                  required
                  placeholder="Новый пароль (минимум 8 символов)"
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
                  {submitting ? 'Сохранение...' : 'Сохранить новый пароль'}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-sm mt-5">
            <Link href="/login" className="text-[rgb(var(--text-secondary))] hover:text-white transition-colors">
              ← Вернуться ко входу
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))]">
          <div className="text-white text-xl">⚙️ Загрузка...</div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}