import express from 'express';
import {
  signup,
  verifySignupOtp,
  login,
  verifyLoginOtp,
  refresh,
  logout,
} from '../controllers/auth.controller.js';
import { upload } from '../middlewares/upload.middleware.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/signup', upload.single('avatar'), signup); // multipart — avatar optional
router.post('/verify-signup', verifySignupOtp); // { email, otp }
router.post('/login', login); // { email, password }
router.post('/verify-login', verifyLoginOtp); // { email, otp }
router.post('/refresh', refresh); // reads httpOnly cookie
router.post('/logout', protect, logout); // clears cookie + revokes token

export default router;
