import mongoose from 'mongoose';

const syncLogSchema = new mongoose.Schema({
  direction: { type: String, enum: ['outbound', 'inbound'], required: true },
  entityType: { type: String, required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
  tallyGuid: { type: String, default: null },
  result: { type: String, enum: ['success', 'failed', 'conflict', 'retry'], required: true },
  message: { type: String, default: '' },
  details: { type: mongoose.Schema.Types.Mixed, default: null },
  at: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true
});

export const SyncLog = mongoose.model('SyncLog', syncLogSchema);
