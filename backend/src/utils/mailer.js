const nodemailer = require('nodemailer');

const smtpConfigured = () =>
  Boolean(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);

let transporter = null;
const getTransporter = () => {
  if (!transporter && smtpConfigured()) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
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
    console.log('Set EMAIL_HOST/EMAIL_USER/EMAIL_PASS in .env to send real emails.\n');
    return;
  }

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
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
    console.log('Set EMAIL_HOST/EMAIL_USER/EMAIL_PASS in .env to send real emails.\n');
    return;
  }

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Verify your Booknight account',
    text: `Your Booknight verification code is: ${code}\n\nThis code expires in 10 minutes. If you didn't create a Booknight account, you can ignore this email.`,
    html: `<p>Your Booknight verification code is:</p><p style="font-size:28px;font-weight:600;letter-spacing:4px;">${code}</p><p>This code expires in 10 minutes. If you didn't create a Booknight account, you can ignore this email.</p>`,
  });
};

/**
 * Sends a digest email listing newly-saved bookmarks in a workspace.
 * `bookmarks` is an array of { title, url, description }. Throws (rather
 * than silently console-logging) if SMTP isn't configured, since digests
 * are a scheduled background job with no user watching a console.
 */
const sendDigestEmail = async (toEmail, workspaceName, bookmarks) => {
  if (!smtpConfigured()) {
    throw new Error('Email is not configured on the server (EMAIL_HOST/EMAIL_USER/EMAIL_PASS)');
  }

  const itemsText = bookmarks
    .map((b) => `- ${b.title || b.url}\n  ${b.url}`)
    .join('\n\n');

  const itemsHtml = bookmarks
    .map(
      (b) =>
        `<li style="margin-bottom:12px;"><a href="${b.url}" style="font-weight:600;">${b.title || b.url}</a>${
          b.description ? `<br><span style="color:#666;font-size:14px;">${b.description}</span>` : ''
        }</li>`
    )
    .join('');

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: toEmail,
    subject: `Booknight digest: ${bookmarks.length} new link${bookmarks.length === 1 ? '' : 's'} in ${workspaceName}`,
    text: `New links saved in "${workspaceName}":\n\n${itemsText}`,
    html: `<p>New links saved in <strong>${workspaceName}</strong>:</p><ul style="padding-left:20px;">${itemsHtml}</ul>`,
  });
};

module.exports = { sendPasswordResetEmail, sendVerificationEmail, sendDigestEmail };