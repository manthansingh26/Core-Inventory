import { useState, useEffect } from 'react';
import { X, PackagePlus, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function QuickStockUpdate({ onClose, onUpdated }) {
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [stockUpdates, setStockUpdates] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, warehousesRes] = await Promise.all([
        api.get('/products'),
        api.get('/warehouses')
      ]);

      // Filter out-of-stock and low-stock products
      const allProducts = productsRes.data.data;
      const criticalProducts = allProducts.filter(p => {
        const total = p.totalStock ?? p.stockLevels?.reduce((s, l) => s + l.quantity, 0) ?? 0;
        return total === 0 || total <= p.minStockLevel;
      });

      setProducts(criticalProducts);
      setWarehouses(warehousesRes.data.data);

      // Initialize stock updates with reorder quantities
      const initialUpdates = {};
      criticalProducts.forEach(p => {
        initialUpdates[p.id] = {
          quantity: p.reorderQty || 100,
          warehouseId: warehousesRes.data.data[0]?.id || '',
          location: 'Main Stock'
        };
      });
      setStockUpdates(initialUpdates);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const updateStockValue = (productId, field, value) => {
    setStockUpdates(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }));
  };

  const handleUpdateStock = async (productId) => {
    const update = stockUpdates[productId];
    if (!update.warehouseId || !update.quantity || update.quantity <= 0) {
      toast.error('Please fill all fields');
      return;
    }

    setUpdating(true);
    try {
      // Create a receipt to add stock
      const product = products.find(p => p.id === productId);
      await api.post('/receipts', {
        partner: 'Stock Replenishment',
        toWarehouse: update.warehouseId,
        toLocation: update.location,
        scheduledDate: new Date().toISOString().split('T')[0],
        notes: 'Quick stock update for out-of-stock item',
        lines: [{
          product: productId,
          productName: product.name,
          sku: product.sku,
          demandQty: update.quantity,
          uom: product.uom
        }]
      });

      // Validate the receipt immediately
      const receiptsRes = await api.get('/receipts', { 
        params: { search: 'Stock Replenishment' } 
      });
      const latestReceipt = receiptsRes.data.data[0];
      
      if (latestReceipt) {
        await api.post(`/receipts/${latestReceipt.id}/validate`);
      }

      toast.success(`Stock updated for ${product.name}`);
      
      // Remove from list
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update stock');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateAll = async () => {
    setUpdating(true);
    let successCount = 0;
    
    for (const product of products) {
      try {
        await handleUpdateStock(product.id);
        successCount++;
      } catch (err) {
        console.error(`Failed to update ${product.name}:`, err);
      }
    }

    toast.success(`Updated ${successCount} products`);
    setUpdating(false);
    
    if (onUpdated) onUpdated();
    if (successCount === products.length) onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h3 className="modal-title">
            <PackagePlus size={20} /> Quick Stock Update
          </h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : products.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <PackagePlus size={40} />
              <h3>All Stocked Up!</h3>
              <p>No out-of-stock or low-stock items found</p>
            </div>
          ) : (
            <>
              <div style={{ 
                background: 'var(--warning-dim)', 
                color: 'var(--warning)', 
                padding: '12px 16px', 
                borderRadius: 8, 
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 14
              }}>
                <AlertTriangle size={18} />
                <div>
                  <strong>{products.length} products</strong> need restocking
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '60vh', overflowY: 'auto' }}>
                {products.map(product => {
                  const total = product.totalStock ?? product.stockLevels?.reduce((s, l) => s + l.quantity, 0) ?? 0;
                  const isOut = total === 0;
                  const update = stockUpdates[product.id] || {};

                  return (
                    <div 
                      key={product.id} 
                      style={{ 
                        border: '1px solid var(--border)', 
                        borderRadius: 8, 
                        padding: 16,
                        background: 'var(--bg-elevated)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                            {product.name}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            SKU: <code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: 4 }}>{product.sku}</code>
                            {' · '}
                            Current: <span style={{ color: isOut ? 'var(--danger)' : 'var(--warning)', fontWeight: 600 }}>{total}</span>
                            {' · '}
                            Min: {product.minStockLevel}
                          </div>
                        </div>
                        <span className={isOut ? 'badge badge-danger' : 'badge badge-warning'}>
                          {isOut ? 'Out of Stock' : 'Low Stock'}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr auto', gap: 10, alignItems: 'end' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: 12 }}>Quantity</label>
                          <input 
                            className="form-control" 
                            type="number" 
                            min={1}
                            value={update.quantity || ''}
                            onChange={e => updateStockValue(product.id, 'quantity', Number(e.target.value))}
                            placeholder={product.reorderQty || 100}
                          />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: 12 }}>Warehouse</label>
                          <select 
                            className="form-control"
                            value={update.warehouseId || ''}
                            onChange={e => updateStockValue(product.id, 'warehouseId', e.target.value)}
                          >
                            <option value="">Select warehouse</option>
                            {warehouses.map(w => (
                              <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: 12 }}>Location</label>
                          <input 
                            className="form-control"
                            value={update.location || ''}
                            onChange={e => updateStockValue(product.id, 'location', e.target.value)}
                            placeholder="Main Stock"
                          />
                        </div>

                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleUpdateStock(product.id)}
                          disabled={updating}
                          style={{ marginBottom: 0 }}
                        >
                          {updating ? 'Updating...' : 'Update'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
          {products.length > 0 && (
            <button 
              className="btn btn-primary" 
              onClick={handleUpdateAll}
              disabled={updating}
            >
              {updating ? 'Updating...' : `Update All (${products.length})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
