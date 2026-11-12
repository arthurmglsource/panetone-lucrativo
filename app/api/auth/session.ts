import { getSessionFromHeaders } from '../../server/authCore.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  const isDev = process.env.NODE_ENV !== 'production';
  const session = getSessionFromHeaders(req.headers, isDev);
  const previewAllowed = isDev || process.env.ALLOW_PREVIEW_MODE === 'true';

  if (!session) {
    return res.status(200).json({
      authenticated: false,
      mode: 'anonymous',
      previewAllowed,
    });
  }

  return res.status(200).json({
    authenticated: true,
    mode: session.mode,
    email: session.email,
    buyerName: session.buyerName,
    expiresAt: new Date(session.exp).toISOString(),
    previewAllowed,
  });
}
