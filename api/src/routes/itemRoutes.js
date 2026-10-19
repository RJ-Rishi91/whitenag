import express from 'express';
import { Item } from '../models/Item.js';
import { StockLevel } from '../models/StockLevel.js';
import { StockMovement } from '../models/StockMovement.js';
import { authenticateToken } from '../middleware/auth.js';
import { enqueueSyncOutbox } from '../services/syncService.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/v1/items
router.get('/', async (req, res, next) => {
  try {
    const { category, productGroup, search, active = 'true' } = req.query;
    const filter = {};

    if (active === 'true') filter.active = true;
    if (category) filter.category = category;
    if (productGroup) filter.productGroup = productGroup;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await Item.find(filter)
      .populate('unitId')
      .sort({ category: 1, productGroup: 1, name: 1 });

    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/items/:id
router.get('/:id', async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate('unitId');
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    // Fetch stock levels across godowns
    const stockLevels = await StockLevel.find({ itemId: item._id }).populate('godownId');

    // Fetch recent movements
    const movements = await StockMovement.find({ itemId: item._id })
      .populate('godownId')
      .sort({ date: -1 })
      .limit(20);

    res.json({
      success: true,
      data: item,
      stockLevels,
      movements
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/items
router.post('/', async (req, res, next) => {
  try {
    const item = new Item(req.body);
    await item.save();

    // Enqueue Tally sync
    await enqueueSyncOutbox({
      entityType: 'item',
      entityId: item._id,
      operation: 'create',
      payload: item.toObject()
    });

    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/items/:id
router.put('/:id', async (req, res, next) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    await enqueueSyncOutbox({
      entityType: 'item',
      entityId: item._id,
      operation: 'update',
      payload: item.toObject()
    });

    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

export default router;
