import { NextRequest, NextResponse } from 'next/server';
import { generateCodeVerifier, generateCodeChallenge, generateState } from '@/lib/pkce';

export const dynamic = 'force-dynamic';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);
  const state = generateState();

  const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;

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

  response.cookies.set('vk_code_verifier', verifier, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 900,
    path: '/',
  });
  response.cookies.set('vk_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 900,
    path: '/',
  });

  return response;
}
