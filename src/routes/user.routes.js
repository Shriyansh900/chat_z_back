import express from 'express';
import {
  searchUsers,
  getProfile,
  getUserById,
  updateProfile,
  deleteProfile,
  blockUser,
  unblockUser,
  getBlockedUsers,
} from '../controllers/user.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile, search, and block/unblock
 */

/**
 * @swagger
 * /users/search:
 *   get:
 *     summary: Search users by username
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: search
 *         required: true
 *         schema: { type: string }
 *         example: shri
 *     responses:
 *       200:
 *         description: Matching users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/User' }
 */
router.get('/search', protect, searchUsers);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get my profile
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: My profile
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 */
router.get('/me', protect, getProfile);

/**
 * @swagger
 * /users/me/blocked:
 *   get:
 *     summary: Get my blocked users list
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of blocked users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/User' }
 */
router.get('/me/blocked', protect, getBlockedUsers);

/**
 * @swagger
 * /users/me:
 *   put:
 *     summary: Update profile
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               bio: { type: string }
 *               avatar: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       409:
 *         description: Username already taken
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.put('/me', protect, upload.single('avatar'), updateProfile);

/**
 * @swagger
 * /users/me:
 *   delete:
 *     summary: Delete account and all data
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Account deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Account deleted successfully }
 */
router.delete('/me', protect, deleteProfile);

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: Get a user's public profile by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *         example: 664f1a2b3c4d5e6f7a8b9c0d
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/:userId', protect, getUserById);

/**
 * @swagger
 * /users/{userId}/block:
 *   post:
 *     summary: Block a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User blocked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: User blocked }
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/:userId/block', protect, blockUser);

/**
 * @swagger
 * /users/{userId}/block:
 *   delete:
 *     summary: Unblock a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User unblocked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: User unblocked }
 */
router.delete('/:userId/block', protect, unblockUser);

export default router;
