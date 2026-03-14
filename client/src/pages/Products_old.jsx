import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Plus, Search, AlertTriangle, Package, X, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [newCat, setNewCat] = useState('');

  const [form, setForm] = useState({
    name: '', sku: '', description: '', category: '',
    uom: 'Units', costPrice: 0, salePrice: 0,
    minStockLevel: 0, reorderQty: 0,
    initialStock: 0, warehouseId: '', locationName: 'Main Stock'
  });

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (categoryFilter) params.category = categoryFilter;
    Promise.all([
      api.get('/products', { params }),
      api.get('/products/categories/all'),
      api.get('/warehouses')
    ]).then(([p, c, w]) => {
      setProducts(p.data.data); setTotal(p.data.total);
      setCategories(c.data.data); setWarehouses(w.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [search, categoryFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editProduct) {
        await api.put(`/products/${editProduct.id}`, form);
        toast.success('Product updated');
      } else {
        await api.post('/products', form);
        toast.success('Product created');
      }
      setShowForm(false); setEditProduct(null);
      setForm({ name: '', sku: '', description: '', category: '', uom: 'Units', costPrice: 0, salePrice: 0, minStockLevel: 0, reorderQty: 0, initialStock: 0, warehouseId: '', locationName: 'Main Stock' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleEdit = (p) => {
    setForm({ name: p.name, sku: p.sku, description: p.description || '', category: p.category?.id || '', uom: p.uom, costPrice: p.costPrice, salePrice: p.salePrice, minStockLevel: p.minStockLevel, reorderQty: p.reorderQty, initialStock: 0, warehouseId: '', locationName: 'Main Stock' });
    setEditProduct(p); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Archive this product?')) return;
    await api.delete(`/products/${id}`);
    toast.success('Product archived'); fetchData();
  };

  const createCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products/categories/create', { name: newCat });
      toast.success('Category created'); setNewCat(''); setShowCatForm(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Products</h2>
          <p>Manage inventory items · {total} total</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowCatForm(true)}>+ Category</button>
          <button id="new-product-btn" className="btn btn-primary" onClick={() => { setEditProduct(null); setShowForm(true); }}>
            <Plus size={15} /> New Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={16} />
          <input id="product-search" placeholder="Search by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" style={{ width: 180 }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>UOM</th>
              <th>Total Stock</th>
              <th>Min. Level</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}><div className="loading-spinner"><div className="spinner" /></div></td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={8}>
                <div className="empty-state">
                  <Package size={40} />
                  <h3>No Products Found</h3>
                  <p>Create your first product to get started</p>
                </div>
              </td></tr>
            ) : products.map(p => {
              const total = p.totalStock ?? p.stockLevels?.reduce((s, l) => s + l.quantity, 0) ?? 0;
              const isLow = total > 0 && total <= p.minStockLevel;
              const isOut = total === 0;
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📦</div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <p className="text-indigo-300 text-sm font-medium">Total Products</p>
                  <p className="text-4xl font-bold text-white">{products.length}</p>

      {/* Category Form */}
      {showCatForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCatForm(false)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <h3 className="modal-title">New Category</h3>
              <button className="btn-icon" onClick={() => setShowCatForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={createCategory}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Category Name</label>
                  <input className="form-control" placeholder="e.g. Raw Materials" value={newCat} onChange={e => setNewCat(e.target.value)} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCatForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
