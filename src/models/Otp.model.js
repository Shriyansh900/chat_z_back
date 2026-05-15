import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  purpose: {
    type: String,
    enum: ['signup', 'login'],
    required: true,
  },
  // MongoDB TTL index — auto deletes document after 10 minutes
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 10 * 60 * 1000),
    index: { expires: 0 },
  },
});

export default mongoose.model('Otp', otpSchema);
