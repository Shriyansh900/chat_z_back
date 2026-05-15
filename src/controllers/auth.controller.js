import User from '../models/User.model.js';
import Otp from '../models/Otp.model.js';
import RefreshToken from '../models/RefreshToken.model.js';
import { hashPassword, comparePassword } from '../utils/hashPassword.js';
import {
  generateAccessToken,
  generateRefreshToken,
} from '../utils/generateToken.js';
import { generateOtp, sendOtpEmail } from '../utils/sendOtp.js';
import { uploadToCloudinary } from '../utils/uploadToCloudinary.js';
import jwt from 'jsonwebtoken';

const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

const sanitizeUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  avatar: user.avatar,
  bio: user.bio,
  isVerified: user.isVerified,
});

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: REFRESH_TOKEN_EXPIRY_MS,
  });
};

// ─── SIGNUP ──────────────────────────────────────────────────────────────────
// POST /api/auth/signup
// Step 1: validate → upload avatar → send OTP → store pending data in OTP record
// User is NOT created yet — only created after OTP is verified
export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check duplicates before doing anything else
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashed = await hashPassword(password);

    // Upload avatar to Cloudinary if provided
    const pendingUser = { username, hashedPassword: hashed };
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'chatz/avatars',
        transformation: [
          { width: 300, height: 300, crop: 'fill', gravity: 'face' },
        ],
      });
      pendingUser.avatar = result.secure_url;
      pendingUser.avatarPublicId = result.public_id;
    }

    // Send OTP FIRST — only save to DB if it succeeds
    // This way a failed email never leaves a stale OTP or orphaned data
    await sendOtpEmail(email, otp, 'signup');

    await Otp.deleteMany({ email, purpose: 'signup' });
    await Otp.create({ email, otp, purpose: 'signup', pendingUser });

    res.status(201).json({
      message:
        'OTP sent to your email. Please verify to complete registration.',
    });
  } catch (error) {
    console.error(error);
    if (
      error.message?.includes('MAIL_USER') ||
      error.code === 'EAUTH' ||
      error.responseCode >= 500
    ) {
      return res
        .status(503)
        .json({ message: 'Failed to send OTP email. Please try again.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── VERIFY SIGNUP OTP ───────────────────────────────────────────────────────
// POST /api/auth/verify-signup
// Step 2: verify OTP → create user → return tokens
export const verifySignupOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const record = await Otp.findOne({ email, otp, purpose: 'signup' });
    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Check if user was already created (edge case: double submit)
    const alreadyExists = await User.findOne({ email });
    if (alreadyExists) {
      await Otp.deleteMany({ email, purpose: 'signup' });
      return res
        .status(409)
        .json({ message: 'User already exists. Please login.' });
    }

    // Create user now using the pending data stored in the OTP record
    const { username, hashedPassword, avatar, avatarPublicId } =
      record.pendingUser;

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      avatar: avatar || '',
      avatarPublicId: avatarPublicId || null,
      isVerified: true,
    });

    await Otp.deleteMany({ email, purpose: 'signup' });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
    });

    setRefreshCookie(res, refreshToken);
    res.status(201).json({ accessToken, user: sanitizeUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── RESEND OTP ──────────────────────────────────────────────────────────────
// POST /api/auth/resend-otp
export const resendOtp = async (req, res) => {
  try {
    const { email, purpose } = req.body;

    if (!email || !purpose) {
      return res
        .status(400)
        .json({ message: 'email and purpose are required' });
    }

    if (!['signup', 'login'].includes(purpose)) {
      return res
        .status(400)
        .json({ message: "purpose must be 'signup' or 'login'" });
    }

    if (purpose === 'login') {
      // For login resend, user must exist
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });
    } else {
      // For signup resend, pending OTP record must exist (user not created yet)
      const pending = await Otp.findOne({ email, purpose: 'signup' });
      if (!pending) {
        return res.status(404).json({
          message:
            'No pending signup found for this email. Please signup again.',
        });
      }
    }

    const otp = generateOtp();

    // Read existing record BEFORE deleting (to preserve pendingUser for signup)
    const existingRecord = await Otp.findOne({ email, purpose });

    // Send email first — only update DB if it succeeds
    await sendOtpEmail(email, otp, purpose);

    await Otp.deleteMany({ email, purpose });
    await Otp.create({
      email,
      otp,
      purpose,
      pendingUser:
        purpose === 'signup' ? existingRecord?.pendingUser : undefined,
    });

    res.json({ message: 'OTP resent successfully' });
  } catch (error) {
    console.error(error);
    if (
      error.message?.includes('MAIL_USER') ||
      error.code === 'EAUTH' ||
      error.responseCode >= 500
    ) {
      return res
        .status(503)
        .json({ message: 'Failed to send OTP email. Please try again.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Step 1: verify credentials → send OTP
// OTP is only saved AFTER email is sent successfully — safe to retry
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = comparePassword(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

    const otp = generateOtp();

    // Send email FIRST — only save to DB if it succeeds
    // This way a failed email never leaves a stale OTP in the DB
    await sendOtpEmail(email, otp, 'login');

    await Otp.deleteMany({ email, purpose: 'login' });
    await Otp.create({ email, otp, purpose: 'login' });

    res.json({
      message: 'OTP sent to your email. Please verify to complete login.',
    });
  } catch (error) {
    console.error(error);
    // Distinguish email failure from other errors
    if (
      error.message?.includes('MAIL_USER') ||
      error.code === 'EAUTH' ||
      error.responseCode >= 500
    ) {
      return res
        .status(503)
        .json({ message: 'Failed to send OTP email. Please try again.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── VERIFY LOGIN OTP ────────────────────────────────────────────────────────
// POST /api/auth/verify-login
export const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const record = await Otp.findOne({ email, otp, purpose: 'login' });
    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    await Otp.deleteMany({ email, purpose: 'login' });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await RefreshToken.deleteMany({ user: user._id });
    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
    });

    setRefreshCookie(res, refreshToken);
    res.json({ accessToken, user: sanitizeUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── REFRESH TOKEN ───────────────────────────────────────────────────────────
// POST /api/auth/refresh
export const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res
        .status(401)
        .json({ message: 'Invalid or expired refresh token' });
    }

    const stored = await RefreshToken.findOne({ token });
    if (!stored)
      return res.status(401).json({ message: 'Refresh token revoked' });

    const newAccessToken = generateAccessToken(decoded.id);
    const newRefreshToken = generateRefreshToken(decoded.id);

    await RefreshToken.deleteOne({ token });
    await RefreshToken.create({
      user: decoded.id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
    });

    setRefreshCookie(res, newRefreshToken);
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
// POST /api/auth/logout
export const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) await RefreshToken.deleteOne({ token });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
