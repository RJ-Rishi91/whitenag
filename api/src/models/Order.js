import mongoose from 'mongoose';
import { syncSchema } from './common.js';

const orderItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  unitSymbol: { type: String, default: 'pcs (pack)' },
  qty: { type: Number, required: true, min: 1 },
  rate: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0 }, // percentage or flat discount
  discountAmount: { type: Number, default: 0 },
  taxRate: { type: Number, default: 5 },
  taxAmount: { type: Number, default: 0 },
  lineTotal: { type: Number, required: true }
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['received', 'packed', 'shipped', 'delivered', 'cancelled'],
    required: true
  },
  at: { type: Date, default: Date.now },
  by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  note: { type: String, default: '' },
  payment: { type: mongoose.Schema.Types.Mixed, default: null }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNo: { type: String, required: true, unique: true, index: true },
  partyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true, index: true },
  segment: { type: String, enum: ['b2b', 'b2c'], default: 'b2b' },
  areaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Area', required: false, index: true },
  godownId: { type: mongoose.Schema.Types.ObjectId, ref: 'Godown', required: true, index: true },
  items: [orderItemSchema],
  subtotal: { type: Number, default: 0 },
  discountTotal: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  paymentTerms: { type: String, default: 'Cash on Delivery' },
  deliveryDetails: { type: String, default: '' },
  remarks: { type: String, default: '' },
  status: {
    type: String,
    enum: ['received', 'packed', 'shipped', 'delivered', 'cancelled'],
    default: 'received',
    index: true
  },
  statusHistory: [statusHistorySchema],
  challanNo: { type: String, default: '', index: true },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid',
    index: true
  },
  paidAmount: { type: Number, default: 0 },
  sync: { type: syncSchema, default: () => ({}) }
}, {
  timestamps: true
});

orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, areaId: 1 });

export const Order = mongoose.model('Order', orderSchema);
