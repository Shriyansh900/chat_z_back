import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  purpose: { type: String, enum: ['signup', 'login'], required: true },

  // Pending signup data — stored here until OTP is verified
  // Only populated for purpose === 'signup'
  pendingUser: {
    username: { type: String },
    hashedPassword: { type: String },
    avatar: { type: String },
    avatarPublicId: { type: String },
  },

  // TTL — MongoDB auto-deletes this document 10 minutes after creation
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 10 * 60 * 1000),
    expires: 0, // correct TTL syntax: 0 means "delete at expiresAt"
  },
});

export default mongoose.model('Otp', otpSchema);
