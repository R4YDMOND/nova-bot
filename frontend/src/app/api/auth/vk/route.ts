import { NextRequest, NextResponse } from 'next/server';
import { generateCodeVerifier, generateCodeChallenge, generateState } from '@/lib/pkce';

export async function GET(request: NextRequest) {
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);
  const state = generateState();

  // Определяем базовый URL из запроса (работает и на Vercel, и локально)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    || `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  const params = new URLSearchParams({
    client_id:              process.env.VK_CLIENT_ID || '54666725',
    redirect_uri:           `${baseUrl}/api/auth/vk/callback`,
    response_type:          'code',
    scope:                  'vkid.personal_info email',
    state,
    code_challenge:         challenge,
    code_challenge_method:  'S256',
  });

  const vkAuthUrl = `https://id.vk.com/oauth2/auth?${params.toString()}`;

  const response = NextResponse.redirect(vkAuthUrl);

  // Сохраняем verifier и state в httpOnly-куках (10 минут)
  response.cookies.set('vk_code_verifier', verifier, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  response.cookies.set('vk_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}
