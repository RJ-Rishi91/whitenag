import express from 'express';
import mongoose from 'mongoose';
import { BOM } from '../models/BOM.js';
import { ProductionEntry } from '../models/ProductionEntry.js';
import { Item } from '../models/Item.js';
import { authenticateToken } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { getNextSequence } from '../services/counterService.js';
import { recordStockMovement } from '../services/stockService.js';
import { enqueueSyncOutbox } from '../services/syncService.js';
import { emitEvent } from '../services/socketService.js';

const router = express.Router();

router.use(['/boms', '/production'], authenticateToken);

// --- BILL OF MATERIALS (BOM) ---

// GET /api/v1/boms
router.get('/boms', async (req, res, next) => {
  try {
    const { productId, active } = req.query;
    const filter = {};
    if (productId) filter.productId = productId;
    if (active !== undefined) filter.active = active === 'true';

    const boms = await BOM.find(filter)
      .populate('productId')
      .populate('lines.itemId')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: boms.length, data: boms });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/boms/for-product/:productId (Get latest active BOM for production calculation)
router.get('/boms/for-product/:productId', async (req, res, next) => {
  try {
    const bom = await BOM.findOne({ productId: req.params.productId, active: true })
      .populate('productId')
      .populate('lines.itemId')
      .sort({ version: -1 });

    if (!bom) return res.status(404).json({ success: false, message: 'No active BOM found for this product' });

    res.json({ success: true, data: bom });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/boms/:id
router.get('/boms/:id', async (req, res, next) => {
  try {
    const bom = await BOM.findById(req.params.id)
      .populate('productId')
      .populate('lines.itemId');

    if (!bom) return res.status(404).json({ success: false, message: 'BOM not found' });

    res.json({ success: true, data: bom });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/boms
router.post('/boms', requirePermission('manufacturing.create'), async (req, res, next) => {
  try {
    const { productId, name, baseQty, baseUnitSymbol, lines, notes } = req.body;

    if (!productId || !name || !lines || lines.length === 0) {
      return res.status(400).json({ success: false, message: 'Product, name and recipe lines required' });
    }

    // Check existing BOM version for this product
    const latestBOM = await BOM.findOne({ productId }).sort({ version: -1 });
    const version = latestBOM ? latestBOM.version + 1 : 1;

    const bom = new BOM({
      productId,
      name: name.trim(),
      version,
      baseQty: baseQty || 100,
      baseUnitSymbol: baseUnitSymbol || 'pcs (pack)',
      lines,
      notes: notes || '',
      active: true
    });

    await bom.save();

    const populated = await BOM.findById(bom._id)
      .populate('productId')
      .populate('lines.itemId');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/boms/:id
router.put('/boms/:id', requirePermission('manufacturing.create'), async (req, res, next) => {
  try {
    const bom = await BOM.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('productId')
      .populate('lines.itemId');

    if (!bom) return res.status(404).json({ success: false, message: 'BOM not found' });

    res.json({ success: true, data: bom });
  } catch (err) {
    next(err);
  }
});

// --- PRODUCTION JOURNAL ---

// GET /api/v1/production
router.get('/production', async (req, res, next) => {
  try {
    const { productId, godownId, fromDate, toDate } = req.query;
    const filter = {};

    if (productId) filter.productId = productId;
    if (godownId) filter.godownId = godownId;
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate + 'T23:59:59.999Z');
    }

    const entries = await ProductionEntry.find(filter)
      .populate('productId')
      .populate('godownId')
      .populate('bomId')
      .populate('createdBy', 'name username')
      .sort({ date: -1 });

    res.json({ success: true, count: entries.length, data: entries });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/production/:id
router.get('/production/:id', async (req, res, next) => {
  try {
    const entry = await ProductionEntry.findById(req.params.id)
      .populate('productId')
      .populate('godownId')
      .populate('bomId')
      .populate('lines.itemId')
      .populate('createdBy', 'name username');

    if (!entry) return res.status(404).json({ success: false, message: 'Production record not found' });

    res.json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/production (Confirm manufacturing batch entry)
router.post('/production', requirePermission('manufacturing.create'), async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      date,
      productId,
      qty,
      godownId,
      bomId,
      batchNo,
      wastage = 0,
      lines,
      remarks = ''
    } = req.body;

    if (!productId || !qty || !godownId || !bomId || !lines || lines.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Product, qty, godown, BOM and consumption lines required' });
    }

    const bom = await BOM.findById(bomId).session(session);
    if (!bom) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'BOM not found' });
    }

    const productionNo = await getNextSequence('productionNo', 'PRD-', 6, session);

    // Compute lines with variance
    const processedLines = lines.map(line => ({
      itemId: line.itemId,
      sku: line.sku,
      name: line.name,
      bomQty: Number(line.bomQty),
      actualQty: Number(line.actualQty),
      variance: Number(line.actualQty) - Number(line.bomQty),
      unitSymbol: line.unitSymbol || 'kg'
    }));

    const entry = new ProductionEntry({
      productionNo,
      date: date ? new Date(date) : new Date(),
      productId,
      qty: Number(qty),
      unitSymbol: bom.baseUnitSymbol || 'pcs (pack)',
      godownId,
      bomId,
      bomVersion: bom.version,
      batchNo: batchNo || `BATCH-${Date.now().toString().slice(-6)}`,
      wastage: Number(wastage),
      lines: processedLines,
      remarks,
      createdBy: req.user._id
    });

    await entry.save({ session });

    // 1. Consume raw materials from godown
    for (const line of processedLines) {
      await recordStockMovement({
        itemId: line.itemId,
        godownId,
        qty: -Math.abs(line.actualQty),
        type: 'consumption',
        refType: 'ProductionEntry',
        refId: entry._id,
        batchNo: entry.batchNo,
        date: entry.date,
        remarks: `Consumed for ${entry.productionNo} (${entry.batchNo})`,
        createdBy: req.user._id,
        session
      });
    }

    // 2. Inward produced finished goods into godown
    await recordStockMovement({
      itemId: productId,
      godownId,
      qty: Math.abs(Number(qty)),
      type: 'production_in',
      refType: 'ProductionEntry',
      refId: entry._id,
      batchNo: entry.batchNo,
      date: entry.date,
      remarks: `Produced batch ${entry.batchNo} (${entry.productionNo})`,
      createdBy: req.user._id,
      session
    });

    // 3. Record wastage if any
    if (wastage > 0) {
      await recordStockMovement({
        itemId: productId,
        godownId,
        qty: -Math.abs(Number(wastage)),
        type: 'wastage',
        refType: 'ProductionEntry',
        refId: entry._id,
        batchNo: entry.batchNo,
        date: entry.date,
        remarks: `Wastage in batch ${entry.batchNo}`,
        createdBy: req.user._id,
        session
      });
    }

    // 4. Enqueue Tally Sync Outbox (Manufacturing Stock Journal)
    await enqueueSyncOutbox({
      entityType: 'production',
      entityId: entry._id,
      operation: 'create',
      payload: entry.toObject(),
      session
    });

    await session.commitTransaction();
    session.endSession();

    const populated = await ProductionEntry.findById(entry._id)
      .populate('productId')
      .populate('godownId')
      .populate('bomId')
      .populate('lines.itemId');

    emitEvent('production:created', populated);

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
});

export default router;
