import mongoose from 'mongoose';

const syncOutboxSchema = new mongoose.Schema({
  entityType: {
    type: String,
    enum: ['party', 'item', 'godown', 'unit', 'order', 'invoice', 'purchase', 'production', 'payment'],
    required: true,
    index: true
  },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  operation: {
    type: String,
    enum: ['create', 'update', 'delete'],
    required: true
  },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  idempotencyKey: { type: String, required: true, unique: true, index: true },
  status: {
    type: String,
    enum: ['pending', 'sent', 'synced', 'failed', 'conflict'],
    default: 'pending',
    index: true
  },
  attempts: { type: Number, default: 0 },
  lastError: { type: String, default: null },
  sentAt: { type: Date, default: null },
  syncedAt: { type: Date, default: null }
}, {
  timestamps: true
});

syncOutboxSchema.index({ status: 1, createdAt: 1 });

export const SyncOutbox = mongoose.model('SyncOutbox', syncOutboxSchema);
