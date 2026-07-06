import crypto from 'crypto';

/** Генерирует code_verifier (случайная строка base64url) */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/** Генерирует code_challenge = base64url(sha256(verifier)) */
export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

/** Генерирует случайный state */
export function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}
