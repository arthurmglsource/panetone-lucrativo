import { Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { BuyerSession } from '../types/content';
import { HollyDecoration } from './IconsAndTimers';

export function AuthGate({
  previewAllowed,
  onAuthenticated,
}: {
  previewAllowed: boolean;
  onAuthenticated: (session: BuyerSession) => void;
}) {
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBuyerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ mode: 'buyer', email, accessCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Não foi possível validar o acesso.');
        return;
      }
      onAuthenticated({
        authenticated: true,
        mode: data.mode,
        email: data.email,
        buyerName: data.buyerName,
      });
    } catch {
      setError('Sem ligação ao servidor de autenticação. Verifique a sua internet.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewEnter = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ mode: 'preview' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Pré-visualização não autorizada neste servidor.');
        return;
      }
      onAuthenticated({
        authenticated: true,
        mode: 'preview',
        email: data.email,
        buyerName: data.buyerName,
      });
    } catch {
      setError('Falha ao iniciar pré-visualização.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/icons/logo-brand.png" alt="Panetones que Rendem" className="auth-logo" />
          <div className="auth-pill">
            <HollyDecoration size={16} />
            Área Protegida · Edição Portugal
          </div>
          <h1 style={{ margin: '6px 0 4px', fontSize: 22, color: 'var(--wine-deep)' }}>
            Acesso para Compradores
          </h1>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--muted)' }}>
            As 30 receitas, calculadora em euros, caderno de encomendas e bónus são entregues exclusivamente após verificação no servidor.
          </p>
        </div>

        {error && (
          <div className="notice notice-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleBuyerSubmit}>
          <div className="field">
            <label htmlFor="buyer-email">E-mail utilizado na compra</label>
            <input
              id="buyer-email"
              type="email"
              required
              autoComplete="email"
              placeholder="nome@exemplo.pt"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="buyer-code">Código da Transação Hotmart ou Código de Acesso</label>
            <input
              id="buyer-code"
              type="text"
              required
              placeholder="Ex.: HP1234567890"
              className="input"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            <Lock size={16} />
            {loading ? 'A validar acesso...' : 'Entrar na Aplicação'}
          </button>
        </form>

        {previewAllowed && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
              <strong>Modo Demonstração QA (Amostra Segura):</strong> testa todas as ferramentas interativas com 2 receitas de amostra, sem expor as restantes 28 receitas nem os 24 downloads pagos.
            </div>
            <button
              type="button"
              className="btn btn-wine btn-block"
              disabled={loading}
              onClick={handlePreviewEnter}
            >
              <Sparkles size={16} /> Entrar em Demonstração QA (Segura)
            </button>
          </div>
        )}

        <div style={{ marginTop: 14, fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'flex-start', gap: 7 }}>
          <ShieldCheck size={16} style={{ flexShrink: 0, color: 'var(--green)', marginTop: 1 }} />
          <span>
            Nenhuma credencial Hotmart reside no navegador. A validação ocorre via cookie assinado (HttpOnly) nos endpoints protegidos do servidor.
          </span>
        </div>
      </div>
    </div>
  );
}
