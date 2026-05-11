import { Server } from 'socket.io';

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Client sends their userId so we can route events to them directly
    socket.on('setup', (userId) => {
      socket.join(userId);
      socket.emit('connected');
    });

    // Join a specific chat room
    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
    });

    // Broadcast a new message to everyone in the chat room
    socket.on('send_message', (data) => {
      io.to(data.chatId).emit('receive_message', data);
    });

    // Typing indicators
    socket.on('typing', (chatId) => {
      socket.to(chatId).emit('typing', chatId);
    });

    socket.on('stop_typing', (chatId) => {
      socket.to(chatId).emit('stop_typing', chatId);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
