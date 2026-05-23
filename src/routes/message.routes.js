import express from 'express';
import {
  sendMessage,
  getMessages,
  deleteMessage,
} from '../controllers/message.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Send, retrieve, and delete messages
 */

/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Send a message
 *     tags: [Messages]
 *     description: >
 *       Send a plain text message to a chat. Optionally attach a file (max 10MB).
 *       Use multipart/form-data when sending a file, otherwise application/json.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chatId, content]
 *             properties:
 *               chatId: { type: string, example: 664f1a2b3c4d5e6f7a8b9c0d }
 *               content: { type: string, example: Hello! }
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [chatId]
 *             properties:
 *               chatId: { type: string }
 *               content: { type: string }
 *               file: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Message sent
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Message' }
 *       403:
 *         description: Not a member of this chat
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Chat not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/', protect, upload.single('file'), sendMessage);

/**
 * @swagger
 * /messages/{chatId}:
 *   get:
 *     summary: Get all messages in a chat
 *     tags: [Messages]
 *     description: Returns messages sorted oldest-first.
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema: { type: string }
 *         example: 664f1a2b3c4d5e6f7a8b9c0d
 *     responses:
 *       200:
 *         description: List of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Message' }
 *       403:
 *         description: Not a member of this chat
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/:chatId', protect, getMessages);

/**
 * @swagger
 * /messages/{messageId}:
 *   delete:
 *     summary: Delete a message (sender only)
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema: { type: string }
 *         example: 664f1a2b3c4d5e6f7a8b9c0d
 *     responses:
 *       200:
 *         description: Message deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Message deleted }
 *       403:
 *         description: You can only delete your own messages
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Message not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.delete('/:messageId', protect, deleteMessage);

export default router;
