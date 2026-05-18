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
 *   description: Signup, login, OTP verification, token refresh, logout
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     description: >
 *       Validates fields, uploads avatar to Cloudinary, generates a 4-digit OTP.
 *       **User is NOT created yet** — call `/auth/verify-signup` with the OTP to complete registration.
 *       Show the returned OTP to the user via a toast notification.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username: { type: string, example: shriyansh }
 *               email:    { type: string, example: shriyansh@example.com }
 *               password: { type: string, example: password123 }
 *               avatar:   { type: string, format: binary, description: Optional profile picture }
 *     responses:
 *       201:
 *         description: OTP generated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OtpResponse' }
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: Username or email already taken
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/signup', upload.single('avatar'), signup);

/**
 * @swagger
 * /auth/verify-signup:
 *   post:
 *     summary: Verify signup OTP — creates user and returns tokens
 *     tags: [Auth]
 *     security: []
 *     description: >
 *       Verifies the 4-digit OTP from `/auth/signup`.
 *       On success, creates the user and returns an access token.
 *       Also sets an httpOnly `refreshToken` cookie (7 days).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email: { type: string, example: shriyansh@example.com }
 *               otp:   { type: string, example: "4829" }
 *     responses:
 *       201:
 *         description: User created — accessToken returned, refreshToken cookie set
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: User already exists (double submit)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/verify-signup', verifySignupOtp);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login — verifies credentials and returns a 4-digit OTP
 *     tags: [Auth]
 *     security: []
 *     description: >
 *       Checks email and password. On success, generates a 4-digit OTP.
 *       Show the OTP to the user via a toast, then call `/auth/verify-login`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, example: shriyansh@example.com }
 *               password: { type: string, example: password123 }
 *     responses:
 *       200:
 *         description: OTP generated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OtpResponse' }
 *       400:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/verify-login:
 *   post:
 *     summary: Verify login OTP — returns tokens
 *     tags: [Auth]
 *     security: []
 *     description: >
 *       Verifies the 4-digit OTP from `/auth/login`.
 *       On success, returns an access token and sets an httpOnly `refreshToken` cookie.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email: { type: string, example: shriyansh@example.com }
 *               otp:   { type: string, example: "7392" }
 *     responses:
 *       200:
 *         description: Login successful — accessToken returned, refreshToken cookie set
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
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
 *     summary: Generate a new OTP (replaces the previous one)
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
 *               email:   { type: string, example: shriyansh@example.com }
 *               purpose: { type: string, enum: [signup, login], example: login }
 *     responses:
 *       200:
 *         description: New OTP generated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/OtpResponse' }
 *       404:
 *         description: No pending session found for this email
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/resend-otp', resendOtp);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Get a new access token using the refresh cookie
 *     tags: [Auth]
 *     security: []
 *     description: >
 *       Reads the httpOnly `refreshToken` cookie set during login/signup.
 *       No request body needed. Rotates the refresh token on every call.
 *     responses:
 *       200:
 *         description: New access token issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *       401:
 *         description: No refresh token / invalid / revoked
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
 *     description: Deletes the refresh token from DB and clears the httpOnly cookie.
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Logged out successfully }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post('/logout', protect, logout);

export default router;
