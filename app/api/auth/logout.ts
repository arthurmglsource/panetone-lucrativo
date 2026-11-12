import { makeLogoutCookieHeader } from '../../server/authCore.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  const isProd = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie', makeLogoutCookieHeader(isProd));
  return res.status(200).json({ ok: true });
}

