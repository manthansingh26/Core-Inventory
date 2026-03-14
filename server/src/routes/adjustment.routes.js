const express = require('express');
const router = express.Router();
const StockMove = require('../models/StockMove');
const { protect } = require('../middleware/auth');
const { updateStock } = require('../helpers/stockHelper');

const generateRef = async () => {
  const count = await StockMove.countDocuments({ type: 'adjustment' });
  return `WH/ADJ/${String(count + 1).padStart(4, '0')}`;
};

router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { type: 'adjustment' };
    if (status) filter.status = status;
    const moves = await StockMove.find(filter)
      .populate('toWarehouse', 'name code')
      .populate('lines.product', 'name sku')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: moves });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const move = await StockMove.findById(req.params.id)
      .populate('toWarehouse', 'name code locations')
      .populate('lines.product', 'name sku uom');
    if (!move || move.type !== 'adjustment') return res.status(404).json({ success: false, message: 'Adjustment not found.' });
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
      type: 'adjustment',
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
    if (!move || move.type !== 'adjustment') return res.status(404).json({ success: false, message: 'Adjustment not found.' });
    if (move.status === 'done') return res.status(400).json({ success: false, message: 'Already validated.' });
    move.status = 'done';
    move.validatedDate = new Date();
    move.validatedBy = req.user._id;
    await move.save();
    await updateStock(move.lines, 'adjustment', move);
    res.json({ success: true, data: move, message: 'Adjustment applied. Stock corrected.' });
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
