const express = require('express');
const router = express.Router();
const { StockMove, StockMoveLine, Warehouse, Product } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const { updateStock } = require('../helpers/stockHelper');
const { Op } = require('sequelize');

const generateRef = async (prefix) => {
  const count = await StockMove.count({ where: { type: prefix === 'WH/IN' ? 'receipt' : prefix === 'WH/OUT' ? 'delivery' : 'transfer' } });
  return `${prefix}/${String(count + 1).padStart(4, '0')}`;
};

// GET /api/receipts
router.get('/', protect, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const where = { type: 'receipt' };
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { reference: { [Op.iLike]: `%${search}%` } },
        { partner: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const limitNum = Number(limit);
    const offset = (Number(page) - 1) * limitNum;

    const { count, rows } = await StockMove.findAndCountAll({
      where,
      include: [
        { model: Warehouse, as: 'toWarehouse', attributes: ['id', 'name', 'code'] },
        { model: StockMoveLine, as: 'lines', include: [{ model: Product, as: 'product', attributes: ['name', 'sku'] }] }
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset
    });
    
    res.json({ success: true, data: rows, total: count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/receipts/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const move = await StockMove.findByPk(req.params.id, {
      include: [
        { model: Warehouse, as: 'toWarehouse', attributes: ['id', 'name', 'code'] },
        { model: StockMoveLine, as: 'lines', include: [{ model: Product, as: 'product', attributes: ['name', 'sku', 'uom'] }] }
      ]
    });
    if (!move || move.type !== 'receipt') return res.status(404).json({ success: false, message: 'Receipt not found.' });
    res.json({ success: true, data: move });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/receipts
router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const ref = await generateRef('WH/IN');
    const { lines, toWarehouse, toLocation, partner, scheduledDate, notes } = req.body;
    
    const move = await StockMove.create({
      reference: ref,
      type: 'receipt',
      status: 'draft',
      partner,
      toWarehouseId: toWarehouse || null,
      toLocation,
      scheduledDate,
      notes,
      createdById: req.user.id
    });

    if (lines && lines.length > 0) {
      await Promise.all(lines.map(l => 
        StockMoveLine.create({
          StockMoveId: move.id,
          ProductId: l.product || null,
          productName: l.productName,
          sku: l.sku,
          demandQty: l.demandQty,
          uom: l.uom
        })
      ));
    }

    res.status(201).json({ success: true, data: move });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/receipts/:id/validate
router.post('/:id/validate', protect, authorize('admin', 'manager', 'staff'), async (req, res) => {
  try {
    const move = await StockMove.findByPk(req.params.id, {
      include: [{ model: StockMoveLine, as: 'lines' }]
    });
    if (!move || move.type !== 'receipt') return res.status(404).json({ success: false, message: 'Receipt not found.' });
    if (move.status === 'done') return res.status(400).json({ success: false, message: 'Already validated.' });
    
    move.status = 'done';
    move.validatedDate = new Date();
    move.validatedById = req.user.id;
    await move.save();

    await Promise.all(move.lines.map(async l => {
      if (!l.doneQty) {
        l.doneQty = l.demandQty;
        await l.save();
      }
    }));

    await updateStock(move.lines, 'receipt', move);
    res.json({ success: true, data: move, message: 'Receipt validated. Stock updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/receipts/:id/cancel
router.post('/:id/cancel', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const move = await StockMove.findByPk(req.params.id);
    if (!move) return res.status(404).json({ success: false, message: 'Not found' });
    move.status = 'cancelled';
    await move.save();
    res.json({ success: true, data: move });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/status', protect, authorize('admin', 'manager', 'staff'), async (req, res) => {
  try {
    const { status } = req.body;
    const move = await StockMove.findByPk(req.params.id);
    if (!move) return res.status(404).json({ success: false, message: 'Not found' });
    if (move.status === 'done' || status === 'done') {
      return res.status(400).json({ success: false, message: 'Cannot set to done directly. Use validate.' });
    }
    move.status = status;
    await move.save();
    res.json({ success: true, data: move });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
