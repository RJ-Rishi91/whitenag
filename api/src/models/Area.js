import mongoose from 'mongoose';

const areaSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  city: { type: String, default: 'Udaipur' },
  pincode: { type: String, default: '313001' },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const Area = mongoose.model('Area', areaSchema);
