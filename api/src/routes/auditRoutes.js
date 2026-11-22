import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getAuditLogs, getAuditSummary } from '../services/auditService.js';

const router = express.Router();

// GET /api/v1/audit/logs - Retrieve filtered audit trail
router.get('/logs', authenticateToken, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 25,
      entity,
      entityId,
      action,
      userId,
      startDate,
      endDate,
      search
    } = req.query;

    const result = await getAuditLogs({
      page,
      limit,
      entity,
      entityId,
      action,
      userId,
      startDate,
      endDate,
      search
    });

    res.json({
      success: true,
      data: result.logs,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: parseInt(limit, 10)
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/audit/summary - Summary metrics of system activity
router.get('/summary', authenticateToken, async (req, res, next) => {
  try {
    const summary = await getAuditSummary();
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/audit/entity/:entity/:entityId - Full change history for a single record
router.get('/entity/:entity/:entityId', authenticateToken, async (req, res, next) => {
  try {
    const { entity, entityId } = req.params;
    const result = await getAuditLogs({ entity, entityId, limit: 100 });
    res.json({ success: true, count: result.total, data: result.logs });
  } catch (err) {
    next(err);
  }
});

export default router;
