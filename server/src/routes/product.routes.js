const express = require('express');
const router = express.Router();
const { Product, ProductStock, Category } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

// GET /api/products - list all products
router.get('/', protect, async (req, res) => {
  try {
    const { search, category, lowStock, page = 1, limit = 50 } = req.query;
    const where = { isActive: true };
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (category) where.categoryId = category;

    const limitNum = Number(limit);
    const offset = (Number(page) - 1) * limitNum;

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['name'] },
        { model: ProductStock, as: 'stockLevels' }
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset
    });

    let result = rows.map(p => {
      const pData = p.toJSON();
      pData.totalStock = pData.stockLevels.reduce((sum, s) => sum + s.quantity, 0);
      return pData;
    });

    if (lowStock === 'true') {
      result = result.filter(p => p.totalStock <= p.minStockLevel);
    }

    res.json({ success: true, data: result, total: count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'category', attributes: ['name'] },
        { model: ProductStock, as: 'stockLevels' }
      ]
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products
router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { name, sku, description, category, uom, costPrice, salePrice, minStockLevel, reorderQty, initialStock, warehouseId, locationName } = req.body;
    
    // Set categoryId appropriately
    const productData = { name, sku, description, uom, costPrice, salePrice, minStockLevel, reorderQty };
    if (category) productData.categoryId = category;

    const product = await Product.create(productData);

    if (initialStock && initialStock > 0 && warehouseId) {
      await ProductStock.create({
        locationName: locationName || 'Main Stock',
        quantity: initialStock,
        ProductId: product.id,
        WarehouseId: warehouseId
      });
    }

    const newProduct = await Product.findByPk(product.id, {
      include: [{ model: ProductStock, as: 'stockLevels' }]
    });

    res.status(201).json({ success: true, data: newProduct });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/products/:id
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    
    const { category, ...data } = req.body;
    if (category !== undefined) data.categoryId = category || null;

    await product.update(data);
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/products/:id (soft delete)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    await product.update({ isActive: false });
    res.json({ success: true, message: 'Product archived.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Categories ---
router.get('/categories/all', protect, async (req, res) => {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/categories/create', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const cat = await Category.create(req.body);
    res.status(201).json({ success: true, data: cat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
