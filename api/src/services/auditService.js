import { AuditLog } from '../models/AuditLog.js';
import { emitEvent } from './socketService.js';

/**
 * Record an immutable audit log entry for any data manipulation.
 * Tracks WHEN, WHAT, and BY WHOM.
 */
export async function recordAudit({
  req = null,
  action,
  entity,
  entityId = null,
  entityRef = '',
  summary,
  diff = null,
  before = null,
  after = null,
  userId = null,
  userName = null,
  userRole = null,
  session = null
}) {
  try {
    // Extract actor details from request if present
    let finalUserId = userId;
    let finalUserName = userName || 'System';
    let finalUserRole = userRole || 'System';
    let ip = '';
    let userAgent = '';

    if (req) {
      if (req.user) {
        finalUserId = finalUserId || req.user._id || req.user.id;
        finalUserName = req.user.name || req.user.username || finalUserName;
        finalUserRole = req.user.roleId?.name || req.user.role || finalUserRole;
      }
      ip = req.ip || req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || '';
      userAgent = req.headers?.['user-agent'] || '';
    }

    const auditEntry = new AuditLog({
      userId: finalUserId,
      userName: finalUserName,
      userRole: finalUserRole,
      action,
      entity,
      entityId,
      entityRef,
      summary,
      diff,
      before,
      after,
      ip,
      userAgent,
      at: new Date()
    });

    if (session) {
      await auditEntry.save({ session });
    } else {
      await auditEntry.save();
    }

    // Broadcast audit event to UI via WebSockets
    emitEvent('audit:recorded', {
      _id: auditEntry._id,
      at: auditEntry.at,
      action: auditEntry.action,
      entity: auditEntry.entity,
      entityRef: auditEntry.entityRef,
      summary: auditEntry.summary,
      userName: auditEntry.userName,
      userRole: auditEntry.userRole
    });

    return auditEntry;
  } catch (err) {
    console.error('[AuditService] Failed to record audit log:', err.message);
    return null;
  }
}

/**
 * Query audit logs with pagination and multi-dimensional filters
 */
export async function getAuditLogs({
  page = 1,
  limit = 25,
  entity = null,
  entityId = null,
  action = null,
  userId = null,
  startDate = null,
  endDate = null,
  search = null
}) {
  const query = {};

  if (entity) query.entity = entity;
  if (entityId) query.entityId = entityId;
  if (action) query.action = action;
  if (userId) query.userId = userId;

  if (startDate || endDate) {
    query.at = {};
    if (startDate) query.at.$gte = new Date(startDate);
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      query.at.$lte = e;
    }
  }

  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [
      { summary: regex },
      { entityRef: regex },
      { userName: regex },
      { action: regex }
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const total = await AuditLog.countDocuments(query);
  const logs = await AuditLog.find(query)
    .sort({ at: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10))
    .lean();

  return {
    logs,
    total,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / limit) || 1
  };
}

/**
 * Summary metrics of system activity
 */
export async function getAuditSummary() {
  const totalModifications = await AuditLog.countDocuments();
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const modificationsLast24h = await AuditLog.countDocuments({ at: { $gte: last24h } });

  const recentChanges = await AuditLog.find()
    .sort({ at: -1 })
    .limit(10)
    .lean();

  // Top active operators in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const topOperators = await AuditLog.aggregate([
    { $match: { at: { $gte: sevenDaysAgo } } },
    { $group: { _id: '$userName', count: { $sum: 1 }, role: { $first: '$userRole' } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  return {
    totalModifications,
    modificationsLast24h,
    recentChanges,
    topOperators
  };
}
