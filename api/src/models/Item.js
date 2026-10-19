import mongoose from 'mongoose';
import { syncSchema } from './common.js';

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
  category: {
    type: String,
    enum: ['raw', 'finished', 'packaging', 'other'],
    required: true,
    default: 'finished'
  },
  productGroup: { type: String, trim: true, default: '' },
  packWeightGrams: { type: Number, default: 0 },
  packagingVariant: { type: String, default: null },
  unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
  unitSymbol: { type: String, default: 'pcs (pack)' },
  mrp: { type: Number, default: 0 },
  standardCost: { type: Number, default: 0 },
  gstRate: { type: Number, default: 5 }, // 5% standard for most food items
  hsn: { type: String, default: '1905' },
  minStock: { type: Number, default: 10 },
  tallyGuid: { type: String, default: null },
  active: { type: Boolean, default: true },
  sync: { type: syncSchema, default: () => ({}) }
}, {
  timestamps: true
});

itemSchema.index({ category: 1, productGroup: 1 });
itemSchema.index({ name: 'text', sku: 'text' });

export const Item = mongoose.model('Item', itemSchema);
