import {
  lookupKvBuyer,
  makeSessionCookieHeader,
  signSession,
  verifyConfiguredBuyerCode,
} from '../../server/authCore.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const isDev = process.env.NODE_ENV !== 'production';
  const isProd = !isDev;
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const mode = body.mode === 'preview' ? 'preview' : 'buyer';
  const email = String(body.email || '').trim().toLowerCase();
  const accessCode = String(body.accessCode || '').trim();

  if (mode === 'preview') {
    const previewAllowed = isDev || process.env.ALLOW_PREVIEW_MODE === 'true';
    if (!previewAllowed) {
      return res.status(403).json({
        error: 'O modo de pré-visualização encontra-se desativado neste ambiente. Entre com os dados de compra.',
      });
    }
    const token = signSession(
      {
        authenticated: true,
        mode: 'preview',
        email: 'previsualizacao@local',
        buyerName: 'Pré-visualização Autorizada',
        exp: Date.now() + 1000 * 60 * 60 * 24,
      },
      isDev
    );
    if (!token) {
      return res.status(503).json({
        error: 'Configuração de servidor incompleta: defina SESSION_SECRET nas variáveis de ambiente da Vercel.',
      });
    }
    res.setHeader('Set-Cookie', makeSessionCookieHeader(token, isProd, 60 * 60 * 24));
    return res.status(200).json({
      authenticated: true,
      mode: 'preview',
      email: 'previsualizacao@local',
      buyerName: 'Pré-visualização Autorizada',
    });
  }

  if (!email || !email.includes('@') || !accessCode) {
    return res.status(400).json({ error: 'Introduza o e-mail de compra e o código de transação/acesso.' });
  }

  let authorized = false;
  let buyerName = email.split('@')[0];

  // 1. Verificar registo Hotmart em KV (quando configurado no servidor)
  const kvRecord = await lookupKvBuyer(email);
  if (kvRecord && kvRecord.status === 'active') {
    if (!kvRecord.transaction || kvRecord.transaction.toUpperCase() === accessCode.toUpperCase()) {
      authorized = true;
      if (kvRecord.name) buyerName = kvRecord.name;
    }
  }

  // 2. Verificar lista de códigos/e-mails autorizados em variáveis de ambiente do servidor
  if (!authorized && verifyConfiguredBuyerCode(email, accessCode)) {
    authorized = true;
  }

  if (!authorized) {
    return res.status(401).json({
      error: 'E-mail ou código de acesso não validado. Confirme o número da transação Hotmart ou contacte o suporte.',
    });
  }

  const token = signSession(
    {
      authenticated: true,
      mode: 'buyer',
      email,
      buyerName,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 14,
    },
    isDev
  );

  if (!token) {
    return res.status(503).json({
      error: 'Servidor sem SESSION_SECRET configurado. Consulte INTEGRACAO_HOTMART_E_SEGURANCA.md.',
    });
  }

  res.setHeader('Set-Cookie', makeSessionCookieHeader(token, isProd));
  return res.status(200).json({
    authenticated: true,
    mode: 'buyer',
    email,
    buyerName,
  });
}

