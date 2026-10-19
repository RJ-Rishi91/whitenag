import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  action: { type: String, required: true },
  entity: { type: String, required: true, index: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
  before: { type: mongoose.Schema.Types.Mixed, default: null },
  after: { type: mongoose.Schema.Types.Mixed, default: null },
  ip: { type: String, default: '' },
  at: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true
});

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
