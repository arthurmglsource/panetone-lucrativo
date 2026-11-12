import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface SessionPayload {
  authenticated: boolean;
  mode: 'buyer' | 'preview';
  email: string;
  buyerName: string;
  exp: number;
}

const COOKIE_NAME = 'pqr_session';
// Ephemeral secret generated once per local dev process when SESSION_SECRET is unset
const EPHEMERAL_DEV_SECRET = crypto.randomBytes(32).toString('hex');

export function resolveAppPaths(baseDir?: string) {
  const rootFallback = baseDir || process.cwd();
  const candidates = [
    rootFallback,
    path.resolve(rootFallback, '..'),
    path.resolve(rootFallback, '../..'),
    process.cwd(),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'protected-data', 'content.json'))) {
      return {
        dataPath: path.join(dir, 'protected-data', 'content.json'),
        demoDataPath: path.join(dir, 'protected-data', 'demo-content.json'),
        downloadsDir: path.join(dir, 'protected-downloads'),
      };
    }
  }
  return {
    dataPath: path.join(process.cwd(), 'protected-data', 'content.json'),
    demoDataPath: path.join(process.cwd(), 'protected-data', 'demo-content.json'),
    downloadsDir: path.join(process.cwd(), 'protected-downloads'),
  };
}

function getSigningSecret(isDev: boolean): string | null {
  const envSecret = process.env.SESSION_SECRET || process.env.AUTH_SECRET;
  if (envSecret && envSecret.length >= 16) return envSecret;
  if (isDev) return EPHEMERAL_DEV_SECRET;
  return null;
}

export function signSession(payload: SessionPayload, isDev: boolean): string | null {
  const secret = getSigningSecret(isDev);
  if (!secret) return null;
  const body = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifySessionToken(token: string | undefined, isDev: boolean): SessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const secret = getSigningSecret(isDev);
  if (!secret) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;

  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8')) as SessionPayload;
    if (!parsed.authenticated || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const out: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq > 0) {
      const k = part.slice(0, eq).trim();
      const v = part.slice(eq + 1).trim();
      out[k] = decodeURIComponent(v);
    }
  }
  return out;
}

export function makeSessionCookieHeader(token: string, isProd: boolean, maxAgeSec = 60 * 60 * 24 * 14): string {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSec}`,
  ];
  if (isProd) parts.push('Secure');
  return parts.join('; ');
}

export function makeLogoutCookieHeader(isProd: boolean): string {
  const parts = [`${COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (isProd) parts.push('Secure');
  return parts.join('; ');
}

export function getSessionFromHeaders(headers: { cookie?: string }, isDev: boolean): SessionPayload | null {
  const cookies = parseCookies(headers.cookie);
  return verifySessionToken(cookies[COOKIE_NAME], isDev);
}

export function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function lookupKvBuyer(email: string): Promise<{ status: string; transaction?: string; name?: string } | null> {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return null;

  try {
    const res = await fetch(`${kvUrl}/get/${encodeURIComponent(`pqr:buyer:${email.toLowerCase()}`)}`, {
      headers: { Authorization: `Bearer ${kvToken}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: string | null };
    if (!data.result) return null;
    return JSON.parse(data.result);
  } catch {
    return null;
  }
}

export async function saveKvBuyer(email: string, record: { status: string; transaction?: string; name?: string; updatedAt: string }) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return false;

  const res = await fetch(`${kvUrl}/set/${encodeURIComponent(`pqr:buyer:${email.toLowerCase()}`)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${kvToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(JSON.stringify(record)),
  });
  return res.ok;
}

export function verifyConfiguredBuyerCode(email: string, code: string): boolean {
  const normalizedCode = code.trim();
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedCode || !normalizedEmail.includes('@')) return false;

  const allowedEmails = (process.env.BUYER_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowedEmails.length > 0 && !allowedEmails.includes(normalizedEmail)) {
    return false;
  }

  const allowedCodes = [
    ...(process.env.BUYER_ACCESS_CODES || '').split(','),
    process.env.BUYER_MASTER_CODE || '',
  ]
    .map((c) => c.trim())
    .filter(Boolean);

  return allowedCodes.some((allowed) => timingSafeStringEqual(normalizedCode, allowed));
}

export function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.png') return 'image/png';
  if (ext === '.csv') return 'text/csv; charset=utf-8';
  if (ext === '.html') return 'text/html; charset=utf-8';
  return 'application/octet-stream';
}
