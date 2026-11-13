(function (root) {
  'use strict';

  var DEFAULTS = {
    endpoint: '/api/recent-purchases',
    storageKey: 'pqr:purchase-notifications:session:v1',
    initialDelayMs: 1000,
    visibleDurationMs: 4000,
    minGapMs: 60000,
    maxGapMs: 90000,
    maxPerSession: 3,
    recentNowMaxAgeMs: 5 * 60 * 1000,
    futureSkewToleranceMs: 60 * 1000,
    exitTransitionMs: 220,
    mobileGapPx: 10,
  };

  function sanitizeFirstName(rawName) {
    if (typeof rawName !== 'string') return null;
    var trimmed = rawName.trim().replace(/\s+/g, ' ');
    if (!trimmed || trimmed.indexOf('@') !== -1) return null;
    var first = trimmed.split(' ')[0].replace(/^[^\p{L}]+|[^\p{L}-]+$/gu, '');
    if (first.length < 2 || first.length > 24) return null;
    if (!/^[\p{L}][\p{L}'’-]*$/u.test(first)) return null;
    return first.charAt(0).toUpperCase() + first.slice(1);
  }

  function parsePurchase(item, nowMs, futureSkewToleranceMs) {
    if (!item || typeof item !== 'object') return null;
    var id = typeof item.id === 'string' ? item.id.trim() : '';
    if (!id) return null;
    if (item.status && item.status !== 'approved') return null;

    var confirmedAtMs = typeof item.confirmedAt === 'number' ? item.confirmedAt : Date.parse(item.confirmedAt);
    if (!Number.isFinite(confirmedAtMs) || confirmedAtMs <= 0) return null;
    if (confirmedAtMs > nowMs + (futureSkewToleranceMs || DEFAULTS.futureSkewToleranceMs)) return null;

    var nameAuthorized = item.nameAuthorized === true;
    var firstName = nameAuthorized ? sanitizeFirstName(item.firstName) : null;

    return {
      id: id,
      confirmedAtMs: Math.min(confirmedAtMs, nowMs),
      nameAuthorized: Boolean(nameAuthorized && firstName),
      firstName: firstName,
    };
  }

  function normalizePurchases(rawList, nowMs, futureSkewToleranceMs) {
    if (!Array.isArray(rawList)) return [];
    var seen = new Set();
    var valid = [];

    for (var i = 0; i < rawList.length; i += 1) {
      var parsed = parsePurchase(rawList[i], nowMs, futureSkewToleranceMs);
      if (!parsed || seen.has(parsed.id)) continue;
      seen.add(parsed.id);
      valid.push(parsed);
    }

    valid.sort(function (a, b) {
      return b.confirmedAtMs - a.confirmedAtMs;
    });
    return valid;
  }

  function formatPurchaseTimeLabel(confirmedAtMs, nowMs, recentNowMaxAgeMs) {
    var cutoff = typeof recentNowMaxAgeMs === 'number' ? recentNowMaxAgeMs : DEFAULTS.recentNowMaxAgeMs;
    var ageMs = Math.max(0, nowMs - confirmedAtMs);
    if (ageMs <= cutoff) {
      return 'agora';
    }
    if (ageMs < 60 * 60 * 1000) {
      var mins = Math.max(1, Math.floor(ageMs / 60000));
      return 'há ' + mins + ' min';
    }
    if (ageMs < 24 * 60 * 60 * 1000) {
      var hours = Math.floor(ageMs / 3600000);
      return 'há ' + hours + (hours === 1 ? ' hora' : ' horas');
    }
    var days = Math.floor(ageMs / 86400000);
    return 'há ' + days + (days === 1 ? ' dia' : ' dias');
  }

  function formatNotificationCopy(purchase, nowMs, recentNowMaxAgeMs) {
    var hasAuthorizedName = Boolean(purchase && purchase.nameAuthorized && purchase.firstName);
    var message = hasAuthorizedName
      ? purchase.firstName + ' comprou o guia Panetones que Rendem'
      : 'Nova compra confirmada';
    var timeLabel = formatPurchaseTimeLabel(purchase.confirmedAtMs, nowMs, recentNowMaxAgeMs);
    var prefix = hasAuthorizedName ? 'Compra confirmada' : 'Panetones que Rendem';

    return {
      message: message,
      meta: prefix + ' • ' + timeLabel,
    };
  }

  function computeNextDelayMs(minGapMs, maxGapMs, randomFn) {
    var min = Number.isFinite(minGapMs) ? minGapMs : DEFAULTS.minGapMs;
    var max = Number.isFinite(maxGapMs) ? maxGapMs : DEFAULTS.maxGapMs;
    var rand = typeof randomFn === 'function' ? randomFn() : Math.random();
    var clamped = Math.min(0.999999999, Math.max(0, Number.isFinite(rand) ? rand : 0));
    return min + Math.floor(clamped * (max - min + 1));
  }

  function createSessionStore(storage, storageKey) {
    var memoryFallback = { dismissed: false, shownCount: 0, shownIds: [] };

    function sanitize(raw) {
      if (!raw || typeof raw !== 'object') {
        return { dismissed: false, shownCount: 0, shownIds: [] };
      }
      var shownIds = Array.isArray(raw.shownIds)
        ? raw.shownIds.filter(function (id) {
            return typeof id === 'string' && id.trim().length > 0;
          })
        : [];
      var shownCount = Number.isFinite(raw.shownCount) && raw.shownCount >= 0 ? Math.floor(raw.shownCount) : shownIds.length;
      return {
        dismissed: Boolean(raw.dismissed),
        shownCount: Math.max(shownCount, shownIds.length),
        shownIds: shownIds,
      };
    }

    function read() {
      if (!storage) return sanitize(memoryFallback);
      try {
        var raw = storage.getItem(storageKey);
        if (!raw) return sanitize(memoryFallback);
        return sanitize(JSON.parse(raw));
      } catch (e) {
        return sanitize(memoryFallback);
      }
    }

    function write(state) {
      var clean = sanitize(state);
      memoryFallback = clean;
      if (!storage) return;
      try {
        storage.setItem(storageKey, JSON.stringify(clean));
      } catch (e) {
        /* Fallback já guardado em memória */
      }
    }

    return { read: read, write: write };
  }

  function defaultFetchPurchases(endpoint) {
    if (typeof fetch !== 'function') return Promise.resolve([]);
    return fetch(endpoint, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
      .then(function (response) {
        if (!response || !response.ok) return [];
        return response.json();
      })
      .then(function (data) {
        return data && Array.isArray(data.purchases) ? data.purchases : [];
      })
      .catch(function () {
        return [];
      });
  }

  function initPurchaseNotifications(options) {
    var cfg = Object.assign({}, DEFAULTS, options || {});
    var doc = cfg.document || (typeof document !== 'undefined' ? document : null);
    if (!doc) return null;

    var toast = doc.querySelector('[data-purchase-toast]');
    if (!toast) return null;

    var messageEl = toast.querySelector('[data-purchase-toast-message]');
    var metaEl = toast.querySelector('[data-purchase-toast-meta]');
    var closeBtn = toast.querySelector('[data-purchase-toast-close]');
    var stickyCta = doc.querySelector('[data-sticky-cta]');
    var heroButton = doc.querySelector('[data-scroll-offer]');

    var nowFn = typeof cfg.now === 'function' ? cfg.now : Date.now;
    var randomFn = typeof cfg.random === 'function' ? cfg.random : Math.random;
    var setTimer = typeof cfg.setTimeout === 'function' ? cfg.setTimeout : setTimeout;
    var clearTimer = typeof cfg.clearTimeout === 'function' ? cfg.clearTimeout : clearTimeout;
    var raf =
      typeof cfg.requestAnimationFrame === 'function'
        ? cfg.requestAnimationFrame
        : typeof requestAnimationFrame === 'function'
          ? requestAnimationFrame
          : function (cb) {
              return setTimer(cb, 0);
            };
    var fetchPurchases =
      typeof cfg.fetchPurchases === 'function'
        ? cfg.fetchPurchases
        : function () {
            return defaultFetchPurchases(cfg.endpoint);
          };

    var storageObj = cfg.storage !== undefined ? cfg.storage : typeof sessionStorage !== 'undefined' ? sessionStorage : null;
    var store = createSessionStore(storageObj, cfg.storageKey);
    var state = store.read();

    var purchases = [];
    var timers = { start: null, hide: null, exit: null, next: null };
    var destroyed = false;
    var stickyObserver = null;
    var resizeObserver = null;
    var onResizeHandler = null;
    var onScrollHandler = null;

    function clearAllTimers() {
      ['start', 'hide', 'exit', 'next'].forEach(function (key) {
        if (timers[key] !== null) {
          clearTimer(timers[key]);
          timers[key] = null;
        }
      });
    }

    function syncPosition() {
      var win = doc.defaultView || (typeof window !== 'undefined' ? window : null);
      if (!win) return;

      var viewportWidth = win.innerWidth || doc.documentElement.clientWidth || 1200;

      if (viewportWidth >= 1000) {
        toast.style.setProperty('--purchase-toast-bottom', '20px');
        return;
      }

      if (stickyCta && stickyCta.classList.contains('is-visible')) {
        var stickyStyle = win.getComputedStyle(stickyCta);
        if (stickyStyle.display !== 'none') {
          var stickyHeight = Math.ceil(stickyCta.getBoundingClientRect().height || 0);
          if (stickyHeight > 0) {
            toast.style.setProperty('--purchase-toast-bottom', stickyHeight + cfg.mobileGapPx + 'px');
            return;
          }
        }
      }

      toast.style.setProperty('--purchase-toast-bottom', '14px');
    }

    function wouldCoverHeroAction() {
      var win = doc.defaultView || (typeof window !== 'undefined' ? window : null);
      if (!win || !heroButton) return false;
      var viewportWidth = win.innerWidth || doc.documentElement.clientWidth || 1200;
      if (viewportWidth >= 1000) return false;
      if (stickyCta && stickyCta.classList.contains('is-visible')) return false;

      var viewportHeight = win.innerHeight || doc.documentElement.clientHeight || 800;
      var btnRect = heroButton.getBoundingClientRect();
      var estimatedHeight = toast.offsetHeight || 64;
      var toastTop = viewportHeight - 14 - estimatedHeight;
      var toastBottom = viewportHeight - 14;
      return btnRect.bottom > toastTop && btnRect.top < toastBottom;
    }

    var waitingForClearance = false;

    function pickNextPurchase() {
      for (var i = 0; i < purchases.length; i += 1) {
        if (state.shownIds.indexOf(purchases[i].id) === -1) {
          return purchases[i];
        }
      }
      return null;
    }

    function hideToastImmediately() {
      clearAllTimers();
      toast.classList.remove('is-visible');
      toast.hidden = true;
    }

    function dismissSession() {
      if (destroyed) return;
      state.dismissed = true;
      store.write(state);
      hideToastImmediately();
    }

    function scheduleNextCycle() {
      if (destroyed || state.dismissed || state.shownCount >= cfg.maxPerSession) return;
      if (!pickNextPurchase()) return;

      var waitMs = computeNextDelayMs(cfg.minGapMs, cfg.maxGapMs, randomFn);
      timers.next = setTimer(function () {
        timers.next = null;
        showNext();
      }, waitMs);
    }

    function hideAfterDuration() {
      timers.hide = null;
      if (destroyed) return;
      toast.classList.remove('is-visible');

      var win = doc.defaultView || (typeof window !== 'undefined' ? window : null);
      var reducedMotion =
        win && typeof win.matchMedia === 'function' && win.matchMedia('(prefers-reduced-motion: reduce)').matches;

      var finishHide = function () {
        timers.exit = null;
        if (!toast.classList.contains('is-visible')) {
          toast.hidden = true;
        }
        scheduleNextCycle();
      };

      if (reducedMotion || cfg.exitTransitionMs <= 0) {
        finishHide();
      } else {
        timers.exit = setTimer(finishHide, cfg.exitTransitionMs);
      }
    }

    function showNext() {
      if (destroyed || state.dismissed || state.shownCount >= cfg.maxPerSession) {
        hideToastImmediately();
        return;
      }

      var candidate = pickNextPurchase();
      if (!candidate) {
        hideToastImmediately();
        return;
      }

      if (wouldCoverHeroAction()) {
        waitingForClearance = true;
        return;
      }
      waitingForClearance = false;

      var copy = formatNotificationCopy(candidate, nowFn(), cfg.recentNowMaxAgeMs);
      if (messageEl) messageEl.textContent = copy.message;
      if (metaEl) metaEl.textContent = copy.meta;

      state.shownIds = state.shownIds.concat([candidate.id]);
      state.shownCount += 1;
      store.write(state);

      toast.hidden = false;
      syncPosition();

      raf(function () {
        if (destroyed || state.dismissed) return;
        syncPosition();
        toast.classList.add('is-visible');
      });

      timers.hide = setTimer(hideAfterDuration, cfg.visibleDurationMs);
    }

    function onCloseClick() {
      dismissSession();
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', onCloseClick);
    }

    var win = doc.defaultView || (typeof window !== 'undefined' ? window : null);
    if (win) {
      onResizeHandler = function () {
        if (!toast.hidden) syncPosition();
        if (waitingForClearance && !wouldCoverHeroAction()) {
          waitingForClearance = false;
          showNext();
        }
      };
      onScrollHandler = function () {
        if (!toast.hidden) syncPosition();
        if (waitingForClearance && !wouldCoverHeroAction()) {
          waitingForClearance = false;
          showNext();
        }
      };
      win.addEventListener('resize', onResizeHandler, { passive: true });
      win.addEventListener('scroll', onScrollHandler, { passive: true });

      if (stickyCta && typeof win.MutationObserver === 'function') {
        stickyObserver = new win.MutationObserver(function () {
          if (!toast.hidden) syncPosition();
          if (waitingForClearance && !wouldCoverHeroAction()) {
            waitingForClearance = false;
            showNext();
          }
        });
        stickyObserver.observe(stickyCta, { attributes: true, attributeFilter: ['class'] });
      }
      if (stickyCta && typeof win.ResizeObserver === 'function') {
        resizeObserver = new win.ResizeObserver(function () {
          if (!toast.hidden) syncPosition();
        });
        resizeObserver.observe(stickyCta);
      }
    }

    function destroy() {
      destroyed = true;
      clearAllTimers();
      if (closeBtn) closeBtn.removeEventListener('click', onCloseClick);
      if (win && onResizeHandler) win.removeEventListener('resize', onResizeHandler);
      if (win && onScrollHandler) win.removeEventListener('scroll', onScrollHandler);
      if (stickyObserver) stickyObserver.disconnect();
      if (resizeObserver) resizeObserver.disconnect();
    }

    /* Garantia inicial: começa sempre oculto até haver compras reais confirmadas */
    toast.classList.remove('is-visible');
    toast.hidden = true;

    if (state.dismissed || state.shownCount >= cfg.maxPerSession) {
      return { destroy: destroy, getState: function () { return store.read(); } };
    }

    var entryAtMs = nowFn();

    Promise.resolve()
      .then(fetchPurchases)
      .then(function (rawPurchases) {
        if (destroyed || state.dismissed || state.shownCount >= cfg.maxPerSession) return;
        purchases = normalizePurchases(rawPurchases, nowFn(), cfg.futureSkewToleranceMs);
        if (!pickNextPurchase()) {
          hideToastImmediately();
          return;
        }
        var elapsed = Math.max(0, nowFn() - entryAtMs);
        var waitForInitial = Math.max(0, cfg.initialDelayMs - elapsed);
        timers.start = setTimer(function () {
          timers.start = null;
          showNext();
        }, waitForInitial);
      });

    return {
      destroy: destroy,
      syncPosition: syncPosition,
      getState: function () {
        return store.read();
      },
    };
  }

  var exported = {
    DEFAULTS: DEFAULTS,
    sanitizeFirstName: sanitizeFirstName,
    normalizePurchases: normalizePurchases,
    formatPurchaseTimeLabel: formatPurchaseTimeLabel,
    formatNotificationCopy: formatNotificationCopy,
    computeNextDelayMs: computeNextDelayMs,
    initPurchaseNotifications: initPurchaseNotifications,
  };

  if (typeof module === 'object' && module.exports) {
    module.exports = exported;
  } else {
    root.PqrPurchaseNotifications = exported;
  }

  if (typeof document !== 'undefined' && typeof module === 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        initPurchaseNotifications();
      });
    } else {
      initPurchaseNotifications();
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);

