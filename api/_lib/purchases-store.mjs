import { createHash, timingSafeEqual } from 'node:crypto';

export const STORE_KEY = 'pqr:confirmed_purchases:v1';
export const MAX_STORED_PURCHASES = 30;
export const FUTURE_SKEW_MS = 60 * 1000;

export function getRedisConfig(env = process.env) {
  const url = String(env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL || '').replace(/\/+$/, '');
  const token = String(env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN || '');
  if (!url || !token) return null;
  return { url, token };
}

export function timingSafeStringEqual(a, b) {
  const hashA = createHash('sha256').update(String(a ?? '')).digest();
  const hashB = createHash('sha256').update(String(b ?? '')).digest();
  return timingSafeEqual(hashA, hashB);
}

export function hashTransactionId(transaction) {
  const clean = String(transaction || '').trim();
  if (!clean) return '';
  return createHash('sha256').update(clean).digest('hex').slice(0, 16);
}

export function sanitizeFirstName(rawName) {
  const normalized = String(rawName || '')
    .trim()
    .replace(/\s+/g, ' ');
  if (!normalized || normalized.includes('@')) return null;
  const firstToken = normalized.split(' ')[0].replace(/^[^\p{L}]+|[^\p{L}-]+$/gu, '');
  if (firstToken.length < 2 || firstToken.length > 24) return null;
  if (!/^[\p{L}][\p{L}'’-]*$/u.test(firstToken)) return null;
  return firstToken.charAt(0).toUpperCase() + firstToken.slice(1);
}

export function parseConfirmedTimestamp(rawValue, nowMs = Date.now()) {
  if (rawValue === null || rawValue === undefined || rawValue === '') return null;
  let ms;
  if (typeof rawValue === 'number') {
    ms = rawValue > 1e12 ? rawValue : rawValue * 1000;
  } else {
    const trimmed = String(rawValue).trim();
    if (/^\d{10,13}$/.test(trimmed)) {
      const n = Number(trimmed);
      ms = trimmed.length === 13 ? n : n * 1000;
    } else {
      ms = Date.parse(trimmed);
    }
  }
  if (!Number.isFinite(ms) || ms <= 0 || ms > nowMs + FUTURE_SKEW_MS) return null;
  return new Date(Math.min(ms, nowMs)).toISOString();
}

export function sanitizePublicPurchases(rawList, nowMs = Date.now()) {
  if (!Array.isArray(rawList)) return [];
  const seen = new Set();
  const cleaned = [];

  for (const item of rawList) {
    if (!item || typeof item !== 'object') continue;
    const id = typeof item.id === 'string' ? item.id.trim() : '';
    if (!id || seen.has(id)) continue;
    if (item.status !== 'approved') continue;

    const confirmedAt = parseConfirmedTimestamp(item.confirmedAt, nowMs);
    if (!confirmedAt) continue;

    const nameAuthorized = item.nameAuthorized === true;
    const firstName = nameAuthorized ? sanitizeFirstName(item.firstName) : null;

    seen.add(id);
    cleaned.push({
      id,
      status: 'approved',
      confirmedAt,
      nameAuthorized: Boolean(nameAuthorized && firstName),
      firstName,
      product: 'Panetones que Rendem',
    });
  }

  cleaned.sort((a, b) => Date.parse(b.confirmedAt) - Date.parse(a.confirmedAt));
  return cleaned.slice(0, MAX_STORED_PURCHASES);
}

async function redisRequest(config, commandParts, fetchImpl = fetch) {
  const response = await fetchImpl(config.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commandParts),
  });
  if (!response.ok) {
    throw new Error(`Redis REST HTTP ${response.status}`);
  }
  return response.json();
}

export async function readConfirmedPurchases({ env = process.env, fetchImpl = fetch, nowMs = Date.now() } = {}) {
  const config = getRedisConfig(env);
  if (!config) return [];

  const data = await redisRequest(config, ['GET', STORE_KEY], fetchImpl);
  if (!data || data.result == null) return [];

  const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
  return sanitizePublicPurchases(parsed, nowMs);
}

async function writeConfirmedPurchases(list, { env = process.env, fetchImpl = fetch } = {}) {
  const config = getRedisConfig(env);
  if (!config) return false;

  await redisRequest(config, ['SET', STORE_KEY, JSON.stringify(list.slice(0, MAX_STORED_PURCHASES))], fetchImpl);
  return true;
}

export async function recordHotmartPurchase(
  payload,
  {
    env = process.env,
    fetchImpl = fetch,
    nowMs = Date.now(),
    allowPublicFirstName = env.PUBLIC_FIRST_NAME_AUTHORIZED === 'true',
  } = {}
) {
  const purchaseData = payload?.data?.purchase || {};
  const buyerData = payload?.data?.buyer || {};
  const id = hashTransactionId(purchaseData.transaction);
  if (!id) {
    return { saved: false, reason: 'missing_transaction' };
  }

  const confirmedAt =
    parseConfirmedTimestamp(purchaseData.approved_date, nowMs) ||
    parseConfirmedTimestamp(purchaseData.order_date, nowMs) ||
    parseConfirmedTimestamp(payload?.creation_date, nowMs) ||
    new Date(nowMs).toISOString();

  const hasConsent =
    Boolean(allowPublicFirstName) ||
    buyerData.public_name_consent === true ||
    purchaseData.public_name_consent === true ||
    buyerData.name_authorized === true;

  const firstName = hasConsent ? sanitizeFirstName(buyerData.first_name || buyerData.name) : null;

  const record = {
    id,
    status: 'approved',
    confirmedAt,
    nameAuthorized: Boolean(hasConsent && firstName),
    firstName,
    product: 'Panetones que Rendem',
  };

  const existing = await readConfirmedPurchases({ env, fetchImpl, nowMs });
  const updated = [record, ...existing.filter((item) => item.id !== id)].slice(0, MAX_STORED_PURCHASES);
  const persisted = await writeConfirmedPurchases(updated, { env, fetchImpl });

  return { saved: persisted, record };
}

export async function revokeHotmartPurchase(transaction, { env = process.env, fetchImpl = fetch, nowMs = Date.now() } = {}) {
  const id = hashTransactionId(transaction);
  if (!id) return { revoked: false, reason: 'missing_transaction' };

  const existing = await readConfirmedPurchases({ env, fetchImpl, nowMs });
  const next = existing.filter((item) => item.id !== id);
  const persisted = await writeConfirmedPurchases(next, { env, fetchImpl });
  return { revoked: persisted, removed: next.length < existing.length };
}

