import type { Order, ParsedIngredient, Recipe } from '../types/content';

export interface ScaledIngredient extends ParsedIngredient {
  scaledQuantity: number | null;
  formattedQuantity: string;
}

export interface AggregatedShoppingItem {
  key: string;
  name: string;
  category: 'massa' | 'recheio' | 'embalagem';
  totalBaseAmount: number;
  baseUnit: 'g' | 'ml' | 'unid';
  displayAmount: string;
  sources: string[];
  note?: string;
}

export function formatEur(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatQuantityValue(qty: number, unit: string): string {
  const lowerUnit = unit.toLowerCase();
  if ((lowerUnit === 'g' || lowerUnit === 'ml') && qty >= 1000) {
    const bigUnit = lowerUnit === 'g' ? 'kg' : 'L';
    return `${(qty / 1000).toFixed(2).replace('.', ',').replace(/,00$/, '')} ${bigUnit}`;
  }
  if (lowerUnit.startsWith('ovo') || lowerUnit.startsWith('lata') || lowerUnit.startsWith('unid') || lowerUnit.startsWith('copo')) {
    const rounded = Math.ceil(qty * 2) / 2;
    const str = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace('.', ',');
    return `${str} ${unit}`;
  }
  if (qty < 10) {
    const rounded = Math.round(qty * 10) / 10;
    return `${String(rounded).replace('.', ',')} ${unit}`.trim();
  }
  return `${Math.round(qty)} ${unit}`.trim();
}

export function scaleIngredients(recipe: Recipe, targetUnits: number): ScaledIngredient[] {
  const base = Math.max(1, recipe.baseYieldUnits || 1);
  const factor = Math.max(1, targetUnits) / base;

  return recipe.ingredients.map((ing) => {
    if (ing.quantity === null || ing.referencesBaseRecipe) {
      return {
        ...ing,
        scaledQuantity: ing.quantity !== null ? Math.round(ing.quantity * factor * 10) / 10 : null,
        formattedQuantity:
          ing.quantity !== null && ing.referencesBaseRecipe
            ? `${formatQuantityValue(ing.quantity * factor, ing.unit)} (${ing.raw})`
            : ing.raw,
      };
    }
    const scaled = ing.quantity * factor;
    return {
      ...ing,
      scaledQuantity: scaled,
      formattedQuantity: formatQuantityValue(scaled, ing.unit),
    };
  });
}

function toBaseUnitAmount(qty: number, unit: string): { amount: number; baseUnit: 'g' | 'ml' | 'unid' } {
  const u = unit.toLowerCase();
  if (u === 'kg') return { amount: qty * 1000, baseUnit: 'g' };
  if (u === 'g') return { amount: qty, baseUnit: 'g' };
  if (u === 'l') return { amount: qty * 1000, baseUnit: 'ml' };
  if (u === 'ml') return { amount: qty, baseUnit: 'ml' };
  return { amount: qty, baseUnit: 'unid' };
}

function cleanDisplayNameFromKey(key: string, fallback: string): string {
  const map: Record<string, string> = {
    'farinha-forca': 'Farinha de trigo de força (>= 12 % prot. / Manitoba)',
    'manteiga-sem-sal': 'Manteiga sem sal (>= 80–82 % MG)',
    'acucar-fino': 'Açúcar branco fino',
    'gemas-ovos': 'Gemas de ovo L (~18–20 g cada)',
    'leite-condensado': 'Leite condensado tradicional (latas 395 g)',
    'natas-35': 'Natas para bater (>= 35 % MG)',
    'leite-em-po': 'Leite em pó gordo integral',
    'chocolate-branco': 'Chocolate branco de pastelaria',
    'chocolate-pastelaria': 'Chocolate negro 54 % / de leite de pastelaria',
    'pepitas-chocolate': 'Pepitas de chocolate forneáveis',
    'cacau-po': 'Cacau em pó 100 % sem açúcar',
    'creme-avela': 'Creme de avelã e cacau',
    'doce-de-leite': 'Doce de leite pasteleiro',
    'polpa-maracuja': 'Polpa de maracujá natural',
    'fermento-padeiro': 'Fermento de padeiro fresco (ou 1/3 seco)',
    'leite-meio-gordo': 'Leite meio-gordo / água fria',
    mel: 'Mel de flores ou rosmaninho',
    'frutas-cristalizadas': 'Frutas cristalizadas variadas',
    'passas-sultanas': 'Passas sultanas',
    'flor-de-sal': 'Flor de sal portuguesa',
    'sal-fino': 'Sal fino',
    'extrato-baunilha': 'Extrato ou pasta de baunilha',
    avelas: 'Avelãs sem pele',
    nozes: 'Miolo de noz',
    amendoas: 'Amêndoa laminada / picada',
  };
  return map[key] || fallback;
}

export function buildShoppingListFromPlan(
  planEntries: { recipeId: number; units: number }[],
  recipes: Recipe[]
): AggregatedShoppingItem[] {
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));
  const agg = new Map<string, AggregatedShoppingItem>();

  let count500g = 0;
  let count500gFilled = 0;
  let countMini = 0;
  let countCopo = 0;

  const pushEntry = (
    key: string,
    name: string,
    category: 'massa' | 'recheio' | 'embalagem',
    qty: number,
    unit: string,
    sourceLabel: string,
    note?: string
  ) => {
    const { amount, baseUnit } = toBaseUnitAmount(qty, unit);
    const mapKey = `${key}__${baseUnit}`;
    const existing = agg.get(mapKey);
    if (existing) {
      existing.totalBaseAmount += amount;
      if (!existing.sources.includes(sourceLabel)) existing.sources.push(sourceLabel);
    } else {
      agg.set(mapKey, {
        key: mapKey,
        name: cleanDisplayNameFromKey(key, name),
        category,
        totalBaseAmount: amount,
        baseUnit,
        displayAmount: '',
        sources: [sourceLabel],
        note,
      });
    }
  };

  // Detect how many filled 500g panetones exist (their excavated crumb feeds Panetone no Copo!)
  for (const entry of planEntries) {
    const r = recipeMap.get(entry.recipeId);
    if (!r || entry.units <= 0) continue;
    if (r.packageType === '500g') {
      count500g += entry.units;
      if (r.isFilled) count500gFilled += entry.units;
    } else if (r.packageType === 'mini') {
      countMini += entry.units;
    } else if (r.packageType === 'copo') {
      countCopo += entry.units;
    }
  }

  for (const entry of planEntries) {
    const r = recipeMap.get(entry.recipeId);
    if (!r || entry.units <= 0) continue;

    const factor = entry.units / Math.max(1, r.baseYieldUnits);
    const sourceLabel = `${entry.units}× ${r.shortTitle}`;

    for (const ing of r.ingredients) {
      if (ing.referencesBaseRecipe) {
        // Expand base recipe if this is a 500g/mini baked recipe OR copo needing fresh mass beyond crumb reuse
        const baseRec = recipeMap.get(ing.referencesBaseRecipe);
        if (baseRec) {
          const skipCupBase = r.packageType === 'copo' && count500gFilled >= entry.units;
          if (!skipCupBase) {
            for (const bIng of baseRec.ingredients) {
              if (bIng.quantity !== null) {
                pushEntry(
                  bIng.normalizedKey,
                  bIng.name,
                  bIng.shoppingCategory,
                  bIng.quantity * factor,
                  bIng.unit,
                  `${sourceLabel} (Massa base R0${baseRec.id})`
                );
              }
            }
          }
        }
        // Extract optional inclusions mentioned in the reference line (e.g., pepitas de chocolate)
        const pepMatch = ing.raw.match(/(\d+)\s*g\s+de\s+pepitas/i);
        if (pepMatch) {
          pushEntry(
            'pepitas-chocolate',
            'Pepitas de chocolate forneáveis',
            'massa',
            Number(pepMatch[1]) * factor,
            'g',
            sourceLabel
          );
        }
        continue;
      }

      if (ing.quantity !== null && ing.unit) {
        pushEntry(ing.normalizedKey, ing.name, ing.shoppingCategory, ing.quantity * factor, ing.unit, sourceLabel);
      }
    }
  }

  // Add packaging counts cleanly (+10% safety reserve on paper molds)
  if (count500g > 0) {
    const withReserve = Math.ceil(count500g * 1.1);
    pushEntry('formas-500g', 'Formas de papel forneáveis 500 g (+10 % reserva)', 'embalagem', withReserve, 'unid', `${count500g} panetones 500 g`);
    pushEntry('sacos-500g', 'Sacos celofane / caixas + fita cetim + etiquetas 500 g', 'embalagem', count500g, 'unid', `${count500g} panetones 500 g`);
  }
  if (countMini > 0) {
    const withReserve = Math.ceil(countMini * 1.1);
    pushEntry('formas-mini', 'Formas de papel forneáveis Mini 100–120 g (+10 % reserva)', 'embalagem', withReserve, 'unid', `${countMini} minis`);
    pushEntry('sacos-mini', 'Sacos celofane / caixinhas + etiquetas Mini', 'embalagem', countMini, 'unid', `${countMini} minis`);
  }
  if (countCopo > 0) {
    pushEntry('copos-220ml', 'Copos PET 220 ml c/ tampa bolha + colheres embaladas + selos', 'embalagem', countCopo, 'unid', `${countCopo} copos`);
  }

  return Array.from(agg.values())
    .map((item) => ({
      ...item,
      displayAmount: formatQuantityValue(item.totalBaseAmount, item.baseUnit === 'unid' ? 'unid.' : item.baseUnit),
    }))
    .sort((a, b) => {
      const order = { massa: 0, recheio: 1, embalagem: 2 };
      if (order[a.category] !== order[b.category]) return order[a.category] - order[b.category];
      return a.name.localeCompare(b.name, 'pt-PT');
    });
}

export function buildShoppingPlanFromOrders(orders: Order[], includePendingDeposit: boolean): { recipeId: number; units: number }[] {
  const allowed = new Set(
    includePendingDeposit
      ? ['pendente-sinal', 'confirmada', 'em-producao']
      : ['confirmada', 'em-producao']
  );

  const byRecipe = new Map<number, number>();
  for (const order of orders) {
    if (!allowed.has(order.status)) continue;
    for (const item of order.items) {
      if (item.quantity > 0 && item.recipeId > 0) {
        byRecipe.set(item.recipeId, (byRecipe.get(item.recipeId) || 0) + item.quantity);
      }
    }
  }

  return Array.from(byRecipe.entries()).map(([recipeId, units]) => ({ recipeId, units }));
}

