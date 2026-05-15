import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ChatZ API',
      version: '1.0.0',
      description:
        'Complete REST API documentation for ChatZ — a real-time encrypted chat application. All protected routes require a Bearer JWT access token.',
      contact: {
        name: 'Shriyansh',
        url: 'https://github.com/Shriyansh900/chat_z_backend',
      },
    },
    servers: [
      {
        url: 'https://chat-z-back.onrender.com/api',
        description: 'Production server',
      },
      {
        url: 'http://localhost:6500/api',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Enter your access token. Obtained from /auth/verify-login or /auth/verify-signup.',
        },
      },
      schemas: {
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
              description:
                'Encrypted ciphertext for the requesting user (base64)',
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
