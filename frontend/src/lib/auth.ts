// Источник Bearer-токена для apiFetch (см. использование в lib/api.ts).
// Токены кладёт AuthProvider при обычном email-логине и при возврате
// с backend VK OAuth (см. app/auth/callback/page.tsx).

const ACCESS_KEY = 'nova_access_token';

export function getAccessToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(ACCESS_KEY) || '';
}