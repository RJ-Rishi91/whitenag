import mongoose from 'mongoose';
import { syncSchema } from './common.js';

const invoiceSchema = new mongoose.Schema({
  invoiceNo: { type: String, required: true, unique: true, index: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  partyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true, index: true },
  type: { type: String, enum: ['b2b', 'b2c'], default: 'b2b' },
  challanNo: { type: String, default: '', index: true },
  date: { type: Date, default: Date.now },
  lines: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    sku: String,
    name: String,
    hsn: String,
    qty: Number,
    unitSymbol: String,
    rate: Number,
    discountAmount: Number,
    taxableAmount: Number,
    taxRate: Number,
    taxAmount: Number,
    lineTotal: Number
  }],
  subtotal: { type: Number, default: 0 },
  discountTotal: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  status: { type: String, enum: ['issued', 'cancelled'], default: 'issued' },
  pdfUrl: { type: String, default: '' },
  sync: { type: syncSchema, default: () => ({}) }
}, {
  timestamps: true
});

export const Invoice = mongoose.model('Invoice', invoiceSchema);
