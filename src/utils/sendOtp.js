import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // Gmail App Password (not your login password)
  },
});

/**
 * Generate a 6-digit OTP string
 */
export const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Send OTP email
 * @param {string} to - recipient email
 * @param {string} otp - 6-digit code
 * @param {"signup"|"login"} purpose
 */
export const sendOtpEmail = async (to, otp, purpose) => {
  const subject =
    purpose === 'signup' ? 'Verify your ChatZ account' : 'Your ChatZ login OTP';

  await transporter.sendMail({
    from: `"ChatZ" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:24px;border:1px solid #eee;border-radius:8px">
        <h2 style="color:#2563eb">ChatZ</h2>
        <p>Your OTP for <strong>${purpose}</strong> is:</p>
        <h1 style="letter-spacing:8px;color:#111">${otp}</h1>
        <p style="color:#888;font-size:13px">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      </div>
    `,
  });
};
