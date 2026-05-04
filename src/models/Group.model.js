import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    avatar: { type: String, default: '' },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
  },
  { timestamps: true },
);

export default mongoose.model('Group', groupSchema);
