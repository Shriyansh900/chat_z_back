import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import chatRoutes from './routes/chat.routes.js';
import friendRoutes from './routes/friend.routes.js';
import groupRoutes from './routes/group.routes.js';
import messageRoutes from './routes/message.routes.js';

const app = express();

app.use(
  cors({
    origin: true, // reflect request origin — allows any origin while still supporting credentials
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser()); // parse httpOnly cookies
app.use('/uploads', express.static('src/uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res
    .status(err.status || 500)
    .json({ message: err.message || 'Internal Server Error' });
});

export default app;
