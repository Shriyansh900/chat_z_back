import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },

    // E2E encrypted content — stored as base64 ciphertext, server cannot read this
    // For group chats: array of { userId, encryptedContent } (one per recipient)
    content: { type: String, default: '' }, // 1-on-1: single ciphertext for recipient
    senderContent: { type: String, default: '' }, // sender's own copy (encrypted with sender's key)

    // For group messages: per-member encrypted copies
    groupEncrypted: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        encryptedContent: { type: String },
      },
    ],

    // Unencrypted file path (file encryption is a separate concern)
    file: { type: String, default: null },
    filePublicId: { type: String, default: null }, // Cloudinary public_id
    fileType: { type: String, default: null }, // "image" | "video" | "raw"

    isEncrypted: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model('Message', messageSchema);
