const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

// GET /api/products - list all products
router.get('/', protect, async (req, res) => {
  try {
    const { search, category, lowStock, page = 1, limit = 50 } = req.query;
    const filter = { isActive: true };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } }
    ];
    if (category) filter.category = category;

    const products = await Product.find(filter)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Product.countDocuments(filter);

    // Apply lowStock filter after fetching (uses virtual)
    let result = products.map(p => p.toJSON());
    if (lowStock === 'true') {
      result = result.filter(p => p.totalStock <= p.minStockLevel);
    }

    res.json({ success: true, data: result, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products
router.post('/', protect, async (req, res) => {
  try {
    const { name, sku, description, category, uom, costPrice, salePrice, minStockLevel, reorderQty, initialStock, warehouseId, locationName } = req.body;
    const product = new Product({ name, sku, description, category, uom, costPrice, salePrice, minStockLevel, reorderQty });
    if (initialStock && initialStock > 0 && warehouseId) {
      product.stockLevels.push({ warehouse: warehouseId, locationName: locationName || 'Main Stock', quantity: initialStock });
    }
    await product.save();
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/products/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/products/:id (soft delete)
router.delete('/:id', protect, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Product archived.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Categories ---
// GET /api/products/categories/all
router.get('/categories/all', protect, async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products/categories
router.post('/categories/create', protect, async (req, res) => {
  try {
    const cat = await Category.create(req.body);
    res.status(201).json({ success: true, data: cat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
