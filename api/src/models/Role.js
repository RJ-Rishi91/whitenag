import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, default: '' },
  permissions: [{ type: String, trim: true }],
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const Role = mongoose.model('Role', roleSchema);
