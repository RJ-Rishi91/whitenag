import express from 'express';
import { Order } from '../models/Order.js';
import { Party } from '../models/Party.js';
import { StockLevel } from '../models/StockLevel.js';
import { ProductionEntry } from '../models/ProductionEntry.js';
import { Payment } from '../models/Payment.js';
import { SyncOutbox } from '../models/SyncOutbox.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/v1/dashboard
router.get('/', async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Today's orders
    const todayOrders = await Order.find({ createdAt: { $gte: todayStart } });
    const todaySales = todayOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);

    // Month's orders
    const monthOrders = await Order.find({ createdAt: { $gte: monthStart } });
    const monthSales = monthOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);

    // Segment split (month)
    let b2bSales = 0;
    let b2cSales = 0;
    monthOrders.forEach(o => {
      if (o.segment === 'b2c') b2cSales += o.grandTotal;
      else b2bSales += o.grandTotal;
    });

    // Pipeline status counts
    const statusCounts = {
      received: await Order.countDocuments({ status: 'received' }),
      packed: await Order.countDocuments({ status: 'packed' }),
      shipped: await Order.countDocuments({ status: 'shipped' }),
      delivered: await Order.countDocuments({ status: 'delivered' })
    };

    // Today's production
    const todayProductions = await ProductionEntry.find({ date: { $gte: todayStart } });
    const todayProductionQty = todayProductions.reduce((sum, p) => sum + p.qty, 0);

    // Low stock items count
    const stockLevels = await StockLevel.find().populate('itemId');
    const lowStockCount = stockLevels.filter(l => l.itemId && l.available <= (l.itemId.minStock || 10)).length;

    // Outstanding total
    const debtors = await Party.find({ type: 'customer', balance: { $gt: 0 } });
    const outstandingTotal = debtors.reduce((sum, d) => sum + d.balance, 0);

    // Pending sync count
    const pendingSyncCount = await SyncOutbox.countDocuments({ status: 'pending' });

    // Cash and Bank Balances
    const payments = await Payment.find();
    let cashBalance = 0;
    let bankBalance = 0;
    let upiCollection = 0;

    payments.forEach(p => {
      const amt = p.direction === 'in' ? p.amount : -p.amount;
      if (p.mode === 'cash') cashBalance += amt;
      else if (p.mode === 'upi') {
        upiCollection += amt;
        bankBalance += amt;
      } else {
        bankBalance += amt;
      }
    });

    // 30-Day Sales trend
    const recentOrders = await Order.find({ createdAt: { $gte: thirtyDaysAgo } })
      .select('createdAt grandTotal')
      .sort({ createdAt: 1 });

    const salesTrendMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const key = d.toISOString().slice(0, 10);
      salesTrendMap[key] = 0;
    }

    recentOrders.forEach(o => {
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      if (salesTrendMap[key] !== undefined) {
        salesTrendMap[key] += o.grandTotal;
      }
    });

    const salesTrend = Object.entries(salesTrendMap).map(([date, total]) => ({ date, total }));

    // Top customers
    const topDebtors = debtors.slice(0, 5).map(d => ({
      id: d._id,
      name: d.name,
      mobile: d.mobile,
      balance: d.balance
    }));

    res.json({
      success: true,
      data: {
        metrics: {
          todaySales,
          monthSales,
          b2bSales,
          b2cSales,
          statusCounts,
          todayProductionQty,
          lowStockCount,
          outstandingTotal,
          pendingSyncCount,
          cashBalance,
          bankBalance,
          upiCollection
        },
        salesTrend,
        topCustomers: topDebtors
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
