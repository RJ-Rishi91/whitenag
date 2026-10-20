import express from 'express';
import { Order } from '../models/Order.js';
import { Purchase } from '../models/Purchase.js';
import { ProductionEntry } from '../models/ProductionEntry.js';
import { StockLevel } from '../models/StockLevel.js';
import { Party } from '../models/Party.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/v1/reports/sales
router.get('/sales', async (req, res, next) => {
  try {
    const { fromDate, toDate, areaId, segment } = req.query;
    const filter = {};

    if (areaId) filter.areaId = areaId;
    if (segment) filter.segment = segment;
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate + 'T23:59:59.999Z');
    }

    const orders = await Order.find(filter)
      .populate('partyId', 'name mobile')
      .populate('areaId', 'name code')
      .sort({ createdAt: -1 });

    const totalSales = orders.reduce((sum, o) => sum + o.grandTotal, 0);

    res.json({
      success: true,
      count: orders.length,
      totalSales,
      data: orders
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/reports/purchases
router.get('/purchases', async (req, res, next) => {
  try {
    const { fromDate, toDate, supplierId } = req.query;
    const filter = {};

    if (supplierId) filter.supplierId = supplierId;
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate + 'T23:59:59.999Z');
    }

    const purchases = await Purchase.find(filter)
      .populate('supplierId', 'name mobile')
      .populate('godownId', 'name')
      .sort({ date: -1 });

    const totalPurchases = purchases.reduce((sum, p) => sum + p.grandTotal, 0);

    res.json({
      success: true,
      count: purchases.length,
      totalPurchases,
      data: purchases
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/reports/manufacturing
router.get('/manufacturing', async (req, res, next) => {
  try {
    const { fromDate, toDate, productId } = req.query;
    const filter = {};

    if (productId) filter.productId = productId;
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate + 'T23:59:59.999Z');
    }

    const entries = await ProductionEntry.find(filter)
      .populate('productId', 'name sku')
      .populate('godownId', 'name')
      .sort({ date: -1 });

    const totalProduced = entries.reduce((sum, e) => sum + e.qty, 0);
    const totalWastage = entries.reduce((sum, e) => sum + (e.wastage || 0), 0);

    res.json({
      success: true,
      count: entries.length,
      totalProduced,
      totalWastage,
      data: entries
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/reports/dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayOrders = await Order.find({ createdAt: { $gte: todayStart } });
    const todaySales = todayOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);

    const monthOrders = await Order.find({ createdAt: { $gte: monthStart } });
    const monthSales = monthOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);

    const debtors = await Party.find({ type: 'customer', balance: { $gt: 0 } });
    const totalOutstanding = debtors.reduce((sum, d) => sum + d.balance, 0);

    res.json({
      success: true,
      data: {
        todaySales,
        monthSales,
        invoicesCount: todayOrders.length,
        totalOutstanding
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
