export type RecipeCategory =
  | 'massas-base'
  | 'classicos-frutados'
  | 'recheados-premium'
  | 'mini-panetones'
  | 'panetone-no-copo';

export interface ParsedIngredient {
  id: string;
  raw: string;
  group: string;
  name: string;
  normalizedKey: string;
  shoppingCategory: 'massa' | 'recheio' | 'embalagem';
  quantity: number | null;
  unit: string;
  notes?: string;
  referencesBaseRecipe?: number;
}

export interface RecipeStep {
  number: number;
  title: string;
  text: string;
  suggestedMinutes: number[];
}

export interface Recipe {
  id: number;
  slug: string;
  title: string;
  shortTitle: string;
  category: RecipeCategory;
  categoryLabel: string;
  blockSubtitle: string;
  image: string;
  yieldText: string;
  baseYieldUnits: number;
  unitTypeLabel: string;
  packageType: '500g' | 'mini' | 'copo';
  isFilled: boolean;
  difficulty: string;
  activeTime: string;
  totalTime: string;
  ovenTemp: string;
  utensils: string[];
  ingredients: ParsedIngredient[];
  steps: RecipeStep[];
  conservation: {
    application: string;
    shelfLife: string;
    allergens: string;
    safetyNote?: string;
  };
  errorsAndTesting: {
    commonErrors: string;
    testingNotice: string;
  };
  defaultReferencePriceEur: number;
  baseMassRecipeId?: number;
}

export interface GuideModule {
  id: string;
  number: number;
  title: string;
  objective: string;
  actionChecklist: string[];
  sections: {
    heading: string;
    bodyMarkdown: string;
  }[];
  rawMarkdown: string;
}

export interface SupplierItem {
  category: string;
  name: string;
  accessType: string;
  products: string;
  urls: string[];
  verifiedAt: string;
}

export interface WhatsappScript {
  id: string;
  category: string;
  title: string;
  text: string;
}

export interface DownloadableAsset {
  id: string;
  fileKey: string;
  title: string;
  description: string;
  category: 'guias' | 'bonus' | 'materiais' | 'imagens' | 'editaveis';
  format: 'PDF' | 'PNG' | 'CSV' | 'HTML';
  sizeLabel: string;
  fileName: string;
}

export interface ProductionWeekendBlock {
  id: string;
  day: 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo';
  phase: 'preparacao' | 'fermentacao' | 'cozedura' | 'embalamento';
  timeSlot: string;
  title: string;
  detail: string;
}

export interface ProtectedContentPayload {
  generatedAt: string;
  brand: {
    name: string;
    edition: string;
    currency: 'EUR';
    characterNote: string;
  };
  recipes: Recipe[];
  modules: GuideModule[];
  sevenDaysPlan: {
    day: string;
    focus: string;
    actions: string;
    outcome: string;
  }[];
  startupChecklist: string[];
  faqItems: {
    question: string;
    answer: string;
  }[];
  suppliers: SupplierItem[];
  whatsappScripts: WhatsappScript[];
  referenceBatches: {
    batchSize: 10 | 30 | 50;
    label: string;
    composition: string;
    items: {
      name: string;
      category: 'massa' | 'recheio' | 'embalagem';
      quantityText: string;
    }[];
  }[];
  weekendSchedule: ProductionWeekendBlock[];
  downloads: DownloadableAsset[];
}

export type OrderStatus =
  | 'pendente-sinal'
  | 'confirmada'
  | 'em-producao'
  | 'pronta'
  | 'entregue'
  | 'cancelada';

export interface OrderItem {
  recipeId: number;
  recipeTitle: string;
  quantity: number;
  unitPriceEur: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalEur: number;
  depositPercent: number;
  depositEur: number;
  depositPaid: boolean;
  deliveryDate: string; // YYYY-MM-DD
  deliveryTime: string; // HH:MM
  deliveryMethod: 'levantamento' | 'entrega';
  status: OrderStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomCalendarTask {
  id: string;
  date: string; // YYYY-MM-DD
  time: string;
  phase: 'preparacao' | 'fermentacao' | 'cozedura' | 'embalamento' | 'entrega';
  title: string;
  detail: string;
  done: boolean;
  linkedOrderId?: string;
}

export interface PriceCalculatorState {
  productName: string;
  recipeId: number | null;
  unitsPerBatch: number;
  ingredientsBatchEur: number;
  wastePercent: number;
  packagingPerUnitEur: number;
  energyBatchEur: number;
  activeMinutesBatch: number;
  hourlyRateEur: number;
  paymentFeePercent: number;
  desiredMarginPercent: number;
  isExamplePreset: boolean;
}

export interface CatalogProduct {
  id: string;
  recipeId: number | null;
  tier: 'Entrada / Lembrança' | 'Sobremesa / Copo' | 'Clássico & Recheado';
  name: string;
  weightOrSize: string;
  description: string;
  priceEur: number;
  allergens: string;
}

export interface CatalogConfig {
  brandName: string;
  tagline: string;
  cityOrPickupZone: string;
  mbWayPhone: string;
  depositRule: string;
  orderDeadline: string;
  products: CatalogProduct[];
}

export interface BuyerSession {
  authenticated: boolean;
  mode: 'buyer' | 'preview' | 'anonymous';
  email?: string;
  buyerName?: string;
  expiresAt?: string;
}
