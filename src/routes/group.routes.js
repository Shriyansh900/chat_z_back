import express from 'express';
import {
  createGroup,
  getMyGroups,
  getGroup,
  addMembers,
  removeMember,
  leaveGroup,
  changeAdmin,
  deleteGroup,
} from '../controllers/group.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Group creation and member management
 */

/**
 * @swagger
 * /groups:
 *   post:
 *     summary: Create a group
 *     tags: [Groups]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: Dev Team }
 *               description: { type: string, example: Our dev group }
 *               members:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["664f1a2b3c4d5e6f7a8b9c0d"]
 *     responses:
 *       201:
 *         description: Group created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Group' }
 */
router.post('/', protect, createGroup);

/**
 * @swagger
 * /groups:
 *   get:
 *     summary: Get all groups I belong to
 *     tags: [Groups]
 *     responses:
 *       200:
 *         description: List of groups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Group' }
 */
router.get('/', protect, getMyGroups);

/**
 * @swagger
 * /groups/{id}:
 *   get:
 *     summary: Get a group by ID
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Group details
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Group' }
 *       403:
 *         description: Not a member
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/:id', protect, getGroup);

/**
 * @swagger
 * /groups/{id}/members:
 *   put:
 *     summary: Add members to group (admin only)
 *     tags: [Groups]
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
 *             required: [userIds]
 *             properties:
 *               userIds:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200:
 *         description: Members added
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Group' }
 *       403:
 *         description: Only admin can add members
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.put('/:id/members', protect, addMembers);

/**
 * @swagger
 * /groups/{id}/members/{userId}:
 *   delete:
 *     summary: Remove a member (admin only)
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Member removed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Group' }
 *       403:
 *         description: Only admin can remove members
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.delete('/:id/members/:userId', protect, removeMember);

/**
 * @swagger
 * /groups/{id}/leave:
 *   delete:
 *     summary: Leave a group (non-admin members only)
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Left the group
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Left the group }
 *       400:
 *         description: Admin must transfer role before leaving
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.delete('/:id/leave', protect, leaveGroup);

/**
 * @swagger
 * /groups/{id}/admin:
 *   put:
 *     summary: Transfer admin role to another member (admin only)
 *     tags: [Groups]
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
 *             required: [userId]
 *             properties:
 *               userId: { type: string, example: 664f1a2b3c4d5e6f7a8b9c0d }
 *     responses:
 *       200:
 *         description: Admin transferred
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Group' }
 *       403:
 *         description: Only admin can transfer role
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.put('/:id/admin', protect, changeAdmin);

/**
 * @swagger
 * /groups/{id}:
 *   delete:
 *     summary: Delete a group entirely (admin only)
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Group deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Group deleted }
 *       403:
 *         description: Only admin can delete the group
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.delete('/:id', protect, deleteGroup);

export default router;
