import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash a plain-text password.
 * @param {string} password
 * @returns {Promise<string>} hashed password
 */
export const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

/**
 * Compare a plain-text password against a hash (async — non-blocking).
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export const comparePassword = (password, hash) =>
  bcrypt.compare(password, hash);
