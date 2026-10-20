import express from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Party } from '../models/Party.js';
import { Item } from '../models/Item.js';
import { RateHistory } from '../models/RateHistory.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { getNextSequence } from '../services/counterService.js';
import {
  reserveOrderStock,
  releaseOrderStock,
  shipOrderStock,
  checkStockAvailability
} from '../services/stockService.js';
import { enqueueSyncOutbox } from '../services/syncService.js';
import { emitEvent } from '../services/socketService.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/v1/orders
router.get('/', async (req, res, next) => {
  try {
    const { status, areaId, segment, search, fromDate, toDate } = req.query;
    const filter = {};

    if (status && status !== 'all') filter.status = status;
    if (areaId) filter.areaId = areaId;
    if (segment) filter.segment = segment;
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate + 'T23:59:59.999Z');
    }

    if (search) {
      const partyMatches = await Party.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      filter.$or = [
        { orderNo: { $regex: search, $options: 'i' } },
        { challanNo: { $regex: search, $options: 'i' } },
        { partyId: { $in: partyMatches.map(p => p._id) } }
      ];
    }

    const orders = await Order.find(filter)
      .populate('partyId')
      .populate('areaId')
      .populate('godownId')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/orders/:id
router.get('/:id', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('partyId')
      .populate('areaId')
      .populate('godownId')
      .populate('statusHistory.by', 'name username');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/orders/check-availability
router.post('/check-availability', async (req, res, next) => {
  try {
    const { items, godownId } = req.body;
    if (!items || !godownId) {
      return res.status(400).json({ success: false, message: 'items and godownId required' });
    }

    const check = await checkStockAvailability(items, godownId);
    res.json({ success: true, ...check });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/orders
router.post('/', requirePermission('order.create'), async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      partyId,
      areaId,
      godownId,
      items,
      paymentTerms,
      deliveryDetails,
      remarks,
      challanNo,
      allowStockOverride = false
    } = req.body;

    if (!partyId || !godownId || !items || items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Missing party, godown or items' });
    }

    // Check stock availability
    const stockCheck = await checkStockAvailability(items, godownId);
    if (!stockCheck.isAvailable && !allowStockOverride) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Stock insufficient for one or more items',
        warnings: stockCheck.warnings
      });
    }

    const party = await Party.findById(partyId).session(session);
    if (!party) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Party not found' });
    }

    // Generate Order Number
    const orderNo = await getNextSequence('orderNo', 'ORD-', 6, session);

    // Auto-generate B2C delivery challan number if applicable
    let finalChallanNo = challanNo;
    if (!finalChallanNo && party.segment === 'b2c') {
      finalChallanNo = await getNextSequence('challanNo', 'DC-', 6, session);
    }

    // Fetch items details for any missing name/sku
    const itemIds = items.map(i => i.itemId).filter(Boolean);
    const dbItems = itemIds.length > 0 ? await Item.find({ _id: { $in: itemIds } }).session(session) : [];
    const dbItemMap = {};
    dbItems.forEach(di => { dbItemMap[di._id.toString()] = di; });

    // Calculate totals
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    const processedItems = items.map(item => {
      const dbItem = item.itemId ? dbItemMap[item.itemId.toString()] : null;
      const qty = Number(item.qty ?? item.quantity ?? 1);
      const rate = Number(item.rate ?? item.unitPrice ?? dbItem?.standardCost ?? 100);
      const lineSubtotal = qty * rate;
      const discAmt = Number(item.discountAmount || (item.discount ? (lineSubtotal * item.discount) / 100 : (item.discountPercent ? (lineSubtotal * item.discountPercent) / 100 : 0)));
      const taxable = Math.max(0, lineSubtotal - discAmt);
      const taxRate = item.taxRate !== undefined ? Number(item.taxRate) : (item.gstRate !== undefined ? Number(item.gstRate) : (dbItem?.gstRate || 5));
      const taxAmt = (taxable * taxRate) / 100;
      const lineTotal = taxable + taxAmt;

      subtotal += lineSubtotal;
      discountTotal += discAmt;
      taxTotal += taxAmt;

      return {
        itemId: item.itemId || dbItem?._id || new mongoose.Types.ObjectId(),
        sku: item.sku || dbItem?.sku || 'NFD-PROD',
        name: item.name || item.productName || dbItem?.name || 'Nagfani Product',
        unitSymbol: item.unitSymbol || item.unit || 'kg',
        qty,
        rate,
        discount: item.discount || item.discountPercent || 0,
        discountAmount: discAmt,
        taxRate,
        taxAmount: taxAmt,
        lineTotal
      };
    });

    const grandTotal = subtotal - discountTotal + taxTotal;

    const order = new Order({
      orderNo,
      partyId: party._id,
      segment: party.segment,
      areaId: areaId || party.areaId,
      godownId,
      items: processedItems,
      subtotal,
      discountTotal,
      taxTotal,
      grandTotal,
      paymentTerms: paymentTerms || 'Cash on Delivery',
      deliveryDetails: deliveryDetails || '',
      remarks: remarks || '',
      challanNo: finalChallanNo || '',
      status: 'received',
      statusHistory: [{
        status: 'received',
        at: new Date(),
        by: req.user._id,
        note: 'Order created'
      }]
    });

    await order.save({ session });

    // 1. Reserve Stock in Godown
    await reserveOrderStock(order, session);

    // 2. Record Customer Rate History for each item
    for (const item of processedItems) {
      await RateHistory.create([{
        partyId: party._id,
        itemId: item.itemId,
        rate: item.rate,
        orderId: order._id,
        date: new Date()
      }], { session });
    }

    // 3. Enqueue Sync Outbox for Tally
    await enqueueSyncOutbox({
      entityType: 'order',
      entityId: order._id,
      operation: 'create',
      payload: order.toObject(),
      session
    });

    await session.commitTransaction();
    session.endSession();

    // Populate and emit real-time event
    const populated = await Order.findById(order._id)
      .populate('partyId')
      .populate('areaId')
      .populate('godownId');

    emitEvent('order:created', populated);

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
});

// POST /api/v1/orders/:id/status (Workflow transitions)
router.post('/:id/status', async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { status, note = '' } = req.body;
    const allowedStatuses = ['received', 'packed', 'shipped', 'delivered', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const previousStatus = order.status;

    // Handle Stock Transitions:
    // If transitioning to Shipped: convert reserved stock to shipped (physical decreases)
    if (status === 'shipped' && previousStatus !== 'shipped' && previousStatus !== 'delivered') {
      await shipOrderStock(order, session);
    }

    // If cancelled: release reserved stock
    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      if (previousStatus === 'shipped' || previousStatus === 'delivered') {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: 'Cannot cancel an order that has already shipped' });
      }
      await releaseOrderStock(order, session);
    }

    order.status = status;
    order.statusHistory.push({
      status,
      at: new Date(),
      by: req.user._id,
      note
    });

    await order.save({ session });

    await enqueueSyncOutbox({
      entityType: 'order',
      entityId: order._id,
      operation: 'update',
      payload: { status, orderNo: order.orderNo },
      session
    });

    await session.commitTransaction();
    session.endSession();

    const populated = await Order.findById(order._id)
      .populate('partyId')
      .populate('areaId')
      .populate('godownId')
      .populate('statusHistory.by', 'name username');

    emitEvent('order:status', { orderId: order._id, status, previousStatus, order: populated });

    res.json({ success: true, data: populated });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
});

// POST /api/v1/orders/:id/payment (Record payment against order)
router.post('/:id/payment', async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, mode = 'cash', ref = '', remarks = '' } = req.body;
    const paymentAmount = Number(amount);

    if (!paymentAmount || paymentAmount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Valid payment amount required' });
    }

    const order = await Order.findById(req.params.id).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const receiptNo = await getNextSequence('receiptNo', 'RCT-', 6, session);

    const payment = new Payment({
      receiptNo,
      partyId: order.partyId,
      orderId: order._id,
      invoiceId: order.invoiceId,
      mode,
      amount: paymentAmount,
      date: new Date(),
      ref,
      direction: 'in',
      remarks: remarks || `Payment for order ${order.orderNo}`,
      recordedBy: req.user._id
    });

    await payment.save({ session });

    // Update order payment status
    order.paidAmount = (order.paidAmount || 0) + paymentAmount;
    if (order.paidAmount >= order.grandTotal) {
      order.paymentStatus = 'paid';
    } else if (order.paidAmount > 0) {
      order.paymentStatus = 'partial';
    }

    order.statusHistory.push({
      status: order.status,
      at: new Date(),
      by: req.user._id,
      note: `Payment recorded: ₹${paymentAmount} (${mode.toUpperCase()})`,
      payment: { receiptNo, amount: paymentAmount, mode }
    });

    await order.save({ session });

    // Update party balance
    await Party.findByIdAndUpdate(
      order.partyId,
      { $inc: { balance: -paymentAmount } },
      { session }
    );

    // Enqueue Tally outbox
    await enqueueSyncOutbox({
      entityType: 'payment',
      entityId: payment._id,
      operation: 'create',
      payload: payment.toObject(),
      session
    });

    await session.commitTransaction();
    session.endSession();

    emitEvent('order:payment', { orderId: order._id, payment });

    res.json({ success: true, payment, order });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
});

export default router;
