import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://nova-bot-rpsy.onrender.com';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
  }

  try {
    // Обмениваем code на токен через backend
    const res = await fetch(`${API_BASE}/api/auth/vk/callback?code=${code}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();

    if (!data.token) {
      return NextResponse.redirect(new URL('/?error=no_token', request.url));
    }

    // Сохраняем токен в cookie и редиректим в dashboard
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.set('nova_token', data.token, {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: '/',
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL('/?error=server_error', request.url));
  }
}
