import {
  AlertTriangle,
  ArrowLeft,
  Calculator,
  ChefHat,
  Clock,
  Flame,
  Heart,
  Minus,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Recipe, RecipeCategory } from '../types/content';
import { formatEur, scaleIngredients } from '../utils/scaling';

const CATEGORIES: { id: 'all' | 'favorites' | RecipeCategory; label: string }[] = [
  { id: 'all', label: 'Todas (30)' },
  { id: 'favorites', label: 'Favoritas' },
  { id: 'massas-base', label: 'Massas Base' },
  { id: 'classicos-frutados', label: 'Clássicos & Frutados' },
  { id: 'recheados-premium', label: 'Recheados' },
  { id: 'mini-panetones', label: 'Minis' },
  { id: 'panetone-no-copo', label: 'No Copo' },
];

export function RecipesView({
  recipes,
  favorites,
  selectedRecipeId,
  onSelectRecipe,
  onToggleFavorite,
  onOpenKitchenMode,
  onSendToCalculator,
}: {
  recipes: Recipe[];
  favorites: number[];
  selectedRecipeId: number | null;
  onSelectRecipe: (id: number | null) => void;
  onToggleFavorite: (id: number) => void;
  onOpenKitchenMode: (recipe: Recipe, targetUnits: number) => void;
  onSendToCalculator: (recipe: Recipe) => void;
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | 'favorites' | RecipeCategory>('all');
  const [targetUnits, setTargetUnits] = useState<number>(2);

  const selectedRecipe = useMemo(
    () => recipes.find((r) => r.id === selectedRecipeId) || null,
    [recipes, selectedRecipeId]
  );

  const handleOpenRecipe = (r: Recipe) => {
    setTargetUnits(r.baseYieldUnits);
    onSelectRecipe(r.id);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return recipes.filter((r) => {
      if (category === 'favorites' && !favorites.includes(r.id)) return false;
      if (category !== 'all' && category !== 'favorites' && r.category !== category) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.blockSubtitle.toLowerCase().includes(q) ||
        r.ingredients.some((i) => i.raw.toLowerCase().includes(q))
      );
    });
  }, [recipes, favorites, category, search]);

  if (selectedRecipe) {
    const scaledIngredients = scaleIngredients(selectedRecipe, targetUnits);
    const groups = Array.from(new Set(scaledIngredients.map((i) => i.group)));
    const factor = (targetUnits / Math.max(1, selectedRecipe.baseYieldUnits)).toFixed(2).replace(/\.00$/, '').replace('.', ',');
    const isFav = favorites.includes(selectedRecipe.id);

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 }}>
          <button type="button" className="btn btn-sm btn-outline" onClick={() => onSelectRecipe(null)}>
            <ArrowLeft size={15} /> Todas as Receitas
          </button>
          <button
            type="button"
            className={`btn btn-sm ${isFav ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onToggleFavorite(selectedRecipe.id)}
          >
            <Heart size={15} fill={isFav ? 'currentColor' : 'none'} />
            {isFav ? 'Favorita' : 'Guardar Favorita'}
          </button>
        </div>

        <div className="hero-banner" style={{ padding: 16 }}>
          <span className="badge badge-gold" style={{ marginBottom: 6 }}>
            Ficha {String(selectedRecipe.id).padStart(2, '0')}/30 · {selectedRecipe.categoryLabel}
          </span>
          <h1 style={{ fontSize: 22 }}>{selectedRecipe.title}</h1>
          <p>{selectedRecipe.blockSubtitle}</p>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onOpenKitchenMode(selectedRecipe, targetUnits)}
            >
              <ChefHat size={17} /> Abrir Modo Cozinha ({targetUnits} unid.)
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', borderColor: 'rgba(229,169,59,0.5)' }}
              onClick={() => onSendToCalculator(selectedRecipe)}
            >
              <Calculator size={16} /> Calcular Preço (€)
            </button>
          </div>
        </div>

        {/* Metadata tiles */}
        <div className="kpi-grid">
          <div className="kpi-tile">
            <div className="kpi-label">Rendimento Base</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{selectedRecipe.yieldText}</div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-label">Dificuldade</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{selectedRecipe.difficulty}</div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-label">Tempos</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              {selectedRecipe.activeTime} · {selectedRecipe.totalTime}
            </div>
          </div>
          <div className="kpi-tile">
            <div className="kpi-label">Forno & Miolo</div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{selectedRecipe.ovenTemp}</div>
          </div>
        </div>

        {/* 4. Ajustar Quantidades */}
        <div className="card card-gold-top">
          <div className="section-header" style={{ marginBottom: 8 }}>
            <h2>Ajustar Quantidades ({selectedRecipe.unitTypeLabel})</h2>
            <span className="badge badge-wine">Escala ×{factor}</span>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 0 }}>
            Escolha quantas unidades pretende produzir; todas as gramas e mililitros abaixo recalculam automaticamente:
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setTargetUnits((u) => Math.max(1, u - 1))}
                aria-label="Diminuir unidades"
              >
                <Minus size={15} />
              </button>
              <input
                type="number"
                min={1}
                max={120}
                value={targetUnits}
                onChange={(e) => setTargetUnits(Math.max(1, Number(e.target.value) || 1))}
                className="input tabular"
                style={{ width: 78, textAlign: 'center', fontWeight: 800, minHeight: 38 }}
                aria-label="Quantidade de unidades"
              />
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setTargetUnits((u) => Math.min(120, u + 1))}
                aria-label="Aumentar unidades"
              >
                <Plus size={15} />
              </button>
            </div>
            {[selectedRecipe.baseYieldUnits, selectedRecipe.baseYieldUnits * 2, selectedRecipe.baseYieldUnits * 4, 10, 30]
              .filter((v, idx, arr) => v > 0 && arr.indexOf(v) === idx)
              .slice(0, 4)
              .map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`chip ${targetUnits === preset ? 'active' : ''}`}
                  onClick={() => setTargetUnits(preset)}
                >
                  {preset} unid.
                </button>
              ))}
          </div>
        </div>

        <div className="grid-2">
          {/* Ingredients scaled */}
          <div className="card card-wine-top">
            <h3 style={{ marginTop: 0, color: 'var(--wine)' }}>
              Ingredientes Recalculados ({targetUnits} {selectedRecipe.unitTypeLabel})
            </h3>
            {groups.map((grp) => (
              <div key={grp} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--wine-soft)', textTransform: 'uppercase', marginBottom: 4 }}>
                  {grp}
                </div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {scaledIngredients
                    .filter((i) => i.group === grp)
                    .map((i) => (
                      <li key={i.id} style={{ marginBottom: 5, fontSize: 13.5 }}>
                        {i.referencesBaseRecipe ? (
                          <span>{i.formattedQuantity}</span>
                        ) : (
                          <span>
                            <strong className="tabular">{i.formattedQuantity}</strong> — {i.name}
                          </span>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
            <h4 style={{ marginBottom: 6, color: 'var(--wine)' }}>Utensílios</h4>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
              {selectedRecipe.utensils.map((u, i) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
          </div>

          {/* Steps + Safety */}
          <div>
            <div className="card">
              <div className="section-header">
                <h2>Preparação Passo a Passo</h2>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => onOpenKitchenMode(selectedRecipe, targetUnits)}
                >
                  <Sparkles size={14} /> Modo Focado
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedRecipe.steps.map((st) => (
                  <div key={st.number} style={{ borderBottom: '1px solid #f0e3d0', paddingBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <strong style={{ color: 'var(--wine)' }}>
                        {st.number}. {st.title}
                      </strong>
                      {st.suggestedMinutes.length > 0 && (
                        <span className="badge badge-gold">{st.suggestedMinutes[0]} min</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13.5 }}>{st.text}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--wine)' }}>
              <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--wine)' }}>
                <AlertTriangle size={16} /> Conservação, Alergénios & Validação
              </h3>
              <p style={{ fontSize: 13 }}><strong>Conservação orientativa:</strong> {selectedRecipe.conservation.shelfLife}</p>
              <p style={{ fontSize: 13 }}><strong>Alergénios (Reg. UE 1169/2011):</strong> {selectedRecipe.conservation.allergens}</p>
              {selectedRecipe.errorsAndTesting.commonErrors && (
                <p style={{ fontSize: 13 }}><strong>Erros comuns a evitar:</strong> {selectedRecipe.errorsAndTesting.commonErrors}</p>
              )}
              <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 0 }}>
                {selectedRecipe.errorsAndTesting.testingNotice}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <h2>30 Receitas & Fichas Técnicas</h2>
        <span className="badge badge-wine">{filtered.length} mostradas</span>
      </div>

      <div className="field">
        <div style={{ position: 'relative' }}>
          <Search
            size={17}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}
          />
          <input
            type="search"
            className="input"
            style={{ paddingLeft: 38 }}
            placeholder="Pesquisar sabor, ingrediente (ex: avelã, pistácio, frutas)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Pesquisar receitas"
          />
        </div>
      </div>

      <div className="chip-row" role="tablist" aria-label="Filtrar por categoria">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`chip ${category === cat.id ? 'active' : ''}`}
            onClick={() => setCategory(cat.id)}
          >
            {cat.label}
            {cat.id === 'favorites' ? ` (${favorites.length})` : ''}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 28 }}>
          <p style={{ margin: '0 0 10px', fontWeight: 600 }}>Nenhuma receita encontrada para este filtro.</p>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => {
              setSearch('');
              setCategory('all');
            }}
          >
            Limpar Filtros
          </button>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map((r) => {
            const isFav = favorites.includes(r.id);
            return (
              <article key={r.id} className="recipe-card">
                <div className="recipe-card-img-wrap">
                  <img src={r.image} alt={r.shortTitle} className="recipe-card-img" loading="lazy" />
                  <button
                    type="button"
                    className="recipe-fav-btn"
                    onClick={() => onToggleFavorite(r.id)}
                    aria-label={isFav ? `Remover ${r.shortTitle} das favoritas` : `Adicionar ${r.shortTitle} às favoritas`}
                  >
                    <Heart size={16} fill={isFav ? '#ffd778' : 'none'} />
                  </button>
                  <span
                    className="badge badge-gold"
                    style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(39,7,13,0.88)', color: '#ffd778' }}
                  >
                    #{String(r.id).padStart(2, '0')} · {r.packageType.toUpperCase()}
                  </span>
                </div>
                <div className="recipe-card-body">
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--wine-soft)' }}>{r.categoryLabel}</div>
                  <h3 className="recipe-card-title">{r.title}</h3>
                  <div className="recipe-meta-line">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <Clock size={12} /> {r.activeTime}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <Flame size={12} /> {r.ovenTemp.split('|')[0].trim()}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    Base: {r.baseYieldUnits} {r.unitTypeLabel} · Ref. ilus.: {formatEur(r.defaultReferencePriceEur)}
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', gap: 6 }}>
                    <button type="button" className="btn btn-sm btn-wine" style={{ flex: 1 }} onClick={() => handleOpenRecipe(r)}>
                      Ver & Ajustar
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => onOpenKitchenMode(r, r.baseYieldUnits)}
                      aria-label={`Modo Cozinha ${r.shortTitle}`}
                    >
                      <ChefHat size={15} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
