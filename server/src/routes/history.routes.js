const express = require('express');
const router = express.Router();
const { StockMove, StockMoveLine, Warehouse, Product } = require('../models');
const { protect } = require('../middleware/auth');
const { Op } = require('sequelize');

// GET /api/history - stock ledger
router.get('/', protect, async (req, res) => {
  try {
    const { type, status, search, dateFrom, dateTo, page = 1, limit = 30 } = req.query;
    const where = { status: 'done' };
    if (type) where.type = type;
    if (status && status !== 'done') where.status = status;
    
    if (search) {
      where[Op.or] = [
        { reference: { [Op.iLike]: `%${search}%` } },
        { partner: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (dateFrom || dateTo) {
      where.validatedDate = {};
      if (dateFrom) where.validatedDate[Op.gte] = new Date(dateFrom);
      // to handle the entire day if dateTo is provided without time
      if (dateTo) {
        const d = new Date(dateTo);
        d.setHours(23, 59, 59, 999);
        where.validatedDate[Op.lte] = d;
      }
    }
    
    const limitNum = Number(limit);
    const offset = (Number(page) - 1) * limitNum;

    const { count, rows } = await StockMove.findAndCountAll({
      where,
      include: [
        { model: Warehouse, as: 'fromWarehouse', attributes: ['name', 'code'] },
        { model: Warehouse, as: 'toWarehouse', attributes: ['name', 'code'] },
        { model: StockMoveLine, as: 'lines', include: [{ model: Product, as: 'product', attributes: ['name', 'sku'] }] }
      ],
      order: [['validatedDate', 'DESC'], ['createdAt', 'DESC']],
      limit: limitNum,
      offset
    });
    
    res.json({ success: true, data: rows, total: count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
