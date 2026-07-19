'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthProvider';
import { api } from '@/lib/api';

const ERROR_MESSAGES: Record<string, string> = {
  vk_denied: 'Вы отменили вход через ВКонтакте',
  invalid_state: 'Ошибка безопасности. Попробуйте ещё раз',
  no_verifier: 'Ошибка сессии. Попробуйте ещё раз',
  token_failed: 'Не удалось получить токен от ВКонтакте',
  token_exception: 'Ошибка сети. Попробуйте позже',
};

function LoginContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const error = params.get('error');
  const verified = params.get('verified') === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [vkLoading, setVkLoading] = useState(false);

  async function handleVkLogin() {
    setVkLoading(true);
    try {
      const { url } = await api.auth.getVkUrl();
      window.location.href = url;
    } catch {
      setVkLoading(false);
      router.push('/login?error=vk_denied');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);
    if (!res.ok) {
      setFormError(res.error || 'Не удалось войти');
      return;
    }
    router.push('/dashboard/servers');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))]">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">✨</div>
          <h1 className="text-3xl font-bold text-white">Nova Bot</h1>
          <p className="text-[rgb(var(--text-secondary))] mt-1 text-sm">
            Управляйте своими серверами
          </p>
        </div>

        <div className="bg-[rgb(var(--surface))] border border-[rgb(var(--border))] rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white text-center mb-2">
            Войти в Dashboard
          </h2>
          <p className="text-[rgb(var(--text-secondary))] text-sm text-center mb-6">
            Выберите способ входа
          </p>

          {verified && (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm text-center">
              ✅ Email подтверждён, теперь можно войти
            </div>
          )}

          {error && ERROR_MESSAGES[error] && (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
              ⚠️ {ERROR_MESSAGES[error]}
            </div>
          )}

          <button
            type="button"
            onClick={handleVkLogin}
            disabled={vkLoading}
            className="flex items-center justify-center gap-3 w-full py-3.5 px-6 rounded-2xl font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
            style={{ backgroundColor: '#0077FF' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14C20.67 22 22 20.67 22 15.07V8.93C22 3.33 20.67 2 15.07 2zm3.29 13.17h-1.5c-.57 0-.74-.45-1.76-1.48-.89-.86-1.28-.97-1.5-.97-.3 0-.39.09-.39.51v1.35c0 .36-.11.58-1.07.58-1.57 0-3.32-.95-4.55-2.73C5.7 10.45 5.1 8.42 5.1 8.01c0-.22.09-.42.51-.42h1.5c.38 0 .52.17.67.58.74 2.13 1.97 4 2.47 4s.58-.24.58-1.61V8.79c-.06-1.16-.68-1.25-.68-1.66 0-.2.16-.4.42-.4h2.37c.32 0 .43.17.43.54v2.96c0 .32.14.43.22.43.21 0 .38-.11.77-.51 1.19-1.34 2.04-3.4 2.04-3.4.11-.22.3-.43.68-.43h1.5c.45 0 .55.23.45.54-.19.88-2.04 3.49-2.04 3.49-.16.27-.22.38 0 .68.16.22.68.68 1.03 1.09.64.74 1.13 1.36 1.26 1.78.12.42-.09.63-.51.63z" />
            </svg>
            {vkLoading ? 'Переходим в VK...' : 'Войти через ВКонтакте'}
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[rgb(var(--border))]" />
            <span className="text-xs text-[rgb(var(--text-secondary))]">или по e-mail</span>
            <div className="flex-1 h-px bg-[rgb(var(--border))]" />
          </div>

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
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] text-white placeholder:text-[rgb(var(--text-secondary))] outline-none focus:border-primary transition-colors"
            />

            {formError && (
              <div className="px-4 py-2.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div className="flex items-center justify-between mt-4 text-sm">
            <Link href="/forgot-password" className="text-[rgb(var(--text-secondary))] hover:text-white transition-colors">
              Забыли пароль?
            </Link>
            <Link href="/register" className="text-primary hover:opacity-80 transition-opacity font-medium">
              Регистрация
            </Link>
          </div>

          <p className="text-[rgb(var(--text-secondary))] text-xs text-center mt-4">
            Входя, вы соглашаетесь с условиями использования Nova Bot
          </p>
        </div>

        <p className="text-center text-[rgb(var(--text-secondary))] text-xs mt-6">
          Nova Bot © 2024 · Все права защищены
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))]">
          <div className="text-white text-xl">⚙️ Загрузка...</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}