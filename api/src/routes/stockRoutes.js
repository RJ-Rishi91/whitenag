import express from 'express';
import mongoose from 'mongoose';
import { StockLevel } from '../models/StockLevel.js';
import { StockMovement } from '../models/StockMovement.js';
import { StockTransfer } from '../models/StockTransfer.js';
import { Order } from '../models/Order.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { getNextSequence } from '../services/counterService.js';
import { recordStockMovement, transferGodownStock } from '../services/stockService.js';
import { emitEvent } from '../services/socketService.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/v1/stock/levels
router.get('/levels', async (req, res, next) => {
  try {
    const { godownId, category, lowStockOnly } = req.query;
    const filter = {};
    if (godownId) filter.godownId = godownId;

    let levels = await StockLevel.find(filter)
      .populate({
        path: 'itemId',
        populate: { path: 'unitId' }
      })
      .populate('godownId');

    // Filter out null populated items
    levels = levels.filter(l => l.itemId && l.godownId);

    if (category) {
      levels = levels.filter(l => l.itemId.category === category);
    }

    if (lowStockOnly === 'true') {
      levels = levels.filter(l => l.available <= (l.itemId.minStock || 10));
    }

    res.json({ success: true, count: levels.length, data: levels });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/stock/movements
router.get('/movements', async (req, res, next) => {
  try {
    const { itemId, godownId, type, fromDate, toDate, limit = 50 } = req.query;
    const filter = {};

    if (itemId) filter.itemId = itemId;
    if (godownId) filter.godownId = godownId;
    if (type) filter.type = type;
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate + 'T23:59:59.999Z');
    }

    const movements = await StockMovement.find(filter)
      .populate('itemId')
      .populate('godownId')
      .populate('createdBy', 'name username')
      .sort({ date: -1 })
      .limit(Number(limit));

    res.json({ success: true, count: movements.length, data: movements });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/stock/reserved
router.get('/reserved', async (req, res, next) => {
  try {
    // Orders in 'received' or 'packed' status hold reserved inventory
    const activeOrders = await Order.find({
      status: { $in: ['received', 'packed'] }
    })
      .populate('partyId', 'name mobile')
      .populate('godownId', 'name code')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: activeOrders.length, data: activeOrders });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/stock/transfers
router.post('/transfers', requirePermission('stock.transfer'), async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { fromGodownId, toGodownId, lines, remarks = '' } = req.body;

    if (!fromGodownId || !toGodownId || !lines || lines.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Source, destination and lines required' });
    }

    if (fromGodownId.toString() === toGodownId.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Source and destination cannot be identical' });
    }

    const transferNo = await getNextSequence('transferNo', 'TRF-', 6, session);

    const transfer = new StockTransfer({
      transferNo,
      fromGodownId,
      toGodownId,
      lines,
      date: new Date(),
      remarks,
      createdBy: req.user._id
    });

    await transfer.save({ session });

    await transferGodownStock({
      fromGodownId,
      toGodownId,
      lines,
      refId: transfer._id,
      remarks,
      createdBy: req.user._id,
      session
    });

    await session.commitTransaction();
    session.endSession();

    const populated = await StockTransfer.findById(transfer._id)
      .populate('fromGodownId')
      .populate('toGodownId')
      .populate('lines.itemId');

    emitEvent('stock:changed', { type: 'transfer', transfer: populated });

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
});

// POST /api/v1/stock/adjustments
router.post('/adjustments', requirePermission('stock.adjust'), async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { itemId, godownId, qty, type = 'adjustment', remarks = '' } = req.body;
    const adjustmentQty = Number(qty);

    if (!itemId || !godownId || adjustmentQty === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'itemId, godownId and non-zero qty required' });
    }

    const movementType = type === 'wastage' ? 'wastage' : 'adjustment';

    const { movement, level } = await recordStockMovement({
      itemId,
      godownId,
      qty: adjustmentQty,
      type: movementType,
      refType: 'Adjustment',
      remarks: remarks || `Manual ${movementType}`,
      createdBy: req.user._id,
      session
    });

    await session.commitTransaction();
    session.endSession();

    emitEvent('stock:changed', { type: movementType, itemId, godownId, level });

    res.status(201).json({ success: true, movement, level });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
});

export default router;
