import {
  BookOpen,
  Calculator,
  CalendarDays,
  ChefHat,
  ClipboardList,
  FolderHeart,
  Home,
  LogOut,
  MenuSquare,
  ShoppingBasket,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { AuthGate } from './components/AuthGate';
import {
  FloatingTimerTray,
  KitchenModeModal,
  playChimeTone,
  type KitchenTimer,
} from './components/IconsAndTimers';
import type {
  BuyerSession,
  Order,
  OrderStatus,
  ProtectedContentPayload,
  Recipe,
} from './types/content';
import { scaleIngredients } from './utils/scaling';
import {
  exportWorkspaceBackupJson,
  loadWorkspaceState,
  parseWorkspaceBackupJson,
  saveWorkspaceState,
  type WorkspacePersistedState,
} from './utils/storage';
import { CalculatorView } from './views/CalculatorView';
import { CalendarView, CatalogView, LibraryBonusView } from './views/CalendarCatalogLibraryViews';
import { HomeView, type AppTab } from './views/HomeView';
import { OrdersView, ShoppingListView } from './views/OrdersAndShoppingView';
import { RecipesView } from './views/RecipesView';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const OFFLINE_CONTENT_FALLBACK_KEY = 'pqr_authorized_content_cache_v1';

export default function App() {
  const [session, setSession] = useState<BuyerSession | null>(null);
  const [previewAllowed, setPreviewAllowed] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [content, setContent] = useState<ProtectedContentPayload | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentError, setContentError] = useState('');

  const [tab, setTab] = useState<AppTab>('home');
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [kitchenLaunch, setKitchenLaunch] = useState<{ recipe: Recipe; targetUnits: number } | null>(null);

  const [workspace, setWorkspace] = useState<WorkspacePersistedState>(() => loadWorkspaceState());
  const [timers, setTimers] = useState<KitchenTimer[]>([]);
  const [toast, setToast] = useState('');
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Persist workspace to localStorage
  useEffect(() => {
    saveWorkspaceState(workspace);
  }, [workspace]);

  // Capture PWA install prompt + register service worker
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Kitchen timer tick loop
  useEffect(() => {
    const hasRunning = timers.some((t) => t.running);
    if (!hasRunning) return;
    const id = window.setInterval(() => {
      setTimers((prev) =>
        prev.map((t) => {
          if (!t.running) return t;
          if (t.remainingSec <= 1) {
            playChimeTone();
            return { ...t, remainingSec: 0, running: false, finished: true };
          }
          return { ...t, remainingSec: t.remainingSec - 1 };
        })
      );
    }, 1000);
    return () => window.clearInterval(id);
  }, [timers]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2600);
  };

  // Initial server session check
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'same-origin' });
        const data = await res.json();
        setPreviewAllowed(Boolean(data.previewAllowed));
        if (data.authenticated) {
          setSession({
            authenticated: true,
            mode: data.mode,
            email: data.email,
            buyerName: data.buyerName,
          });
        } else {
          setSession({ authenticated: false, mode: 'anonymous' });
        }
      } catch {
        // Offline recovery ONLY if buyer previously unlocked authorized offline cache on this device
        try {
          const cachedRaw = window.localStorage.getItem(OFFLINE_CONTENT_FALLBACK_KEY);
          if (cachedRaw && !navigator.onLine) {
            const parsed = JSON.parse(cachedRaw) as { session: BuyerSession; content: ProtectedContentPayload };
            if (parsed.session?.authenticated && parsed.content?.recipes?.length) {
              setSession(parsed.session);
              setContent(parsed.content);
            } else {
              setSession({ authenticated: false, mode: 'anonymous' });
            }
          } else {
            setSession({ authenticated: false, mode: 'anonymous' });
          }
        } catch {
          setSession({ authenticated: false, mode: 'anonymous' });
        }
      } finally {
        setCheckingSession(false);
      }
    })();
  }, []);

  // Fetch protected payload once authenticated
  useEffect(() => {
    if (!session?.authenticated) {
      setContent(null);
      return;
    }
    if (content) return;

    (async () => {
      setLoadingContent(true);
      setContentError('');
      try {
        const res = await fetch('/api/content', { credentials: 'same-origin' });
        if (res.status === 401 || res.status === 403) {
          setSession({ authenticated: false, mode: 'anonymous' });
          return;
        }
        if (!res.ok) throw new Error('Falha ao carregar conteúdos protegidos.');
        const data = (await res.json()) as ProtectedContentPayload;
        setContent(data);
        try {
          window.localStorage.setItem(OFFLINE_CONTENT_FALLBACK_KEY, JSON.stringify({ session, content: data }));
        } catch {
          // Ignore quota limits
        }
      } catch (err) {
        setContentError(err instanceof Error ? err.message : 'Erro ao carregar dados.');
      } finally {
        setLoadingContent(false);
      }
    })();
  }, [session, content]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {
      // Ignore network issues
    }
    window.localStorage.removeItem(OFFLINE_CONTENT_FALLBACK_KEY);
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_PROTECTED_CACHE' });
    }
    setContent(null);
    setTab('home');
    setSelectedRecipeId(null);
    setSelectedModuleId(null);
    setSession({ authenticated: false, mode: 'anonymous' });
  };

  const handleInstallPwa = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const handleExportBackup = () => {
    const json = exportWorkspaceBackupJson(workspace);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `panetones-que-rendem-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Cópia de segurança JSON exportada!');
  };

  const handleImportBackup = async (file: File) => {
    try {
      const txt = await file.text();
      const restored = parseWorkspaceBackupJson(txt);
      if (!restored) {
        showToast('Ficheiro de backup inválido.');
        return;
      }
      setWorkspace(restored);
      showToast('Backup restaurado com sucesso!');
    } catch {
      showToast('Não foi possível ler o ficheiro JSON.');
    }
  };

  if (checkingSession) {
    return (
      <div className="auth-shell">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <img src="/icons/logo-brand.png" alt="Panetones que Rendem" className="auth-logo" />
          <p style={{ margin: 0, fontWeight: 700, color: 'var(--wine)' }}>A verificar sessão protegida...</p>
        </div>
      </div>
    );
  }

  if (!session?.authenticated) {
    return <AuthGate previewAllowed={previewAllowed} onAuthenticated={(s) => setSession(s)} />;
  }

  if (loadingContent || !content) {
    return (
      <div className="auth-shell">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <img src="/icons/logo-brand.png" alt="Panetones que Rendem" className="auth-logo" />
          {contentError ? (
            <>
              <div className="notice notice-danger">{contentError}</div>
              <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
                Tentar Novamente
              </button>
            </>
          ) : (
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--wine)' }}>A carregar receitas e ferramentas...</p>
          )}
        </div>
      </div>
    );
  }

  const navItems: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Início', icon: <Home size={18} /> },
    { id: 'recipes', label: 'Receitas', icon: <ChefHat size={18} /> },
    { id: 'orders', label: 'Encomendas', icon: <ClipboardList size={18} /> },
    { id: 'calculator', label: 'Preços €', icon: <Calculator size={18} /> },
    { id: 'shopping', label: 'Compras', icon: <ShoppingBasket size={18} /> },
    { id: 'calendar', label: 'Calendário', icon: <CalendarDays size={18} /> },
    { id: 'catalog', label: 'Catálogo', icon: <MenuSquare size={18} /> },
    { id: 'bonus', label: 'Bónus', icon: <FolderHeart size={18} /> },
  ];

  const mobileBottomItems = [navItems[0], navItems[1], navItems[2], navItems[3], navItems[7]];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <button
            type="button"
            className="brand-lockup"
            onClick={() => {
              setSelectedRecipeId(null);
              setTab('home');
            }}
          >
            <img src="/icons/logo-brand.png" alt="Panetones que Rendem" />
            <div>
              <div className="brand-title">Panetones que Rendem</div>
              <div className="brand-sub">App do Produtor · Portugal (€)</div>
            </div>
          </button>

          <nav className="desktop-nav" aria-label="Navegação principal">
            {navItems.map((n) => (
              <button
                key={n.id}
                type="button"
                className={`desktop-nav-btn ${tab === n.id ? 'active' : ''}`}
                onClick={() => setTab(n.id)}
              >
                {n.icon}
                <span>{n.label}</span>
              </button>
            ))}
          </nav>

          <div className="topbar-actions">
            {session.mode === 'preview' && <span className="mode-chip">Pré-visualização</span>}
            <button
              type="button"
              className="btn btn-sm btn-outline"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(229,169,59,0.4)' }}
              onClick={handleLogout}
              title="Terminar sessão e limpar cópia local protegida"
              aria-label="Sair"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Secondary quick strip on mobile so all 10 features stay 1 tap away */}
      <div className="main-container">
        <div className="chip-row no-print" style={{ marginBottom: 12 }}>
          <button type="button" className={`chip ${tab === 'shopping' ? 'active' : ''}`} onClick={() => setTab('shopping')}>
            Lista de Compras
          </button>
          <button type="button" className={`chip ${tab === 'calendar' ? 'active' : ''}`} onClick={() => setTab('calendar')}>
            Calendário de Produção
          </button>
          <button type="button" className={`chip ${tab === 'catalog' ? 'active' : ''}`} onClick={() => setTab('catalog')}>
            Catálogo de Natal (PNG/WA)
          </button>
          <button type="button" className={`chip ${tab === 'bonus' ? 'active' : ''}`} onClick={() => setTab('bonus')}>
            <BookOpen size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Módulos & Bónus
          </button>
        </div>

        {toast && (
          <div className="notice notice-green" role="status">
            {toast}
          </div>
        )}

        {tab === 'home' && (
          <HomeView
            content={content}
            workspace={workspace}
            canInstallPwa={Boolean(installPrompt)}
            onInstallPwa={handleInstallPwa}
            onNavigate={(nextTab, extra) => {
              if (extra?.recipeId) setSelectedRecipeId(extra.recipeId);
              if (extra?.moduleId) setSelectedModuleId(extra.moduleId);
              setTab(nextTab);
            }}
            onToggleStartupItem={(idx) =>
              setWorkspace((prev) => ({
                ...prev,
                completedStartupItems: prev.completedStartupItems.includes(idx)
                  ? prev.completedStartupItems.filter((x) => x !== idx)
                  : [...prev.completedStartupItems, idx],
              }))
            }
            onToggleModuleDone={(id) =>
              setWorkspace((prev) => ({
                ...prev,
                completedModules: prev.completedModules.includes(id)
                  ? prev.completedModules.filter((x) => x !== id)
                  : [...prev.completedModules, id],
              }))
            }
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />
        )}

        {tab === 'recipes' && (
          <RecipesView
            recipes={content.recipes}
            favorites={workspace.favorites}
            selectedRecipeId={selectedRecipeId}
            onSelectRecipe={setSelectedRecipeId}
            onToggleFavorite={(id) =>
              setWorkspace((prev) => ({
                ...prev,
                favorites: prev.favorites.includes(id) ? prev.favorites.filter((x) => x !== id) : [...prev.favorites, id],
              }))
            }
            onOpenKitchenMode={(recipe, targetUnits) => setKitchenLaunch({ recipe, targetUnits })}
            onSendToCalculator={(rec) => {
              setWorkspace((prev) => ({
                ...prev,
                calculatorState: {
                  ...prev.calculatorState,
                  recipeId: rec.id,
                  productName: rec.shortTitle,
                  unitsPerBatch: rec.baseYieldUnits,
                  isExamplePreset: false,
                },
              }));
              setTab('calculator');
              showToast(`Receita "${rec.shortTitle}" carregada na Calculadora.`);
            }}
          />
        )}

        {tab === 'calculator' && (
          <CalculatorView
            recipes={content.recipes}
            state={workspace.calculatorState}
            savedScenarios={workspace.savedScenarios}
            onChange={(next) => setWorkspace((prev) => ({ ...prev, calculatorState: next }))}
            onSaveScenario={(suggestedPriceEur) => {
              setWorkspace((prev) => ({
                ...prev,
                savedScenarios: [
                  {
                    ...prev.calculatorState,
                    id: `sc-${Date.now()}`,
                    savedAt: new Date().toISOString(),
                    suggestedPriceEur,
                  },
                  ...prev.savedScenarios,
                ],
              }));
              showToast('Ficha de preço guardada!');
            }}
            onLoadScenario={(sc) => setWorkspace((prev) => ({ ...prev, calculatorState: sc }))}
            onDeleteScenario={(id) =>
              setWorkspace((prev) => ({ ...prev, savedScenarios: prev.savedScenarios.filter((s) => s.id !== id) }))
            }
            onApplyToCatalog={(name, priceEur, recipeId) => {
              const rec = content.recipes.find((r) => r.id === recipeId);
              setWorkspace((prev) => ({
                ...prev,
                catalogConfig: {
                  ...prev.catalogConfig,
                  products: [
                    ...prev.catalogConfig.products,
                    {
                      id: `cat-${Date.now()}`,
                      recipeId,
                      tier:
                        rec?.packageType === 'mini'
                          ? 'Entrada / Lembrança'
                          : rec?.packageType === 'copo'
                          ? 'Sobremesa / Copo'
                          : 'Clássico & Recheado',
                      name,
                      weightOrSize: rec?.unitTypeLabel || '500 g+',
                      description: rec?.blockSubtitle || 'Produção fresca por encomenda.',
                      priceEur,
                      allergens: rec?.conservation.allergens.replace('Contém ', '').slice(0, 65) || 'Glúten, Ovos, Leite',
                    },
                  ],
                },
              }));
              setTab('catalog');
              showToast('Produto adicionado ao Catálogo de Natal!');
            }}
          />
        )}

        {tab === 'orders' && (
          <OrdersView
            recipes={content.recipes}
            orders={workspace.orders}
            mbWayPhone={workspace.catalogConfig.mbWayPhone}
            onSaveOrder={(order: Order) => {
              setWorkspace((prev) => {
                const exists = prev.orders.some((o) => o.id === order.id);
                return {
                  ...prev,
                  orders: exists
                    ? prev.orders.map((o) => (o.id === order.id ? order : o))
                    : [order, ...prev.orders],
                };
              });
              showToast('Encomenda guardada com sucesso!');
            }}
            onDeleteOrder={(id) =>
              setWorkspace((prev) => ({ ...prev, orders: prev.orders.filter((o) => o.id !== id) }))
            }
            onToggleDepositPaid={(id) =>
              setWorkspace((prev) => ({
                ...prev,
                orders: prev.orders.map((o) =>
                  o.id === id
                    ? {
                        ...o,
                        depositPaid: !o.depositPaid,
                        status: !o.depositPaid && o.status === 'pendente-sinal' ? 'confirmada' : o.status,
                      }
                    : o
                ),
              }))
            }
            onStatusChange={(id, status: OrderStatus) =>
              setWorkspace((prev) => ({
                ...prev,
                orders: prev.orders.map((o) => (o.id === id ? { ...o, status } : o)),
              }))
            }
            onGoToShoppingList={() => setTab('shopping')}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />
        )}

        {tab === 'shopping' && (
          <ShoppingListView
            content={content}
            orders={workspace.orders}
            checkedKeys={workspace.shoppingCheckedKeys}
            unitPricesEur={workspace.shoppingUnitPricesEur}
            onToggleChecked={(k) =>
              setWorkspace((prev) => ({
                ...prev,
                shoppingCheckedKeys: prev.shoppingCheckedKeys.includes(k)
                  ? prev.shoppingCheckedKeys.filter((x) => x !== k)
                  : [...prev.shoppingCheckedKeys, k],
              }))
            }
            onClearChecked={() => setWorkspace((prev) => ({ ...prev, shoppingCheckedKeys: [] }))}
            onUpdateUnitPrice={(k, price) =>
              setWorkspace((prev) => ({
                ...prev,
                shoppingUnitPricesEur: { ...prev.shoppingUnitPricesEur, [k]: price },
              }))
            }
          />
        )}

        {tab === 'calendar' && (
          <CalendarView
            content={content}
            orders={workspace.orders}
            customTasks={workspace.customTasks}
            completedWeekendIds={workspace.completedWeekendIds}
            onToggleWeekendStep={(id) =>
              setWorkspace((prev) => ({
                ...prev,
                completedWeekendIds: prev.completedWeekendIds.includes(id)
                  ? prev.completedWeekendIds.filter((x) => x !== id)
                  : [...prev.completedWeekendIds, id],
              }))
            }
            onAddCustomTask={(tsk) =>
              setWorkspace((prev) => ({ ...prev, customTasks: [...prev.customTasks, tsk] }))
            }
            onToggleCustomTask={(id) =>
              setWorkspace((prev) => ({
                ...prev,
                customTasks: prev.customTasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
              }))
            }
            onDeleteCustomTask={(id) =>
              setWorkspace((prev) => ({ ...prev, customTasks: prev.customTasks.filter((t) => t.id !== id) }))
            }
          />
        )}

        {tab === 'catalog' && (
          <CatalogView
            recipes={content.recipes}
            config={workspace.catalogConfig}
            onChange={(next) => setWorkspace((prev) => ({ ...prev, catalogConfig: next }))}
          />
        )}

        {tab === 'bonus' && (
          <LibraryBonusView
            content={content}
            completedModules={workspace.completedModules}
            selectedModuleId={selectedModuleId}
            onSelectModule={setSelectedModuleId}
            onToggleModuleDone={(id) =>
              setWorkspace((prev) => ({
                ...prev,
                completedModules: prev.completedModules.includes(id)
                  ? prev.completedModules.filter((x) => x !== id)
                  : [...prev.completedModules, id],
              }))
            }
          />
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav" aria-label="Menu rápido mobile">
        {mobileBottomItems.map((n) => (
          <button
            key={n.id}
            type="button"
            className={`bottom-nav-btn ${tab === n.id ? 'active' : ''}`}
            onClick={() => setTab(n.id)}
          >
            {n.icon}
            <span>{n.label}</span>
          </button>
        ))}
      </nav>

      {/* Active floating timers */}
      <FloatingTimerTray
        timers={timers}
        onToggle={(id) =>
          setTimers((prev) =>
            prev.map((t) =>
              t.id === id
                ? { ...t, running: !t.running && t.remainingSec > 0, finished: false }
                : t
            )
          )
        }
        onReset={(id) =>
          setTimers((prev) =>
            prev.map((t) =>
              t.id === id ? { ...t, remainingSec: t.durationSec, running: false, finished: false } : t
            )
          )
        }
        onRemove={(id) => setTimers((prev) => prev.filter((t) => t.id !== id))}
      />

      {/* Fullscreen Kitchen Mode */}
      {kitchenLaunch && (
        <KitchenModeModal
          recipe={kitchenLaunch.recipe}
          targetUnits={kitchenLaunch.targetUnits}
          scaledIngredients={scaleIngredients(kitchenLaunch.recipe, kitchenLaunch.targetUnits)}
          timers={timers}
          onAddTimer={(label, minutes) => {
            const sec = Math.max(5, Math.round(minutes * 60));
            setTimers((prev) => [
              ...prev,
              {
                id: `tm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                label,
                durationSec: sec,
                remainingSec: sec,
                running: true,
                finished: false,
              },
            ]);
          }}
          onToggleTimer={(id) =>
            setTimers((prev) =>
              prev.map((t) => (t.id === id ? { ...t, running: !t.running && t.remainingSec > 0, finished: false } : t))
            )
          }
          onRemoveTimer={(id) => setTimers((prev) => prev.filter((t) => t.id !== id))}
          onClose={() => setKitchenLaunch(null)}
        />
      )}
    </div>
  );
}
