import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ChatZ API',
      version: '2.0.0',
      description: `
## ChatZ REST API

Real-time E2E encrypted chat application.

### Authentication Flow
1. **Signup** — \`POST /auth/signup\` → returns a **4-digit OTP** in the response
2. **Verify** — \`POST /auth/verify-signup\` → creates user, returns \`accessToken\` + sets \`refreshToken\` cookie
3. **Login** — \`POST /auth/login\` → returns a **4-digit OTP** in the response
4. **Verify** — \`POST /auth/verify-login\` → returns \`accessToken\` + sets \`refreshToken\` cookie
5. **Refresh** — \`POST /auth/refresh\` → reads httpOnly cookie, returns new \`accessToken\`

### Token Usage
All protected routes require: \`Authorization: Bearer <accessToken>\`

Access tokens expire in **15 minutes**. Use \`/auth/refresh\` to get a new one silently.

### OTP Note
OTP is returned directly in the API response (4 digits). Display it to the user via a toast notification on the frontend.
      `.trim(),
      contact: {
        name: 'Shriyansh',
        url: 'https://github.com/Shriyansh900/chat_z_backend',
      },
    },
    servers: [
      {
        url: 'https://chat-z-back.onrender.com/api',
        description: 'Production (Render)',
      },
      {
        url: 'http://localhost:6500/api',
        description: 'Local development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Access token from /auth/verify-login or /auth/verify-signup. Expires in 15 minutes.',
        },
      },
      schemas: {
        // ── Auth ──────────────────────────────────────────────────────────
        OtpResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'OTP generated. Please verify.',
            },
            otp: {
              type: 'string',
              example: '4829',
              description: '4-digit OTP — show to user via toast',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT access token (15 min expiry)',
            },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        // ── Models ────────────────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
            username: { type: 'string', example: 'shriyansh' },
            email: { type: 'string', example: 'shriyansh@example.com' },
            avatar: {
              type: 'string',
              example:
                'https://res.cloudinary.com/shriyansh/image/upload/v1/chatz/avatars/abc.jpg',
            },
            bio: { type: 'string', example: 'Hey there!' },
            isVerified: { type: 'boolean', example: true },
            isOnline: { type: 'boolean', example: true },
            lastSeen: { type: 'string', format: 'date-time', nullable: true },
            publicKey: {
              type: 'string',
              nullable: true,
              example: '{"kty":"RSA","n":"...","e":"AQAB"}',
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
            sender: { $ref: '#/components/schemas/User' },
            chat: { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
            myContent: {
              type: 'string',
              description: 'Ciphertext for the requesting user (base64)',
              example: 'dGVzdCBlbmNyeXB0ZWQ=',
            },
            file: {
              type: 'string',
              nullable: true,
              example:
                'https://res.cloudinary.com/shriyansh/raw/upload/v1/chatz/files/doc.pdf',
            },
            fileType: {
              type: 'string',
              nullable: true,
              enum: ['image', 'video', 'raw'],
            },
            isEncrypted: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Chat: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
            users: {
              type: 'array',
              items: { $ref: '#/components/schemas/User' },
            },
            isGroup: { type: 'boolean', example: false },
            lastMessage: { $ref: '#/components/schemas/Message' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        FriendRequest: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
            sender: { $ref: '#/components/schemas/User' },
            receiver: { $ref: '#/components/schemas/User' },
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'rejected'],
              example: 'pending',
            },
          },
        },
        Group: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
            name: { type: 'string', example: 'Dev Team' },
            description: { type: 'string', example: 'Our dev group' },
            avatar: { type: 'string', example: '' },
            admin: { $ref: '#/components/schemas/User' },
            members: {
              type: 'array',
              items: { $ref: '#/components/schemas/User' },
            },
            chat: { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Unauthorized' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
