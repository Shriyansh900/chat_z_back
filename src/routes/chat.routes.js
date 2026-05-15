import express from 'express';
import { accessChat, getUserChats } from '../controllers/chat.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Chats
 *   description: 1-on-1 chat management (only between accepted friends)
 */

/**
 * @swagger
 * /chats:
 *   post:
 *     summary: Create or fetch a 1-on-1 chat
 *     tags: [Chats]
 *     description: >
 *       Creates a new chat between the logged-in user and the specified user,
 *       or returns the existing chat if one already exists.
 *       **Both users must be accepted friends** — returns 403 otherwise.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: string
 *                 description: MongoDB ObjectId of the other user
 *                 example: 664f1a2b3c4d5e6f7a8b9c0d
 *     responses:
 *       200:
 *         description: Existing chat returned
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Chat' }
 *       201:
 *         description: New chat created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Chat' }
 *       400:
 *         description: userId is required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: You can only chat with accepted friends
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/', protect, accessChat);

/**
 * @swagger
 * /chats:
 *   get:
 *     summary: Get all chats for the logged-in user
 *     tags: [Chats]
 *     description: Returns all chats sorted by most recently updated. Each chat includes populated users and lastMessage.
 *     responses:
 *       200:
 *         description: List of chats
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Chat' }
 */
router.get('/', protect, getUserChats);

export default router;
