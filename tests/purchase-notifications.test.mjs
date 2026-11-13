import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

import {
  sanitizeFirstName,
  sanitizePublicPurchases,
  recordHotmartPurchase,
  revokeHotmartPurchase,
  readConfirmedPurchases,
  timingSafeStringEqual,
} from '../api/_lib/purchases-store.mjs';
import { GET as recentPurchasesGet } from '../api/recent-purchases.mjs';
import { POST as hotmartWebhookPost } from '../api/webhook/hotmart.mjs';

const require = createRequire(import.meta.url);
const notifications = require('../purchase-notifications.js');

function createMockElement(initial = {}) {
  const listeners = new Map();
  const classes = new Set(initial.classes || []);
  const styles = new Map();
  let rect = initial.rect || { top: 0, bottom: 0, height: 0, width: 0 };

  return {
    hidden: Boolean(initial.hidden),
    textContent: initial.textContent || '',
    offsetHeight: initial.offsetHeight ?? rect.height ?? 62,
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
    },
    style: {
      setProperty: (k, v) => styles.set(k, v),
      getPropertyValue: (k) => styles.get(k) || '',
    },
    getBoundingClientRect: () => rect,
    setRect: (nextRect) => {
      rect = nextRect;
    },
    addEventListener: (type, fn) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener: (type, fn) => {
      if (listeners.has(type)) listeners.get(type).delete(fn);
    },
    dispatch: (type) => {
      if (!listeners.has(type)) return;
      for (const fn of listeners.get(type)) fn({ type });
    },
    querySelector: (selector) => {
      if (selector === '[data-purchase-toast-message]') return initial.messageEl || null;
      if (selector === '[data-purchase-toast-meta]') return initial.metaEl || null;
      if (selector === '[data-purchase-toast-close]') return initial.closeBtn || null;
      return null;
    },
  };
}

function createFakeDom({ innerWidth = 1280, innerHeight = 800, stickyVisible = false, stickyHeight = 72, heroRect = null } = {}) {
  const messageEl = createMockElement();
  const metaEl = createMockElement();
  const closeBtn = createMockElement();
  const toast = createMockElement({
    hidden: true,
    offsetHeight: 62,
    messageEl,
    metaEl,
    closeBtn,
  });
  const stickyCta = createMockElement({
    classes: stickyVisible ? ['sticky-cta', 'is-visible'] : ['sticky-cta'],
    rect: { top: innerHeight - stickyHeight, bottom: innerHeight, height: stickyHeight, width: innerWidth },
  });
  const heroBtn = createMockElement({
    rect: heroRect || { top: 400, bottom: 458, height: 58, width: 320 },
  });

  const winListeners = new Map();
  const win = {
    innerWidth,
    innerHeight,
    matchMedia: () => ({ matches: false }),
    getComputedStyle: (el) => ({
      display: el === stickyCta && innerWidth >= 1000 ? 'none' : 'flex',
    }),
    addEventListener: (type, fn) => {
      if (!winListeners.has(type)) winListeners.set(type, new Set());
      winListeners.get(type).add(fn);
    },
    removeEventListener: (type, fn) => {
      if (winListeners.has(type)) winListeners.get(type).delete(fn);
    },
  };

  const doc = {
    defaultView: win,
    documentElement: { clientWidth: innerWidth, clientHeight: innerHeight },
    querySelector: (sel) => {
      if (sel === '[data-purchase-toast]') return toast;
      if (sel === '[data-sticky-cta]') return stickyCta;
      if (sel === '[data-scroll-offer]') return heroBtn;
      return null;
    },
  };

  return { doc, win, toast, messageEl, metaEl, closeBtn, stickyCta, heroBtn };
}

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

async function flushMicrotasks() {
  for (let i = 0; i < 8; i += 1) {
    await Promise.resolve();
  }
}

function createRedisMockFetch() {
  const store = new Map();
  return {
    store,
    fetchImpl: async (_url, init) => {
      const [cmd, key, val] = JSON.parse(init.body);
      if (cmd === 'GET') {
        return new Response(JSON.stringify({ result: store.get(key) ?? null }), { status: 200 });
      }
      if (cmd === 'SET') {
        store.set(key, val);
        return new Response(JSON.stringify({ result: 'OK' }), { status: 200 });
      }
      return new Response('Unsupported', { status: 400 });
    },
  };
}

test('backend store strips unauthorized names, rejects non-approved items, and allows authorized first name', async () => {
  const { fetchImpl } = createRedisMockFetch();
  const env = {
    UPSTASH_REDIS_REST_URL: 'https://redis.example.test',
    UPSTASH_REDIS_REST_TOKEN: 'secret-token',
  };
  const nowMs = Date.UTC(2026, 10, 13, 21, 0, 0);

  // Compra sem autorização explícita -> nome NUNCA é guardado nem exibido
  await recordHotmartPurchase(
    {
      event: 'PURCHASE_APPROVED',
      data: {
        buyer: { name: 'Ana Catarina Lopes', email: 'ana@example.com' },
        purchase: { transaction: 'HP100001', approved_date: nowMs - 60_000 },
      },
    },
    { env, fetchImpl, nowMs }
  );

  // Compra COM autorização explícita -> guarda apenas primeiro nome
  await recordHotmartPurchase(
    {
      event: 'PURCHASE_COMPLETE',
      data: {
        buyer: { name: 'margarida santos', email: 'margarida@example.com', public_name_consent: true },
        purchase: { transaction: 'HP100002', approved_date: nowMs - 30_000 },
      },
    },
    { env, fetchImpl, nowMs }
  );

  const list = await readConfirmedPurchases({ env, fetchImpl, nowMs });
  assert.equal(list.length, 2);
  assert.equal(list[0].firstName, 'Margarida');
  assert.equal(list[0].nameAuthorized, true);
  assert.equal(list[1].firstName, null);
  assert.equal(list[1].nameAuthorized, false);

  // Revogação por reembolso remove a compra do feed público
  await revokeHotmartPurchase('HP100002', { env, fetchImpl, nowMs });
  const afterRefund = await readConfirmedPurchases({ env, fetchImpl, nowMs });
  assert.equal(afterRefund.length, 1);
  assert.equal(afterRefund[0].nameAuthorized, false);
});

test('backend sanitizers reject emails, invalid dates, and non-approved statuses', () => {
  assert.equal(sanitizeFirstName('margarida@gmail.com'), null);
  assert.equal(sanitizeFirstName('12345'), null);
  assert.equal(sanitizeFirstName('  joão silva '), 'João');
  assert.equal(timingSafeStringEqual('abc', 'abc'), true);
  assert.equal(timingSafeStringEqual('abc', 'abcd'), false);

  const nowMs = Date.UTC(2026, 10, 13, 21, 0, 0);
  const sanitized = sanitizePublicPurchases(
    [
      { id: '1', status: 'pending', confirmedAt: new Date(nowMs).toISOString() },
      { id: '2', status: 'approved', confirmedAt: 'not-a-date' },
      { id: '3', status: 'approved', confirmedAt: new Date(nowMs + 10 * 60_000).toISOString() },
      { id: '4', status: 'approved', confirmedAt: new Date(nowMs - 20_000).toISOString(), nameAuthorized: false, firstName: 'Pedro' },
    ],
    nowMs
  );
  assert.equal(sanitized.length, 1);
  assert.equal(sanitized[0].id, '4');
  assert.equal(sanitized[0].firstName, null);
});

test('/api/recent-purchases fails safe with empty array when no storage env is configured', async () => {
  const response = await recentPurchasesGet();
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body, { ok: true, purchases: [] });
});

test('/api/webhook/hotmart rejects unconfigured or invalid hottok requests', async () => {
  const prevHottok = process.env.HOTMART_HOTTOK;
  try {
    delete process.env.HOTMART_HOTTOK;
    const res503 = await hotmartWebhookPost(new Request('https://example.test/api/webhook/hotmart', { method: 'POST', body: '{}' }));
    assert.equal(res503.status, 503);

    process.env.HOTMART_HOTTOK = 'super-secret-hottok';
    const res401 = await hotmartWebhookPost(
      new Request('https://example.test/api/webhook/hotmart', {
        method: 'POST',
        headers: { 'x-hotmart-hottok': 'wrong' },
        body: '{}',
      })
    );
    assert.equal(res401.status, 401);
  } finally {
    if (prevHottok === undefined) delete process.env.HOTMART_HOTTOK;
    else process.env.HOTMART_HOTTOK = prevHottok;
  }
});

test('notification copy uses authorized first name or default and restricts "agora" to recent minutes', () => {
  const nowMs = Date.UTC(2026, 10, 13, 21, 0, 0);

  const authorizedRecent = notifications.formatNotificationCopy(
    { id: 'tx1', confirmedAtMs: nowMs - 2 * 60_000, nameAuthorized: true, firstName: 'Margarida' },
    nowMs
  );
  assert.equal(authorizedRecent.message, 'Margarida comprou o guia Panetones que Rendem');
  assert.match(authorizedRecent.meta, /\bagora$/);

  const defaultRecent = notifications.formatNotificationCopy(
    { id: 'tx2', confirmedAtMs: nowMs - 4 * 60_000, nameAuthorized: false, firstName: 'Inês' },
    nowMs
  );
  assert.equal(defaultRecent.message, 'Nova compra confirmada');
  assert.doesNotMatch(defaultRecent.message, /Inês/);
  assert.match(defaultRecent.meta, /\bagora$/);

  const olderPurchase = notifications.formatNotificationCopy(
    { id: 'tx3', confirmedAtMs: nowMs - 15 * 60_000, nameAuthorized: false, firstName: null },
    nowMs
  );
  assert.equal(olderPurchase.message, 'Nova compra confirmada');
  assert.equal(olderPurchase.meta, 'Panetones que Rendem • há 15 min');
  assert.doesNotMatch(olderPurchase.meta, /agora/);
});

test('empty purchase feed keeps component hidden without timers or errors', async () => {
  const dom = createFakeDom();
  const storage = createMemoryStorage();

  const controller = notifications.initPurchaseNotifications({
    document: dom.doc,
    storage,
    fetchPurchases: async () => [],
  });

  await Promise.resolve();
  await Promise.resolve();
  assert.equal(dom.toast.hidden, true);
  assert.equal(dom.toast.classList.contains('is-visible'), false);
  assert.equal(controller.getState().shownCount, 0);
  controller.destroy();
});

test('enforces 1s entry delay, 4s visibility, 60-90s interval, max 3/session, and no duplicate purchases', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  t.mock.timers.setTime(Date.UTC(2026, 10, 13, 21, 0, 0));

  const dom = createFakeDom();
  const storage = createMemoryStorage();
  const baseNow = Date.now();

  const controller = notifications.initPurchaseNotifications({
    document: dom.doc,
    storage,
    now: () => Date.now(),
    random: () => 0.5, // 60000 + floor(0.5 * 30001) = 75000ms (75s)
    requestAnimationFrame: (cb) => cb(),
    fetchPurchases: async () => [
      { id: 'tx-1', status: 'approved', confirmedAt: new Date(baseNow - 30_000).toISOString(), nameAuthorized: true, firstName: 'Margarida' },
      { id: 'tx-2', status: 'approved', confirmedAt: new Date(baseNow - 90_000).toISOString(), nameAuthorized: false, firstName: 'Rita' },
      { id: 'tx-3', status: 'approved', confirmedAt: new Date(baseNow - 10 * 60_000).toISOString(), nameAuthorized: true, firstName: 'Joana' },
      { id: 'tx-4', status: 'approved', confirmedAt: new Date(baseNow - 20 * 60_000).toISOString(), nameAuthorized: false },
    ],
  });

  // Aguarda promise da fetch
  await flushMicrotasks();

  // Antes de 1s: oculto
  t.mock.timers.tick(999);
  assert.equal(dom.toast.hidden, true);

  // A 1s: mostra #1 (Margarida)
  t.mock.timers.tick(1);
  assert.equal(dom.toast.hidden, false);
  assert.equal(dom.toast.classList.contains('is-visible'), true);
  assert.equal(dom.messageEl.textContent, 'Margarida comprou o guia Panetones que Rendem');
  assert.match(dom.metaEl.textContent, /agora$/);

  // Visível durante 4s
  t.mock.timers.tick(3999);
  assert.equal(dom.toast.classList.contains('is-visible'), true);
  t.mock.timers.tick(1);
  assert.equal(dom.toast.classList.contains('is-visible'), false);
  t.mock.timers.tick(220);
  assert.equal(dom.toast.hidden, true);

  // Aguarda intervalo aleatório (75s neste teste dentro de 60..90s)
  t.mock.timers.tick(74999);
  assert.equal(dom.toast.hidden, true);
  t.mock.timers.tick(1);
  assert.equal(dom.toast.hidden, false);
  assert.equal(dom.messageEl.textContent, 'Nova compra confirmada');

  // Visível 4s + saída 220ms -> mostra #3 após 75s
  t.mock.timers.tick(4000);
  t.mock.timers.tick(220);
  assert.equal(dom.toast.hidden, true);
  t.mock.timers.tick(75000);
  assert.equal(dom.toast.hidden, false);
  assert.equal(dom.messageEl.textContent, 'Joana comprou o guia Panetones que Rendem');
  assert.doesNotMatch(dom.metaEl.textContent, /agora/);

  // Fecha #3 após 4s -> NÃO pode haver 4ª notificação na mesma sessão
  t.mock.timers.tick(4000);
  t.mock.timers.tick(220);
  assert.equal(dom.toast.hidden, true);
  t.mock.timers.tick(120_000);
  assert.equal(dom.toast.hidden, true);
  assert.equal(controller.getState().shownCount, 3);
  assert.deepEqual(controller.getState().shownIds, ['tx-1', 'tx-2', 'tx-3']);
  controller.destroy();

  // Simula recarregamento na mesma sessão: não volta a exibir
  const domReload = createFakeDom();
  const controllerReload = notifications.initPurchaseNotifications({
    document: domReload.doc,
    storage,
    now: () => Date.now(),
    fetchPurchases: async () => [
      { id: 'tx-4', status: 'approved', confirmedAt: new Date(baseNow - 20_000).toISOString(), nameAuthorized: false },
    ],
  });
  await Promise.resolve();
  t.mock.timers.tick(10_000);
  assert.equal(domReload.toast.hidden, true);
  controllerReload.destroy();
});

test('does not repeat the same purchase when fewer than 3 unique purchases exist', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  t.mock.timers.setTime(Date.UTC(2026, 10, 13, 21, 0, 0));

  const dom = createFakeDom();
  const storage = createMemoryStorage();
  const baseNow = Date.now();

  const controller = notifications.initPurchaseNotifications({
    document: dom.doc,
    storage,
    now: () => Date.now(),
    random: () => 0,
    requestAnimationFrame: (cb) => cb(),
    fetchPurchases: async () => [
      { id: 'only-1', status: 'approved', confirmedAt: new Date(baseNow - 10_000).toISOString(), nameAuthorized: false },
    ],
  });

  await flushMicrotasks();
  t.mock.timers.tick(1000);
  assert.equal(dom.toast.hidden, false);

  t.mock.timers.tick(4000);
  t.mock.timers.tick(220);
  t.mock.timers.tick(120_000);
  assert.equal(dom.toast.hidden, true);
  assert.equal(controller.getState().shownCount, 1);
  controller.destroy();
});

test('closing via ✕ stops notifications immediately for the rest of the session', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  t.mock.timers.setTime(Date.UTC(2026, 10, 13, 21, 0, 0));

  const dom = createFakeDom();
  const storage = createMemoryStorage();
  const baseNow = Date.now();

  const controller = notifications.initPurchaseNotifications({
    document: dom.doc,
    storage,
    now: () => Date.now(),
    random: () => 0,
    requestAnimationFrame: (cb) => cb(),
    fetchPurchases: async () => [
      { id: 'tx-a', status: 'approved', confirmedAt: new Date(baseNow - 10_000).toISOString(), nameAuthorized: false },
      { id: 'tx-b', status: 'approved', confirmedAt: new Date(baseNow - 20_000).toISOString(), nameAuthorized: true, firstName: 'Sofia' },
    ],
  });

  await flushMicrotasks();
  t.mock.timers.tick(1000);
  assert.equal(dom.toast.hidden, false);

  dom.closeBtn.dispatch('click');
  assert.equal(dom.toast.hidden, true);
  assert.equal(dom.toast.classList.contains('is-visible'), false);
  assert.equal(controller.getState().dismissed, true);

  t.mock.timers.tick(180_000);
  assert.equal(dom.toast.hidden, true);
  assert.equal(controller.getState().shownCount, 1);
  controller.destroy();
});

test('computeNextDelayMs always stays within 60s to 90s bounds', () => {
  assert.equal(notifications.computeNextDelayMs(60000, 90000, () => 0), 60000);
  assert.equal(notifications.computeNextDelayMs(60000, 90000, () => 0.999999), 90000);
  assert.equal(notifications.computeNextDelayMs(60000, 90000, () => 0.5), 75000);
});

test('syncPosition keeps toast in bottom-left on desktop and above sticky buy button on mobile', () => {
  const desktopDom = createFakeDom({ innerWidth: 1280, innerHeight: 800 });
  const desktopCtrl = notifications.initPurchaseNotifications({
    document: desktopDom.doc,
    storage: createMemoryStorage(),
    fetchPurchases: async () => [],
  });
  desktopCtrl.syncPosition();
  assert.equal(desktopDom.toast.style.getPropertyValue('--purchase-toast-bottom'), '20px');
  desktopCtrl.destroy();

  const mobileDom = createFakeDom({ innerWidth: 390, innerHeight: 844, stickyVisible: true, stickyHeight: 74 });
  const mobileCtrl = notifications.initPurchaseNotifications({
    document: mobileDom.doc,
    storage: createMemoryStorage(),
    fetchPurchases: async () => [],
  });
  mobileCtrl.syncPosition();
  assert.equal(mobileDom.toast.style.getPropertyValue('--purchase-toast-bottom'), '84px');
  mobileCtrl.destroy();
});
