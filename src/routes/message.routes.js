import express from 'express';
import { sendMessage, getMessages } from '../controllers/message.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.post('/', protect, upload.single('file'), sendMessage); // Send a message (optional file)
router.get('/:chatId', protect, getMessages); // Get messages for a chat

export default router;
