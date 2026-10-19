import mongoose from 'mongoose';

const rateHistorySchema = new mongoose.Schema({
  partyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true, index: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
  rate: { type: Number, required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: false },
  date: { type: Date, default: Date.now }
}, {
  timestamps: true
});

rateHistorySchema.index({ partyId: 1, itemId: 1, date: -1 });

export const RateHistory = mongoose.model('RateHistory', rateHistorySchema);
