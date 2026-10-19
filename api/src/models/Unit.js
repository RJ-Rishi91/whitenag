import mongoose from 'mongoose';

const unitSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  symbol: { type: String, required: true, unique: true, trim: true },
  tallyUnit: { type: String, default: '' },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const Unit = mongoose.model('Unit', unitSchema);
