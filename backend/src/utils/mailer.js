const nodemailer = require('nodemailer');

const smtpConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;
const getTransporter = () => {
  if (!transporter && smtpConfigured()) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

/**
 * Sends the password reset email. If SMTP isn't configured (e.g. local dev
 * without real credentials yet), logs the reset link to the console instead
 * of failing - so the flow is fully testable before email is wired up.
 */
const sendPasswordResetEmail = async (toEmail, resetUrl) => {
  if (!smtpConfigured()) {
    console.log('\n--- Password reset requested (SMTP not configured) ---');
    console.log(`To: ${toEmail}`);
    console.log(`Reset link: ${resetUrl}`);
    console.log('Set SMTP_HOST/SMTP_USER/SMTP_PASS in .env to send real emails.\n');
    return;
  }

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: toEmail,
    subject: 'Reset your Booknight password',
    text: `Someone requested a password reset for your Booknight account.\n\nReset your password here: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
    html: `<p>Someone requested a password reset for your Booknight account.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`,
  });
};

/**
 * Sends the email verification code used during registration. Same
 * SMTP-or-console-log fallback as sendPasswordResetEmail.
 */
const sendVerificationEmail = async (toEmail, code) => {
  if (!smtpConfigured()) {
    console.log('\n--- Email verification code requested (SMTP not configured) ---');
    console.log(`To: ${toEmail}`);
    console.log(`Verification code: ${code}`);
    console.log('Set SMTP_HOST/SMTP_USER/SMTP_PASS in .env to send real emails.\n');
    return;
  }

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: toEmail,
    subject: 'Verify your Booknight account',
    text: `Your Booknight verification code is: ${code}\n\nThis code expires in 10 minutes. If you didn't create a Booknight account, you can ignore this email.`,
    html: `<p>Your Booknight verification code is:</p><p style="font-size:28px;font-weight:600;letter-spacing:4px;">${code}</p><p>This code expires in 10 minutes. If you didn't create a Booknight account, you can ignore this email.</p>`,
  });
};

module.exports = { sendPasswordResetEmail, sendVerificationEmail };