import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Chat from '../models/Chat.model.js';
import { setIo } from '../config/socket.js';
import { handlePresence } from './presence.socket.js';

// userId → Set<socketId>  (tracks multiple tabs per user)
const onlineSockets = new Map();

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Export io singleton so controllers can emit events
  setIo(io);

  // ─── Auth middleware ───────────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

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

    // Each user joins their own personal room (for direct notifications)
    socket.join(socket.userId);
    socket.emit('connected');

    // Delegate all presence logic (online/offline, multi-tab safe)
    await handlePresence(io, socket, onlineSockets);

    // ─── Join a chat room (membership validated) ───────────────────────────
    socket.on('join_chat', async (chatId) => {
      try {
        const chat = await Chat.findById(chatId).lean();
        if (!chat) return;
        if (!chat.users.map(String).includes(socket.userId)) return;
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
  });
};
