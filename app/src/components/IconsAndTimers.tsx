import { Bell, Check, ChevronDown, ChevronUp, Pause, Play, Plus, RotateCcw, Trash2, Volume2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Recipe } from '../types/content';
import type { ScaledIngredient } from '../utils/scaling';

export interface KitchenTimer {
  id: string;
  label: string;
  durationSec: number;
  remainingSec: number;
  running: boolean;
  finished: boolean;
}

export function HollyDecoration({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 14C12 10 6 11 4 15C8 16 11 19 16 17Z" fill="#2f6f3e" />
      <path d="M16 14C20 10 26 11 28 15C24 16 21 19 16 17Z" fill="#265b32" />
      <circle cx="14" cy="18" r="2.6" fill="#c72c38" />
      <circle cx="18.2" cy="18" r="2.6" fill="#d93844" />
      <circle cx="16.1" cy="15" r="2.4" fill="#e54854" />
    </svg>
  );
}

export function playChimeTone() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [587.33, 880, 1174.66];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, ctx.currentTime + i * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + i * 0.16 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.16 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.16);
      osc.stop(ctx.currentTime + i * 0.16 + 0.48);
    });
  } catch {
    // Audio playback blocked or unavailable
  }
}

export function formatMmSs(totalSec: number): string {
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hrs > 0) {
    return `${hrs}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function FloatingTimerTray({
  timers,
  onToggle,
  onReset,
  onRemove,
}: {
  timers: KitchenTimer[];
  onToggle: (id: string) => void;
  onReset: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [minimized, setMinimized] = useState(false);

  if (timers.length === 0) return null;

  const primary = timers.find((t) => t.finished) || timers.find((t) => t.running) || timers[0];

  if (minimized) {
    return (
      <div className="floating-timers floating-timers--minimized no-print" role="region" aria-label="Temporizadores ativos">
        <button
          type="button"
          onClick={() => setMinimized(false)}
          aria-label="Expandir temporizadores"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--ivory)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            padding: '2px 4px',
            fontWeight: 700,
            fontSize: 12.5,
          }}
        >
          <Bell size={14} color="var(--gold-light)" />
          <span>{timers.length} timer{timers.length > 1 ? 's' : ''}</span>
          <span className="tabular" style={{ color: primary.finished ? '#ffd778' : 'var(--gold-light)' }}>
            {primary.finished ? 'CONCLUÍDO!' : formatMmSs(primary.remainingSec)}
          </span>
          <ChevronUp size={15} color="var(--gold-light)" />
        </button>
      </div>
    );
  }

  return (
    <div className="floating-timers no-print" role="region" aria-label="Temporizadores ativos">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold-light)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Bell size={14} /> Temporizadores de Cozinha ({timers.length})
        </span>
        <button
          type="button"
          onClick={() => setMinimized(true)}
          aria-label="Minimizar temporizadores"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'var(--cream)',
            border: '1px solid rgba(229, 169, 59, 0.35)',
            borderRadius: 999,
            padding: '3px 8px',
            fontSize: 11,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
          }}
        >
          Minimizar <ChevronDown size={13} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {timers.map((t) => (
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              background: t.finished ? 'rgba(229, 169, 59, 0.25)' : 'rgba(255, 255, 255, 0.08)',
              padding: '6px 10px',
              borderRadius: 10,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t.label}
              </div>
              <div className="tabular" style={{ fontSize: 15, fontWeight: 800, color: t.finished ? '#ffd778' : '#fff' }}>
                {t.finished ? 'CONCLUÍDO!' : formatMmSs(t.remainingSec)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              <button className="btn btn-sm btn-primary" onClick={() => onToggle(t.id)} aria-label={t.running ? 'Pausar' : 'Iniciar'}>
                {t.running ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button className="btn btn-sm btn-outline" onClick={() => onReset(t.id)} aria-label="Reiniciar">
                <RotateCcw size={14} />
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => onRemove(t.id)} aria-label="Eliminar">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function KitchenModeModal({
  recipe,
  targetUnits,
  scaledIngredients,
  timers,
  onAddTimer,
  onToggleTimer,
  onRemoveTimer,
  onClose,
}: {
  recipe: Recipe;
  targetUnits: number;
  scaledIngredients: ScaledIngredient[];
  timers: KitchenTimer[];
  onAddTimer: (label: string, minutes: number) => void;
  onToggleTimer: (id: string) => void;
  onRemoveTimer: (id: string) => void;
  onClose: () => void;
}) {
  const [stepIdx, setStepIdx] = useState(0);
  const [doneSteps, setDoneSteps] = useState<number[]>([]);
  const [checkedIngs, setCheckedIngs] = useState<string[]>([]);
  const [showIngredients, setShowIngredients] = useState(false);
  const [wakeActive, setWakeActive] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('15');

  const currentStep = recipe.steps[stepIdx];
  const progressPct = Math.round(((doneSteps.length) / Math.max(1, recipe.steps.length)) * 100);

  useEffect(() => {
    let sentinel: { release: () => Promise<void> } | null = null;
    if ('wakeLock' in navigator) {
      (navigator as unknown as { wakeLock: { request: (t: string) => Promise<{ release: () => Promise<void> }> } })
        .wakeLock.request('screen')
        .then((s) => {
          sentinel = s;
          setWakeActive(true);
        })
        .catch(() => setWakeActive(false));
    }
    return () => {
      if (sentinel) sentinel.release().catch(() => {});
    };
  }, []);

  const toggleStepDone = (num: number) => {
    setDoneSteps((prev) => (prev.includes(num) ? prev.filter((x) => x !== num) : [...prev, num]));
  };

  const toggleIng = (id: string) => {
    setCheckedIngs((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="kitchen-overlay" role="dialog" aria-modal="true" aria-label={`Modo Cozinha: ${recipe.shortTitle}`}>
      <div className="kitchen-header">
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-light)' }}>
            MODO COZINHA · {targetUnits} {recipe.unitTypeLabel} {wakeActive ? '· Ecrã Ativo' : ''}
          </div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 17 }}>{recipe.shortTitle}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => setShowIngredients((s) => !s)}
          >
            {showIngredients ? 'Ver Passo' : `Ingredientes (${checkedIngs.length}/${scaledIngredients.length})`}
          </button>
          <button className="btn btn-sm btn-outline" onClick={onClose} aria-label="Fechar Modo Cozinha">
            <X size={16} /> Sair
          </button>
        </div>
      </div>

      <div className="kitchen-body">
        {/* Progress bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gold-light)', marginBottom: 4 }}>
            <span>Passo {stepIdx + 1} de {recipe.steps.length}</span>
            <span>{progressPct}% concluído</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.14)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${Math.max(8, progressPct)}%`, height: '100%', background: 'var(--gold)', transition: 'width 0.2s ease' }} />
          </div>
        </div>

        {/* Step Pills */}
        <div className="chip-row" style={{ marginBottom: 12 }}>
          {recipe.steps.map((st, idx) => {
            const isDone = doneSteps.includes(st.number);
            return (
              <button
                key={st.number}
                className={`chip ${idx === stepIdx ? 'active' : ''}`}
                style={{
                  background: idx === stepIdx ? 'var(--gold)' : isDone ? '#1d6f42' : 'rgba(255,255,255,0.1)',
                  color: idx === stepIdx ? '#27070d' : '#fff',
                  borderColor: 'rgba(229,169,59,0.4)',
                }}
                onClick={() => {
                  setStepIdx(idx);
                  setShowIngredients(false);
                }}
              >
                {isDone ? '✓ ' : ''}{st.number}. {st.title.slice(0, 22)}
              </button>
            );
          })}
        </div>

        {showIngredients ? (
          <div className="kitchen-step-box">
            <h2 style={{ marginTop: 0, color: 'var(--wine)' }}>Checklist de Bancada ({targetUnits} {recipe.unitTypeLabel})</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Toque para riscar os ingredientes já pesados (Mise en Place):</p>
            {scaledIngredients.map((ing) => {
              const checked = checkedIngs.includes(ing.id);
              return (
                <label key={ing.id} className={`check-item ${checked ? 'done' : ''}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggleIng(ing.id)} />
                  <span>
                    <strong>{ing.formattedQuantity}</strong> — {ing.name} <small>({ing.group})</small>
                  </span>
                </label>
              );
            })}
            <h3 style={{ color: 'var(--wine)' }}>Utensílios Necessários</h3>
            <ul>
              {recipe.utensils.map((u, i) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
          </div>
        ) : (
          currentStep && (
            <div className="kitchen-step-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span className="badge badge-wine">PASSO {currentStep.number} DE {recipe.steps.length}</span>
                <span className="badge badge-gold">{recipe.ovenTemp}</span>
              </div>
              <h2 style={{ margin: '0 0 10px', fontSize: 22, color: 'var(--wine-deep)' }}>{currentStep.title}</h2>
              <p style={{ fontSize: 17.5, lineHeight: 1.6, margin: '0 0 16px' }}>{currentStep.text}</p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                <button
                  className={`btn ${doneSteps.includes(currentStep.number) ? 'btn-wine' : 'btn-outline'}`}
                  onClick={() => toggleStepDone(currentStep.number)}
                >
                  <Check size={16} />
                  {doneSteps.includes(currentStep.number) ? 'Passo Concluído' : 'Marcar Passo Concluído'}
                </button>

                {currentStep.suggestedMinutes.map((mins) => (
                  <button
                    key={mins}
                    className="btn btn-primary"
                    onClick={() => onAddTimer(`Passo ${currentStep.number}: ${currentStep.title}`, mins)}
                  >
                    <Bell size={16} /> Timer {mins} min
                  </button>
                ))}
              </div>

              {/* Manual quick timer */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)' }}>Timer livre (min):</span>
                <input
                  type="number"
                  min={1}
                  max={720}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="input"
                  style={{ width: 86, minHeight: 38 }}
                />
                <button
                  className="btn btn-sm btn-wine"
                  onClick={() => {
                    const m = Number(customMinutes);
                    if (m > 0) onAddTimer(`${recipe.shortTitle} · ${m}m`, m);
                  }}
                >
                  <Plus size={14} /> Iniciar
                </button>
                <button className="btn btn-sm btn-ghost" onClick={playChimeTone}>
                  <Volume2 size={14} /> Testar Alarme
                </button>
              </div>
            </div>
          )
        )}

        {/* Active timers inside kitchen mode */}
        {timers.length > 0 && (
          <div className="card" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', borderColor: 'var(--gold)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold-light)', marginBottom: 8 }}>Temporizadores a Correr</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {timers.map((t) => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 13 }}>{t.label}</div>
                    <strong className="tabular" style={{ fontSize: 18, color: t.finished ? '#ffd778' : '#fff' }}>
                      {t.finished ? 'TEMPO TERMINADO!' : formatMmSs(t.remainingSec)}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm btn-primary" onClick={() => onToggleTimer(t.id)}>
                      {t.running ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => onRemoveTimer(t.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="kitchen-footer">
        <button
          className="btn btn-outline"
          disabled={stepIdx === 0}
          onClick={() => {
            setShowIngredients(false);
            setStepIdx((i) => Math.max(0, i - 1));
          }}
        >
          ← Anterior
        </button>
        {stepIdx < recipe.steps.length - 1 ? (
          <button
            className="btn btn-primary"
            onClick={() => {
              if (currentStep && !doneSteps.includes(currentStep.number)) toggleStepDone(currentStep.number);
              setShowIngredients(false);
              setStepIdx((i) => Math.min(recipe.steps.length - 1, i + 1));
            }}
          >
            Próximo Passo →
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={() => {
              if (currentStep && !doneSteps.includes(currentStep.number)) toggleStepDone(currentStep.number);
              onClose();
            }}
          >
            <Check size={16} /> Concluir Receita
          </button>
        )}
      </div>
    </div>
  );
}
