import express from 'express';
import {
  sendFriendRequest,
  getFriendRequests,
  respondToRequest,
  getFriends,
} from '../controllers/friend.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/request', protect, sendFriendRequest); // Send a friend request
router.get('/requests', protect, getFriendRequests); // Get pending incoming requests
router.put('/request/:id', protect, respondToRequest); // Accept or reject a request
router.get('/', protect, getFriends); // Get all accepted friends

export default router;
