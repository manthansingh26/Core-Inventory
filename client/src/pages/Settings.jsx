import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, X, Edit2, Trash2, Warehouse } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const [warehouses, setWarehouses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editWH, setEditWH] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', address: '' });
  const [loading, setLoading] = useState(true);

  const fetchWarehouses = () => {
    api.get('/warehouses').then(r => { setWarehouses(r.data.data); setLoading(false); });
  };
  useEffect(() => { fetchWarehouses(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editWH) {
        await api.put(`/warehouses/${editWH._id}`, form);
        toast.success('Warehouse updated');
      } else {
        await api.post('/warehouses', form);
        toast.success('Warehouse created');
      }
      setShowForm(false); setEditWH(null); setForm({ name: '', code: '', address: '' }); fetchWarehouses();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this warehouse?')) return;
    await api.delete(`/warehouses/${id}`);
    toast.success('Warehouse deactivated'); fetchWarehouses();
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h2>Settings</h2><p>Configure warehouses and system settings</p></div>
      </div>

      <div className="card mb-4">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>🏭 Warehouses</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Manage warehouse locations</div>
          </div>
          <button id="new-warehouse-btn" className="btn btn-primary btn-sm" onClick={() => { setEditWH(null); setForm({ name: '', code: '', address: '' }); setShowForm(true); }}>
            <Plus size={14} /> Add Warehouse
          </button>
        </div>
        {loading ? <div className="loading-spinner"><div className="spinner" /></div> : warehouses.length === 0 ? (
          <div className="empty-state" style={{ padding: 30 }}>
            <Warehouse size={36} />
            <h3>No Warehouses</h3>
            <p>Add your first warehouse to get started</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {warehouses.map(w => (
              <div key={w._id} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{w.name}</div>
                    <code style={{ fontSize: 11.5, color: 'var(--accent-light)', background: 'var(--accent-dim)', padding: '2px 6px', borderRadius: 4, marginTop: 4, display: 'inline-block' }}>{w.code}</code>
                    {w.address && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{w.address}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn-icon" onClick={() => { setEditWH(w); setForm({ name: w.name, code: w.code, address: w.address || '' }); setShowForm(true); }}><Edit2 size={14} /></button>
                    <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(w._id)}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editWH ? 'Edit Warehouse' : 'New Warehouse'}</h3>
              <button className="btn-icon" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid" style={{ gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Warehouse Name *</label>
                    <input id="wh-name" className="form-control" placeholder="e.g. Main Warehouse" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Short Code *</label>
                    <input id="wh-code" className="form-control" placeholder="e.g. WH1" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <input className="form-control" placeholder="Optional address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editWH ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
