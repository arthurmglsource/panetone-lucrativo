import {
  recordHotmartPurchase,
  revokeHotmartPurchase,
  timingSafeStringEqual,
} from '../_lib/purchases-store.mjs';

const CONFIRMED_EVENTS = new Set(['PURCHASE_APPROVED', 'PURCHASE_COMPLETE']);
const REVOKED_EVENTS = new Set(['PURCHASE_REFUNDED', 'PURCHASE_CANCELED', 'PURCHASE_CHARGEBACK']);

export async function POST(request) {
  const expectedHottok = process.env.HOTMART_HOTTOK || '';
  if (!expectedHottok) {
    return Response.json(
      { error: 'Webhook Hotmart não configurado (HOTMART_HOTTOK em falta).' },
      { status: 503 }
    );
  }

  const incomingHottok = request.headers.get('x-hotmart-hottok') || '';
  if (!incomingHottok || !timingSafeStringEqual(incomingHottok, expectedHottok)) {
    return Response.json({ error: 'Hottok inválido.' }, { status: 401 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    console.error('[hotmart-webhook] invalid JSON payload:', error);
    return Response.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const event = String(payload?.event || '').toUpperCase();
  const transaction = String(payload?.data?.purchase?.transaction || '').trim();

  if (CONFIRMED_EVENTS.has(event)) {
    try {
      const result = await recordHotmartPurchase(payload);
      if (!result.saved && result.reason === 'missing_transaction') {
        return Response.json({ error: 'Transação em falta no payload.' }, { status: 400 });
      }
      return Response.json({
        received: true,
        event,
        persisted: result.saved,
        nameAuthorized: Boolean(result.record?.nameAuthorized),
      });
    } catch (error) {
      console.error('[hotmart-webhook] failed to record confirmed purchase:', error);
      return Response.json({ error: 'Erro ao guardar compra confirmada.' }, { status: 500 });
    }
  }

  if (REVOKED_EVENTS.has(event)) {
    try {
      const result = await revokeHotmartPurchase(transaction);
      return Response.json({ received: true, event, ...result });
    } catch (error) {
      console.error('[hotmart-webhook] failed to revoke purchase:', error);
      return Response.json({ error: 'Erro ao revogar compra.' }, { status: 500 });
    }
  }

  return Response.json({ received: true, ignoredEvent: event });
}

