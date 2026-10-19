import { logger } from '../config/logger.js';

export function errorHandler(err, req, res, next) {
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled API error');

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({ field: e.path, message: e.message }));
    return res.status(400).json({ success: false, message: 'Validation error', errors });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: `Invalid ID format for ${err.path}` });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ success: false, message: `Duplicate entry for ${field}` });
  }

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}
