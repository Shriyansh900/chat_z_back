import nodemailer from 'nodemailer';

let _transporter = null;

const getTransporter = () => {
  if (!_transporter) {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      const err = new Error(
        'MAIL_USER and MAIL_PASS environment variables are required',
      );
      err.isEmailError = true;
      throw err;
    }

    _transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465, // direct SSL — faster than 587 STARTTLS
      secure: true, // use TLS from the start, no upgrade negotiation
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      family: 4, // force IPv4 — Render free tier has no IPv6
      pool: true, // keep TCP connection alive between sends
      maxConnections: 3, // up to 3 parallel connections
      maxMessages: 100, // reuse each connection for up to 100 messages
      rateDelta: 1000, // max sends per second window
      rateLimit: 5, // max 5 emails per second (Gmail limit is ~100/day free)
    });
  }
  return _transporter;
};

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

  try {
    await getTransporter().sendMail({
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
  } catch (err) {
    err.isEmailError = true;
    throw err;
  }
};
