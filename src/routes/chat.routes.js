import express from 'express';
import { accessChat, getUserChats } from '../controllers/chat.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', protect, accessChat); // Create or fetch 1-on-1 chat
router.get('/', protect, getUserChats); // Get all chats for logged-in user

export default router;
