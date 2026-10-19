import mongoose from 'mongoose';
import { syncSchema } from './common.js';

const godownSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: {
    type: String,
    enum: ['factory', 'warehouse', 'retail', 'other'],
    default: 'warehouse'
  },
  address: { type: String, default: '' },
  active: { type: Boolean, default: true },
  tallyGodown: { type: String, default: '' },
  sync: { type: syncSchema, default: () => ({}) }
}, {
  timestamps: true
});

export const Godown = mongoose.model('Godown', godownSchema);
