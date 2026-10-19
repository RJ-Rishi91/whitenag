import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  mustChangePassword: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null }
}, {
  timestamps: true
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.statics.hashPassword = async function(password) {
  return bcrypt.hash(password, 10);
};

export const User = mongoose.model('User', userSchema);
