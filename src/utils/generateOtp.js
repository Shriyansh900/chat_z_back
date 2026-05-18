/**
 * Generate a random 4-digit OTP string.
 * @returns {string} e.g. "4829"
 */
export const generateOtp = () =>
  Math.floor(1000 + Math.random() * 9000).toString();
