import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User } from '../models/User.js';

export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.userId).populate('roleId');

    if (!user || !user.active) {
      return res.status(401).json({ success: false, message: 'User inactive or not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token', error: error.message });
  }
}

export function authenticateConnector(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!apiKey || apiKey !== config.connectorApiKey) {
    return res.status(401).json({ success: false, message: 'Invalid connector API key' });
  }

  req.isConnector = true;
  next();
}
