import express from 'express';
import mongoose from 'mongoose';
import { Purchase } from '../models/Purchase.js';
import { Party } from '../models/Party.js';
import { Item } from '../models/Item.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { getNextSequence } from '../services/counterService.js';
import { recordStockMovement } from '../services/stockService.js';
import { enqueueSyncOutbox } from '../services/syncService.js';
import { emitEvent } from '../services/socketService.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/v1/purchases
router.get('/', async (req, res, next) => {
  try {
    const { supplierId, fromDate, toDate } = req.query;
    const filter = {};

    if (supplierId) filter.supplierId = supplierId;
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate + 'T23:59:59.999Z');
    }

    const purchases = await Purchase.find(filter)
      .populate('supplierId')
      .populate('godownId')
      .populate('lines.itemId')
      .sort({ date: -1 });

    res.json({ success: true, count: purchases.length, data: purchases });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/purchases/:id
router.get('/:id', async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplierId')
      .populate('godownId')
      .populate('lines.itemId')
      .populate('createdBy', 'name username');

    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });

    res.json({ success: true, data: purchase });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/purchases
router.post('/', requirePermission('purchase.create'), async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { supplierId, invoiceNo, date, godownId, lines, remarks = '' } = req.body;

    if (!supplierId || !godownId || !lines || lines.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Supplier, godown and lines required' });
    }

    const purchaseNo = await getNextSequence('purchaseNo', 'PUR-', 6, session);

    let subtotal = 0;
    let taxTotal = 0;

    const processedLines = lines.map(line => {
      const lineSubtotal = line.qty * line.rate;
      const discAmt = line.discount || 0;
      const taxable = Math.max(0, lineSubtotal - discAmt);
      const gstRate = line.gstRate || 5;
      const gstAmt = (taxable * gstRate) / 100;
      const lineTotal = taxable + gstAmt;

      subtotal += taxable;
      taxTotal += gstAmt;

      return {
        itemId: line.itemId,
        sku: line.sku,
        name: line.name,
        qty: line.qty,
        unitSymbol: line.unitSymbol || 'kg',
        rate: line.rate,
        discount: discAmt,
        gstRate,
        gstAmount: gstAmt,
        lineTotal
      };
    });

    const grandTotal = subtotal + taxTotal;

    const purchase = new Purchase({
      purchaseNo,
      supplierId,
      invoiceNo: invoiceNo || '',
      date: date ? new Date(date) : new Date(),
      godownId,
      lines: processedLines,
      subtotal,
      taxTotal,
      grandTotal,
      remarks,
      createdBy: req.user._id
    });

    await purchase.save({ session });

    // 1. Inward Stock Movements for each raw material item
    for (const line of processedLines) {
      await recordStockMovement({
        itemId: line.itemId,
        godownId,
        qty: line.qty,
        type: 'purchase',
        refType: 'Purchase',
        refId: purchase._id,
        rate: line.rate,
        date: purchase.date,
        remarks: `Inward from Bill #${invoiceNo} (${purchaseNo})`,
        createdBy: req.user._id,
        session
      });
    }

    // 2. Update Supplier Outstanding balance (Accounts Payable)
    await Party.findByIdAndUpdate(
      supplierId,
      { $inc: { balance: -grandTotal } }, // negative balance represents payable to supplier
      { session }
    );

    // 3. Enqueue Tally Sync Outbox (Purchase Voucher)
    await enqueueSyncOutbox({
      entityType: 'purchase',
      entityId: purchase._id,
      operation: 'create',
      payload: purchase.toObject(),
      session
    });

    await session.commitTransaction();
    session.endSession();

    const populated = await Purchase.findById(purchase._id)
      .populate('supplierId')
      .populate('godownId')
      .populate('lines.itemId');

    emitEvent('purchase:created', populated);

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
});

export default router;
