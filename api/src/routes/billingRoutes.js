import express from 'express';
import mongoose from 'mongoose';
import { Invoice } from '../models/Invoice.js';
import { Order } from '../models/Order.js';
import { Party } from '../models/Party.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { getNextSequence } from '../services/counterService.js';
import { enqueueSyncOutbox } from '../services/syncService.js';

const router = express.Router();

router.use(['/invoices', '/delivery-challans'], authenticateToken);

// GET /api/v1/invoices
router.get('/invoices', async (req, res, next) => {
  try {
    const { partyId, type, search, fromDate, toDate } = req.query;
    const filter = {};

    if (partyId) filter.partyId = partyId;
    if (type) filter.type = type;
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate + 'T23:59:59.999Z');
    }

    if (search) {
      filter.$or = [
        { invoiceNo: { $regex: search, $options: 'i' } },
        { challanNo: { $regex: search, $options: 'i' } }
      ];
    }

    const invoices = await Invoice.find(filter)
      .populate('partyId')
      .populate('orderId')
      .sort({ date: -1 });

    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/invoices/:id
router.get('/invoices/:id', async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('partyId')
      .populate('orderId')
      .populate('lines.itemId');

    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/invoices/generate-from-order/:orderId
router.post(['/invoices/generate-from-order/:orderId', '/generate-from-order/:orderId'], requirePermission('invoice.create'), async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(req.params.orderId).populate('partyId').session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.invoiceId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Invoice already generated for this order' });
    }

    const invoiceNo = await getNextSequence('invoiceNo', 'INV-', 6, session);

    // Build tax breakdown (assume CGST 2.5% + SGST 2.5% for intra-state Rajasthan)
    const isInterState = order.partyId?.gstin && !order.partyId.gstin.startsWith('08');
    const cgst = isInterState ? 0 : order.taxTotal / 2;
    const sgst = isInterState ? 0 : order.taxTotal / 2;
    const igst = isInterState ? order.taxTotal : 0;

    const invoiceLines = order.items.map(item => ({
      itemId: item.itemId,
      sku: item.sku,
      name: item.name,
      hsn: item.hsn || '1905',
      qty: item.qty,
      unitSymbol: item.unitSymbol,
      rate: item.rate,
      discountAmount: item.discountAmount,
      taxableAmount: (item.qty * item.rate) - (item.discountAmount || 0),
      taxRate: item.taxRate,
      taxAmount: item.taxAmount,
      lineTotal: item.lineTotal
    }));

    const invoice = new Invoice({
      invoiceNo,
      orderId: order._id,
      partyId: order.partyId._id,
      type: order.segment === 'b2c' ? 'b2c' : 'b2b',
      challanNo: order.challanNo || '',
      date: new Date(),
      lines: invoiceLines,
      subtotal: order.subtotal,
      discountTotal: order.discountTotal,
      cgst,
      sgst,
      igst,
      taxTotal: order.taxTotal,
      grandTotal: order.grandTotal,
      status: 'issued'
    });

    await invoice.save({ session });

    // Link invoice back to order
    order.invoiceId = invoice._id;
    await order.save({ session });

    // Update Customer Outstanding Ledger (Debit customer)
    await Party.findByIdAndUpdate(
      order.partyId._id,
      { $inc: { balance: order.grandTotal } },
      { session }
    );

    // Enqueue Tally Sync Outbox (Sales Voucher)
    await enqueueSyncOutbox({
      entityType: 'invoice',
      entityId: invoice._id,
      operation: 'create',
      payload: invoice.toObject(),
      session
    });

    await session.commitTransaction();
    session.endSession();

    const populated = await Invoice.findById(invoice._id)
      .populate('partyId')
      .populate('orderId');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
});

// GET /api/v1/challans
router.get('/challans/list', async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = { challanNo: { $ne: '' } };

    if (search) {
      filter.$or = [
        { challanNo: { $regex: search, $options: 'i' } },
        { orderNo: { $regex: search, $options: 'i' } }
      ];
    }

    const challans = await Order.find(filter)
      .populate('partyId')
      .populate('areaId')
      .select('orderNo challanNo partyId areaId grandTotal status createdAt')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: challans.length, data: challans });
  } catch (err) {
    next(err);
  }
});

export default router;
