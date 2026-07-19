'use client';
import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';

function CallbackContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { loginWithTokens } = useAuth();

  useEffect(() => {
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const name = params.get('name') || undefined;
    const avatar = params.get('avatar') || undefined;

    if (!accessToken || !refreshToken) {
      router.replace('/login?error=vk_token_missing');
      return;
    }

    loginWithTokens(accessToken, refreshToken, { id: 0, name, avatar });
    router.replace('/dashboard/servers');
  }, [params, router, loginWithTokens]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))]">
      <div className="text-white text-xl">⚙️ Входим...</div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))]">
          <div className="text-white text-xl">⚙️ Загрузка...</div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}