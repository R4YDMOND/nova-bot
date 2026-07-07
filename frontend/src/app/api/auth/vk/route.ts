import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const VK_CLIENT_ID = process.env.VK_CLIENT_ID || '54666725';

function getBaseUrl(req: NextRequest): string {
  // Приоритет: заголовки реального запроса > env-переменная > хардкод-фолбэк
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_APP_URL || 'https://nova-bot-4vmp.vercel.app';
}

function base64url(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function GET(req: NextRequest) {
  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/auth/vk/callback`;

  const state = base64url(crypto.randomBytes(16));
  const codeVerifier = base64url(crypto.randomBytes(32));
  const codeChallenge = base64url(crypto.createHash('sha256').update(codeVerifier).digest());

  const authUrl = new URL('https://id.vk.com/oauth2/auth');
  authUrl.searchParams.set('client_id', VK_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'vkid.personal_info email');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set('vk_oauth_state', state, {
    httpOnly: true, secure: true, sameSite: 'lax', maxAge: 900, path: '/',
  });
  response.cookies.set('vk_code_verifier', codeVerifier, {
    httpOnly: true, secure: true, sameSite: 'lax', maxAge: 900, path: '/',
  });
  return response;
}