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
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" shapeRendering="geometricPrecision">
              <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1.01-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.6v1.575c0 .422-.135.675-1.253.675-1.845 0-3.896-1.118-5.335-3.202C4.624 10.857 3.92 8.46 3.92 7.98c0-.254.102-.491.6-.491h1.744c.44 0 .61.203.78.677.865 2.42 2.328 4.66 2.916 4.66.22 0 .322-.102.322-.66V9.98c-.068-1.35-.762-1.46-.762-1.943 0-.235.203-.472.53-.472h2.744c.372 0 .508.203.508.643v3.462c0 .372.169.508.271.508.22 0 .406-.136.813-.542 1.253-1.409 2.14-3.578 2.14-3.578.135-.254.373-.491.813-.491h1.744c.525 0 .644.271.525.643-.22 1.032-2.397 4.096-2.397 4.096-.186.305-.254.44 0 .78.186.254.813.796 1.203 1.253.746.847 1.324 1.575 1.485 2.05.15.475-.086.712-.61.712z" />
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