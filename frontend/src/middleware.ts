import { NextResponse } from 'next/server';

// Гейт по nova_session-куке убран вместе со старым VK-флоу на фронте.
// Авторизация теперь строится на Bearer JWT в localStorage, который
// недоступен в edge middleware — проверка перенесена в
// app/dashboard/layout.tsx (клиентский редирект через useAuth()).
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};