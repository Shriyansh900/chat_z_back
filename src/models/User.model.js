import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false }, // never returned by default
    avatar: { type: String, default: '' },
    avatarPublicId: { type: String, default: null },
    bio: { type: String, default: '', maxlength: 200 },
    isVerified: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: null },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    publicKey: { type: String, default: null },
  },
  { timestamps: true },
);

export default mongoose.model('User', userSchema);
