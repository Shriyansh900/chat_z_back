import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import chatRoutes from './routes/chat.routes.js';
import friendRoutes from './routes/friend.routes.js';
import groupRoutes from './routes/group.routes.js';
import messageRoutes from './routes/message.routes.js';

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Must be FIRST — before body parsers so OPTIONS preflight is handled correctly
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // In production — read CLIENT_URL at request time (not at module load)
    const allowedOrigins = process.env.CLIENT_URL
      ? process.env.CLIENT_URL.split(',').map((o) => o.trim())
      : [];

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true, // required for cookies
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  optionsSuccessStatus: 200, // some browsers (IE11) choke on 204
};

app.use(cors(corsOptions));
// Note: cors() middleware automatically handles OPTIONS preflight — no separate app.options() needed

// ─── Body parsers & cookies ───────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('src/uploads'));

// ─── Swagger UI ───────────────────────────────────────────────────────────────
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'ChatZ API Docs',
    customCss: '.swagger-ui .topbar { background-color: #2563eb; }',
    swaggerOptions: { persistAuthorization: true },
  }),
);

app.get('/api/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  // Handle CORS errors specifically
  if (err.message?.startsWith('CORS:')) {
    return res.status(403).json({ message: err.message });
  }
  console.error(err.stack);
  res
    .status(err.status || 500)
    .json({ message: err.message || 'Internal Server Error' });
});

export default app;
