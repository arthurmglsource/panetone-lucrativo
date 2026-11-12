import {
  Check,
  Copy,
  Download,
  Edit3,
  MessageCircle,
  Plus,
  Printer,
  ShoppingBasket,
  Trash2,
  Upload,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Order, OrderItem, OrderStatus, ProtectedContentPayload, Recipe } from '../types/content';
import {
  buildShoppingListFromPlan,
  buildShoppingPlanFromOrders,
  formatEur,
} from '../utils/scaling';
import { ordersToCsv } from '../utils/storage';

const STATUS_LABELS: Record<OrderStatus, string> = {
  'pendente-sinal': 'Pendente Sinal',
  confirmada: 'Confirmada (Sinal OK)',
  'em-producao': 'Em Produção',
  pronta: 'Pronta p/ Entrega',
  entregue: 'Entregue',
  cancelada: 'Cancelada',
};

const STATUS_BADGE: Record<OrderStatus, string> = {
  'pendente-sinal': 'badge-gold',
  confirmada: 'badge-green',
  'em-producao': 'badge-wine',
  pronta: 'badge-green',
  entregue: 'badge-green',
  cancelada: 'badge-danger',
};

function normalizePtPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('351')) return digits;
  if (digits.length === 9) return `351${digits}`;
  return digits;
}

export function OrdersView({
  recipes,
  orders,
  mbWayPhone,
  onSaveOrder,
  onDeleteOrder,
  onToggleDepositPaid,
  onStatusChange,
  onGoToShoppingList,
  onExportBackup,
  onImportBackup,
}: {
  recipes: Recipe[];
  orders: Order[];
  mbWayPhone: string;
  onSaveOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  onToggleDepositPaid: (id: string) => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onGoToShoppingList: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
}) {
  const [filterStatus, setFilterStatus] = useState<'all' | OrderStatus>('all');
  const [search, setSearch] = useState('');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [copiedId, setCopiedId] = useState('');

  // Form states when modal/drawer open
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [items, setItems] = useState<OrderItem[]>([
    { recipeId: 11, recipeTitle: 'Chocotone Duplo Chocolate Cremoso', quantity: 1, unitPriceEur: 15.0 },
  ]);
  const [depositPercent, setDepositPercent] = useState(50);
  const [depositPaid, setDepositPaid] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('2026-12-20');
  const [deliveryTime, setDeliveryTime] = useState('15:00');
  const [deliveryMethod, setDeliveryMethod] = useState<'levantamento' | 'entrega'>('levantamento');
  const [status, setStatus] = useState<OrderStatus>('pendente-sinal');
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);

  const openNewForm = () => {
    setEditingOrder(null);
    setCustomerName('');
    setCustomerPhone('');
    const r11 = recipes.find((r) => r.id === 11) || recipes[0];
    setItems([
      {
        recipeId: r11.id,
        recipeTitle: r11.shortTitle,
        quantity: 1,
        unitPriceEur: r11.defaultReferencePriceEur,
      },
    ]);
    setDepositPercent(50);
    setDepositPaid(false);
    setDeliveryDate('2026-12-20');
    setDeliveryTime('15:00');
    setDeliveryMethod('levantamento');
    setStatus('pendente-sinal');
    setNotes('');
    setShowForm(true);
  };

  const openEditForm = (o: Order) => {
    setEditingOrder(o);
    setCustomerName(o.customerName);
    setCustomerPhone(o.customerPhone);
    setItems(o.items.length ? o.items : []);
    setDepositPercent(o.depositPercent);
    setDepositPaid(o.depositPaid);
    setDeliveryDate(o.deliveryDate);
    setDeliveryTime(o.deliveryTime);
    setDeliveryMethod(o.deliveryMethod);
    setStatus(o.status);
    setNotes(o.notes);
    setShowForm(true);
  };

  const formTotalEur = useMemo(
    () => items.reduce((s, it) => s + Math.max(0, it.quantity) * Math.max(0, it.unitPriceEur), 0),
    [items]
  );
  const formDepositEur = Math.round(formTotalEur * (depositPercent / 100) * 100) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || items.length === 0) return;
    const now = new Date().toISOString();
    const cleanStatus: OrderStatus = depositPaid && status === 'pendente-sinal' ? 'confirmada' : status;
    const newOrder: Order = {
      id: editingOrder ? editingOrder.id : `ENC-${String(Date.now()).slice(-5)}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      items,
      totalEur: Number(formTotalEur.toFixed(2)),
      depositPercent,
      depositEur: formDepositEur,
      depositPaid,
      deliveryDate,
      deliveryTime,
      deliveryMethod,
      status: cleanStatus,
      notes: notes.trim(),
      createdAt: editingOrder ? editingOrder.createdAt : now,
      updatedAt: now,
    };
    onSaveOrder(newOrder);
    setShowForm(false);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders
      .filter((o) => {
        if (filterStatus !== 'all' && o.status !== filterStatus) return false;
        if (!q) return true;
        return (
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q) ||
          o.items.some((i) => i.recipeTitle.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => `${a.deliveryDate} ${a.deliveryTime}`.localeCompare(`${b.deliveryDate} ${b.deliveryTime}`));
  }, [orders, filterStatus, search]);

  const kpis = useMemo(() => {
    const active = orders.filter((o) => o.status !== 'cancelada');
    const total = active.reduce((s, o) => s + o.totalEur, 0);
    const paid = active.reduce((s, o) => s + (o.depositPaid ? o.depositEur : 0), 0);
    const remaining = active.reduce(
      (s, o) => s + (o.status === 'entregue' ? 0 : o.depositPaid ? Math.max(0, o.totalEur - o.depositEur) : o.totalEur),
      0
    );
    const units = active.reduce((s, o) => s + o.items.reduce((acc, i) => acc + i.quantity, 0), 0);
    return { total, paid, remaining, units };
  }, [orders]);

  const buildOrderWhatsappText = (o: Order) => {
    const prodList = o.items.map((i) => `• ${i.quantity}x ${i.recipeTitle} (${formatEur(i.unitPriceEur)}/un.)`).join('\n');
    const remaining = o.depositPaid ? Math.max(0, o.totalEur - o.depositEur) : o.totalEur;
    if (!o.depositPaid) {
      return `Olá ${o.customerName}! Fica então pré-reservada a sua encomenda de Natal:\n${prodList}\n\nData: ${o.deliveryDate} às ${o.deliveryTime} (${o.deliveryMethod})\nTotal: ${formatEur(o.totalEur)}\nSinal ${o.depositPercent}% por MB WAY (${mbWayPhone || '9XX XXX XXX'}): ${formatEur(o.depositEur)}\n\nAssim que enviar o comprovativo confirmo a sua vaga!`;
    }
    return `Olá ${o.customerName}! A sua encomenda está confirmada para ${o.deliveryDate} às ${o.deliveryTime} (${o.deliveryMethod}).\n${prodList}\nSinal recebido: ${formatEur(o.depositEur)} | Falta na entrega: ${formatEur(remaining)}. Obrigada(o)!`;
  };

  const handleExportCsv = () => {
    const csv = ordersToCsv(orders);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `encomendas-panetones-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      <div className="section-header">
        <h2>Caderno de Encomendas</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={openNewForm}>
            <Plus size={16} /> Nova Encomenda
          </button>
          <button type="button" className="btn btn-wine" onClick={onGoToShoppingList}>
            <ShoppingBasket size={16} /> Gerar Compras
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-tile">
          <div className="kpi-label">Total Encomendas</div>
          <div className="kpi-value tabular">{formatEur(kpis.total)}</div>
          <small style={{ color: 'var(--muted)' }}>{kpis.units} unidades ativas</small>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Sinais Recebidos</div>
          <div className="kpi-value green tabular">{formatEur(kpis.paid)}</div>
          <small style={{ color: 'var(--muted)' }}>Via MB WAY / adiantamento</small>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">A Receber</div>
          <div className="kpi-value tabular">{formatEur(kpis.remaining)}</div>
          <small style={{ color: 'var(--muted)' }}>Pendente até entregas</small>
        </div>
        <div className="kpi-tile">
          <div className="kpi-label">Exportar / Backup</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
            <button type="button" className="btn btn-sm btn-outline" onClick={handleExportCsv}>
              CSV
            </button>
            <button type="button" className="btn btn-sm btn-outline" onClick={onExportBackup}>
              <Download size={13} /> JSON
            </button>
            <label className="btn btn-sm btn-outline" style={{ margin: 0 }}>
              <Upload size={13} />
              <input
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onImportBackup(f);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card card-gold-top">
          <div className="section-header">
            <h2>{editingOrder ? `Editar ${editingOrder.id}` : 'Registar Nova Encomenda'}</h2>
            <button type="button" className="btn btn-sm btn-outline" onClick={() => setShowForm(false)}>
              Fechar
            </button>
          </div>

          <div className="grid-2">
            <div className="field">
              <label htmlFor="ord-cust">Nome do Cliente *</label>
              <input
                id="ord-cust"
                type="text"
                required
                className="input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ex.: Mariana Ferreira"
              />
            </div>
            <div className="field">
              <label htmlFor="ord-phone">Telemóvel / WhatsApp</label>
              <input
                id="ord-phone"
                type="tel"
                className="input"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="91X XXX XXX"
              />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <strong style={{ fontSize: 13, color: 'var(--wine)' }}>Produtos da Encomenda</strong>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  const first = recipes[0];
                  setItems((prev) => [
                    ...prev,
                    {
                      recipeId: first.id,
                      recipeTitle: first.shortTitle,
                      quantity: 1,
                      unitPriceEur: first.defaultReferencePriceEur,
                    },
                  ]);
                }}
              >
                <Plus size={14} /> Adicionar Produto
              </button>
            </div>

            {items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 78px 94px 38px',
                  gap: 6,
                  marginBottom: 8,
                  alignItems: 'center',
                }}
              >
                <select
                  className="select"
                  value={item.recipeId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const rec = recipes.find((r) => r.id === id);
                    if (!rec) return;
                    setItems((prev) =>
                      prev.map((it, i) =>
                        i === idx
                          ? { ...it, recipeId: rec.id, recipeTitle: rec.shortTitle, unitPriceEur: rec.defaultReferencePriceEur }
                          : it
                      )
                    );
                  }}
                >
                  {recipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      #{String(r.id).padStart(2, '0')} · {r.shortTitle}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  className="input tabular"
                  aria-label="Quantidade"
                  value={item.quantity}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((it, i) => (i === idx ? { ...it, quantity: Math.max(1, Number(e.target.value) || 1) } : it))
                    )
                  }
                />
                <input
                  type="number"
                  min={0}
                  step="0.10"
                  className="input tabular"
                  aria-label="Preço unitário EUR"
                  value={item.unitPriceEur}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((it, i) => (i === idx ? { ...it, unitPriceEur: Math.max(0, Number(e.target.value) || 0) } : it))
                    )
                  }
                />
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  disabled={items.length <= 1}
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                  aria-label="Remover linha"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="grid-3">
            <div className="field">
              <label htmlFor="ord-date">Data de Entrega</label>
              <input
                id="ord-date"
                type="date"
                className="input"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="ord-time">Hora</label>
              <input
                id="ord-time"
                type="time"
                className="input"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="ord-method">Logística</label>
              <select
                id="ord-method"
                className="select"
                value={deliveryMethod}
                onChange={(e) => setDeliveryMethod(e.target.value as 'levantamento' | 'entrega')}
              >
                <option value="levantamento">Levantamento pelo cliente</option>
                <option value="entrega">Entrega ao domicílio</option>
              </select>
            </div>
          </div>

          <div className="grid-3">
            <div className="field">
              <label htmlFor="ord-dep">Sinal (%)</label>
              <input
                id="ord-dep"
                type="number"
                min={0}
                max={100}
                className="input tabular"
                value={depositPercent}
                onChange={(e) => setDepositPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
              />
            </div>
            <div className="field">
              <label htmlFor="ord-status">Estado</label>
              <select
                id="ord-status"
                className="select"
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
              >
                {Object.entries(STATUS_LABELS).map(([k, lbl]) => (
                  <option key={k} value={k}>
                    {lbl}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ justifyContent: 'flex-end' }}>
              <label className="check-item" style={{ marginBottom: 0 }}>
                <input type="checkbox" checked={depositPaid} onChange={(e) => setDepositPaid(e.target.checked)} />
                <span>Sinal MB WAY pago ({formatEur(formDepositEur)})</span>
              </label>
            </div>
          </div>

          <div className="field">
            <label htmlFor="ord-notes">Notas / Etiqueta De-Para / Alergias</label>
            <input
              id="ord-notes"
              type="text"
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: Tag De Ana para Professora Sofia · Entregar em caixa presente"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div className="tabular" style={{ fontWeight: 800, fontSize: 16, color: 'var(--wine)' }}>
              Total: {formatEur(formTotalEur)} · Sinal ({depositPercent}%): {formatEur(formDepositEur)}
            </div>
            <button type="submit" className="btn btn-primary">
              <Check size={16} /> Guardar Encomenda
            </button>
          </div>
        </form>
      )}

      {/* Search & Status filters */}
      <div className="field">
        <input
          type="search"
          className="input"
          placeholder="Pesquisar por cliente, telemóvel ou sabor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="chip-row">
        <button type="button" className={`chip ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>
          Todos ({orders.length})
        </button>
        {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((st) => (
          <button
            key={st}
            type="button"
            className={`chip ${filterStatus === st ? 'active' : ''}`}
            onClick={() => setFilterStatus(st)}
          >
            {STATUS_LABELS[st]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 28 }}>
          <h3 style={{ marginTop: 0, color: 'var(--wine)' }}>Ainda sem encomendas registadas</h3>
          <p style={{ fontSize: 13.5, color: 'var(--muted)' }}>
            Registe os seus pedidos reais para controlar sinais de 50 % por MB WAY e gerar automaticamente a Lista de Compras e o Calendário.
          </p>
          <button type="button" className="btn btn-primary" onClick={openNewForm}>
            <Plus size={16} /> Registar Primeira Encomenda
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((o) => {
            const pendingEur = o.depositPaid ? Math.max(0, o.totalEur - o.depositEur) : o.totalEur;
            const waText = buildOrderWhatsappText(o);
            const waPhone = normalizePtPhone(o.customerPhone);
            const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}`;
            return (
              <div key={o.id} className="card" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 16, color: 'var(--wine-deep)' }}>{o.customerName}</strong>
                      <span className={`badge ${STATUS_BADGE[o.status]}`}>{STATUS_LABELS[o.status]}</span>
                      <small style={{ color: 'var(--muted)' }}>{o.id}</small>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>
                      Entrega: <strong>{o.deliveryDate}</strong> às <strong>{o.deliveryTime}</strong> · {o.deliveryMethod}
                      {o.customerPhone ? ` · Tel: ${o.customerPhone}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }} className="tabular">
                    <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--wine)' }}>{formatEur(o.totalEur)}</div>
                    <div style={{ fontSize: 12, color: o.depositPaid ? 'var(--green)' : 'var(--danger)', fontWeight: 700 }}>
                      {o.depositPaid ? `Sinal pago: ${formatEur(o.depositEur)}` : `Aguarda sinal: ${formatEur(o.depositEur)}`}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Em falta: {formatEur(pendingEur)}</div>
                  </div>
                </div>

                <ul style={{ margin: '8px 0', paddingLeft: 18, fontSize: 13 }}>
                  {o.items.map((it, idx) => (
                    <li key={idx}>
                      <strong>{it.quantity}×</strong> {it.recipeTitle} — {formatEur(it.unitPriceEur)}
                    </li>
                  ))}
                </ul>
                {o.notes && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Notas: {o.notes}</div>}

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', paddingTop: 6, borderTop: '1px solid #f0e2ce' }}>
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => onToggleDepositPaid(o.id)}>
                    {o.depositPaid ? 'Desmarcar Sinal' : 'Marcar Sinal Pago'}
                  </button>
                  <select
                    className="select"
                    style={{ width: 'auto', minHeight: 36, fontSize: 12.5, padding: '4px 10px' }}
                    value={o.status}
                    aria-label="Mudar estado da encomenda"
                    onChange={(e) => onStatusChange(o.id, e.target.value as OrderStatus)}
                  >
                    {Object.entries(STATUS_LABELS).map(([k, lbl]) => (
                      <option key={k} value={k}>
                        {lbl}
                      </option>
                    ))}
                  </select>
                  <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={() => {
                      navigator.clipboard?.writeText(waText);
                      setCopiedId(o.id);
                      setTimeout(() => setCopiedId(''), 1800);
                    }}
                  >
                    <Copy size={14} /> {copiedId === o.id ? 'Copiado!' : 'Copiar Msg'}
                  </button>
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => openEditForm(o)}>
                    <Edit3 size={14} /> Editar
                  </button>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => onDeleteOrder(o.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ShoppingListView({
  content,
  orders,
  checkedKeys,
  unitPricesEur,
  onToggleChecked,
  onClearChecked,
  onUpdateUnitPrice,
}: {
  content: ProtectedContentPayload;
  orders: Order[];
  checkedKeys: string[];
  unitPricesEur: Record<string, number>;
  onToggleChecked: (key: string) => void;
  onClearChecked: () => void;
  onUpdateUnitPrice: (key: string, price: number) => void;
}) {
  const [mode, setMode] = useState<'orders' | 'manual' | 'reference'>('orders');
  const [includePending, setIncludePending] = useState(true);
  const [refBatch, setRefBatch] = useState<10 | 30 | 50>(30);
  const [manualPlan, setManualPlan] = useState<{ recipeId: number; units: number }[]>([
    { recipeId: 1, units: 4 },
    { recipeId: 11, units: 4 },
  ]);
  const [copied, setCopied] = useState(false);

  const activeOrderPlan = useMemo(
    () => buildShoppingPlanFromOrders(orders, includePending),
    [orders, includePending]
  );

  const computedItems = useMemo(() => {
    if (mode === 'orders') return buildShoppingListFromPlan(activeOrderPlan, content.recipes);
    if (mode === 'manual') return buildShoppingListFromPlan(manualPlan, content.recipes);
    return [];
  }, [mode, activeOrderPlan, manualPlan, content.recipes]);

  const activeReferenceBatch = content.referenceBatches.find((b) => b.batchSize === refBatch) || content.referenceBatches[1];

  const estimatedTotalBudget = useMemo(() => {
    const keys =
      mode === 'reference'
        ? activeReferenceBatch.items.map((_, i) => `ref-${refBatch}-${i}`)
        : computedItems.map((i) => i.key);
    return keys.reduce((s, k) => s + (unitPricesEur[k] || 0), 0);
  }, [mode, activeReferenceBatch, refBatch, computedItems, unitPricesEur]);

  const handleCopyWhatsapp = () => {
    const lines = ['🛒 *LISTA DE COMPRAS — PANETONES QUE RENDEM*', ''];
    if (mode === 'reference') {
      lines.push(`*${activeReferenceBatch.label}*`);
      activeReferenceBatch.items.forEach((it) => {
        lines.push(`• [ ] ${it.name}: ${it.quantityText}`);
      });
    } else {
      computedItems.forEach((it) => {
        lines.push(`• [ ] ${it.name}: ${it.displayAmount}`);
      });
    }
    navigator.clipboard?.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div>
      <div className="section-header">
        <h2>Lista de Compras Automática</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-sm btn-primary" onClick={handleCopyWhatsapp}>
            <Copy size={14} /> {copied ? 'Lista Copiada!' : 'Copiar para WhatsApp'}
          </button>
          <button type="button" className="btn btn-sm btn-outline no-print" onClick={() => window.print()}>
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>

      <div className="chip-row">
        <button type="button" className={`chip ${mode === 'orders' ? 'active' : ''}`} onClick={() => setMode('orders')}>
          Das Encomendas ({activeOrderPlan.reduce((s, x) => s + x.units, 0)} unid.)
        </button>
        <button type="button" className={`chip ${mode === 'manual' ? 'active' : ''}`} onClick={() => setMode('manual')}>
          Planeamento Personalizado
        </button>
        <button type="button" className={`chip ${mode === 'reference' ? 'active' : ''}`} onClick={() => setMode('reference')}>
          Lotes Fixos 10 / 30 / 50 (Bónus 01)
        </button>
      </div>

      {mode === 'orders' && (
        <div className="card card-gold-top">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <label className="check-item" style={{ marginBottom: 0, border: 'none', padding: 0 }}>
              <input
                type="checkbox"
                checked={includePending}
                onChange={(e) => setIncludePending(e.target.checked)}
              />
              <span>Incluir pedidos ainda com sinal pendente</span>
            </label>
            <div className="tabular" style={{ fontWeight: 700, color: 'var(--wine)' }}>
              Orçamento preenchido: {formatEur(estimatedTotalBudget)}
            </div>
          </div>
          {activeOrderPlan.length === 0 && (
            <div className="notice" style={{ marginTop: 10, marginBottom: 0 }}>
              Não existem encomendas ativas no Caderno de Encomendas. Crie pedidos em <strong>Encomendas</strong> ou mude acima para <strong>Planeamento Personalizado</strong> / <strong>Lotes Fixos 10/30/50</strong>.
            </div>
          )}
        </div>
      )}

      {mode === 'manual' && (
        <div className="card card-gold-top">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong style={{ color: 'var(--wine)' }}>Selecione Receitas & Quantidades a Produzir</strong>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setManualPlan((prev) => [...prev, { recipeId: 5, units: 2 }])}
            >
              <Plus size={14} /> Juntar Receita
            </button>
          </div>
          {manualPlan.map((entry, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 84px 38px', gap: 6, marginBottom: 6 }}>
              <select
                className="select"
                value={entry.recipeId}
                onChange={(e) =>
                  setManualPlan((prev) => prev.map((x, i) => (i === idx ? { ...x, recipeId: Number(e.target.value) } : x)))
                }
              >
                {content.recipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    #{String(r.id).padStart(2, '0')} · {r.shortTitle}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                className="input tabular"
                value={entry.units}
                onChange={(e) =>
                  setManualPlan((prev) =>
                    prev.map((x, i) => (i === idx ? { ...x, units: Math.max(1, Number(e.target.value) || 1) } : x))
                  )
                }
              />
              <button
                type="button"
                className="btn btn-sm btn-danger"
                disabled={manualPlan.length <= 1}
                onClick={() => setManualPlan((prev) => prev.filter((_, i) => i !== idx))}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {mode === 'reference' && (
        <div className="card card-gold-top">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {([10, 30, 50] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  className={`chip ${refBatch === sz ? 'active' : ''}`}
                  onClick={() => setRefBatch(sz)}
                >
                  Lote {sz} unid.
                </button>
              ))}
            </div>
            <strong className="tabular" style={{ color: 'var(--wine)' }}>Orçamento: {formatEur(estimatedTotalBudget)}</strong>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 6 }}>
            Composição: {activeReferenceBatch.composition}
          </div>
        </div>
      )}

      {/* Checklist Render */}
      {(mode === 'reference' || computedItems.length > 0) && (
        <div className="card">
          <div className="section-header">
            <h2>Itens a Adquirir</h2>
            <button type="button" className="btn btn-sm btn-outline" onClick={onClearChecked}>
              Limpar Riscos
            </button>
          </div>

          {mode === 'reference'
            ? activeReferenceBatch.items.map((item, idx) => {
                const k = `ref-${refBatch}-${idx}`;
                const checked = checkedKeys.includes(k);
                return (
                  <div
                    key={k}
                    className={`check-item ${checked ? 'done' : ''}`}
                    style={{ justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
                  >
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, cursor: 'pointer' }}>
                      <input type="checkbox" checked={checked} onChange={() => onToggleChecked(k)} />
                      <span>
                        <strong>{item.name}</strong> — <span className="tabular">{item.quantityText}</span>
                      </span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.10"
                      placeholder="€"
                      className="input tabular"
                      style={{ width: 76, minHeight: 34, padding: '4px 8px', fontSize: 12.5 }}
                      value={unitPricesEur[k] ?? ''}
                      onChange={(e) => onUpdateUnitPrice(k, Math.max(0, Number(e.target.value) || 0))}
                      aria-label={`Valor estimado em euros para ${item.name}`}
                    />
                  </div>
                );
              })
            : (['massa', 'recheio', 'embalagem'] as const).map((cat) => {
                const sub = computedItems.filter((i) => i.category === cat);
                if (sub.length === 0) return null;
                const titles = {
                  massa: 'A. Massa Base & Secos',
                  recheio: 'B. Recheios, Cremes & Chocolates',
                  embalagem: 'C. Formas & Embalagens (+10 % reserva)',
                };
                return (
                  <div key={cat} style={{ marginBottom: 14 }}>
                    <h3 style={{ color: 'var(--wine)', marginBottom: 8 }}>{titles[cat]}</h3>
                    {sub.map((item) => {
                      const checked = checkedKeys.includes(item.key);
                      return (
                        <div
                          key={item.key}
                          className={`check-item ${checked ? 'done' : ''}`}
                          style={{ justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
                        >
                          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, cursor: 'pointer' }}>
                            <input type="checkbox" checked={checked} onChange={() => onToggleChecked(item.key)} />
                            <span>
                              <strong className="tabular">{item.displayAmount}</strong> — {item.name}
                              <br />
                              <small style={{ color: 'var(--muted)' }}>{item.sources.join(' · ')}</small>
                            </span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="0.10"
                            placeholder="€"
                            className="input tabular"
                            style={{ width: 76, minHeight: 34, padding: '4px 8px', fontSize: 12.5 }}
                            value={unitPricesEur[item.key] ?? ''}
                            onChange={(e) => onUpdateUnitPrice(item.key, Math.max(0, Number(e.target.value) || 0))}
                            aria-label={`Valor em euros para ${item.name}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
        </div>
      )}
    </div>
  );
}

