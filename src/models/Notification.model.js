import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      enum: ['message', 'friend_request'],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    isRead: { type: Boolean, default: false },

    // ── Bonus: placeholder for FCM push ──────────────────────────────────
    // fcmToken is stored on the User model when the client registers a device.
    // Set to true once a push notification is sent so we don't double-notify.
    pushSent: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Index for efficient unread-count queries
notificationSchema.index({ userId: 1, isRead: 1 });

export default mongoose.model('Notification', notificationSchema);
