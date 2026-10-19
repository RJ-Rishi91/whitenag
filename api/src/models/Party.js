import mongoose from 'mongoose';
import { syncSchema } from './common.js';

const partySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['customer', 'supplier'],
    required: true,
    default: 'customer'
  },
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  altMobile: { type: String, default: '', trim: true },
  address: { type: String, default: '' },
  city: { type: String, default: 'Udaipur' },
  pincode: { type: String, default: '313001' },
  areaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Area', required: false },
  segment: {
    type: String,
    enum: ['b2b', 'b2c'],
    default: 'b2b'
  },
  b2bType: {
    type: String,
    enum: ['wholesale', 'retailer', 'distributor', 'other', 'none'],
    default: 'retailer'
  },
  gstin: { type: String, default: '', uppercase: true, trim: true },
  mapsUrl: { type: String, default: '' },
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  creditDays: { type: Number, default: 0 },
  creditLimit: { type: Number, default: 0 },
  balance: { type: Number, default: 0 }, // Positive = customer owes us (debit), Negative = we owe supplier (credit)
  tallyGuid: { type: String, default: null },
  active: { type: Boolean, default: true },
  sync: { type: syncSchema, default: () => ({}) }
}, {
  timestamps: true
});

partySchema.index({ mobile: 1 });
partySchema.index({ name: 'text', mobile: 'text' });
partySchema.index({ type: 1, segment: 1, areaId: 1 });

export const Party = mongoose.model('Party', partySchema);
