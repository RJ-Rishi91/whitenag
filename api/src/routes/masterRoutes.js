import express from 'express';
import { Area } from '../models/Area.js';
import { Godown } from '../models/Godown.js';
import { Unit } from '../models/Unit.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';

const router = express.Router();

router.use(['/areas', '/godowns', '/units'], authenticateToken);

// --- AREAS ---
router.get('/areas', async (req, res, next) => {
  try {
    const areas = await Area.find({ active: true }).sort({ name: 1 });
    res.json({ success: true, data: areas });
  } catch (err) {
    next(err);
  }
});

router.post('/areas', requireAdmin, async (req, res, next) => {
  try {
    const { code, name, pincode } = req.body;
    const area = new Area({
      code: code.toUpperCase().trim(),
      name: name.trim(),
      pincode: pincode || '313001'
    });
    await area.save();
    res.status(201).json({ success: true, data: area });
  } catch (err) {
    next(err);
  }
});

router.put('/areas/:id', requireAdmin, async (req, res, next) => {
  try {
    const area = await Area.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!area) return res.status(404).json({ success: false, message: 'Area not found' });
    res.json({ success: true, data: area });
  } catch (err) {
    next(err);
  }
});

// --- GODOWNS ---
router.get('/godowns', async (req, res, next) => {
  try {
    const godowns = await Godown.find({ active: true }).sort({ name: 1 });
    res.json({ success: true, data: godowns });
  } catch (err) {
    next(err);
  }
});

router.post('/godowns', requireAdmin, async (req, res, next) => {
  try {
    const { name, code, type, address } = req.body;
    const godown = new Godown({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      type: type || 'warehouse',
      address: address || ''
    });
    await godown.save();
    res.status(201).json({ success: true, data: godown });
  } catch (err) {
    next(err);
  }
});

router.put('/godowns/:id', requireAdmin, async (req, res, next) => {
  try {
    const godown = await Godown.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!godown) return res.status(404).json({ success: false, message: 'Godown not found' });
    res.json({ success: true, data: godown });
  } catch (err) {
    next(err);
  }
});

// --- UNITS ---
router.get('/units', async (req, res, next) => {
  try {
    const units = await Unit.find({ active: true }).sort({ name: 1 });
    res.json({ success: true, data: units });
  } catch (err) {
    next(err);
  }
});

router.post('/units', requireAdmin, async (req, res, next) => {
  try {
    const { name, symbol } = req.body;
    const unit = new Unit({ name: name.trim(), symbol: symbol.trim() });
    await unit.save();
    res.status(201).json({ success: true, data: unit });
  } catch (err) {
    next(err);
  }
});

export default router;
