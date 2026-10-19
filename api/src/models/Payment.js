import mongoose from 'mongoose';
import { syncSchema } from './common.js';

const paymentSchema = new mongoose.Schema({
  receiptNo: { type: String, required: true, unique: true, index: true },
  partyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true, index: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null, index: true },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },
  mode: {
    type: String,
    enum: ['cash', 'upi', 'online', 'bank', 'credit'],
    required: true,
    default: 'cash'
  },
  amount: { type: Number, required: true, min: 0.01 },
  date: { type: Date, default: Date.now },
  ref: { type: String, default: '' }, // UPI reference, transaction ID, cheque number
  direction: { type: String, enum: ['in', 'out'], default: 'in' }, // in = collection, out = vendor payout
  remarks: { type: String, default: '' },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  sync: { type: syncSchema, default: () => ({}) }
}, {
  timestamps: true
});

paymentSchema.index({ date: -1, mode: 1 });

export const Payment = mongoose.model('Payment', paymentSchema);
