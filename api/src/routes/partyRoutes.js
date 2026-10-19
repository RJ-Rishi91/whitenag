import express from 'express';
import { Party } from '../models/Party.js';
import { RateHistory } from '../models/RateHistory.js';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Invoice } from '../models/Invoice.js';
import { authenticateToken } from '../middleware/auth.js';
import { enqueueSyncOutbox } from '../services/syncService.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/v1/parties (Customers / Suppliers)
router.get('/', async (req, res, next) => {
  try {
    const { type = 'customer', segment, areaId, search, outstandingOnly } = req.query;
    const filter = { type, active: true };

    if (segment) filter.segment = segment;
    if (areaId) filter.areaId = areaId;
    if (outstandingOnly === 'true') filter.balance = { $gt: 0 };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    const parties = await Party.find(filter)
      .populate('areaId')
      .sort({ name: 1 });

    res.json({ success: true, count: parties.length, data: parties });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/parties/:id
router.get('/:id', async (req, res, next) => {
  try {
    const party = await Party.findById(req.params.id).populate('areaId');
    if (!party) return res.status(404).json({ success: false, message: 'Party not found' });

    // Recent orders
    const recentOrders = await Order.find({ partyId: party._id })
      .sort({ createdAt: -1 })
      .limit(10);

    // Recent payments
    const recentPayments = await Payment.find({ partyId: party._id })
      .sort({ date: -1 })
      .limit(10);

    res.json({
      success: true,
      data: party,
      recentOrders,
      recentPayments
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/parties/:id/rates (Latest rate history per item for last-rate memory)
router.get('/:id/rates', async (req, res, next) => {
  try {
    const { itemId } = req.query;
    const filter = { partyId: req.params.id };
    if (itemId) filter.itemId = itemId;

    const rates = await RateHistory.find(filter)
      .populate('itemId')
      .sort({ date: -1 });

    // Deduplicate to get the single latest rate per item
    const latestRatesMap = new Map();
    for (const record of rates) {
      const key = record.itemId._id.toString();
      if (!latestRatesMap.has(key)) {
        latestRatesMap.set(key, record);
      }
    }

    res.json({ success: true, data: Array.from(latestRatesMap.values()) });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/parties/:id/ledger (Running balance ledger)
router.get('/:id/ledger', async (req, res, next) => {
  try {
    const partyId = req.params.id;
    const party = await Party.findById(partyId);
    if (!party) return res.status(404).json({ success: false, message: 'Party not found' });

    // Get all invoices (Debits for customers)
    const invoices = await Invoice.find({ partyId, status: 'issued' }).sort({ date: 1 });

    // Get all payments (Credits for customers)
    const payments = await Payment.find({ partyId }).sort({ date: 1 });

    // Merge into combined chronological ledger
    const transactions = [];

    invoices.forEach(inv => {
      transactions.push({
        date: inv.date,
        type: 'INVOICE',
        refNo: inv.invoiceNo,
        challanNo: inv.challanNo,
        description: `Tax Invoice ${inv.invoiceNo}`,
        debit: inv.grandTotal,
        credit: 0
      });
    });

    payments.forEach(pay => {
      transactions.push({
        date: pay.date,
        type: 'PAYMENT',
        refNo: pay.receiptNo,
        challanNo: '',
        description: `Payment Received (${pay.mode.toUpperCase()}) - ${pay.ref || ''}`,
        debit: 0,
        credit: pay.amount
      });
    });

    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    let runningBalance = 0;
    const ledger = transactions.map(tx => {
      runningBalance += (tx.debit - tx.credit);
      return {
        ...tx,
        balance: runningBalance
      };
    });

    res.json({
      success: true,
      party: {
        id: party._id,
        name: party.name,
        currentBalance: party.balance
      },
      ledger
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/parties
router.post('/', async (req, res, next) => {
  try {
    const party = new Party(req.body);
    await party.save();

    await enqueueSyncOutbox({
      entityType: 'party',
      entityId: party._id,
      operation: 'create',
      payload: party.toObject()
    });

    res.status(201).json({ success: true, data: party });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/parties/:id
router.put('/:id', async (req, res, next) => {
  try {
    const party = await Party.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!party) return res.status(404).json({ success: false, message: 'Party not found' });

    await enqueueSyncOutbox({
      entityType: 'party',
      entityId: party._id,
      operation: 'update',
      payload: party.toObject()
    });

    res.json({ success: true, data: party });
  } catch (err) {
    next(err);
  }
});

export default router;
