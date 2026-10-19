import mongoose from 'mongoose';
import { syncSchema } from './common.js';

const consumptionLineSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  sku: String,
  name: String,
  bomQty: { type: Number, required: true },
  actualQty: { type: Number, required: true },
  variance: { type: Number, default: 0 }, // actualQty - bomQty
  unitSymbol: { type: String, default: 'kg' }
}, { _id: false });

const productionEntrySchema = new mongoose.Schema({
  productionNo: { type: String, required: true, unique: true, index: true },
  date: { type: Date, default: Date.now },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
  qty: { type: Number, required: true, min: 0.001 },
  unitSymbol: { type: String, default: 'pcs (pack)' },
  godownId: { type: mongoose.Schema.Types.ObjectId, ref: 'Godown', required: true, index: true },
  bomId: { type: mongoose.Schema.Types.ObjectId, ref: 'BOM', required: true },
  bomVersion: { type: Number, default: 1 },
  batchNo: { type: String, required: true, trim: true },
  wastage: { type: Number, default: 0 },
  lines: [consumptionLineSchema],
  remarks: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  sync: { type: syncSchema, default: () => ({}) }
}, {
  timestamps: true
});

productionEntrySchema.index({ date: -1, productId: 1 });

export const ProductionEntry = mongoose.model('ProductionEntry', productionEntrySchema);
