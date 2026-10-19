import express from 'express';
import mongoose from 'mongoose';
import { Payment } from '../models/Payment.js';
import { Party } from '../models/Party.js';
import { Order } from '../models/Order.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { getNextSequence } from '../services/counterService.js';
import { enqueueSyncOutbox } from '../services/syncService.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/v1/payments
router.get('/', async (req, res, next) => {
  try {
    const { partyId, mode, direction = 'in', fromDate, toDate } = req.query;
    const filter = { direction };

    if (partyId) filter.partyId = partyId;
    if (mode) filter.mode = mode;
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate + 'T23:59:59.999Z');
    }

    const payments = await Payment.find(filter)
      .populate('partyId')
      .populate('recordedBy', 'name username')
      .sort({ date: -1 });

    res.json({ success: true, count: payments.length, data: payments });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/payments
router.post('/', requirePermission('payment.record'), async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      partyId,
      orderId,
      invoiceId,
      mode = 'cash',
      amount,
      date,
      ref = '',
      direction = 'in',
      remarks = ''
    } = req.body;

    const paymentAmount = Number(amount);
    if (!partyId || !paymentAmount || paymentAmount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Party and valid positive amount required' });
    }

    const receiptNo = await getNextSequence('receiptNo', 'RCT-', 6, session);

    const payment = new Payment({
      receiptNo,
      partyId,
      orderId: orderId || null,
      invoiceId: invoiceId || null,
      mode,
      amount: paymentAmount,
      date: date ? new Date(date) : new Date(),
      ref,
      direction,
      remarks,
      recordedBy: req.user._id
    });

    await payment.save({ session });

    // Update Party Balance:
    // If direction === 'in' (customer paid us), decreases customer debit balance
    // If direction === 'out' (we paid supplier), increases balance towards 0
    const balanceAdjustment = direction === 'in' ? -paymentAmount : paymentAmount;
    await Party.findByIdAndUpdate(
      partyId,
      { $inc: { balance: balanceAdjustment } },
      { session }
    );

    // If linked to an order, update paid amount on order
    if (orderId) {
      const order = await Order.findById(orderId).session(session);
      if (order) {
        order.paidAmount = (order.paidAmount || 0) + paymentAmount;
        if (order.paidAmount >= order.grandTotal) {
          order.paymentStatus = 'paid';
        } else if (order.paidAmount > 0) {
          order.paymentStatus = 'partial';
        }
        await order.save({ session });
      }
    }

    // Enqueue Tally Sync Outbox (Receipt / Payment voucher)
    await enqueueSyncOutbox({
      entityType: 'payment',
      entityId: payment._id,
      operation: 'create',
      payload: payment.toObject(),
      session
    });

    await session.commitTransaction();
    session.endSession();

    const populated = await Payment.findById(payment._id)
      .populate('partyId')
      .populate('recordedBy', 'name username');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
});

// GET /api/v1/payments/cash-bank-summary
router.get('/cash-bank-summary', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const payments = await Payment.find();

    let totalCash = 0;
    let totalBank = 0;
    let totalUPI = 0;
    let todayCash = 0;
    let todayBank = 0;
    let todayUPI = 0;

    payments.forEach(p => {
      const isToday = new Date(p.date) >= today;
      const amt = p.direction === 'in' ? p.amount : -p.amount;

      if (p.mode === 'cash') {
        totalCash += amt;
        if (isToday) todayCash += amt;
      } else if (p.mode === 'upi') {
        totalUPI += amt;
        totalBank += amt; // UPI goes to bank account
        if (isToday) {
          todayUPI += amt;
          todayBank += amt;
        }
      } else if (p.mode === 'bank' || p.mode === 'online') {
        totalBank += amt;
        if (isToday) todayBank += amt;
      }
    });

    res.json({
      success: true,
      summary: {
        totalCash,
        totalBank,
        totalUPI,
        todayCollection: todayCash + todayBank,
        todayCash,
        todayBank,
        todayUPI
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/payments/outstanding (Customer outstanding with ageing)
router.get('/outstanding', async (req, res, next) => {
  try {
    const debtors = await Party.find({ type: 'customer', balance: { $gt: 0 } })
      .populate('areaId')
      .sort({ balance: -1 });

    const totalOutstanding = debtors.reduce((acc, d) => acc + d.balance, 0);

    res.json({
      success: true,
      totalOutstanding,
      count: debtors.length,
      data: debtors
    });
  } catch (err) {
    next(err);
  }
});

export default router;
