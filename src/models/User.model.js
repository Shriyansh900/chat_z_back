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
    password: { type: String, required: true },
    avatar: { type: String, default: '' },
    avatarPublicId: { type: String, default: null }, // Cloudinary public_id for deletion
    bio: { type: String, default: '', maxlength: 200 },
    isVerified: { type: Boolean, default: false },

    // E2E Encryption — public key stored as JWK (JSON Web Key) string
    // Private key NEVER leaves the client device
    publicKey: { type: String, default: null },
  },
  { timestamps: true },
);

export default mongoose.model('User', userSchema);
