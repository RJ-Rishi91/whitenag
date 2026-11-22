import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  userName: { type: String, default: 'System' },
  userRole: { type: String, default: 'System' },
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE',
      'UPDATE',
      'DELETE',
      'STATUS_CHANGE',
      'PAYMENT_COLLECTED',
      'STOCK_ADJUSTMENT',
      'TRANSFER',
      'PRICE_OVERRIDE',
      'CANCEL',
      'SYNC_PUSH',
      'SYNC_ACK',
      'MASTER_MERGE'
    ],
    index: true
  },
  entity: {
    type: String,
    required: true,
    enum: [
      'order',
      'invoice',
      'party',
      'item',
      'payment',
      'production',
      'stock',
      'godown',
      'user',
      'sync'
    ],
    index: true
  },
  entityId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
  entityRef: { type: String, default: '', index: true },
  summary: { type: String, required: true },
  diff: { type: mongoose.Schema.Types.Mixed, default: null },
  before: { type: mongoose.Schema.Types.Mixed, default: null },
  after: { type: mongoose.Schema.Types.Mixed, default: null },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  at: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true
});

// Compound indexes for rapid lookups
auditLogSchema.index({ entity: 1, entityId: 1, at: -1 });
auditLogSchema.index({ userId: 1, at: -1 });
auditLogSchema.index({ action: 1, at: -1 });

// IMMUTABILITY ENFORCEMENT: Never allow deletions from AuditLog
const blockDelete = function() {
  throw new Error('CRITICAL INTEGRITY VIOLATION: Audit logs are permanently immutable and can NEVER be deleted.');
};

auditLogSchema.pre('deleteOne', blockDelete);
auditLogSchema.pre('deleteMany', blockDelete);
auditLogSchema.pre('findOneAndDelete', blockDelete);
auditLogSchema.pre('findByIdAndDelete', blockDelete);
auditLogSchema.pre('remove', blockDelete);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
