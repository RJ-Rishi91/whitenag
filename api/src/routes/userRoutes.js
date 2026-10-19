import express from 'express';
import { User } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/v1/users
router.get('/', async (req, res, next) => {
  try {
    const users = await User.find().populate('roleId').select('-passwordHash').sort({ name: 1 });
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/users (Admin only)
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { name, username, mobile, password, roleId } = req.body;
    if (!name || !username || !mobile || !password || !roleId) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const existing = await User.findOne({ username: username.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    const passwordHash = await User.hashPassword(password);
    const user = new User({
      name,
      username: username.toLowerCase().trim(),
      mobile,
      passwordHash,
      roleId,
      mustChangePassword: true
    });
    await user.save();

    const populated = await User.findById(user._id).populate('roleId').select('-passwordHash');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/users/:id (Admin only)
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { name, mobile, roleId, active } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name) user.name = name;
    if (mobile) user.mobile = mobile;
    if (roleId) user.roleId = roleId;
    if (active !== undefined) user.active = active;

    await user.save();
    const populated = await User.findById(user._id).populate('roleId').select('-passwordHash');
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/users/:id/reset-password (Admin only)
router.put('/:id/reset-password', requireAdmin, async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.passwordHash = await User.hashPassword(password);
    user.mustChangePassword = true;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
