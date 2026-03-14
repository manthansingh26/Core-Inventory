import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

const STATUS_COLORS = {
  draft: 'badge-draft',
  waiting: 'badge-waiting',
  ready: 'badge-ready',
  done: 'badge-done',
  cancelled: 'badge-cancelled'
};

export default function StockMoveList({
  title, description, data, total, loading,
  type, basePath, onSearch, onStatusFilter, onNew,
  statusFilter, searchVal
}) {
  const navigate = useNavigate();

  const columns = {
    receipt: ['Reference', 'Supplier', 'Receive At', 'Scheduled Date', 'Status'],
    delivery: ['Reference', 'Customer', 'Ship From', 'Scheduled Date', 'Status'],
    transfer: ['Reference', 'From', 'To', 'Scheduled Date', 'Status'],
    adjustment: ['Reference', 'Warehouse', 'Location', 'Scheduled Date', 'Status'],
  };

  const renderRow = (move) => {
    switch (type) {
      case 'receipt': return [
        <span style={{ fontWeight: 600, color: 'var(--accent-light)' }}>{move.reference}</span>,
        move.partner || '—',
        move.toWarehouse?.name || '—',
        move.scheduledDate ? format(new Date(move.scheduledDate), 'dd MMM yyyy') : '—',
        <span className={`badge ${STATUS_COLORS[move.status]}`}>{move.status}</span>
      ];
      case 'delivery': return [
        <span style={{ fontWeight: 600, color: 'var(--success)' }}>{move.reference}</span>,
        move.partner || '—',
        move.fromWarehouse?.name || '—',
        move.scheduledDate ? format(new Date(move.scheduledDate), 'dd MMM yyyy') : '—',
        <span className={`badge ${STATUS_COLORS[move.status]}`}>{move.status}</span>
      ];
      case 'transfer': return [
        <span style={{ fontWeight: 600, color: 'var(--warning)' }}>{move.reference}</span>,
        `${move.fromWarehouse?.name || '?'} / ${move.fromLocation || '?'}`,
        `${move.toWarehouse?.name || '?'} / ${move.toLocation || '?'}`,
        move.scheduledDate ? format(new Date(move.scheduledDate), 'dd MMM yyyy') : '—',
        <span className={`badge ${STATUS_COLORS[move.status]}`}>{move.status}</span>
      ];
      case 'adjustment': return [
        <span style={{ fontWeight: 600, color: 'var(--info)' }}>{move.reference}</span>,
        move.toWarehouse?.name || '—',
        move.toLocation || '—',
        move.scheduledDate ? format(new Date(move.scheduledDate), 'dd MMM yyyy') : '—',
        <span className={`badge ${STATUS_COLORS[move.status]}`}>{move.status}</span>
      ];
      default: return [];
    }
  };

  const statuses = ['draft', 'waiting', 'ready', 'done', 'cancelled'];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>{title}</h2>
          <p>{description} · {total} total</p>
        </div>
        <button className="btn btn-primary" id={`new-${type}-btn`} onClick={onNew}>
          <Plus size={15} /> New
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            id={`${type}-search`}
            placeholder="Search by ref or contact..."
            value={searchVal}
            onChange={e => onSearch(e.target.value)}
          />
        </div>
        {statuses.map(s => (
          <button
            key={s}
            className={`filter-chip ${statusFilter === s ? 'active' : ''}`}
            onClick={() => onStatusFilter(statusFilter === s ? '' : s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              {(columns[type] || []).map(col => <th key={col}>{col}</th>)}
              <th>Items</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><div className="loading-spinner"><div className="spinner" /></div></td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={6}>
                <div className="empty-state">
                  <Plus size={40} />
                  <h3>No {title} Found</h3>
                  <p>Create a new {type} to get started</p>
                </div>
              </td></tr>
            ) : data.map(move => (
              <tr key={move._id} onClick={() => navigate(`${basePath}/${move._id}`)} style={{ cursor: 'pointer' }}>
                {renderRow(move).map((cell, i) => (
                  <td key={i}>{cell}</td>
                ))}
                <td style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  {move.lines?.length || 0} product{move.lines?.length !== 1 ? 's' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
