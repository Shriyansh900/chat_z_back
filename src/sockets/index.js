import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import Chat from '../models/Chat.model.js';
import FriendRequest from '../models/FriendRequest.model.js';
import { setIo } from '../config/socket.js';

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Export io singleton so controllers can emit events
  setIo(io);

  // ─── Auth middleware — verify JWT before any socket event ─────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log('User connected:', socket.id, '| userId:', socket.userId);

    // Mark user online in DB
    try {
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: true,
        lastSeen: new Date(),
      });
    } catch (e) {
      console.error('[SOCKET] Failed to mark user online:', e.message);
    }

    // Each user joins their own personal room (for direct notifications)
    socket.join(socket.userId);
    socket.emit('connected');

    // Notify only friends that this user is online
    try {
      const friendships = await FriendRequest.find({
        $or: [{ sender: socket.userId }, { receiver: socket.userId }],
        status: 'accepted',
      });

      friendships.forEach((f) => {
        const friendId =
          String(f.sender) === socket.userId
            ? String(f.receiver)
            : String(f.sender);
        io.to(friendId).emit('user_online', { userId: socket.userId });
      });
    } catch (e) {
      console.error(
        '[SOCKET] Failed to notify friends of online status:',
        e.message,
      );
    }

    // ─── Join a chat room (validated) ─────────────────────────────────────
    socket.on('join_chat', async (chatId) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat) return;

        const isMember = chat.users.map(String).includes(socket.userId);
        if (!isMember) return;

        socket.join(chatId);
      } catch (e) {
        console.error('[SOCKET] join_chat error:', e.message);
      }
    });

    // ─── Typing indicators ─────────────────────────────────────────────────
    socket.on('typing', (chatId) => {
      socket.to(chatId).emit('typing', { chatId, userId: socket.userId });
    });

    socket.on('stop_typing', (chatId) => {
      socket.to(chatId).emit('stop_typing', { chatId, userId: socket.userId });
    });

    // ─── Disconnect ────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);

      const lastSeen = new Date();

      try {
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen,
        });
      } catch (e) {
        console.error('[SOCKET] Failed to mark user offline:', e.message);
      }

      // Notify only friends that this user went offline
      try {
        const friendships = await FriendRequest.find({
          $or: [{ sender: socket.userId }, { receiver: socket.userId }],
          status: 'accepted',
        });

        friendships.forEach((f) => {
          const friendId =
            String(f.sender) === socket.userId
              ? String(f.receiver)
              : String(f.sender);
          io.to(friendId).emit('user_offline', {
            userId: socket.userId,
            lastSeen,
          });
        });
      } catch (e) {
        console.error(
          '[SOCKET] Failed to notify friends of offline status:',
          e.message,
        );
      }
    });
  });
};
