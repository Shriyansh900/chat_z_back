import express from 'express';
import {
  searchUsers,
  getProfile,
  updateProfile,
  deleteProfile,
  uploadPublicKey,
  getPublicKey,
} from '../controllers/user.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.get('/search', protect, searchUsers); // ?search=query
router.get('/me', protect, getProfile); // get my profile
router.put('/me', protect, upload.single('avatar'), updateProfile); // update profile + avatar
router.delete('/me', protect, deleteProfile); // delete account
router.post('/me/public-key', protect, uploadPublicKey); // register E2E public key
router.get('/:userId/public-key', protect, getPublicKey); // get another user's public key

export default router;
