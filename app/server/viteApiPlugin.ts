import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import {
  getMimeType,
  getSessionFromHeaders,
  lookupKvBuyer,
  makeLogoutCookieHeader,
  makeSessionCookieHeader,
  resolveAppPaths,
  signSession,
  verifyConfiguredBuyerCode,
} from './authCore.ts';

function readJsonBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk: Buffer) => {
      raw += chunk.toString('utf-8');
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function sendJson(res: any, status: number, obj: unknown, extraHeaders: Record<string, string> = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  for (const [k, v] of Object.entries(extraHeaders)) {
    res.setHeader(k, v);
  }
  res.end(JSON.stringify(obj));
}

export function pqrLocalApiPlugin(appRoot: string): Plugin {
  const { dataPath, downloadsDir } = resolveAppPaths(appRoot);

  const attachMiddleware = (middlewares: any, isDevServer: boolean) => {
    middlewares.use(async (req: any, res: any, next: any) => {
      const url = new URL(req.url || '/', 'http://localhost');
      if (!url.pathname.startsWith('/api/')) return next();

      const allowPreview = isDevServer || process.env.ALLOW_PREVIEW_MODE === 'true';
      const isProdCookie = process.env.NODE_ENV === 'production' && !isDevServer;

      if (url.pathname === '/api/auth/session' && req.method === 'GET') {
        const session = getSessionFromHeaders(req.headers, isDevServer || process.env.NODE_ENV !== 'production');
        if (!session) {
          return sendJson(res, 200, {
            authenticated: false,
            mode: 'anonymous',
            previewAllowed: allowPreview,
          });
        }
        return sendJson(res, 200, {
          authenticated: true,
          mode: session.mode,
          email: session.email,
          buyerName: session.buyerName,
          expiresAt: new Date(session.exp).toISOString(),
          previewAllowed: allowPreview,
        });
      }

      if (url.pathname === '/api/auth/login' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const mode = body.mode === 'preview' ? 'preview' : 'buyer';
        const email = String(body.email || '').trim().toLowerCase();
        const accessCode = String(body.accessCode || '').trim();

        if (mode === 'preview') {
          if (!allowPreview) {
            return sendJson(res, 403, { error: 'Pré-visualização desativada neste servidor.' });
          }
          const token = signSession(
            {
              authenticated: true,
              mode: 'preview',
              email: 'previsualizacao@local',
              buyerName: 'Pré-visualização Local',
              exp: Date.now() + 1000 * 60 * 60 * 24,
            },
            true
          );
          if (!token) return sendJson(res, 503, { error: 'SESSION_SECRET ausente.' });
          return sendJson(
            res,
            200,
            {
              authenticated: true,
              mode: 'preview',
              email: 'previsualizacao@local',
              buyerName: 'Pré-visualização Local',
            },
            { 'Set-Cookie': makeSessionCookieHeader(token, isProdCookie, 60 * 60 * 24) }
          );
        }

        if (!email || !email.includes('@') || !accessCode) {
          return sendJson(res, 400, { error: 'Introduza o e-mail de compra e o código de acesso.' });
        }

        let authorized = false;
        let buyerName = email.split('@')[0];
        const kv = await lookupKvBuyer(email);
        if (kv && kv.status === 'active' && (!kv.transaction || kv.transaction.toUpperCase() === accessCode.toUpperCase())) {
          authorized = true;
          if (kv.name) buyerName = kv.name;
        }
        if (!authorized && verifyConfiguredBuyerCode(email, accessCode)) {
          authorized = true;
        }
        if (!authorized) {
          return sendJson(res, 401, {
            error: 'E-mail ou código não validado. Em desenvolvimento local pode usar a Pré-visualização Local.',
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
          true
        );
        if (!token) return sendJson(res, 503, { error: 'SESSION_SECRET ausente.' });
        return sendJson(
          res,
          200,
          { authenticated: true, mode: 'buyer', email, buyerName },
          { 'Set-Cookie': makeSessionCookieHeader(token, isProdCookie) }
        );
      }

      if (url.pathname === '/api/auth/logout' && req.method === 'POST') {
        return sendJson(res, 200, { ok: true }, { 'Set-Cookie': makeLogoutCookieHeader(isProdCookie) });
      }

      if (url.pathname === '/api/content' && req.method === 'GET') {
        const session = getSessionFromHeaders(req.headers, true);
        if (!session) {
          return sendJson(res, 401, { error: 'Autenticação necessária.' });
        }
        if (!fs.existsSync(dataPath)) {
          return sendJson(res, 500, { error: 'Conteúdo não sincronizado.' });
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'private, no-store');
        return res.end(fs.readFileSync(dataPath, 'utf-8'));
      }

      if (url.pathname === '/api/download' && req.method === 'GET') {
        const session = getSessionFromHeaders(req.headers, true);
        if (!session) {
          return sendJson(res, 401, { error: 'Acesso negado.' });
        }
        const rawFile = url.searchParams.get('file') || '';
        const safeName = path.basename(rawFile);
        if (!safeName || safeName !== rawFile || safeName.includes('..')) {
          return sendJson(res, 400, { error: 'Ficheiro inválido.' });
        }
        const fullPath = path.join(downloadsDir, safeName);
        if (!fs.existsSync(fullPath)) {
          return sendJson(res, 404, { error: 'Ficheiro não encontrado.' });
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', getMimeType(safeName));
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
        res.setHeader('Cache-Control', 'private, no-store');
        return res.end(fs.readFileSync(fullPath));
      }

      return sendJson(res, 404, { error: 'Endpoint não encontrado.' });
    });
  };

  return {
    name: 'pqr-local-api',
    configureServer(server) {
      attachMiddleware(server.middlewares, true);
    },
    configurePreviewServer(server) {
      attachMiddleware(server.middlewares, true);
    },
  };
}
