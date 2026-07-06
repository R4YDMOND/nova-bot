import { NextRequest, NextResponse } from 'next/server';

const VK_CLIENT_ID = process.env.VK_CLIENT_ID || '54666725';

interface VKTokenResponse {
  access_token?: string;
  user_id?: number;
  error?: string;
  error_description?: string;
}

interface VKUser {
  id: number;
  first_name: string;
  last_name: string;
  photo_100?: string;
  screen_name?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    || `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  // Ошибка или отмена пользователем
  if (error || !code) {
    console.error('[VK OAuth] Error from VK:', error);
    return NextResponse.redirect(`${baseUrl}/login?error=vk_denied`);
  }

  // Проверяем state
  const storedState = request.cookies.get('vk_oauth_state')?.value;
  if (!storedState || state !== storedState) {
    console.error('[VK OAuth] State mismatch');
    return NextResponse.redirect(`${baseUrl}/login?error=invalid_state`);
  }

  // Читаем code_verifier
  const codeVerifier = request.cookies.get('vk_code_verifier')?.value;
  if (!codeVerifier) {
    console.error('[VK OAuth] No code_verifier in cookies');
    return NextResponse.redirect(`${baseUrl}/login?error=no_verifier`);
  }

  // Обмениваем code на access_token
  let tokenData: VKTokenResponse;
  try {
    const tokenRes = await fetch('https://id.vk.com/oauth2/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        code_verifier: codeVerifier,
        client_id:     VK_CLIENT_ID,
        redirect_uri:  `${baseUrl}/api/auth/vk/callback`,
      }),
    });

    tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error('[VK OAuth] Token exchange failed:', tokenData);
      return NextResponse.redirect(`${baseUrl}/login?error=token_failed`);
    }
  } catch (e) {
    console.error('[VK OAuth] Token exchange exception:', e);
    return NextResponse.redirect(`${baseUrl}/login?error=token_exception`);
  }

  const { access_token, user_id } = tokenData;

  // Получаем данные пользователя
  let user: VKUser | null = null;
  try {
    const userRes = await fetch(
      `https://api.vk.com/method/users.get?user_ids=${user_id}&access_token=${access_token}&v=5.199&fields=photo_100,screen_name`,
    );
    const userData = await userRes.json();
    user = userData.response?.[0] ?? null;
  } catch (e) {
    console.warn('[VK OAuth] Failed to fetch user info:', e);
  }

  // Формируем сессию
  const session = {
    userId:      user_id,
    name:        user ? `${user.first_name} ${user.last_name}` : `VK User ${user_id}`,
    avatar:      user?.photo_100 ?? '',
    screenName:  user?.screen_name ?? '',
    accessToken: access_token,
    loginAt:     Date.now(),
  };

  // Редиректим на дашборд, устанавливаем сессию
  const response = NextResponse.redirect(`${baseUrl}/dashboard`);

  response.cookies.set('nova_session', JSON.stringify(session), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7, // 7 дней
    path:     '/',
  });

  // Удаляем временные куки
  response.cookies.delete('vk_code_verifier');
  response.cookies.delete('vk_oauth_state');

  return response;
}
