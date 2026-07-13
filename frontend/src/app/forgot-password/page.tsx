'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.auth.forgotPassword({ email });
      setSent(true);
    } catch (e) {
      setError((e as Error).message || 'Что-то пошло не так');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))]">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔑</div>
          <h1 className="text-3xl font-bold text-white">Nova Bot</h1>
          <p className="text-[rgb(var(--text-secondary))] mt-1 text-sm">Восстановление пароля</p>
        </div>

        <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-3xl p-8 shadow-2xl">
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-3">📬</div>
              <h2 className="text-lg font-semibold text-white mb-2">Проверьте почту</h2>
              <p className="text-[rgb(var(--text-secondary))] text-sm leading-relaxed">
                Если аккаунт с таким email существует, мы отправили на него ссылку для сброса пароля. Ссылка действительна 1
                час.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-white text-center mb-2">Забыли пароль?</h2>
              <p className="text-[rgb(var(--text-secondary))] text-sm text-center mb-6">
                Укажите email — пришлём ссылку для сброса пароля
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  {submitting ? 'Отправка...' : 'Отправить ссылку'}
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