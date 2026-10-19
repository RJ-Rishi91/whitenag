import mongoose from 'mongoose';

const stockLevelSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
  godownId: { type: mongoose.Schema.Types.ObjectId, ref: 'Godown', required: true, index: true },
  physical: { type: Number, default: 0 },
  reserved: { type: Number, default: 0 },
  available: { type: Number, default: 0 } // physical - reserved
}, {
  timestamps: true
});

stockLevelSchema.index({ itemId: 1, godownId: 1 }, { unique: true });

stockLevelSchema.pre('save', function() {
  this.available = (this.physical || 0) - (this.reserved || 0);
});

export const StockLevel = mongoose.model('StockLevel', stockLevelSchema);
