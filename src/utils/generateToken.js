import jwt from 'jsonwebtoken';

/**
 * Generate a short-lived access token (15 minutes).
 * @param {string} userId
 * @returns {string}
 */
export const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

/**
 * Generate a long-lived refresh token (7 days).
 * @param {string} userId
 * @returns {string}
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
};
