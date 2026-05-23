import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

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

    try {
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: true,
        lastSeen: new Date(),
      });
    } catch (e) {
      console.error('[SOCKET] Failed to mark user online:', e.message);
    }

    socket.join(socket.userId);
    socket.emit('connected');
    io.emit('user_online', { userId: socket.userId });

    // ─── Join a chat room ──────────────────────────────────────────────────
    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
    });

    // ─── Send message — broadcast to chat room ─────────────────────────────
    socket.on('send_message', (data) => {
      io.to(data.chatId).emit('receive_message', data);
    });

    // ─── Message deleted ───────────────────────────────────────────────────
    socket.on('delete_message', (data) => {
      // data: { chatId, messageId }
      io.to(data.chatId).emit('message_deleted', data);
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
      try {
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date(),
        });
        io.emit('user_offline', {
          userId: socket.userId,
          lastSeen: new Date(),
        });
      } catch (e) {
        console.error('[SOCKET] Failed to mark user offline:', e.message);
      }
    });
  });
};
