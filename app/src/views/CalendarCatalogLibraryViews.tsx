import {
  BookOpen,
  Calendar,
  Check,
  Copy,
  Download,
  ExternalLink,
  Image as ImageIcon,
  MessageCircle,
  Plus,
  Printer,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type {
  CatalogConfig,
  CustomCalendarTask,
  Order,
  ProtectedContentPayload,
  Recipe,
} from '../types/content';
import { buildCatalogWhatsappText, exportCatalogAsPng } from '../utils/catalogExport';
import { formatEur } from '../utils/scaling';

const PHASE_LABELS: Record<CustomCalendarTask['phase'], string> = {
  preparacao: 'Preparação & Recheios',
  fermentacao: 'Amassadura & Fermentação',
  cozedura: 'Forno & Tombamento',
  embalamento: 'Rechear & Embalar',
  entrega: 'Entregas & Levantamentos',
};

export function CalendarView({
  content,
  orders,
  customTasks,
  completedWeekendIds,
  onToggleWeekendStep,
  onAddCustomTask,
  onToggleCustomTask,
  onDeleteCustomTask,
}: {
  content: ProtectedContentPayload;
  orders: Order[];
  customTasks: CustomCalendarTask[];
  completedWeekendIds: string[];
  onToggleWeekendStep: (id: string) => void;
  onAddCustomTask: (task: CustomCalendarTask) => void;
  onToggleCustomTask: (id: string) => void;
  onDeleteCustomTask: (id: string) => void;
}) {
  const [tab, setTab] = useState<'encomendas' | 'fim-semana'>('encomendas');
  const [date, setDate] = useState('2026-12-19');
  const [time, setTime] = useState('14:30');
  const [phase, setPhase] = useState<CustomCalendarTask['phase']>('fermentacao');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');

  // Auto-group active orders by delivery date so user sees real bake windows
  const ordersByDate = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const o of orders) {
      if (o.status === 'cancelada') continue;
      const list = map.get(o.deliveryDate) || [];
      list.push(o);
      map.set(o.deliveryDate, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [orders]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddCustomTask({
      id: `tsk-${Date.now()}`,
      date,
      time,
      phase,
      title: title.trim(),
      detail: detail.trim(),
      done: false,
    });
    setTitle('');
    setDetail('');
  };

  return (
    <div>
      <div className="section-header">
        <h2>Calendário de Produção & Entregas</h2>
      </div>

      <div className="chip-row">
        <button type="button" className={`chip ${tab === 'encomendas' ? 'active' : ''}`} onClick={() => setTab('encomendas')}>
          Agenda & Tarefas Reais ({ordersByDate.length} dias c/ entregas)
        </button>
        <button type="button" className={`chip ${tab === 'fim-semana' ? 'active' : ''}`} onClick={() => setTab('fim-semana')}>
          Plano Padrão 30 Unid. (Módulo 06)
        </button>
      </div>

      {tab === 'encomendas' ? (
        <div className="grid-2">
          <div>
            <div className="card card-wine-top">
              <h3 style={{ marginTop: 0, color: 'var(--wine)' }}>Entregas & Janelas de Forno Derivadas</h3>
              {ordersByDate.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                  Assim que registar pedidos em <strong>Encomendas</strong>, cada data de entrega aparecerá aqui com a contagem automática para preparar a véspera (recheios + forno + tombamento nocturno).
                </p>
              ) : (
                ordersByDate.map(([d, dayOrders]) => {
                  const totalUnits = dayOrders.reduce(
                    (s, o) => s + o.items.reduce((acc, i) => acc + i.quantity, 0),
                    0
                  );
                  return (
                    <div key={d} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: 'var(--wine-deep)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={15} /> Entrega: {d}
                        </strong>
                        <span className="badge badge-gold">{totalUnits} unid. · {dayOrders.length} pedidos</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 0' }}>
                        Produção recomendada: cozinhar recheios 2 dias antes · assar + tombamento na véspera (8–12 h).
                      </div>
                      {dayOrders.map((o) => (
                        <div key={o.id} style={{ fontSize: 12.5, paddingLeft: 8, borderLeft: '2px solid var(--gold)', marginTop: 4 }}>
                          <strong>{o.deliveryTime}</strong> — {o.customerName} ({o.items.map((i) => `${i.quantity}× ${i.recipeTitle}`).join(', ')})
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0, color: 'var(--wine)' }}>As Suas Tarefas ({customTasks.length})</h3>
              {customTasks.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>Adicione blocos de fermentação, fornadas ou compras no formulário ao lado.</p>
              ) : (
                [...customTasks]
                  .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
                  .map((t) => (
                    <div key={t.id} className={`check-item ${t.done ? 'done' : ''}`} style={{ justifyContent: 'space-between' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, cursor: 'pointer' }}>
                        <input type="checkbox" checked={t.done} onChange={() => onToggleCustomTask(t.id)} />
                        <span>
                          <span className="badge badge-wine" style={{ marginRight: 6 }}>{PHASE_LABELS[t.phase]}</span>
                          <strong>{t.date} · {t.time}</strong> — {t.title}
                          {t.detail && (
                            <>
                              <br />
                              <small style={{ color: 'var(--muted)' }}>{t.detail}</small>
                            </>
                          )}
                        </span>
                      </label>
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => onDeleteCustomTask(t.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>

          <form onSubmit={handleAddTask} className="card card-gold-top">
            <h3 style={{ marginTop: 0, color: 'var(--wine)' }}>Nova Tarefa de Cozinha / Entrega</h3>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="tsk-date">Data</label>
                <input id="tsk-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="tsk-time">Hora</label>
                <input id="tsk-time" type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="tsk-phase">Etapa</label>
              <select id="tsk-phase" className="select" value={phase} onChange={(e) => setPhase(e.target.value as CustomCalendarTask['phase'])}>
                {Object.entries(PHASE_LABELS).map(([k, lbl]) => (
                  <option key={k} value={k}>
                    {lbl}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="tsk-title">Tarefa *</label>
              <input
                id="tsk-title"
                type="text"
                required
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Fazer ganache e creme de leite em pó"
              />
            </div>
            <div className="field">
              <label htmlFor="tsk-detail">Detalhes</label>
              <input
                id="tsk-detail"
                type="text"
                className="input"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="Ex.: Cobrir em contacto e refrigerar até amanhã"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">
              <Plus size={16} /> Adicionar ao Calendário
            </button>
          </form>
        </div>
      ) : (
        <div className="card">
          <h3 style={{ marginTop: 0, color: 'var(--wine)' }}>Roteiro Operacional de Fim de Semana (30 Unidades · Módulo 06)</h3>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            Sequência validada para 1 forno doméstico (4 formas de 500 g por tabuleiro):
          </p>
          {content.weekendSchedule.map((blk) => {
            const done = completedWeekendIds.includes(blk.id);
            return (
              <label key={blk.id} className={`check-item ${done ? 'done' : ''}`}>
                <input type="checkbox" checked={done} onChange={() => onToggleWeekendStep(blk.id)} />
                <span>
                  <span className="badge badge-gold" style={{ marginRight: 6 }}>{blk.day} · {blk.timeSlot}</span>
                  <strong>{blk.title}</strong>
                  <br />
                  <small style={{ color: 'var(--muted)' }}>{blk.detail}</small>
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CatalogView({
  recipes,
  config,
  onChange,
}: {
  recipes: Recipe[];
  config: CatalogConfig;
  onChange: (next: CatalogConfig) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [exportingPng, setExportingPng] = useState(false);

  const whatsappText = useMemo(() => buildCatalogWhatsappText(config), [config]);

  const handlePng = async () => {
    setExportingPng(true);
    try {
      await exportCatalogAsPng(config);
    } finally {
      setExportingPng(false);
    }
  };

  return (
    <div>
      <div className="section-header">
        <h2>Catálogo de Natal Personalizável</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-sm btn-primary" disabled={exportingPng} onClick={handlePng}>
            <ImageIcon size={15} /> {exportingPng ? 'A gerar PNG...' : 'Exportar Imagem PNG'}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-wine"
          >
            <MessageCircle size={15} /> Partilhar WhatsApp
          </a>
          <button type="button" className="btn btn-sm btn-outline no-print" onClick={() => window.print()}>
            <Printer size={15} /> PDF / Imprimir
          </button>
        </div>
      </div>

      <div className="grid-2">
        {/* Editor */}
        <div className="card card-wine-top no-print">
          <h3 style={{ marginTop: 0, color: 'var(--wine)' }}>Personalizar Dados do Menu</h3>
          <div className="field">
            <label htmlFor="cat-brand">Nome da Sua Marca / Cozinha</label>
            <input
              id="cat-brand"
              type="text"
              className="input"
              value={config.brandName}
              onChange={(e) => onChange({ ...config, brandName: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="cat-tag">Frase / Apresentação</label>
            <input
              id="cat-tag"
              type="text"
              className="input"
              value={config.tagline}
              onChange={(e) => onChange({ ...config, tagline: e.target.value })}
            />
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="cat-zone">Zona / Levantamento</label>
              <input
                id="cat-zone"
                type="text"
                className="input"
                value={config.cityOrPickupZone}
                onChange={(e) => onChange({ ...config, cityOrPickupZone: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="cat-mbw">Número MB WAY</label>
              <input
                id="cat-mbw"
                type="text"
                className="input"
                value={config.mbWayPhone}
                onChange={(e) => onChange({ ...config, mbWayPhone: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 8px' }}>
            <strong style={{ color: 'var(--wine)' }}>Produtos ({config.products.length})</strong>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() =>
                onChange({
                  ...config,
                  products: [
                    ...config.products,
                    {
                      id: `cat-${Date.now()}`,
                      recipeId: 12,
                      tier: 'Clássico & Recheado',
                      name: 'Panetone Creme de Leite em Pó',
                      weightOrSize: '~760 g',
                      description: 'Creme aveludado com cobertura nevada artesanal.',
                      priceEur: 14.5,
                      allergens: 'Glúten, Ovos, Leite',
                    },
                  ],
                })
              }
            >
              <Plus size={14} /> Novo Item
            </button>
          </div>

          {config.products.map((prod, idx) => (
            <div key={prod.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 10, marginBottom: 10, background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginBottom: 6 }}>
                <select
                  className="select"
                  value={prod.recipeId ?? ''}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    const rec = recipes.find((r) => r.id === id);
                    onChange({
                      ...config,
                      products: config.products.map((p, i) =>
                        i === idx
                          ? {
                              ...p,
                              recipeId: id,
                              name: rec ? rec.shortTitle : p.name,
                              allergens: rec ? rec.conservation.allergens.replace('Contém ', '').slice(0, 65) : p.allergens,
                            }
                          : p
                      ),
                    });
                  }}
                >
                  <option value="">Personalizado</option>
                  {recipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      Receita {r.id}: {r.shortTitle}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  disabled={config.products.length <= 1}
                  onClick={() =>
                    onChange({ ...config, products: config.products.filter((_, i) => i !== idx) })
                  }
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid-2">
                <input
                  type="text"
                  className="input"
                  value={prod.name}
                  placeholder="Nome"
                  onChange={(e) =>
                    onChange({
                      ...config,
                      products: config.products.map((p, i) => (i === idx ? { ...p, name: e.target.value } : p)),
                    })
                  }
                />
                <input
                  type="number"
                  min={0}
                  step="0.50"
                  className="input tabular"
                  value={prod.priceEur}
                  aria-label="Preço EUR"
                  onChange={(e) =>
                    onChange({
                      ...config,
                      products: config.products.map((p, i) =>
                        i === idx ? { ...p, priceEur: Math.max(0, Number(e.target.value) || 0) } : p
                      ),
                    })
                  }
                />
              </div>
              <input
                type="text"
                className="input"
                style={{ marginTop: 6 }}
                value={prod.description}
                placeholder="Descrição"
                onChange={(e) =>
                  onChange({
                    ...config,
                    products: config.products.map((p, i) => (i === idx ? { ...p, description: e.target.value } : p)),
                  })
                }
              />
            </div>
          ))}

          <button
            type="button"
            className="btn btn-sm btn-outline btn-block"
            onClick={() => {
              navigator.clipboard?.writeText(whatsappText);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}
          >
            <Copy size={14} /> {copied ? 'Texto do Catálogo Copiado!' : 'Copiar Texto Formatado do Catálogo'}
          </button>
        </div>

        {/* Live Branded Preview Card */}
        <div>
          <div
            style={{
              background: 'linear-gradient(155deg, #4a0d16 0%, #27070d 100%)',
              color: '#fff5e6',
              borderRadius: 20,
              border: '3px solid #e5a93b',
              padding: 20,
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <img src="/icons/logo-brand.png" alt="Logótipo" style={{ width: 92, height: 'auto', margin: '0 auto 6px', display: 'block' }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: '#ffd778', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Catálogo de Natal · Encomenda Primeiro
              </div>
              <h2 style={{ margin: '4px 0', color: '#fff', fontSize: 22 }}>{config.brandName}</h2>
              <p style={{ margin: 0, fontSize: 12.5, color: '#f3dcc0' }}>{config.tagline}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {config.products.map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: '#fffcf7',
                    color: '#27070d',
                    borderRadius: 14,
                    border: '1.5px solid #e5a93b',
                    padding: '11px 13px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: '#7b1928', textTransform: 'uppercase' }}>
                      {p.tier} · {p.weightOrSize}
                    </div>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 16 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#4d3538' }}>{p.description}</div>
                    <div style={{ fontSize: 11, color: '#6c4d52', marginTop: 2 }}>Alergénios: {p.allergens}</div>
                  </div>
                  <div
                    className="tabular"
                    style={{
                      background: '#e5a93b',
                      color: '#27070d',
                      fontWeight: 800,
                      fontSize: 17,
                      padding: '8px 12px',
                      borderRadius: 12,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatEur(p.priceEur)}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 14,
                padding: '10px 12px',
                borderRadius: 12,
                background: 'rgba(229,169,59,0.14)',
                border: '1px solid rgba(229,169,59,0.35)',
                textAlign: 'center',
                fontSize: 12,
              }}
            >
              <strong style={{ color: '#ffd778' }}>{config.depositRule} · MB WAY: {config.mbWayPhone}</strong>
              <div>{config.cityOrPickupZone}</div>
              <div style={{ color: '#f3dcc0' }}>{config.orderDeadline}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LibraryBonusView({
  content,
  completedModules,
  selectedModuleId,
  onSelectModule,
  onToggleModuleDone,
}: {
  content: ProtectedContentPayload;
  completedModules: string[];
  selectedModuleId: string | null;
  onSelectModule: (id: string | null) => void;
  onToggleModuleDone: (id: string) => void;
}) {
  const [subTab, setSubTab] = useState<'downloads' | 'modules' | 'scripts' | 'suppliers'>(
    selectedModuleId ? 'modules' : 'downloads'
  );
  const [copiedId, setCopiedId] = useState('');
  const [dlFilter, setDlFilter] = useState<'all' | 'guias' | 'bonus' | 'materiais' | 'imagens' | 'editaveis'>('all');

  const activeModule = content.modules.find((m) => m.id === (selectedModuleId || content.modules[0]?.id)) || content.modules[0];

  const filteredDownloads = useMemo(
    () => content.downloads.filter((d) => dlFilter === 'all' || d.category === dlFilter),
    [content.downloads, dlFilter]
  );

  return (
    <div>
      <div className="section-header">
        <h2>Bónus, Guias & Materiais</h2>
      </div>

      <div className="chip-row">
        <button type="button" className={`chip ${subTab === 'downloads' ? 'active' : ''}`} onClick={() => setSubTab('downloads')}>
          PDFs & Editáveis ({content.downloads.length})
        </button>
        <button type="button" className={`chip ${subTab === 'modules' ? 'active' : ''}`} onClick={() => setSubTab('modules')}>
          Ler os 6 Módulos & FAQ
        </button>
        <button type="button" className={`chip ${subTab === 'scripts' ? 'active' : ''}`} onClick={() => setSubTab('scripts')}>
          Scripts WhatsApp ({content.whatsappScripts.length})
        </button>
        <button type="button" className={`chip ${subTab === 'suppliers' ? 'active' : ''}`} onClick={() => setSubTab('suppliers')}>
          Fornecedores PT ({content.suppliers.length})
        </button>
      </div>

      {subTab === 'downloads' && (
        <div>
          <div className="chip-row">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'guias', label: 'E-books & Guias' },
              { id: 'bonus', label: '3 Bónus PDF' },
              { id: 'materiais', label: 'Etiquetas & Kits' },
              { id: 'imagens', label: 'Imagens PNG' },
              { id: 'editaveis', label: 'Excel/CSV & HTML' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                className={`chip ${dlFilter === f.id ? 'active' : ''}`}
                onClick={() => setDlFilter(f.id as typeof dlFilter)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid-2">
            {filteredDownloads.map((item) => (
              <div key={item.id} className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-wine">{item.format}</span>
                  <small style={{ color: 'var(--muted)' }}>{item.sizeLabel}</small>
                </div>
                <strong style={{ fontSize: 15, color: 'var(--wine-deep)' }}>{item.title}</strong>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', flex: 1 }}>{item.description}</p>
                <a
                  href={`/api/download?file=${encodeURIComponent(item.fileKey)}`}
                  download={item.fileName}
                  className="btn btn-sm btn-primary"
                >
                  <Download size={14} /> Descarregar {item.format}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'modules' && (
        <div>
          <div className="chip-row">
            {content.modules.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`chip ${activeModule?.id === m.id ? 'active' : ''}`}
                onClick={() => onSelectModule(m.id)}
              >
                {completedModules.includes(m.id) ? '✓ ' : ''}M0{m.number}
              </button>
            ))}
          </div>

          {activeModule && (
            <div className="card card-wine-top">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge badge-gold">Módulo 0{activeModule.number} de 6</span>
                <button
                  type="button"
                  className={`btn btn-sm ${completedModules.includes(activeModule.id) ? 'btn-wine' : 'btn-primary'}`}
                  onClick={() => onToggleModuleDone(activeModule.id)}
                >
                  <Check size={14} />
                  {completedModules.includes(activeModule.id) ? 'Concluído' : 'Marcar como Concluído'}
                </button>
              </div>
              <h2 style={{ color: 'var(--wine)', marginBottom: 6 }}>{activeModule.title}</h2>
              {activeModule.objective && (
                <div className="notice">
                  <strong>Objetivo:</strong> {activeModule.objective}
                </div>
              )}

              {activeModule.sections.map((sec, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <h3 style={{ color: 'var(--wine-soft)', marginBottom: 4 }}>
                    <BookOpen size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                    {sec.heading}
                  </h3>
                  <div style={{ fontSize: 13.5, whiteSpace: 'pre-line', color: 'var(--ink)' }}>
                    {sec.bodyMarkdown
                      .replace(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/g, '')
                      .replace(/^>\s?/gm, '')
                      .replace(/`([^`]+)`/g, '$1')
                      .replace(/\*\*([^*]+)\*\*/g, '$1')}
                  </div>
                </div>
              ))}

              {activeModule.actionChecklist.length > 0 && (
                <div className="notice notice-green" style={{ marginBottom: 0 }}>
                  <strong>Resumo de Ação:</strong>
                  <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                    {activeModule.actionChecklist.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="card">
            <h3 style={{ marginTop: 0, color: 'var(--wine)' }}>Perguntas Frequentes & Legalidade PT</h3>
            {content.faqItems.map((f, i) => (
              <div key={i} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 8 }}>
                <strong style={{ color: 'var(--wine-deep)', fontSize: 13.5 }}>{f.question}</strong>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>{f.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'scripts' && (
        <div className="grid-2">
          {content.whatsappScripts.map((sc) => (
            <div key={sc.id} className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="badge badge-gold">{sc.category}</span>
              <strong style={{ color: 'var(--wine-deep)', fontSize: 14.5 }}>{sc.title}</strong>
              <p style={{ margin: 0, fontSize: 13, whiteSpace: 'pre-line', flex: 1 }}>{sc.text}</p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    navigator.clipboard?.writeText(sc.text);
                    setCopiedId(sc.id);
                    setTimeout(() => setCopiedId(''), 1800);
                  }}
                >
                  <Copy size={14} /> {copiedId === sc.id ? 'Copiado!' : 'Copiar Script'}
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(sc.text)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline"
                >
                  <MessageCircle size={14} /> Enviar
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === 'suppliers' && (
        <div className="grid-2">
          {content.suppliers.map((sup, i) => (
            <div key={i} className="card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span className="badge badge-wine">{sup.category.split('—')[0]}</span>
                <small style={{ color: 'var(--muted)' }}>Verif. {sup.verifiedAt}</small>
              </div>
              <strong style={{ fontSize: 16, color: 'var(--wine-deep)' }}>{sup.name}</strong>
              <div style={{ fontSize: 12, color: 'var(--wine-soft)', margin: '3px 0' }}>{sup.accessType}</div>
              <p style={{ fontSize: 13, margin: '6px 0' }}>{sup.products}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {sup.urls.map((u) => (
                  <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
                    <ExternalLink size={13} /> {u.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
