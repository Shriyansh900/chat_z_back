import User from '../models/User.model.js';
import FriendRequest from '../models/FriendRequest.model.js';

/**
 * Returns the list of accepted friend IDs for a given userId.
 */
const getFriendIds = async (userId) => {
  const friendships = await FriendRequest.find({
    $or: [{ sender: userId }, { receiver: userId }],
    status: 'accepted',
  }).lean();

  return friendships.map((f) =>
    String(f.sender) === userId ? String(f.receiver) : String(f.sender),
  );
};

/**
 * Handles online/offline presence for a single socket connection.
 *
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 * @param {Map<string, Set<string>>} onlineSockets  userId → Set of socketIds
 */
export const handlePresence = async (io, socket, onlineSockets) => {
  const userId = socket.userId;

  // ── Connect: track socket, mark online if first connection ──────────────
  if (!onlineSockets.has(userId)) {
    onlineSockets.set(userId, new Set());
  }
  onlineSockets.get(userId).add(socket.id);

  const isFirstConnection = onlineSockets.get(userId).size === 1;

  if (isFirstConnection) {
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date(),
      });
    } catch (e) {
      console.error('[PRESENCE] Failed to mark user online in DB:', e.message);
    }

    // Notify only accepted friends
    try {
      const friendIds = await getFriendIds(userId);
      friendIds.forEach((friendId) => {
        io.to(friendId).emit('user_online', { userId });
      });
    } catch (e) {
      console.error(
        '[PRESENCE] Failed to notify friends of online:',
        e.message,
      );
    }
  }

  // ── Disconnect: remove socket, mark offline only when last tab closes ────
  socket.on('disconnect', async () => {
    const sockets = onlineSockets.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineSockets.delete(userId);
      }
    }

    const isLastConnection = !onlineSockets.has(userId);

    if (isLastConnection) {
      const lastSeen = new Date();

      try {
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
      } catch (e) {
        console.error(
          '[PRESENCE] Failed to mark user offline in DB:',
          e.message,
        );
      }

      try {
        const friendIds = await getFriendIds(userId);
        friendIds.forEach((friendId) => {
          io.to(friendId).emit('user_offline', { userId, lastSeen });
        });
      } catch (e) {
        console.error(
          '[PRESENCE] Failed to notify friends of offline:',
          e.message,
        );
      }
    }
  });
};
