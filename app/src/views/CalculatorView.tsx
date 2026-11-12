import { BookmarkPlus, MenuSquare, RotateCcw, Trash2 } from 'lucide-react';
import type { PriceCalculatorState, Recipe } from '../types/content';
import { calculatePricing } from '../utils/calculator';
import { formatEur } from '../utils/scaling';
import { DEFAULT_CALCULATOR_STATE } from '../utils/storage';

export function CalculatorView({
  recipes,
  state,
  savedScenarios,
  onChange,
  onSaveScenario,
  onLoadScenario,
  onDeleteScenario,
  onApplyToCatalog,
}: {
  recipes: Recipe[];
  state: PriceCalculatorState;
  savedScenarios: (PriceCalculatorState & { id: string; savedAt: string; suggestedPriceEur: number })[];
  onChange: (next: PriceCalculatorState) => void;
  onSaveScenario: (suggestedPriceEur: number) => void;
  onLoadScenario: (scenario: PriceCalculatorState) => void;
  onDeleteScenario: (id: string) => void;
  onApplyToCatalog: (name: string, priceEur: number, recipeId: number | null) => void;
}) {
  const result = calculatePricing(state);

  const updateNum = (field: keyof PriceCalculatorState, val: string) => {
    const parsed = Number(val.replace(',', '.'));
    onChange({
      ...state,
      isExamplePreset: false,
      [field]: Number.isFinite(parsed) && parsed >= 0 ? parsed : 0,
    });
  };

  return (
    <div>
      <div className="section-header">
        <h2>Calculadora de Custos & Margem (€)</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => onChange({ ...DEFAULT_CALCULATOR_STATE })}
          >
            Exemplo Ilustrativo
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() =>
              onChange({
                productName: '',
                recipeId: null,
                unitsPerBatch: 2,
                ingredientsBatchEur: 0,
                wastePercent: 5,
                packagingPerUnitEur: 0,
                energyBatchEur: 0,
                activeMinutesBatch: 0,
                hourlyRateEur: 10,
                paymentFeePercent: 0,
                desiredMarginPercent: 30,
                isExamplePreset: false,
              })
            }
          >
            <RotateCcw size={14} /> Zerar
          </button>
        </div>
      </div>

      {state.isExamplePreset && (
        <div className="notice">
          <strong>Simulação Ilustrativa Pré-carregada:</strong> os valores atuais representam o exemplo do Módulo 04. Substitua pelos custos reais dos seus talões antes de fechar o seu catálogo.
        </div>
      )}

      <div className="grid-2">
        {/* Form */}
        <div className="card card-wine-top">
          <div className="field">
            <label htmlFor="calc-recipe-pick">Associar Receita (opcional)</label>
            <select
              id="calc-recipe-pick"
              className="select"
              value={state.recipeId ?? ''}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : null;
                const rec = recipes.find((r) => r.id === id);
                onChange({
                  ...state,
                  recipeId: id,
                  productName: rec ? rec.shortTitle : state.productName,
                  unitsPerBatch: rec ? rec.baseYieldUnits : state.unitsPerBatch,
                  isExamplePreset: false,
                });
              }}
            >
              <option value="">— Produto / Lote Personalizado —</option>
              {recipes.map((r) => (
                <option key={r.id} value={r.id}>
                  #{String(r.id).padStart(2, '0')} · {r.shortTitle} (base {r.baseYieldUnits})
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="calc-name">Nome do Produto / Lote</label>
            <input
              id="calc-name"
              type="text"
              className="input"
              value={state.productName}
              onChange={(e) => onChange({ ...state, productName: e.target.value, isExamplePreset: false })}
              placeholder="Ex.: Chocotone Duplo Chocolate 500 g"
            />
          </div>

          <div className="grid-2">
            <div className="field">
              <label htmlFor="calc-units">Unidades Produzidas no Lote</label>
              <input
                id="calc-units"
                type="number"
                min={1}
                step={1}
                className="input tabular"
                value={state.unitsPerBatch}
                onChange={(e) => updateNum('unitsPerBatch', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="calc-ing">Total Ingredientes do Lote (€)</label>
              <input
                id="calc-ing"
                type="number"
                min={0}
                step="0.05"
                className="input tabular"
                value={state.ingredientsBatchEur}
                onChange={(e) => updateNum('ingredientsBatchEur', e.target.value)}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label htmlFor="calc-waste">Quebra / Desperdício (%)</label>
              <input
                id="calc-waste"
                type="number"
                min={0}
                max={40}
                step="0.5"
                className="input tabular"
                value={state.wastePercent}
                onChange={(e) => updateNum('wastePercent', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="calc-pack">Embalagem por Unidade (€)</label>
              <input
                id="calc-pack"
                type="number"
                min={0}
                step="0.05"
                className="input tabular"
                value={state.packagingPerUnitEur}
                onChange={(e) => updateNum('packagingPerUnitEur', e.target.value)}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label htmlFor="calc-energy">Energia & Água do Lote (€)</label>
              <input
                id="calc-energy"
                type="number"
                min={0}
                step="0.05"
                className="input tabular"
                value={state.energyBatchEur}
                onChange={(e) => updateNum('energyBatchEur', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="calc-mins">Tempo Ativo na Cozinha (min)</label>
              <input
                id="calc-mins"
                type="number"
                min={0}
                step={1}
                className="input tabular"
                value={state.activeMinutesBatch}
                onChange={(e) => updateNum('activeMinutesBatch', e.target.value)}
              />
            </div>
          </div>

          <div className="grid-3">
            <div className="field">
              <label htmlFor="calc-hourly">Valor Hora (€/h)</label>
              <input
                id="calc-hourly"
                type="number"
                min={0}
                step="0.5"
                className="input tabular"
                value={state.hourlyRateEur}
                onChange={(e) => updateNum('hourlyRateEur', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="calc-fee">Taxa Pagto (%)</label>
              <input
                id="calc-fee"
                type="number"
                min={0}
                max={30}
                step="0.1"
                className="input tabular"
                value={state.paymentFeePercent}
                onChange={(e) => updateNum('paymentFeePercent', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="calc-margin">Margem Desejada (%)</label>
              <input
                id="calc-margin"
                type="number"
                min={0}
                max={90}
                step={1}
                className="input tabular"
                value={state.desiredMarginPercent}
                onChange={(e) => updateNum('desiredMarginPercent', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Result Breakdown */}
        <div>
          <div className="card card-gold-top">
            <h3 style={{ marginTop: 0, color: 'var(--wine)' }}>Resultado por Unidade & por Lote</h3>
            {!result.valid ? (
              <div className="notice notice-danger">{result.validationError}</div>
            ) : (
              <>
                <div className="hero-banner" style={{ padding: 14, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--gold-light)', fontWeight: 700 }}>
                    PREÇO DE VENDA SUGERIDO (ARREDONDADO)
                  </div>
                  <div className="tabular" style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>
                    {formatEur(result.suggestedPricePsychologicalEur)} <small style={{ fontSize: 14, color: 'var(--gold-light)' }}>/ unid.</small>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#f3dcc0', marginTop: 4 }}>
                    Exato pela fórmula: {formatEur(result.suggestedPriceExactEur)} · Margem real obtida:{' '}
                    <strong>{result.realMarginPercent.toFixed(1).replace('.', ',')} %</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 13.5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Ingredientes c/ quebra ({state.wastePercent}%) por unid.:</span>
                    <strong className="tabular">{formatEur(result.ingredientsPerUnitEur)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Embalagem por unid.:</span>
                    <strong className="tabular">{formatEur(result.packagingPerUnitEur)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Energia & Indiretos por unid.:</span>
                    <strong className="tabular">{formatEur(result.energyPerUnitEur)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Mão de Obra ({state.activeMinutesBatch} min ÷ {result.units}):</span>
                    <strong className="tabular">{formatEur(result.laborPerUnitEur)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                    <strong>Custo Total Real (Ponto de Equilíbrio):</strong>
                    <strong className="tabular" style={{ color: 'var(--wine)' }}>{formatEur(result.breakEvenPerUnitEur)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>Lucro Líquido do Negócio / unid.:</strong>
                    <strong className="tabular" style={{ color: 'var(--green)' }}>{formatEur(result.netProfitPerUnitEur)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--green-soft)', padding: '7px 10px', borderRadius: 8 }}>
                    <strong>Ganho Total na Sua Mão (Salário + Lucro):</strong>
                    <strong className="tabular" style={{ color: 'var(--green)' }}>{formatEur(result.workerTotalGainPerUnitEur)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--muted)' }}>
                    <span>Lote completo ({result.units} unid.):</span>
                    <span className="tabular">
                      Faturação {formatEur(result.batchRevenueEur)} · Lucro líq. {formatEur(result.batchNetProfitEur)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-wine"
                    onClick={() => onSaveScenario(result.suggestedPricePsychologicalEur)}
                  >
                    <BookmarkPlus size={15} /> Guardar Cenário
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() =>
                      onApplyToCatalog(
                        state.productName.replace(/\s*·\s*Exemplo Ilustrativo/i, '') || 'Panetone Artesanal',
                        result.suggestedPricePsychologicalEur,
                        state.recipeId
                      )
                    }
                  >
                    <MenuSquare size={15} /> Enviar ao Catálogo
                  </button>
                </div>
              </>
            )}
          </div>

          {savedScenarios.length > 0 && (
            <div className="card">
              <h3 style={{ marginTop: 0, color: 'var(--wine)' }}>Fichas Guardadas ({savedScenarios.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {savedScenarios.map((sc) => (
                  <div
                    key={sc.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: '#fff',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{sc.productName || 'Sem nome'}</div>
                      <small style={{ color: 'var(--muted)' }} className="tabular">
                        Lote {sc.unitsPerBatch} unid. · Sugerido {formatEur(sc.suggestedPriceEur)}
                      </small>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" className="btn btn-sm btn-outline" onClick={() => onLoadScenario(sc)}>
                        Abrir
                      </button>
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => onDeleteScenario(sc.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
