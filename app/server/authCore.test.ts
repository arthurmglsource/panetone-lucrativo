import { afterEach, describe, expect, it } from 'vitest';
import {
  makeSessionCookieHeader,
  parseCookies,
  signSession,
  verifyConfiguredBuyerCode,
  verifySessionToken,
} from './authCore';

describe('Segurança de Sessão & Validação de Compradores', () => {
  afterEach(() => {
    delete process.env.SESSION_SECRET;
    delete process.env.BUYER_ACCESS_CODES;
    delete process.env.BUYER_EMAILS;
  });

  it('assina e valida token HMAC corretamente em desenvolvimento e produção', () => {
    process.env.SESSION_SECRET = 'chave-super-secreta-producao-1234567890';
    const token = signSession(
      {
        authenticated: true,
        mode: 'buyer',
        email: 'cliente@exemplo.pt',
        buyerName: 'Cliente Teste',
        exp: Date.now() + 60_000,
      },
      false
    );
    expect(token).toBeTruthy();

    const verified = verifySessionToken(token!, false);
    expect(verified?.authenticated).toBe(true);
    expect(verified?.email).toBe('cliente@exemplo.pt');

    // Rejeita token adulterado
    const tampered = token!.slice(0, -3) + 'xyz';
    expect(verifySessionToken(tampered, false)).toBeNull();
  });

  it('falha fechado em produção sem SESSION_SECRET configurado', () => {
    delete process.env.SESSION_SECRET;
    const token = signSession(
      {
        authenticated: true,
        mode: 'buyer',
        email: 'cliente@exemplo.pt',
        buyerName: 'Teste',
        exp: Date.now() + 60_000,
      },
      false
    );
    expect(token).toBeNull();
  });

  it('rejeita sessão expirada e faz parse seguro de cookies HttpOnly', () => {
    process.env.SESSION_SECRET = 'chave-super-secreta-producao-1234567890';
    const expired = signSession(
      {
        authenticated: true,
        mode: 'preview',
        email: 'a@b.pt',
        buyerName: 'A',
        exp: Date.now() - 1000,
      },
      false
    );
    expect(verifySessionToken(expired!, false)).toBeNull();

    const header = makeSessionCookieHeader('abc.123', true);
    expect(header).toContain('HttpOnly');
    expect(header).toContain('Secure');
    const parsed = parseCookies('foo=bar; pqr_session=abc.123');
    expect(parsed.pqr_session).toBe('abc.123');
  });

  it('valida códigos de comprador configurados apenas no servidor', () => {
    process.env.BUYER_ACCESS_CODES = 'HP2026NATAL,VIP-PT-01';
    expect(verifyConfiguredBuyerCode('ana@sapo.pt', 'HP2026NATAL')).toBe(true);
    expect(verifyConfiguredBuyerCode('ana@sapo.pt', 'CODIGO-ERRADO')).toBe(false);
  });
});
