const express = require('express');
const router = express.Router();
const { StockMove, StockMoveLine, Warehouse, Product } = require('../models');
const { protect } = require('../middleware/auth');
const { updateStock } = require('../helpers/stockHelper');
const { Op } = require('sequelize');

const generateRef = async () => {
  const count = await StockMove.count({ where: { type: 'transfer' } });
  return `WH/INT/${String(count + 1).padStart(4, '0')}`;
};

router.get('/', protect, async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = { type: 'transfer' };
    if (status) where.status = status;
    if (search) where.reference = { [Op.iLike]: `%${search}%` };

    const moves = await StockMove.findAll({
      where,
      include: [
        { model: Warehouse, as: 'fromWarehouse', attributes: ['id', 'name', 'code'] },
        { model: Warehouse, as: 'toWarehouse', attributes: ['id', 'name', 'code'] },
        { model: StockMoveLine, as: 'lines', include: [{ model: Product, as: 'product', attributes: ['name', 'sku'] }] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: moves });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const move = await StockMove.findByPk(req.params.id, {
      include: [
        { model: Warehouse, as: 'fromWarehouse', attributes: ['id', 'name', 'code'] },
        { model: Warehouse, as: 'toWarehouse', attributes: ['id', 'name', 'code'] },
        { model: StockMoveLine, as: 'lines', include: [{ model: Product, as: 'product', attributes: ['name', 'sku'] }] }
      ]
    });
    if (!move || move.type !== 'transfer') return res.status(404).json({ success: false, message: 'Transfer not found.' });
    res.json({ success: true, data: move });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const ref = await generateRef();
    const { lines, fromWarehouse, fromLocation, toWarehouse, toLocation, scheduledDate, notes } = req.body;
    const move = await StockMove.create({
      reference: ref, type: 'transfer', status: 'draft',
      fromWarehouseId: fromWarehouse || null, fromLocation,
      toWarehouseId: toWarehouse || null, toLocation,
      scheduledDate, notes, createdById: req.user.id
    });

    if (lines && lines.length > 0) {
      await Promise.all(lines.map(l => StockMoveLine.create({
        StockMoveId: move.id, ProductId: l.product || null,
        productName: l.productName, sku: l.sku, demandQty: l.demandQty, uom: l.uom
      })));
    }
    res.status(201).json({ success: true, data: move });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/validate', protect, async (req, res) => {
  try {
    const move = await StockMove.findByPk(req.params.id, { include: [{ model: StockMoveLine, as: 'lines' }] });
    if (!move || move.type !== 'transfer') return res.status(404).json({ success: false, message: 'Not found.' });
    if (move.status === 'done') return res.status(400).json({ success: false, message: 'Already validated.' });
    move.status = 'done';
    move.validatedDate = new Date();
    move.validatedById = req.user.id;
    await move.save();

    await Promise.all(move.lines.map(async l => {
      if (!l.doneQty) { l.doneQty = l.demandQty; await l.save(); }
    }));
    await updateStock(move.lines, 'transfer', move);
    res.json({ success: true, data: move, message: 'Validated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/cancel', protect, async (req, res) => {
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

module.exports = router;
