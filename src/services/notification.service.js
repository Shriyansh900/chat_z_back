import Notification from '../models/Notification.model.js';
import { getIo } from '../config/socket.js';

/**
 * Creates a notification in MongoDB and immediately delivers it via Socket.IO
 * if the target user is connected.
 *
 * Designed to be called fire-and-forget from controllers:
 *   createAndSend({ ... }).catch(err => console.error('[NOTIF]', err));
 *
 * @param {object} opts
 * @param {string}  opts.userId    - Receiver's MongoDB ObjectId (string)
 * @param {string}  [opts.senderId] - Sender's MongoDB ObjectId (string)
 * @param {'message'|'friend_request'} opts.type
 * @param {string}  opts.title
 * @param {string}  opts.body
 */
export const createAndSend = async ({
  userId,
  senderId = null,
  type,
  title,
  body,
}) => {
  // STEP 1 — Persist notification
  const notification = await Notification.create({
    userId,
    senderId,
    type,
    title,
    body,
  });

  console.log(
    `[NOTIF] Created  type=${type}  userId=${userId}  id=${notification._id}`,
  );

  // STEP 2 — Check if receiver is online via their personal Socket.IO room.
  // Each user joins a room named after their userId on connect (see sockets/index.js).
  // io.sockets.adapter.rooms.get(userId) returns the Set of socketIds in that room.
  let delivered = false;
  try {
    const io = getIo();
    const room = io.sockets.adapter.rooms.get(userId);
    const isOnline = room && room.size > 0;

    if (isOnline) {
      // STEP 3 — Emit directly to the user's personal room (never broadcast)
      io.to(userId).emit('notification', {
        _id: String(notification._id),
        type,
        title,
        body,
        senderId,
        isRead: false,
        createdAt: notification.createdAt,
      });

      delivered = true;
      console.log(
        `[NOTIF] Delivered via socket  userId=${userId}  type=${type}`,
      );
    }
  } catch (e) {
    console.error('[NOTIF] Socket delivery error:', e.message);
  }

  // STEP 4 — Offline path
  if (!delivered) {
    console.log(
      `[NOTIF] User offline, notification stored  userId=${userId}  type=${type}`,
    );

    // ── Bonus placeholder: FCM push notification ──────────────────────────
    // Uncomment and implement when FCM is integrated:
    //
    // try {
    //   const user = await User.findById(userId).select('fcmToken').lean();
    //   if (user?.fcmToken) {
    //     await sendFcmPush({ token: user.fcmToken, title, body });
    //     await Notification.findByIdAndUpdate(notification._id, { pushSent: true });
    //     console.log(`[NOTIF] FCM push sent  userId=${userId}`);
    //   }
    // } catch (fcmErr) {
    //   console.error('[NOTIF] FCM push failed:', fcmErr.message);
    // }
    //
    // ── Bonus placeholder: Redis queue hook ───────────────────────────────
    // Uncomment when a Redis/BullMQ queue is wired up:
    //
    // await notificationQueue.add('send-push', {
    //   notificationId: String(notification._id),
    //   userId,
    //   title,
    //   body,
    // });
  }

  return notification;
};
