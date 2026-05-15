import express from 'express';
import {
  sendFriendRequest,
  getFriendRequests,
  respondToRequest,
  getFriends,
  unfriend,
} from '../controllers/friend.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Friends
 *   description: Friend requests and friends list
 */

/**
 * @swagger
 * /friends/request:
 *   post:
 *     summary: Send a friend request
 *     tags: [Friends]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [receiverId]
 *             properties:
 *               receiverId: { type: string, example: 664f1a2b3c4d5e6f7a8b9c0d }
 *     responses:
 *       201:
 *         description: Friend request sent
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/FriendRequest' }
 *       409:
 *         description: Request already sent
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/request', protect, sendFriendRequest);

/**
 * @swagger
 * /friends/requests:
 *   get:
 *     summary: Get pending incoming friend requests
 *     tags: [Friends]
 *     responses:
 *       200:
 *         description: List of pending requests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/FriendRequest' }
 */
router.get('/requests', protect, getFriendRequests);

/**
 * @swagger
 * /friends/request/{id}:
 *   put:
 *     summary: Accept or reject a friend request
 *     tags: [Friends]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action: { type: string, enum: [accept, reject], example: accept }
 *     responses:
 *       200:
 *         description: Request updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/FriendRequest' }
 *       403:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.put('/request/:id', protect, respondToRequest);

/**
 * @swagger
 * /friends:
 *   get:
 *     summary: Get all accepted friends
 *     tags: [Friends]
 *     responses:
 *       200:
 *         description: Friends list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/User' }
 */
router.get('/', protect, getFriends);

/**
 * @swagger
 * /friends/{userId}:
 *   delete:
 *     summary: Remove a friend (unfriend)
 *     tags: [Friends]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *         example: 664f1a2b3c4d5e6f7a8b9c0d
 *     responses:
 *       200:
 *         description: Friend removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Friend removed }
 *       404:
 *         description: Friendship not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.delete('/:userId', protect, unfriend);

export default router;
