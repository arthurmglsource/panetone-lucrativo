import { readConfirmedPurchases } from './_lib/purchases-store.mjs';

export async function GET() {
  try {
    const purchases = await readConfirmedPurchases();
    return Response.json(
      { ok: true, purchases },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('[recent-purchases] failed to read confirmed purchases:', error);
    return Response.json(
      { ok: false, purchases: [] },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }
}

