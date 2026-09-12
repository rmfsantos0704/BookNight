const nodemailer = require('nodemailer');

const makeTransporter = () => {
  const {
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_SECURE,
    EMAIL_USER,
    EMAIL_PASS,
    EMAIL_FROM,
  } = process.env;

  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT || 587),
    secure: String(EMAIL_SECURE || 'false') === 'true',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
};

const sendPasswordResetEmail = async (user, token) => {
  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  const resetUrl = `${clientOrigin}/reset-password?token=${encodeURIComponent(token)}`;
  const transporter = makeTransporter();

  if (!transporter) {
    console.log(`[Booknight] Password reset for ${user.email}: ${resetUrl}`);
    return;
  }

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'Booknight <no-reply@booknight.local>';

  await transporter.sendMail({
    from,
    to: user.email,
    subject: 'Booknight password reset',
    text: `You requested a password reset for Booknight. Visit this link to continue: ${resetUrl}`,
    html: `<p>You requested a Booknight password reset.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });
};

module.exports = { sendPasswordResetEmail };
