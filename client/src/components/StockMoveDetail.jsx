import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle2, XCircle, ArrowLeft, Calendar, MapPin, User, Edit2, Printer, Camera } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  draft: 'badge-draft', waiting: 'badge-waiting', ready: 'badge-ready',
  done: 'badge-done', cancelled: 'badge-cancelled'
};

const TYPE_CONFIG = {
  receipt: { label: 'Receipt', endpoint: '/receipts', color: 'var(--accent)', icon: '📥' },
  delivery: { label: 'Delivery Order', endpoint: '/deliveries', color: 'var(--success)', icon: '📤' },
  transfer: { label: 'Internal Transfer', endpoint: '/transfers', color: 'var(--warning)', icon: '🔄' },
  adjustment: { label: 'Stock Adjustment', endpoint: '/adjustments', color: 'var(--info)', icon: '🔧' }
};

export default function StockMoveDetail({ id, type }) {
  const [move, setMove] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const navigate = useNavigate();
  const cfg = TYPE_CONFIG[type];

  const fetchMove = () => {
    setLoading(true);
    api.get(`${cfg.endpoint}/${id}`).then(r => { setMove(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchMove(); }, [id]);

  const validate = async () => {
    if (!window.confirm('Validate this operation? Stock will be updated. Document will be LOCKED.')) return;
    setValidating(true);
    try {
      await api.post(`${cfg.endpoint}/${id}/validate`);
      toast.success('Validated! Stock updated & locked.');
      fetchMove();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Validation failed');
    } finally { setValidating(false); }
  };

  const cancel = async () => {
    if (!window.confirm('Cancel this operation?')) return;
    try {
      await api.post(`${cfg.endpoint}/${id}/cancel`);
      toast.success('Cancelled');
      fetchMove();
    } catch (err) {
      toast.error('Cancel failed');
    }
  };

  const updateStatus = async (newStatus) => {
    if (newStatus === move.status) return;
    if (newStatus === 'done') return validate();
    if (newStatus === 'cancelled') return cancel();
    
    if (move.status === 'done') {
       toast.error('Document is locked after validation.');
       return;
    }

    try {
      await api.put(`${cfg.endpoint}/${id}/status`, { status: newStatus });
      toast.success(`Status set to ${newStatus}`);
      fetchMove();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!move) return <div className="empty-state"><h3>Not found</h3></div>;

  const totalQty = move.lines?.reduce((s, l) => s + (l.demandQty || 0), 0) || 0;
  const statuses = ['draft', 'waiting', 'ready', 'done', 'cancelled'];
  const isLocked = move.status === 'done' || move.status === 'cancelled';

  return (
    <div>
      {/* Back */}
      <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
        <ArrowLeft size={15} /> Back
      </button>

      {/* Header */}
      <div className="detail-header">
        <div className="detail-header-top">
          <div>
            <div className="detail-ref" style={{ color: cfg.color }}>{cfg.icon} {cfg.label} {isLocked ? '(LOCKED)' : ''}</div>
            <div className="detail-title">{move.reference}</div>
          </div>
          <div className="detail-actions" style={{ flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => window.print()} title="Print Count Sheet">
              <Printer size={15} /> Print
            </button>
            {!isLocked && statuses.map(s => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                disabled={validating}
                className={`btn btn-sm ${move.status === s ? 'btn-primary' : 'btn-secondary'}`}
                style={{ textTransform: 'capitalize' }}
              >
                {s === 'done' && validating ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : s}
              </button>
            ))}
            {isLocked && <span className={`badge ${STATUS_COLORS[move.status]}`} style={{ fontSize: 13, padding: '6px 14px' }}>{move.status}</span>}
          </div>
        </div>

        <div className="detail-meta">
          {move.partner && (
            <div className="detail-meta-item">
              <User size={14} />
              <span>{type === 'receipt' ? 'Supplier' : 'Customer'}: <strong>{move.partner}</strong></span>
            </div>
          )}
          {move.scheduledDate && (
            <div className="detail-meta-item">
              <Calendar size={14} />
              <span>Scheduled: <strong>{format(new Date(move.scheduledDate), 'dd MMM yyyy')}</strong></span>
            </div>
          )}
          {move.validatedDate && (
            <div className="detail-meta-item" style={{ color: 'var(--success)' }}>
              <CheckCircle2 size={14} />
              <span>Done: <strong>{format(new Date(move.validatedDate), 'dd MMM yyyy, HH:mm')}</strong></span>
            </div>
          )}
          {move.fromWarehouse && (
            <div className="detail-meta-item">
              <MapPin size={14} />
              <span>From: <strong>{move.fromWarehouse.name}{move.fromLocation ? ` / ${move.fromLocation}` : ''}</strong></span>
            </div>
          )}
          {move.toWarehouse && (
            <div className="detail-meta-item">
              <MapPin size={14} style={{ color: cfg.color }} />
              <span>To: <strong>{move.toWarehouse.name}{move.toLocation ? ` / ${move.toLocation}` : ''}</strong></span>
            </div>
          )}
        </div>

        {move.notes && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', borderLeft: `3px solid ${cfg.color}` }}>
            {move.notes}
          </div>
        )}
      </div>

      {/* Lines table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Product Lines</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{move.lines?.length} product(s) · {totalQty} total units</div>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>SKU</th>
                <th>UOM</th>
                <th>{type === 'adjustment' ? 'Expected Qty' : 'Demand Qty'}</th>
                <th>{type === 'adjustment' ? 'Counted Qty' : 'Done Qty'}</th>
                {type === 'adjustment' && <th>Variance</th>}
                {type === 'adjustment' && <th>Cost Method</th>}
                <th>Photo</th>
              </tr>
            </thead>
            <tbody>
              {move.lines?.map((line, i) => {
                const doneAmount = typeof line.doneQty === 'number' ? line.doneQty : line.demandQty;
                const variance = doneAmount - line.demandQty;
                const isVariance = variance !== 0;

                return (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{line.productName || line.product?.name || '—'}</td>
                    <td><code style={{ background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{line.sku || line.product?.sku || '—'}</code></td>
                    <td style={{ color: 'var(--text-muted)' }}>{line.uom}</td>
                    <td style={{ fontWeight: 600 }}>{line.demandQty}</td>
                    <td style={{ color: move.status === 'done' ? 'var(--success)' : 'var(--text-muted)', fontWeight: 600 }}>
                      {move.status === 'done' ? doneAmount : '—'}
                    </td>
                    {type === 'adjustment' && (
                       <td style={{ fontWeight: 600, color: isVariance ? 'var(--danger)' : 'var(--text-muted)' }}>
                         {move.status === 'done' ? (variance > 0 ? `+${variance}` : variance) : '-'}
                         {isVariance && move.status === 'done' && <span style={{ marginLeft: 6, fontSize: 11, background: 'var(--danger-dim)', color: 'var(--danger)', padding: '2px 4px', borderRadius: 4 }}>Diff</span>}
                       </td>
                    )}
                    {type === 'adjustment' && (
                       <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>FIFO / AVG</td>
                    )}
                    <td>
                      <button className="btn-icon" title="Attach Evidence/Photo"><Camera size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
