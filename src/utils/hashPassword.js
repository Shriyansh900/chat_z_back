import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash a plain-text password.
 * @param {string} password
 * @returns {Promise<string>} hashed password
 */
export const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

/**
 * Compare a plain-text password against a hash.
 * @param {string} password
 * @param {string} hash
 * @returns {boolean}
 */
export const comparePassword = (password, hash) =>
  bcrypt.compareSync(password, hash);
