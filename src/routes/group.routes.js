import express from 'express';
import {
  createGroup,
  getMyGroups,
  getGroup,
  addMembers,
  removeMember,
} from '../controllers/group.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', protect, createGroup); // Create a group
router.get('/', protect, getMyGroups); // Get my groups
router.get('/:id', protect, getGroup); // Get a single group
router.put('/:id/members', protect, addMembers); // Add members (admin)
router.delete('/:id/members/:userId', protect, removeMember); // Remove member (admin)

export default router;
