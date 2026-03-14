import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Search, History } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS = {
  draft: 'badge-draft', waiting: 'badge-waiting', ready: 'badge-ready',
  done: 'badge-done', cancelled: 'badge-cancelled'
};

const TYPE_ICONS = {
  receipt: { icon: '📥', color: 'var(--accent)' },
  delivery: { icon: '📤', color: 'var(--success)' },
  transfer: { icon: '🔄', color: 'var(--warning)' },
  adjustment: { icon: '🔧', color: 'var(--info)' }
};

export default function MoveHistory() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = { limit: 50 };
    if (search) params.search = search;
    if (typeFilter) params.type = typeFilter;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    api.get('/history', { params }).then(r => {
      setData(r.data.data); setTotal(r.data.total); setLoading(false);
    }).catch(() => setLoading(false));
  }, [search, typeFilter, dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Move History</h2>
          <p>Complete stock ledger — all validated operations · {total} records</p>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} />
          <input placeholder="Search reference or contact..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['receipt', 'delivery', 'transfer', 'adjustment'].map(t => (
          <button key={t} className={`filter-chip ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(typeFilter === t ? '' : t)}>
            {TYPE_ICONS[t].icon} {t}
          </button>
        ))}
        <input className="form-control" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 150 }} title="From date" />
        <input className="form-control" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: 150 }} title="To date" />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Reference</th>
              <th>Contact</th>
              <th>From</th>
              <th>To</th>
              <th>Products</th>
              <th>Date Done</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}><div className="loading-spinner"><div className="spinner" /></div></td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <History size={40} />
                  <h3>No History Found</h3>
                  <p>Validated operations will appear here</p>
                </div>
              </td></tr>
            ) : data.map(move => {
              const t = TYPE_ICONS[move.type] || { icon: '📋', color: 'var(--text-muted)' };
              return (
                <tr key={move._id}>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: t.color, fontWeight: 600 }}>
                      {t.icon} {move.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: t.color }}>{move.reference}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{move.partner || '—'}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>
                    {move.fromWarehouse ? `${move.fromWarehouse.name}${move.fromLocation ? ` / ${move.fromLocation}` : ''}` : '—'}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>
                    {move.toWarehouse ? `${move.toWarehouse.name}${move.toLocation ? ` / ${move.toLocation}` : ''}` : '—'}
                  </td>
                  <td style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                    {move.lines?.length || 0} item{move.lines?.length !== 1 ? 's' : ''}
                  </td>
                  <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                    {move.validatedDate ? format(new Date(move.validatedDate), 'dd MMM yyyy, HH:mm') : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
