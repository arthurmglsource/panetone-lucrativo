import type {
  CatalogConfig,
  CustomCalendarTask,
  Order,
  PriceCalculatorState,
} from '../types/content';

export interface WorkspacePersistedState {
  version: number;
  favorites: number[];
  completedModules: string[];
  completedStartupItems: number[];
  completedWeekendIds: string[];
  orders: Order[];
  customTasks: CustomCalendarTask[];
  shoppingCheckedKeys: string[];
  shoppingUnitPricesEur: Record<string, number>;
  shoppingPantryAmounts: Record<string, number>;
  calculatorState: PriceCalculatorState;
  savedScenarios: (PriceCalculatorState & { id: string; savedAt: string; suggestedPriceEur: number })[];
  catalogConfig: CatalogConfig;
}

const STORAGE_KEY = 'pqr_workspace_v1';

export const DEFAULT_CALCULATOR_STATE: PriceCalculatorState = {
  productName: 'Panetone Recheado Premium (~750 g) · Exemplo Ilustrativo',
  recipeId: 11,
  unitsPerBatch: 2,
  ingredientsBatchEur: 11.6,
  wastePercent: 5,
  packagingPerUnitEur: 1.35,
  energyBatchEur: 0.8,
  activeMinutesBatch: 36,
  hourlyRateEur: 10,
  paymentFeePercent: 0,
  desiredMarginPercent: 32,
  isExamplePreset: true,
};

export const DEFAULT_CATALOG_CONFIG: CatalogConfig = {
  brandName: 'A Minha Cozinha de Natal',
  tagline: 'Panetones frescos feitos exclusivamente por encomenda com manteiga verdadeira',
  cityOrPickupZone: 'Levantamento local · Entregas sob consulta',
  mbWayPhone: '9XX XXX XXX',
  depositRule: 'Reserva confirmada com sinal de 50 % por MB WAY.',
  orderDeadline: 'Encomendas semanais até quinta-feira às 18h00',
  products: [
    {
      id: 'cat-1',
      recipeId: 19,
      tier: 'Entrada / Lembrança',
      name: 'Mini Panetone Artesanal',
      weightOrSize: '120 g – 160 g',
      description: 'Versão lembrança embrulhada em celofane com fita de cetim e tag De/Para.',
      priceEur: 4.5,
      allergens: 'Glúten, Ovos, Leite',
    },
    {
      id: 'cat-2',
      recipeId: 26,
      tier: 'Sobremesa / Copo',
      name: 'Panetone no Copo Cremoso',
      weightOrSize: '220 ml',
      description: 'Camadas de cubos de panetone húmido, creme sedoso e cobertura crocante à colher.',
      priceEur: 5.0,
      allergens: 'Glúten, Ovos, Leite, Soja',
    },
    {
      id: 'cat-3',
      recipeId: 11,
      tier: 'Clássico & Recheado',
      name: 'Chocotone Duplo Chocolate',
      weightOrSize: '~780 g finais',
      description: 'Massa leve de fermentação cuidada com gotas 54 % e recheio cremoso abundante.',
      priceEur: 15.0,
      allergens: 'Glúten, Ovos, Leite, Soja',
    },
  ],
};

export function createInitialWorkspaceState(): WorkspacePersistedState {
  return {
    version: 1,
    favorites: [1, 11, 25],
    completedModules: [],
    completedStartupItems: [],
    completedWeekendIds: [],
    orders: [],
    customTasks: [],
    shoppingCheckedKeys: [],
    shoppingUnitPricesEur: {},
    shoppingPantryAmounts: {},
    calculatorState: DEFAULT_CALCULATOR_STATE,
    savedScenarios: [],
    catalogConfig: DEFAULT_CATALOG_CONFIG,
  };
}

export function loadWorkspaceState(): WorkspacePersistedState {
  const defaults = createInitialWorkspaceState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<WorkspacePersistedState>;
    return {
      ...defaults,
      ...parsed,
      calculatorState: { ...defaults.calculatorState, ...(parsed.calculatorState || {}) },
      catalogConfig: { ...defaults.catalogConfig, ...(parsed.catalogConfig || {}) },
    };
  } catch {
    return defaults;
  }
}

export function saveWorkspaceState(state: WorkspacePersistedState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage quota exceeded — ignore gracefully
  }
}

export function exportWorkspaceBackupJson(state: WorkspacePersistedState): string {
  return JSON.stringify(
    {
      app: 'panetones-que-rendem-pwa',
      exportedAt: new Date().toISOString(),
      state,
    },
    null,
    2
  );
}

export function parseWorkspaceBackupJson(jsonText: string): WorkspacePersistedState | null {
  try {
    const parsed = JSON.parse(jsonText);
    const candidate = parsed?.state ? parsed.state : parsed;
    if (!candidate || !Array.isArray(candidate.orders) || typeof candidate.version !== 'number') {
      return null;
    }
    const defaults = createInitialWorkspaceState();
    return {
      ...defaults,
      ...candidate,
      calculatorState: { ...defaults.calculatorState, ...(candidate.calculatorState || {}) },
      catalogConfig: { ...defaults.catalogConfig, ...(candidate.catalogConfig || {}) },
    };
  } catch {
    return null;
  }
}

export function ordersToCsv(orders: Order[]): string {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = [
    'ID',
    'Cliente',
    'Telemovel_WhatsApp',
    'Produtos',
    'Total_EUR',
    'Sinal_EUR',
    'Sinal_Pago',
    'Falta_Receber_EUR',
    'Data_Entrega',
    'Hora',
    'Modo',
    'Estado',
    'Notas',
  ];
  const rows = orders.map((o) => {
    const pending = o.depositPaid ? Math.max(0, o.totalEur - o.depositEur) : o.totalEur;
    const productsSummary = o.items.map((i) => `${i.quantity}x ${i.recipeTitle}`).join(' | ');
    return [
      esc(o.id),
      esc(o.customerName),
      esc(o.customerPhone),
      esc(productsSummary),
      o.totalEur.toFixed(2),
      o.depositEur.toFixed(2),
      o.depositPaid ? 'SIM' : 'NAO',
      pending.toFixed(2),
      esc(o.deliveryDate),
      esc(o.deliveryTime),
      esc(o.deliveryMethod),
      esc(o.status),
      esc(o.notes),
    ].join(',');
  });
  return [header.join(','), ...rows].join('\n');
}
