const express = require('express');
const router = express.Router();
const StockMove = require('../models/StockMove');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Counts
    const [
      pendingReceipts,
      pendingDeliveries,
      pendingTransfers,
      totalProducts,
      doneToday
    ] = await Promise.all([
      StockMove.countDocuments({ type: 'receipt', status: { $in: ['draft', 'waiting', 'ready'] } }),
      StockMove.countDocuments({ type: 'delivery', status: { $in: ['draft', 'waiting', 'ready'] } }),
      StockMove.countDocuments({ type: 'transfer', status: { $in: ['draft', 'waiting', 'ready'] } }),
      Product.countDocuments({ isActive: true }),
      StockMove.countDocuments({ status: 'done', validatedDate: { $gte: today } })
    ]);

    // Low stock products
    const allProducts = await Product.find({ isActive: true });
    const lowStockCount = allProducts.filter(p => {
      const total = p.stockLevels.reduce((s, l) => s + l.quantity, 0);
      return total <= p.minStockLevel;
    }).length;
    const outOfStockCount = allProducts.filter(p => {
      const total = p.stockLevels.reduce((s, l) => s + l.quantity, 0);
      return total === 0;
    }).length;

    // Late receipts (scheduled date < today, not done)
    const lateReceipts = await StockMove.countDocuments({
      type: 'receipt',
      status: { $nin: ['done', 'cancelled'] },
      scheduledDate: { $lt: today }
    });
    const lateDeliveries = await StockMove.countDocuments({
      type: 'delivery',
      status: { $nin: ['done', 'cancelled'] },
      scheduledDate: { $lt: today }
    });

    // Recent moves (last 7 days chart data)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentMoves = await StockMove.aggregate([
      { $match: { status: 'done', validatedDate: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$validatedDate' } },
            type: '$type'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        kpis: {
          totalProducts,
          lowStockCount,
          outOfStockCount,
          pendingReceipts,
          pendingDeliveries,
          pendingTransfers,
          lateReceipts,
          lateDeliveries,
          doneToday
        },
        recentMoves
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
