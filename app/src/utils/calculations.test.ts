import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Order, ProtectedContentPayload } from '../types/content';
import { calculatePricing } from './calculator';
import {
  buildShoppingListFromPlan,
  buildShoppingPlanFromOrders,
  scaleIngredients,
} from './scaling';
import { DEFAULT_CALCULATOR_STATE, ordersToCsv } from './storage';

const contentPath = path.resolve(process.cwd(), 'protected-data/content.json');
const content = JSON.parse(fs.readFileSync(contentPath, 'utf-8')) as ProtectedContentPayload;

describe('Integridade do Conteúdo Sincronizado & Lógica de Negócio', () => {
  it('sincroniza exatamente as 30 receitas e 6 módulos da fonte Markdown sem falhas', () => {
    expect(content.recipes).toHaveLength(30);
    expect(content.modules).toHaveLength(6);
    expect(content.sevenDaysPlan).toHaveLength(7);
    expect(content.downloads.length).toBeGreaterThanOrEqual(15);
    for (const r of content.recipes) {
      expect(r.ingredients.length).toBeGreaterThanOrEqual(3);
      expect(r.steps.length).toBeGreaterThanOrEqual(3);
      expect(r.baseYieldUnits).toBeGreaterThanOrEqual(1);
    }
  });

  it('recalcula ingredientes proporcionalmente para qualquer número de unidades', () => {
    const r01 = content.recipes.find((r) => r.id === 1)!;
    expect(r01.baseYieldUnits).toBe(2);
    const scaledFor6 = scaleIngredients(r01, 6); // 3x base (500 g -> 1500 g farinha = 1,5 kg)
    const flour = scaledFor6.find((i) => i.normalizedKey === 'farinha-forca');
    expect(flour?.scaledQuantity).toBe(1500);
    expect(flour?.formattedQuantity).toBe('1,50 kg');
  });

  it('calcula custos, quebra, mão de obra, preço psicológico e lucro líquido em euros', () => {
    const res = calculatePricing(DEFAULT_CALCULATOR_STATE);
    expect(res.valid).toBe(true);
    // 11.60 * 1.05 / 2 = 6.09 ing/un + 1.35 pack + 0.40 energy + 3.00 labor = 10.84 break-even
    expect(res.breakEvenPerUnitEur).toBeCloseTo(10.84, 2);
    // 10.84 / (1 - 0.32) = 15.941 -> psychological ceiling rounds cleanly to 16.00 €
    expect(res.suggestedPricePsychologicalEur).toBe(16.0);
    expect(res.netProfitPerUnitEur).toBeCloseTo(5.16, 2);
    expect(res.workerTotalGainPerUnitEur).toBeCloseTo(8.16, 2);
  });

  it('bloqueia combinações inválidas onde Margem + Taxa >= 95 %', () => {
    const res = calculatePricing({
      ...DEFAULT_CALCULATOR_STATE,
      desiredMarginPercent: 90,
      paymentFeePercent: 6,
    });
    expect(res.valid).toBe(false);
    expect(res.validationError).toBeTruthy();
  });

  it('agrega encomendas em plano de produção e lista de compras automática com embalagens e copos', () => {
    const orders: Order[] = [
      {
        id: 'ENC-001',
        customerName: 'Ana Silva',
        customerPhone: '912345678',
        items: [
          { recipeId: 11, recipeTitle: 'Chocotone Duplo', quantity: 2, unitPriceEur: 15 },
          { recipeId: 25, recipeTitle: 'Panetone no Copo', quantity: 6, unitPriceEur: 5 },
        ],
        totalEur: 60,
        depositPercent: 50,
        depositEur: 30,
        depositPaid: true,
        deliveryDate: '2026-12-20',
        deliveryTime: '15:00',
        deliveryMethod: 'levantamento',
        status: 'confirmada',
        notes: '',
        createdAt: '2026-11-12T10:00:00Z',
        updatedAt: '2026-11-12T10:00:00Z',
      },
      {
        id: 'ENC-002',
        customerName: 'João Mendes',
        customerPhone: '961112223',
        items: [{ recipeId: 1, recipeTitle: 'Panetone Clássico Base', quantity: 2, unitPriceEur: 12 }],
        totalEur: 24,
        depositPercent: 50,
        depositEur: 12,
        depositPaid: false,
        deliveryDate: '2026-12-20',
        deliveryTime: '16:00',
        deliveryMethod: 'entrega',
        status: 'pendente-sinal',
        notes: '',
        createdAt: '2026-11-12T10:05:00Z',
        updatedAt: '2026-11-12T10:05:00Z',
      },
    ];

    const confirmedOnly = buildShoppingPlanFromOrders(orders, false);
    expect(confirmedOnly).toHaveLength(2);

    const shopping = buildShoppingListFromPlan(confirmedOnly, content.recipes);
    const leiteCond = shopping.find((i) => i.key.startsWith('leite-condensado'));
    // R11 base=2 (395g) + R25 base=6 (395g) = 790 g
    expect(leiteCond?.totalBaseAmount).toBe(790);

    const cupPkg = shopping.find((i) => i.key.startsWith('copos-220ml'));
    expect(cupPkg?.totalBaseAmount).toBe(6);

    const molds = shopping.find((i) => i.key.startsWith('formas-500g'));
    // 2 units * 1.1 = ceil(2.2) = 3 molds with +10% safety reserve
    expect(molds?.totalBaseAmount).toBe(3);

    const csv = ordersToCsv(orders);
    expect(csv).toContain('"ENC-001"');
    expect(csv).toContain('30.00'); // falta receber ENC-001
  });
});

