import mongoose from 'mongoose';

const bomLineSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  sku: String,
  name: String,
  qty: { type: Number, required: true, min: 0.0001 },
  unitSymbol: { type: String, default: 'kg' },
  remarks: { type: String, default: '' }
}, { _id: false });

const bomSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
  name: { type: String, required: true, trim: true },
  version: { type: Number, default: 1 },
  baseQty: { type: Number, required: true, default: 100 }, // e.g. for producing 100 kg or 100 packs
  baseUnitSymbol: { type: String, default: 'pcs (pack)' },
  lines: [bomLineSchema],
  active: { type: Boolean, default: true },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

bomSchema.index({ productId: 1, version: -1 });

export const BOM = mongoose.model('BOM', bomSchema);
