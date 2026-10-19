import express from 'express';
import { Role } from '../models/Role.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/v1/roles
router.get('/', async (req, res, next) => {
  try {
    const roles = await Role.find().sort({ name: 1 });
    res.json({ success: true, data: roles });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/roles/:id (Admin only - customize permissions)
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { name, permissions, active } = req.body;
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });

    if (name) role.name = name;
    if (permissions) role.permissions = permissions;
    if (active !== undefined) role.active = active;

    await role.save();
    res.json({ success: true, data: role });
  } catch (err) {
    next(err);
  }
});

export default router;
