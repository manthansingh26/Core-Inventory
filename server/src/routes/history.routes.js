const express = require('express');
const router = express.Router();
const StockMove = require('../models/StockMove');
const { protect } = require('../middleware/auth');

// GET /api/history - stock ledger
router.get('/', protect, async (req, res) => {
  try {
    const { type, status, search, dateFrom, dateTo, page = 1, limit = 30 } = req.query;
    const filter = { status: 'done' };
    if (type) filter.type = type;
    if (status && status !== 'done') filter.status = status;
    else if (!type && !status) {} // show all done
    if (search) filter.$or = [
      { reference: { $regex: search, $options: 'i' } },
      { partner: { $regex: search, $options: 'i' } }
    ];
    if (dateFrom || dateTo) {
      filter.validatedDate = {};
      if (dateFrom) filter.validatedDate.$gte = new Date(dateFrom);
      if (dateTo) filter.validatedDate.$lte = new Date(dateTo);
    }
    const moves = await StockMove.find(filter)
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('lines.product', 'name sku')
      .sort({ validatedDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await StockMove.countDocuments(filter);
    res.json({ success: true, data: moves, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
