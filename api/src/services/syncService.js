import { SyncOutbox } from '../models/SyncOutbox.js';
import { SyncLog } from '../models/SyncLog.js';

export async function enqueueSyncOutbox({
  entityType,
  entityId,
  operation,
  payload,
  idempotencyKey,
  session = null
}) {
  const finalKey = idempotencyKey || `${entityType}-${entityId}-${operation}-${Date.now()}`;

  const doc = new SyncOutbox({
    entityType,
    entityId,
    operation,
    payload,
    idempotencyKey: finalKey,
    status: 'pending'
  });

  if (session) {
    await doc.save({ session });
  } else {
    await doc.save();
  }

  return doc;
}

export async function logSyncEvent({
  direction,
  entityType,
  entityId = null,
  tallyGuid = null,
  result,
  message,
  details = null
}) {
  try {
    await SyncLog.create({
      direction,
      entityType,
      entityId,
      tallyGuid,
      result,
      message,
      details,
      at: new Date()
    });
  } catch (err) {
    // Non-blocking log write failure
    console.error('Failed to write sync log:', err);
  }
}
