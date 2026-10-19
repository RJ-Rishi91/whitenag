import mongoose from 'mongoose';

const stockTransferLineSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  sku: String,
  name: String,
  qty: { type: Number, required: true, min: 0.001 },
  unitSymbol: { type: String, default: 'pcs (pack)' }
}, { _id: false });

const stockTransferSchema = new mongoose.Schema({
  transferNo: { type: String, required: true, unique: true, index: true },
  fromGodownId: { type: mongoose.Schema.Types.ObjectId, ref: 'Godown', required: true },
  toGodownId: { type: mongoose.Schema.Types.ObjectId, ref: 'Godown', required: true },
  lines: [stockTransferLineSchema],
  date: { type: Date, default: Date.now },
  remarks: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, {
  timestamps: true
});

export const StockTransfer = mongoose.model('StockTransfer', stockTransferSchema);
