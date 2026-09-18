const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { sendPasswordResetEmail, sendVerificationEmail } = require('../utils/mailer');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const hashToken = (rawToken) => crypto.createHash('sha256').update(rawToken).digest('hex');
const generateVerificationCode = () => crypto.randomInt(100000, 1000000).toString();

const issueVerificationCode = async (user) => {
  const code = generateVerificationCode();
  user.verificationCodeHash = hashToken(code);
  user.verificationCodeExpires = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);
  await user.save();

  try {
    await sendVerificationEmail(user.email, code);
  } catch (err) {
    console.error(`Failed to send verification email to ${user.email}:`, err.message);
  }
};

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// @route POST /api/auth/register
// Creates the account as unverified and emails a 6-digit code - no token is
// issued yet. The client must call /verify-email before the account is
// usable.
const register = asyncHandler(async (req, res) => {
  const { email, password, displayName } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409);
    throw new Error('An account with this email already exists');
  }

  const user = new User({ email, displayName });
  await user.setPassword(password);
  await issueVerificationCode(user);

  res.status(201).json({
    success: true,
    requiresVerification: true,
    email: user.email,
    message: 'We sent a 6-digit code to your email. Enter it to finish creating your account.',
  });
});

// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  // passwordHash has select:false, so explicitly request it here
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.emailVerified) {
    res.status(403);
    const err = new Error('Please verify your email before signing in.');
    err.requiresVerification = true;
    err.email = user.email;
    throw err;
  }

  res.json({
    success: true,
    token: signToken(user._id),
    user: user.toJSON(),
  });
});

// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toJSON() });
});

// @route POST /api/auth/forgot-password
// Always responds with a generic success message, whether or not the email
// exists - this prevents the endpoint being used to check which emails are
// registered.
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const genericResponse = {
    success: true,
    message: 'If an account with that email exists, a reset link has been sent.',
  };

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.json(genericResponse);
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordTokenHash = hashToken(rawToken);
  user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await user.save();

  // CLIENT_ORIGIN may be a comma-separated list (for CORS, multiple allowed
  // origins) - the reset link needs exactly one URL, so use the first
  // (primary/canonical) origin in the list, not the raw multi-value string.
  const primaryOrigin = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',')[0].trim();
  const resetUrl = `${primaryOrigin}/reset-password/${rawToken}`;

  try {
    await sendPasswordResetEmail(user.email, resetUrl);
  } catch (err) {
    // Don't leak email-sending failures to the client - log server-side
    // and still return the generic response.
    console.error(`Failed to send reset email to ${user.email}:`, err.message);
  }

  res.json(genericResponse);
});

// @route POST /api/auth/reset-password/:token
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters');
  }

  const tokenHash = hashToken(token);
  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordTokenHash +resetPasswordExpires');

  if (!user) {
    res.status(400);
    throw new Error('This reset link is invalid or has expired');
  }

  await user.setPassword(password);
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ success: true, message: 'Password updated. You can now sign in.' });
});

// @route POST /api/auth/verify-email
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    res.status(400);
    throw new Error('Email and code are required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+verificationCodeHash +verificationCodeExpires'
  );

  if (
    !user ||
    !user.verificationCodeHash ||
    user.verificationCodeHash !== hashToken(code) ||
    !user.verificationCodeExpires ||
    user.verificationCodeExpires < new Date()
  ) {
    res.status(400);
    throw new Error('That code is invalid or has expired.');
  }

  user.emailVerified = true;
  user.verificationCodeHash = undefined;
  user.verificationCodeExpires = undefined;
  await user.save();

  res.json({
    success: true,
    token: signToken(user._id),
    user: user.toJSON(),
  });
});

// @route POST /api/auth/resend-verification
// Always returns a generic response, whether or not the email exists or is
// already verified - same anti-enumeration pattern as forgot-password.
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const genericResponse = {
    success: true,
    message: 'If that account needs verification, a new code has been sent.',
  };

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || user.emailVerified) {
    return res.json(genericResponse);
  }

  await issueVerificationCode(user);
  res.json(genericResponse);
});

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
};