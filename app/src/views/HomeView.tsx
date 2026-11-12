import {
  BookOpen,
  Calculator,
  CalendarDays,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  Download,
  FolderHeart,
  MenuSquare,
  ShoppingBasket,
  Smartphone,
  Upload,
} from 'lucide-react';
import type { ProtectedContentPayload } from '../types/content';
import { formatEur } from '../utils/scaling';
import type { WorkspacePersistedState } from '../utils/storage';
import { HollyDecoration } from '../components/IconsAndTimers';

export type AppTab =
  | 'home'
  | 'recipes'
  | 'calculator'
  | 'orders'
  | 'shopping'
  | 'calendar'
  | 'catalog'
  | 'bonus';

export function HomeView({
  content,
  workspace,
  canInstallPwa,
  onInstallPwa,
  onNavigate,
  onToggleStartupItem,
  onToggleModuleDone,
  onExportBackup,
  onImportBackup,
}: {
  content: ProtectedContentPayload;
  workspace: WorkspacePersistedState;
  canInstallPwa: boolean;
  onInstallPwa: () => void;
  onNavigate: (tab: AppTab, extra?: { recipeId?: number; moduleId?: string }) => void;
  onToggleStartupItem: (idx: number) => void;
  onToggleModuleDone: (id: string) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
}) {
  const activeOrders = workspace.orders.filter((o) => o.status !== 'cancelada');
  const confirmedTotal = activeOrders.reduce((s, o) => s + o.totalEur, 0);
  const receivedDeposits = activeOrders.reduce((s, o) => s + (o.depositPaid ? o.depositEur : 0), 0);
  const totalUnitsOrdered = activeOrders.reduce(
    (s, o) => s + o.items.reduce((acc, i) => acc + i.quantity, 0),
    0
  );

  const moduleProgressPct = Math.round(
    (workspace.completedModules.length / Math.max(1, content.modules.length)) * 100
  );

  const shortcuts: { tab: AppTab; title: string; desc: string; icon: React.ReactNode }[] = [
    { tab: 'recipes', title: '30 Receitas & Escala', desc: 'Pesquisar e ajustar unidades', icon: <ChefHat size={18} /> },
    { tab: 'recipes', title: 'Modo Cozinha', desc: 'Passo a passo c/ temporizador', icon: <CheckCircle2 size={18} /> },
    { tab: 'calculator', title: 'Calculadora (€)', desc: 'Custos, mão de obra e margem', icon: <Calculator size={18} /> },
    { tab: 'orders', title: 'Encomendas', desc: 'Sinais MB WAY e entregas', icon: <ClipboardList size={18} /> },
    { tab: 'shopping', title: 'Lista de Compras', desc: 'Automática dos pedidos + 10/30/50', icon: <ShoppingBasket size={18} /> },
    { tab: 'calendar', title: 'Calendário', desc: 'Preparo, forno e entregas', icon: <CalendarDays size={18} /> },
    { tab: 'catalog', title: 'Catálogo de Natal', desc: 'Menu em PNG e WhatsApp', icon: <MenuSquare size={18} /> },
    { tab: 'bonus', title: 'Bónus & PDFs', desc: 'Downloads, scripts e fornecedores', icon: <FolderHeart size={18} /> },
    { tab: 'bonus', title: 'Guias & 6 Módulos', desc: 'Método Encomenda Primeiro', icon: <BookOpen size={18} /> },
    { tab: 'bonus', title: 'Fornecedores PT', desc: '17 lojas verificadas em Portugal', icon: <Download size={18} /> },
  ];

  return (
    <div>
      <section className="hero-banner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div>
            <div className="badge badge-gold" style={{ marginBottom: 8 }}>
              <HollyDecoration size={15} /> Natal 2026 · Método Encomenda Primeiro
            </div>
            <h1>Painel da Sua Cozinha de Natal</h1>
            <p>
              Organize receitas, calcule margens reais em euros e controle encomendas com sinal de 50 % por MB WAY antes de ir às compras.
            </p>
          </div>
        </div>
        {canInstallPwa && (
          <div style={{ marginTop: 12 }}>
            <button className="btn btn-primary btn-sm" onClick={onInstallPwa}>
              <Smartphone size={15} /> Instalar App no Telemóvel (Acesso Offline)
            </button>
          </div>
        )}
      </section>

      {content.isDemoMode && (
        <div className="notice notice-warn" role="status" style={{ marginBottom: 14 }}>
          <strong>Versão de Demonstração QA ativa:</strong> tem acesso a {content.recipes.length} receitas de amostra e a todas as ferramentas interativas (Modo Cozinha, Escalonamento, Calculadora €, Encomendas, Compras, Calendário e Catálogo PNG). As 30 receitas integrais, 6 módulos e 24 descargas protegidas desbloqueiam exclusivamente na sessão de comprador.
        </div>
      )}

      {/* Real Orders & Progress KPIs (never fake sample revenue) */}
      <div className="kpi-grid">
        <div className="kpi-tile">
          <div className="kpi-label">Progresso no Guia</div>
          <div className="kpi-value tabular">{moduleProgressPct}%</div>
          <small style={{ color: 'var(--muted)' }}>
            {workspace.completedModules.length}/{content.modules.length} módulos concluídos
          </small>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Encomendas Ativas</div>
          <div className="kpi-value tabular">{activeOrders.length}</div>
          <small style={{ color: 'var(--muted)' }}>{totalUnitsOrdered} unidades encomendadas</small>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Faturação Registada</div>
          <div className="kpi-value tabular">{formatEur(confirmedTotal)}</div>
          <small style={{ color: 'var(--muted)' }}>Base real dos seus pedidos</small>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Sinais MB WAY</div>
          <div className="kpi-value green tabular">{formatEur(receivedDeposits)}</div>
          <small style={{ color: 'var(--muted)' }}>Recebido em adiantamentos</small>
        </div>
      </div>

      {/* 10 Shortcuts */}
      <div className="section-header">
        <h2>Atalhos Rápidos</h2>
      </div>
      <div className="shortcut-grid">
        {shortcuts.map((s, idx) => (
          <button
            key={idx}
            type="button"
            className="shortcut-card"
            onClick={() => onNavigate(s.tab)}
          >
            <span className="shortcut-icon">{s.icon}</span>
            <span className="shortcut-title">{s.title}</span>
            <span className="shortcut-desc">{s.desc}</span>
          </button>
        ))}
      </div>

      <div className="grid-2">
        {/* Recomendações Comece Aqui */}
        <div className="card card-gold-top">
          <div className="section-header">
            <h2>Recomendações para Começar</h2>
            <span className="badge badge-wine">Primeiros 15 min</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 0 }}>
            Siga esta sequência prática antes de aceitar o primeiro pedido pago:
          </p>
          {content.sevenDaysPlan.slice(0, 4).map((d, i) => {
            const done = workspace.completedStartupItems.includes(i);
            return (
              <label key={i} className={`check-item ${done ? 'done' : ''}`}>
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => onToggleStartupItem(i)}
                />
                <span>
                  <strong>{d.day} · {d.focus}:</strong> {d.actions}
                </span>
              </label>
            );
          })}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <button className="btn btn-sm btn-primary" onClick={() => onNavigate('recipes', { recipeId: 1 })}>
              Começar pela Receita 01
            </button>
            <button className="btn btn-sm btn-outline" onClick={() => onNavigate('bonus')}>
              Ver Plano 7 Dias Completo
            </button>
          </div>
        </div>

        {/* Progresso dos 6 Módulos */}
        <div className="card card-wine-top">
          <div className="section-header">
            <h2>Progresso nos 6 Módulos</h2>
            <span className="badge badge-green">{workspace.completedModules.length}/6</span>
          </div>
          {content.modules.map((mod) => {
            const done = workspace.completedModules.includes(mod.id);
            return (
              <div
                key={mod.id}
                className={`check-item ${done ? 'done' : ''}`}
                style={{ justifyContent: 'space-between', alignItems: 'center' }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1 }}>
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => onToggleModuleDone(mod.id)}
                  />
                  <span>
                    <strong>{mod.title}</strong>
                  </span>
                </label>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => onNavigate('bonus', { moduleId: mod.id })}
                >
                  Ler
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cópia de Segurança e Instalação PWA */}
      <div className="card">
        <div className="section-header">
          <h2>Cópia de Segurança & Acesso Offline (PWA)</h2>
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 0 }}>
          Os seus pedidos, receitas favoritas e catálogo ficam guardados neste dispositivo. Exporte regularmente uma cópia de segurança JSON caso troque de telemóvel.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-sm btn-wine" onClick={onExportBackup}>
            <Download size={15} /> Descarregar Cópia JSON
          </button>
          <label className="btn btn-sm btn-outline" style={{ margin: 0 }}>
            <Upload size={15} /> Restaurar Cópia JSON
            <input
              type="file"
              accept="application/json,.json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportBackup(file);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        {!canInstallPwa && (
          <div className="notice" style={{ marginTop: 12, marginBottom: 0 }}>
            <strong>Dica para instalar no iPhone/Android:</strong> abra o menu do navegador (Partilhar no Safari ou ⋮ no Chrome) e toque em <strong>&ldquo;Adicionar ao ecrã principal&rdquo;</strong> para abrir em ecrã inteiro na cozinha.
          </div>
        )}
      </div>
    </div>
  );
}
