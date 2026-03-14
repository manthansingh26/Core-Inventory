const express = require('express');
const router = express.Router();
const StockMove = require('../models/StockMove');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { updateStock } = require('../helpers/stockHelper');

const generateRef = async (prefix) => {
  const count = await StockMove.countDocuments({ type: prefix === 'WH/IN' ? 'receipt' : prefix === 'WH/OUT' ? 'delivery' : 'transfer' });
  return `${prefix}/${String(count + 1).padStart(4, '0')}`;
};

// GET /api/receipts
router.get('/', protect, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const filter = { type: 'receipt' };
    if (status) filter.status = status;
    if (search) filter.$or = [
      { reference: { $regex: search, $options: 'i' } },
      { partner: { $regex: search, $options: 'i' } }
    ];
    const moves = await StockMove.find(filter)
      .populate('toWarehouse', 'name code')
      .populate('lines.product', 'name sku')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await StockMove.countDocuments(filter);
    res.json({ success: true, data: moves, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/receipts/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const move = await StockMove.findById(req.params.id)
      .populate('toWarehouse', 'name code locations')
      .populate('lines.product', 'name sku uom');
    if (!move || move.type !== 'receipt') return res.status(404).json({ success: false, message: 'Receipt not found.' });
    res.json({ success: true, data: move });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/receipts
router.post('/', protect, async (req, res) => {
  try {
    const ref = await generateRef('WH/IN');
    const move = await StockMove.create({
      ...req.body,
      reference: ref,
      type: 'receipt',
      status: 'draft',
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: move });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/receipts/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const move = await StockMove.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: move });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/receipts/:id/validate
router.post('/:id/validate', protect, async (req, res) => {
  try {
    const move = await StockMove.findById(req.params.id);
    if (!move || move.type !== 'receipt') return res.status(404).json({ success: false, message: 'Receipt not found.' });
    if (move.status === 'done') return res.status(400).json({ success: false, message: 'Already validated.' });
    move.status = 'done';
    move.validatedDate = new Date();
    move.validatedBy = req.user._id;
    // Set doneQty = demandQty if not manually set
    move.lines.forEach(l => { if (!l.doneQty) l.doneQty = l.demandQty; });
    await move.save();
    await updateStock(move.lines, 'receipt', move);
    res.json({ success: true, data: move, message: 'Receipt validated. Stock updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/receipts/:id/cancel
router.post('/:id/cancel', protect, async (req, res) => {
  try {
    const move = await StockMove.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
    res.json({ success: true, data: move });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
