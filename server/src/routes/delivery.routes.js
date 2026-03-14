const express = require('express');
const router = express.Router();
const StockMove = require('../models/StockMove');
const { protect } = require('../middleware/auth');
const { updateStock } = require('../helpers/stockHelper');

const generateRef = async () => {
  const count = await StockMove.countDocuments({ type: 'delivery' });
  return `WH/OUT/${String(count + 1).padStart(4, '0')}`;
};

router.get('/', protect, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const filter = { type: 'delivery' };
    if (status) filter.status = status;
    if (search) filter.$or = [
      { reference: { $regex: search, $options: 'i' } },
      { partner: { $regex: search, $options: 'i' } }
    ];
    const moves = await StockMove.find(filter)
      .populate('fromWarehouse', 'name code')
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

router.get('/:id', protect, async (req, res) => {
  try {
    const move = await StockMove.findById(req.params.id)
      .populate('fromWarehouse', 'name code locations')
      .populate('lines.product', 'name sku uom stockLevels');
    if (!move || move.type !== 'delivery') return res.status(404).json({ success: false, message: 'Delivery not found.' });
    res.json({ success: true, data: move });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const ref = await generateRef();
    const move = await StockMove.create({
      ...req.body,
      reference: ref,
      type: 'delivery',
      status: 'draft',
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: move });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const move = await StockMove.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: move });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/validate', protect, async (req, res) => {
  try {
    const move = await StockMove.findById(req.params.id);
    if (!move || move.type !== 'delivery') return res.status(404).json({ success: false, message: 'Delivery not found.' });
    if (move.status === 'done') return res.status(400).json({ success: false, message: 'Already validated.' });
    move.status = 'done';
    move.validatedDate = new Date();
    move.validatedBy = req.user._id;
    move.lines.forEach(l => { if (!l.doneQty) l.doneQty = l.demandQty; });
    await move.save();
    await updateStock(move.lines, 'delivery', move);
    res.json({ success: true, data: move, message: 'Delivery validated. Stock updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/cancel', protect, async (req, res) => {
  try {
    const move = await StockMove.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
    res.json({ success: true, data: move });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
