import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },

    content: { type: String, default: '' },

    // Unencrypted file path
    file: { type: String, default: null },
    filePublicId: { type: String, default: null }, // Cloudinary public_id
    fileType: { type: String, default: null }, // "image" | "video" | "raw"
  },
  { timestamps: true },
);

export default mongoose.model('Message', messageSchema);
