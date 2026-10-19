import mongoose from 'mongoose';

const syncInboxSchema = new mongoose.Schema({
  source: { type: String, default: 'tally' },
  entityType: { type: String, required: true },
  tallyGuid: { type: String, required: true, index: true },
  alterId: { type: Number, default: 0 },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  status: {
    type: String,
    enum: ['received', 'processed', 'conflict', 'ignored', 'failed'],
    default: 'received',
    index: true
  },
  resolution: { type: String, default: null }, // 'keep_app', 'keep_tally', 'merged'
  error: { type: String, default: null },
  receivedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export const SyncInbox = mongoose.model('SyncInbox', syncInboxSchema);
