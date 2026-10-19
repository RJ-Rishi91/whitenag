import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config/env.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/v1/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const query = username.includes('@')
      ? { email: username.toLowerCase().trim() }
      : /^\d+$/.test(username)
      ? { mobile: username.trim() }
      : { username: username.toLowerCase().trim() };

    const user = await User.findOne(query).populate('roleId');

    if (!user || !user.active) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or inactive user' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.roleId?.code || 'USER'
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpires }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        mobile: user.mobile,
        role: user.roleId,
        mustChangePassword: user.mustChangePassword
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  return res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      username: req.user.username,
      mobile: req.user.mobile,
      role: req.user.roleId,
      mustChangePassword: req.user.mustChangePassword
    }
  });
});

// POST /api/v1/auth/change-password
router.post('/change-password', authenticateToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    req.user.passwordHash = await User.hashPassword(newPassword);
    req.user.mustChangePassword = false;
    await req.user.save();

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
