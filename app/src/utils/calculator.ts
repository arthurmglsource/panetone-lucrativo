import type { PriceCalculatorState } from '../types/content';

export interface PricingBreakdown {
  valid: boolean;
  validationError?: string;
  units: number;
  ingredientsWithWasteBatchEur: number;
  ingredientsPerUnitEur: number;
  packagingPerUnitEur: number;
  directCostPerUnitEur: number;
  energyPerUnitEur: number;
  laborBatchEur: number;
  laborPerUnitEur: number;
  breakEvenPerUnitEur: number;
  suggestedPriceExactEur: number;
  suggestedPricePsychologicalEur: number;
  paymentFeeAtSuggestedEur: number;
  netProfitPerUnitEur: number;
  workerTotalGainPerUnitEur: number;
  batchRevenueEur: number;
  batchNetProfitEur: number;
  realMarginPercent: number;
}

function roundPsychologicalEur(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const floorInt = Math.floor(value);
  const frac = value - floorInt;
  if (frac <= 0.05) return Number(floorInt.toFixed(2));
  if (frac <= 0.5) return Number((floorInt + 0.5).toFixed(2));
  if (frac <= 0.9) return Number((floorInt + 0.9).toFixed(2));
  return Number((floorInt + 1).toFixed(2));
}

export function calculatePricing(state: PriceCalculatorState): PricingBreakdown {
  const units = Math.max(1, Math.round(state.unitsPerBatch || 1));
  const ingBatch = Math.max(0, state.ingredientsBatchEur || 0);
  const wastePct = Math.max(0, state.wastePercent || 0);
  const packUnit = Math.max(0, state.packagingPerUnitEur || 0);
  const energyBatch = Math.max(0, state.energyBatchEur || 0);
  const activeMins = Math.max(0, state.activeMinutesBatch || 0);
  const hourlyRate = Math.max(0, state.hourlyRateEur || 0);
  const feePct = Math.max(0, state.paymentFeePercent || 0);
  const marginPct = Math.max(0, state.desiredMarginPercent || 0);

  const ingredientsWithWasteBatchEur = ingBatch * (1 + wastePct / 100);
  const ingredientsPerUnitEur = ingredientsWithWasteBatchEur / units;
  const directCostPerUnitEur = ingredientsPerUnitEur + packUnit;
  const energyPerUnitEur = energyBatch / units;
  const laborBatchEur = (activeMins / 60) * hourlyRate;
  const laborPerUnitEur = laborBatchEur / units;
  const breakEvenPerUnitEur = directCostPerUnitEur + energyPerUnitEur + laborPerUnitEur;

  const combinedDeduction = (marginPct + feePct) / 100;
  if (combinedDeduction >= 0.95) {
    return {
      valid: false,
      validationError: 'A soma de Margem + Taxa de Pagamento deve ser inferior a 95 % para o cálculo fechar.',
      units,
      ingredientsWithWasteBatchEur,
      ingredientsPerUnitEur,
      packagingPerUnitEur: packUnit,
      directCostPerUnitEur,
      energyPerUnitEur,
      laborBatchEur,
      laborPerUnitEur,
      breakEvenPerUnitEur,
      suggestedPriceExactEur: 0,
      suggestedPricePsychologicalEur: 0,
      paymentFeeAtSuggestedEur: 0,
      netProfitPerUnitEur: 0,
      workerTotalGainPerUnitEur: 0,
      batchRevenueEur: 0,
      batchNetProfitEur: 0,
      realMarginPercent: 0,
    };
  }

  const suggestedPriceExactEur = breakEvenPerUnitEur / (1 - combinedDeduction);
  const suggestedPricePsychologicalEur = roundPsychologicalEur(suggestedPriceExactEur);
  const paymentFeeAtSuggestedEur = suggestedPricePsychologicalEur * (feePct / 100);
  const netProfitPerUnitEur = suggestedPricePsychologicalEur - paymentFeeAtSuggestedEur - breakEvenPerUnitEur;
  const workerTotalGainPerUnitEur = netProfitPerUnitEur + laborPerUnitEur;
  const batchRevenueEur = suggestedPricePsychologicalEur * units;
  const batchNetProfitEur = netProfitPerUnitEur * units;
  const realMarginPercent =
    suggestedPricePsychologicalEur > 0 ? (netProfitPerUnitEur / suggestedPricePsychologicalEur) * 100 : 0;

  return {
    valid: true,
    units,
    ingredientsWithWasteBatchEur,
    ingredientsPerUnitEur,
    packagingPerUnitEur: packUnit,
    directCostPerUnitEur,
    energyPerUnitEur,
    laborBatchEur,
    laborPerUnitEur,
    breakEvenPerUnitEur,
    suggestedPriceExactEur,
    suggestedPricePsychologicalEur,
    paymentFeeAtSuggestedEur,
    netProfitPerUnitEur,
    workerTotalGainPerUnitEur,
    batchRevenueEur,
    batchNetProfitEur,
    realMarginPercent,
  };
}
