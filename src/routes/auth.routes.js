import express from 'express';
import {
  signup,
  login,
  refresh,
  logout,
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refresh); // get new access token using httpOnly cookie
router.post('/logout', logout); // revoke refresh token + clear cookie

export default router;
