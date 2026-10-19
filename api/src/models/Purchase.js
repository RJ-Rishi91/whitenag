import mongoose from 'mongoose';
import { syncSchema } from './common.js';

const purchaseLineSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  sku: String,
  name: String,
  qty: { type: Number, required: true, min: 0.001 },
  unitSymbol: { type: String, default: 'kg' },
  rate: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0 },
  gstRate: { type: Number, default: 5 },
  gstAmount: { type: Number, default: 0 },
  lineTotal: { type: Number, required: true }
}, { _id: false });

const purchaseSchema = new mongoose.Schema({
  purchaseNo: { type: String, required: true, unique: true, index: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true, index: true },
  invoiceNo: { type: String, default: '' }, // supplier's bill no
  date: { type: Date, default: Date.now },
  godownId: { type: mongoose.Schema.Types.ObjectId, ref: 'Godown', required: true },
  lines: [purchaseLineSchema],
  subtotal: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  paidAmount: { type: Number, default: 0 },
  remarks: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  sync: { type: syncSchema, default: () => ({}) }
}, {
  timestamps: true
});

purchaseSchema.index({ date: -1, supplierId: 1 });

export const Purchase = mongoose.model('Purchase', purchaseSchema);
