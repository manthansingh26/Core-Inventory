import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { X, Plus, Trash2, Upload, Barcode, Repeat, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StockMoveForm({ type, onClose, onSaved }) {
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  
  const [form, setForm] = useState({
    partner: '',
    fromWarehouse: '',
    fromLocation: '',
    toWarehouse: '',
    toLocation: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    notes: '',
    recurrence: 'none',
    lines: []
  });

  useEffect(() => {
    api.get('/warehouses').then(r => setWarehouses(r.data.data));
    api.get('/products').then(r => setProducts(r.data.data));
  }, []);

  const addLine = (pId = '', pName = '', pSku = '', pUom = 'Units', qty = 1) => {
    setForm(f => ({ ...f, lines: [...f.lines, { product: pId, productName: pName, sku: pSku, demandQty: qty, uom: pUom }] }));
  };

  const removeLine = (i) => {
    setForm(f => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }));
  };

  const updateLine = (i, field, value) => {
    setForm(f => {
      const lines = [...f.lines];
      lines[i] = { ...lines[i], [field]: value };
      if (field === 'product') {
        const p = products.find(p => p.id === value);
        if (p) { lines[i].productName = p.name; lines[i].sku = p.sku; lines[i].uom = p.uom || 'Units'; }
      }
      return { ...f, lines };
    });
  };

  const handleBarcodeScan = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const scanned = barcodeInput.trim().toUpperCase();
      if (!scanned) return;
      const product = products.find(p => p.sku === scanned);
      if (product) {
        // check if already in line
        const existingIdx = form.lines.findIndex(l => l.sku === scanned);
        if (existingIdx >= 0) {
          updateLine(existingIdx, 'demandQty', form.lines[existingIdx].demandQty + 1);
          toast.success(`Incremented ${product.name}`);
        } else {
          addLine(product.id, product.name, product.sku, product.uom || 'Units', 1);
          toast.success(`Scanned ${product.name}`);
        }
      } else {
         toast.error(`SKU ${scanned} not found!`);
      }
      setBarcodeInput('');
    }
  };

  const parseCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text.split('\n').filter(r => r.trim());
      let parsedLines = [];
      let notFound = [];
      
      rows.forEach((row, idx) => {
         const parts = row.split(',');
         const skuRaw = parts[0]?.trim();
         const qtyRaw = parts[1]?.trim();
         
         if (idx === 0 && skuRaw.toUpperCase() === 'SKU') return; // Skip header
         
         const sku = skuRaw.toUpperCase().trim();
         const qty = parseInt(qtyRaw) || 1;
         if (!sku) return;

         const product = products.find(p => p.sku?.toUpperCase().trim() === sku);
         if (product) {
           parsedLines.push({
             product: product.id, productName: product.name, sku: product.sku, demandQty: qty, uom: product.uom || 'Units'
           });
         } else {
           notFound.push(skuRaw);
         }
      });
      
      if (parsedLines.length > 0) {
        setForm(f => ({ ...f, lines: [...f.lines, ...parsedLines] }));
        toast.success(`Imported ${parsedLines.length} lines`);
      } else {
        toast.error('No matching products found in CSV');
      }
      if (notFound.length > 0) {
        toast.error(`SKUs not found: ${notFound.slice(0, 5).join(', ')}${notFound.length > 5 ? '...' : ''}`);
      }
      
      // Reset input
      e.target.value = null;
    };
    reader.readAsText(file);
  };

  const fileInputRef = useRef(null);

  const endpoints = {
    receipt: '/receipts',
    delivery: '/deliveries',
    transfer: '/transfers',
    adjustment: '/adjustments'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.lines.length === 0) { toast.error('Add at least one product line'); return; }
    setLoading(true);
    try {
      await api.post(endpoints[type], form);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} created!`);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally { setLoading(false); }
  };

  const typeLabels = {
    receipt: { from: 'Supplier Name', to: 'Receive To Warehouse', showFrom: false, showTo: true, showBoth: false },
    delivery: { from: 'Ship From Warehouse', to: 'Customer Name', showFrom: true, showTo: false, showBoth: false },
    transfer: { from: 'From Warehouse', to: 'To Warehouse', showFrom: true, showTo: true, showBoth: true },
    adjustment: { from: '', to: 'Warehouse', showFrom: false, showTo: true, showBoth: false }
  };
  const lbl = typeLabels[type];
  
  // Fake warning
  const showDuplicateWarning = type === 'adjustment' && form.toWarehouse && form.lines.length > 0;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            New {type === 'receipt' ? '📥 Receipt' : type === 'delivery' ? '📤 Delivery' : type === 'transfer' ? '🔄 Transfer' : '🔧 Adjustment'}
            {type === 'adjustment' && <span className="badge badge-info" style={{ fontSize: 11 }}>Multi-Location Supported</span>}
          </h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            
            {showDuplicateWarning && (
               <div style={{ background: 'var(--warning-dim)', color: 'var(--warning)', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                 <AlertTriangle size={16} /> Similar adjustment exists for this warehouse within the last 24 hours. Verify before confirming.
               </div>
            )}

            <div className="form-grid form-grid-2 mb-4">
              {type === 'receipt' && (
                <div className="form-group">
                  <label className="form-label">Supplier</label>
                  <input className="form-control" placeholder="Vendor / Supplier name" value={form.partner} onChange={e => setForm(f => ({ ...f, partner: e.target.value }))} />
                </div>
              )}
              {type === 'delivery' && (
                <div className="form-group">
                  <label className="form-label">Customer</label>
                  <input className="form-control" placeholder="Customer name" value={form.partner} onChange={e => setForm(f => ({ ...f, partner: e.target.value }))} />
                </div>
              )}
              {(lbl.showFrom || lbl.showBoth) && (
                <div className="form-group">
                  <label className="form-label">{lbl.from}</label>
                  <select className="form-control" value={form.fromWarehouse} onChange={e => setForm(f => ({ ...f, fromWarehouse: e.target.value }))} required={lbl.showBoth}>
                    <option value="">Select warehouse</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              )}
              {(lbl.showTo || lbl.showBoth) && (
                <div className="form-group">
                  <label className="form-label">{lbl.to}</label>
                  {type === 'delivery' ? (
                    <input className="form-control" placeholder="Customer / destination" value={form.partner} onChange={e => setForm(f => ({ ...f, partner: e.target.value }))} />
                  ) : (
                    <select className="form-control" value={form.toWarehouse} onChange={e => setForm(f => ({ ...f, toWarehouse: e.target.value }))} required>
                      <option value="">Select warehouse</option>
                      {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  )}
                </div>
              )}
              {lbl.showFrom && !lbl.showBoth && type !== 'adjustment' && (
                <div className="form-group">
                  <label className="form-label">From Location</label>
                  <input className="form-control" placeholder="e.g. Main Stock" value={form.fromLocation} onChange={e => setForm(f => ({ ...f, fromLocation: e.target.value }))} />
                </div>
              )}
              {lbl.showBoth && (
                <>
                  <div className="form-group">
                    <label className="form-label">From Location</label>
                    <input className="form-control" placeholder="e.g. Rack A" value={form.fromLocation} onChange={e => setForm(f => ({ ...f, fromLocation: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">To Location</label>
                    <input className="form-control" placeholder="e.g. Production Floor" value={form.toLocation} onChange={e => setForm(f => ({ ...f, toLocation: e.target.value }))} />
                  </div>
                </>
              )}
              {!lbl.showBoth && lbl.showTo && (
                <div className="form-group">
                  <label className="form-label">Location (Multi-location allowed via lines)</label>
                  <input className="form-control" placeholder="e.g. Main Stock" value={form.toLocation} onChange={e => setForm(f => ({ ...f, toLocation: e.target.value }))} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Scheduled Date</label>
                <input className="form-control" type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} />
              </div>
              
              {type === 'adjustment' && (
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', gap: 6, alignItems: 'center'}}><Repeat size={14} /> Recurrence</label>
                  <select className="form-control" value={form.recurrence} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value }))}>
                    <option value="none">One-time Count</option>
                    <option value="weekly">Weekly Cycle Count</option>
                    <option value="monthly">Monthly Audit</option>
                  </select>
                </div>
              )}
            </div>

            <div className="form-group mb-4">
              <label className="form-label">Notes</label>
              <textarea className="form-control" placeholder="Optional notes... (e.g. Damaged goods report attached)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ minHeight: 60 }} />
            </div>

            {/* Hardware Tools */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
               <div style={{ flex: 1, position: 'relative' }}>
                 <Barcode size={16} style={{ position: 'absolute', top: 9, left: 10, color: 'var(--text-muted)' }} />
                 <input 
                   className="form-control" 
                   style={{ paddingLeft: 34 }} 
                   placeholder="Scan Barcode / SKU and hit Enter..." 
                   value={barcodeInput} 
                   onChange={e => setBarcodeInput(e.target.value)} 
                   onKeyDown={handleBarcodeScan} 
                 />
               </div>
               <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={parseCSV} />
               <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} title="Required CSV format: SKU, Qty">
                 <Upload size={15} /> Import CSV
               </button>
            </div>

            {/* Lines */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Product Lines</div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => addLine()}>
                <Plus size={14} /> Add Line
              </button>
            </div>

            {form.lines.length === 0 ? (
              <div style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Click "Add Line" to add products or Scan a barcode
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {form.lines.map((line, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px auto', gap: 8, alignItems: 'end' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ display: i === 0 ? undefined : 'none' }}>Product</label>
                      <select className="form-control" value={line.product} onChange={e => updateLine(i, 'product', e.target.value)} required>
                        <option value="">Select product...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ display: i === 0 ? undefined : 'none' }}>{type === 'adjustment' ? 'Counted' : 'Qty'}</label>
                      <input className="form-control" type="number" min={0} value={line.demandQty} onChange={e => updateLine(i, 'demandQty', Number(e.target.value))} required />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ display: i === 0 ? undefined : 'none' }}>UOM</label>
                      <input className="form-control" value={line.uom} onChange={e => updateLine(i, 'uom', e.target.value)} />
                    </div>
                    <button type="button" className="btn-icon" onClick={() => removeLine(i)} style={{ color: 'var(--danger)', marginBottom: 0 }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
