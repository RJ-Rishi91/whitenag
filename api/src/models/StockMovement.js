import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
  godownId: { type: mongoose.Schema.Types.ObjectId, ref: 'Godown', required: true, index: true },
  qty: { type: Number, required: true }, // positive or negative
  type: {
    type: String,
    enum: [
      'purchase',
      'production_in',
      'consumption',
      'reserve',
      'release',
      'pack',
      'ship',
      'transfer_in',
      'transfer_out',
      'adjustment',
      'wastage'
    ],
    required: true,
    index: true
  },
  refType: { type: String, default: null }, // 'Order', 'Purchase', 'ProductionEntry', 'StockTransfer', 'Adjustment'
  refId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
  batchNo: { type: String, default: '' },
  rate: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
  remarks: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, {
  timestamps: true
});

stockMovementSchema.index({ itemId: 1, godownId: 1, date: -1 });

export const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
