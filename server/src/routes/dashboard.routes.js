const express = require('express');
const router = express.Router();
const { StockMove, Product, sequelize } = require('../models');
const { protect } = require('../middleware/auth');
const { Op } = require('sequelize');

router.get('/', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      pendingReceipts,
      pendingDeliveries,
      pendingTransfers,
      totalProducts,
      doneToday,
      lateReceipts,
      lateDeliveries
    ] = await Promise.all([
      StockMove.count({ where: { type: 'receipt', status: { [Op.in]: ['draft', 'waiting', 'ready'] } } }),
      StockMove.count({ where: { type: 'delivery', status: { [Op.in]: ['draft', 'waiting', 'ready'] } } }),
      StockMove.count({ where: { type: 'transfer', status: { [Op.in]: ['draft', 'waiting', 'ready'] } } }),
      Product.count({ where: { isActive: true } }),
      StockMove.count({ where: { status: 'done', validatedDate: { [Op.gte]: today } } }),
      StockMove.count({ where: { type: 'receipt', status: { [Op.notIn]: ['done', 'cancelled'] }, scheduledDate: { [Op.lt]: today } } }),
      StockMove.count({ where: { type: 'delivery', status: { [Op.notIn]: ['done', 'cancelled'] }, scheduledDate: { [Op.lt]: today } } })
    ]);

    // Low stock products
    const allProducts = await Product.findAll({ 
      where: { isActive: true },
      include: ['stockLevels'] 
    });
    
    const lowStockCount = allProducts.filter(p => {
      const total = p.stockLevels?.reduce((s, l) => s + l.quantity, 0) || 0;
      return total <= p.minStockLevel && total > 0;
    }).length;
    
    const outOfStockCount = allProducts.filter(p => {
      const total = p.stockLevels?.reduce((s, l) => s + l.quantity, 0) || 0;
      return total <= 0;
    }).length;

    // Recent moves (last 7 days chart data)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Using raw query for grouping by date in postgres
    const recentMovesRaw = await StockMove.findAll({
      where: { status: 'done', validatedDate: { [Op.gte]: sevenDaysAgo } },
      attributes: [
        [sequelize.fn('date', sequelize.col('validatedDate')), 'date'],
        'type',
        [sequelize.fn('count', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('date', sequelize.col('validatedDate')), 'type'],
      order: [[sequelize.fn('date', sequelize.col('validatedDate')), 'ASC']],
      raw: true
    });

    const recentMoves = recentMovesRaw.map(m => ({
      _id: { date: m.date, type: m.type },
      count: Number(m.count)
    }));

    res.json({
      success: true,
      data: {
        kpis: {
          totalProducts, lowStockCount, outOfStockCount,
          pendingReceipts, pendingDeliveries, pendingTransfers,
          lateReceipts, lateDeliveries, doneToday
        },
        recentMoves
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
