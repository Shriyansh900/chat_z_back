import express from 'express';
import {
  signup,
  verifySignupOtp,
  login,
  verifyLoginOtp,
  resendOtp,
  refresh,
  logout,
} from '../controllers/auth.controller.js';
import { upload } from '../middlewares/upload.middleware.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication — signup, login, OTP verification, token refresh, logout
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username: { type: string, example: shriyansh }
 *               email: { type: string, example: shriyansh@example.com }
 *               password: { type: string, example: password123 }
 *               avatar: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: OTP sent to email — user created only after verification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: OTP sent to your email. Please verify to complete registration. }
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/signup', upload.single('avatar'), signup);

/**
 * @swagger
 * /auth/verify-signup:
 *   post:
 *     summary: Verify signup OTP and activate account
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email: { type: string, example: shriyansh@example.com }
 *               otp: { type: string, example: "482910" }
 *     responses:
 *       200:
 *         description: Email verified — returns accessToken, sets refreshToken cookie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/verify-signup', verifySignupOtp);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login — sends OTP to email
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: shriyansh@example.com }
 *               password: { type: string, example: password123 }
 *     responses:
 *       200:
 *         description: OTP sent to email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: OTP sent to your email. Please verify to complete login. }
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: Email not verified
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/verify-login:
 *   post:
 *     summary: Verify login OTP and complete authentication
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email: { type: string, example: shriyansh@example.com }
 *               otp: { type: string, example: "739201" }
 *     responses:
 *       200:
 *         description: Login successful — returns accessToken, sets refreshToken cookie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/verify-login', verifyLoginOtp);

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: Resend OTP to email
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, purpose]
 *             properties:
 *               email: { type: string, example: shriyansh@example.com }
 *               purpose: { type: string, enum: [signup, login], example: login }
 *     responses:
 *       200:
 *         description: OTP resent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: OTP resent successfully }
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/resend-otp', resendOtp);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Get new access token using refresh cookie
 *     tags: [Auth]
 *     security: []
 *     description: Reads the httpOnly refreshToken cookie. No body needed. Rotates the refresh token.
 *     responses:
 *       200:
 *         description: New access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *       401:
 *         description: No / invalid / revoked refresh token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/refresh', refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout — revoke refresh token and clear cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Logged out successfully }
 */
router.post('/logout', protect, logout);

export default router;
