import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { SyncOutbox } from '../models/SyncOutbox.js';
import { SyncInbox } from '../models/SyncInbox.js';
import { SyncLog } from '../models/SyncLog.js';
import { authenticateToken, authenticateConnector } from '../middleware/auth.js';
import { emitEvent } from '../services/socketService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

let lastConnectorHeartbeat = null;

// ==========================================
// CONNECTOR ENDPOINTS (API Key authenticated)
// ==========================================

// POST /api/v1/sync/heartbeat
router.post('/heartbeat', authenticateConnector, (req, res) => {
  const { tallyReachable = false, company = '', version = '1.0' } = req.body;
  lastConnectorHeartbeat = {
    at: new Date(),
    tallyReachable,
    company,
    version
  };

  emitEvent('connector:status', lastConnectorHeartbeat);
  res.json({ success: true, timestamp: lastConnectorHeartbeat.at });
});

// GET /api/v1/sync/pending
router.get('/pending', authenticateConnector, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const pendingItems = await SyncOutbox.find({ status: { $in: ['pending', 'failed'] } })
      .sort({ createdAt: 1 })
      .limit(limit);

    res.json({ success: true, count: pendingItems.length, data: pendingItems });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/sync/ack
router.post('/ack', authenticateConnector, async (req, res, next) => {
  try {
    const { idempotencyKey, tallyGuid, voucherNumber } = req.body;
    if (!idempotencyKey) {
      return res.status(400).json({ success: false, message: 'idempotencyKey is required' });
    }

    const item = await SyncOutbox.findOne({ idempotencyKey });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Sync outbox item not found' });
    }

    item.status = 'synced';
    item.syncedAt = new Date();
    await item.save();

    await SyncLog.create({
      direction: 'outbound',
      entityType: item.entityType,
      entityId: item.entityId,
      tallyGuid,
      result: 'success',
      message: `Synced to Tally (${voucherNumber || tallyGuid})`,
      at: new Date()
    });

    emitEvent('sync:status', { idempotencyKey, status: 'synced', tallyGuid });
    res.json({ success: true, message: 'Item acknowledged as synced' });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/sync/fail
router.post('/fail', authenticateConnector, async (req, res, next) => {
  try {
    const { idempotencyKey, error } = req.body;
    if (!idempotencyKey) {
      return res.status(400).json({ success: false, message: 'idempotencyKey is required' });
    }

    const item = await SyncOutbox.findOne({ idempotencyKey });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Sync outbox item not found' });
    }

    item.status = 'failed';
    item.attempts += 1;
    item.lastError = error || 'Unknown Tally export error';
    await item.save();

    await SyncLog.create({
      direction: 'outbound',
      entityType: item.entityType,
      entityId: item.entityId,
      result: 'failed',
      message: item.lastError,
      at: new Date()
    });

    emitEvent('sync:status', { idempotencyKey, status: 'failed', error: item.lastError });
    res.json({ success: true, message: 'Failure recorded' });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/sync/inbound (Masters pushed from Tally)
router.post('/inbound', authenticateConnector, async (req, res, next) => {
  try {
    const { entityType, tallyGuid, alterId, payload } = req.body;
    if (!entityType || !tallyGuid || !payload) {
      return res.status(400).json({ success: false, message: 'entityType, tallyGuid and payload required' });
    }

    const inboxItem = new SyncInbox({
      entityType,
      tallyGuid,
      alterId: alterId || 0,
      payload,
      status: 'received',
      receivedAt: new Date()
    });

    await inboxItem.save();
    res.status(201).json({ success: true, data: inboxItem });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// ADMIN DASHBOARD / UI ENDPOINTS (JWT Token)
// ==========================================

// GET /api/v1/sync/overview
router.get('/overview', authenticateToken, async (req, res, next) => {
  try {
    const pendingCount = await SyncOutbox.countDocuments({ status: 'pending' });
    const failedCount = await SyncOutbox.countDocuments({ status: 'failed' });
    const conflictCount = await SyncOutbox.countDocuments({ status: 'conflict' });
    const syncedCount = await SyncOutbox.countDocuments({ status: 'synced' });

    // Is connector online? (heartbeat within 2 minutes)
    const isOnline = lastConnectorHeartbeat && (Date.now() - new Date(lastConnectorHeartbeat.at).getTime() < 120000);

    const lastSynced = await SyncOutbox.findOne({ status: 'synced' }).sort({ syncedAt: -1 });

    res.json({
      success: true,
      connector: {
        isOnline: Boolean(isOnline),
        lastSeen: lastConnectorHeartbeat?.at || null,
        company: lastConnectorHeartbeat?.company || null,
        tallyReachable: lastConnectorHeartbeat?.tallyReachable || false
      },
      counts: {
        pending: pendingCount,
        failed: failedCount,
        conflict: conflictCount,
        synced: syncedCount
      },
      lastSyncedAt: lastSynced?.syncedAt || null
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/sync/log
router.get('/log', authenticateToken, async (req, res, next) => {
  try {
    const logs = await SyncLog.find().sort({ at: -1 }).limit(100);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/sync/conflicts
router.get('/conflicts', authenticateToken, async (req, res, next) => {
  try {
    const conflicts = await SyncInbox.find({ status: 'conflict' }).sort({ receivedAt: -1 });
    res.json({ success: true, count: conflicts.length, data: conflicts });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/sync/conflicts/:id/resolve
router.post('/conflicts/:id/resolve', authenticateToken, async (req, res, next) => {
  try {
    const { decision } = req.body; // 'keep_app', 'keep_tally', 'merged'
    const conflict = await SyncInbox.findById(req.params.id);
    if (!conflict) return res.status(404).json({ success: false, message: 'Conflict record not found' });

    conflict.status = 'processed';
    conflict.resolution = decision;
    await conflict.save();

    res.json({ success: true, message: `Conflict resolved with '${decision}'` });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/sync/retry/:id
router.post('/retry/:id', authenticateToken, async (req, res, next) => {
  try {
    const item = await SyncOutbox.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Outbox item not found' });

    item.status = 'pending';
    item.lastError = null;
    await item.save();

    res.json({ success: true, message: 'Item queued for retry' });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/sync/trigger
router.post('/trigger', authenticateToken, async (req, res, next) => {
  try {
    const { scope = 'all' } = req.body;
    emitEvent('sync:trigger', { scope, triggeredBy: req.user?.userId || req.user?._id, at: new Date() });

    // Execute connector cycle if available
    try {
      const connectorPath = path.resolve(__dirname, '../../../connector');
      if (fs.existsSync(path.join(connectorPath, 'connector.py'))) {
        exec('python3 connector.py --run-once', { cwd: connectorPath }, (err, stdout) => {
          if (!err && stdout) {
            console.log('[TallySync] Triggered cycle completed:', stdout.trim().split('\n').pop());
          }
        });
      }
    } catch {
      // ignore
    }

    const pendingCount = await SyncOutbox.countDocuments({ status: { $in: ['pending', 'failed'] } });
    const syncedCount = await SyncOutbox.countDocuments({ status: 'synced' });

    res.json({
      success: true,
      message: 'Tally synchronization cycle triggered successfully',
      scope,
      counts: {
        pending: pendingCount,
        synced: syncedCount
      },
      triggeredAt: new Date()
    });
  } catch (err) {
    next(err);
  }
});

export default router;
