import { saveKvBuyer, timingSafeStringEqual } from '../../server/authCore.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const expectedHottok = process.env.HOTMART_HOTTOK || '';
  if (!expectedHottok) {
    return res.status(503).json({
      error: 'Webhook Hotmart ainda não configurado (HOTMART_HOTTOK ausente nas variáveis de ambiente).',
    });
  }

  const incomingHottok = String(req.headers['x-hotmart-hottok'] || '');
  if (!incomingHottok || !timingSafeStringEqual(incomingHottok, expectedHottok)) {
    return res.status(401).json({ error: 'Hottok inválido.' });
  }

  const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const event = String(payload.event || '').toUpperCase();
  const buyerEmail = String(payload?.data?.buyer?.email || '').trim().toLowerCase();
  const buyerName = String(payload?.data?.buyer?.name || '').trim();
  const transaction = String(payload?.data?.purchase?.transaction || '').trim();

  if (!buyerEmail) {
    return res.status(400).json({ error: 'Payload sem e-mail de comprador.' });
  }

  const activateEvents = new Set(['PURCHASE_APPROVED', 'PURCHASE_COMPLETE']);
  const revokeEvents = new Set(['PURCHASE_REFUNDED', 'PURCHASE_CANCELED', 'PURCHASE_CHARGEBACK']);

  if (activateEvents.has(event) || revokeEvents.has(event)) {
    const status = activateEvents.has(event) ? 'active' : 'revoked';
    const saved = await saveKvBuyer(buyerEmail, {
      status,
      transaction,
      name: buyerName,
      updatedAt: new Date().toISOString(),
    });
    return res.status(200).json({
      received: true,
      event,
      buyerEmail,
      status,
      persistedToKv: saved,
    });
  }

  return res.status(200).json({ received: true, ignoredEvent: event });
}
