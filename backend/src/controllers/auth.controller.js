const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  generateRandomToken,
  getRefreshCookieOptions,
  getClearCookieOptions,
} = require('../utils/tokens');

/**
 * POST /api/auth/signup
 * Registers a new user and generates a simulated email verification token.
 */
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const rawVerificationToken = generateRandomToken();
    const tokenHash = hashToken(rawVerificationToken);
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      emailVerified: false,
      emailVerificationToken: tokenHash,
      emailVerificationTokenExpires: verificationExpiry,
    });

    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const simulatedVerificationUrl = `${frontendUrl}/verify-email?token=${rawVerificationToken}`;

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Please verify your email to log in.',
      data: {
        user,
        simulationDetails: {
          token: rawVerificationToken,
          verificationUrl: simulatedVerificationUrl,
          expiresAt: verificationExpiry,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/verify-email
 * Verifies user's email using the simulation token.
 */
const verifyEmail = async (req, res, next) => {
  try {
    const token = req.query.token || req.body.token;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required.',
      });
    }

    const tokenHash = hashToken(token);

    // Support matching both raw token or hashed token for dev ease
    const user = await User.findOne({
      $or: [
        { emailVerificationToken: tokenHash },
        { emailVerificationToken: token },
      ],
      emailVerificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired email verification token.',
      });
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Authenticates user, enforces email verification, issues 15m access token + 7d httpOnly refresh cookie.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in.',
        emailVerified: false,
      });
    }

    const familyId = crypto.randomUUID();
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user._id, familyId);
    const refreshTokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Clean up expired refresh tokens
    user.refreshTokens = user.refreshTokens.filter(
      (t) => t.expiresAt > new Date()
    );

    user.refreshTokens.push({
      tokenHash: refreshTokenHash,
      familyId,
      expiresAt,
    });

    await user.save();

    res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      accessToken,
      refreshToken,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh
 * Rotates the refresh token (1-time use) and issues a new 15m access token + new 7d refresh token cookie.
 */
const refresh = async (req, res, next) => {
  try {
    const refreshToken =
      req.cookies?.refreshToken ||
      req.body?.refreshToken ||
      req.headers['x-refresh-token'];

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token missing.',
      });
    }

    const secret =
      process.env.JWT_REFRESH_SECRET ||
      'dev_jwt_refresh_secret_super_secure_key_32bytes_min!';

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, secret);
    } catch (err) {
      res.clearCookie('refreshToken', getClearCookieOptions());
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.',
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      res.clearCookie('refreshToken', getClearCookieOptions());
      return res.status(401).json({
        success: false,
        message: 'User associated with refresh token no longer exists.',
      });
    }

    const incomingHash = hashToken(refreshToken);
    const tokenIndex = user.refreshTokens.findIndex(
      (t) => t.tokenHash === incomingHash
    );

    // Reuse detection logic
    if (tokenIndex === -1) {
      // Token was not found in active refresh tokens.
      // If session family matches any known family, invalidate ALL tokens for security!
      user.refreshTokens = user.refreshTokens.filter(
        (t) => t.familyId !== decoded.familyId
      );
      await user.save();
      res.clearCookie('refreshToken', getClearCookieOptions());

      return res.status(401).json({
        success: false,
        message: 'Refresh token reuse detected. Session revoked.',
      });
    }

    // Check token expiration in DB
    const existingSession = user.refreshTokens[tokenIndex];
    if (existingSession.expiresAt < new Date()) {
      user.refreshTokens.splice(tokenIndex, 1);
      await user.save();
      res.clearCookie('refreshToken', getClearCookieOptions());

      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired.',
      });
    }

    // Token is valid: remove old session (rotate)
    user.refreshTokens.splice(tokenIndex, 1);

    // Issue new pair
    const familyId = decoded.familyId || crypto.randomUUID();
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user._id, familyId);
    const newRefreshTokenHash = hashToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Clean up older expired tokens
    user.refreshTokens = user.refreshTokens.filter(
      (t) => t.expiresAt > new Date()
    );

    user.refreshTokens.push({
      tokenHash: newRefreshTokenHash,
      familyId,
      expiresAt: newExpiresAt,
    });

    await user.save();

    res.cookie('refreshToken', newRefreshToken, getRefreshCookieOptions());

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Invalidates the current refresh session and clears the httpOnly cookie.
 */
const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      try {
        const decoded = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET
        );
        const user = await User.findById(decoded.userId);
        if (user) {
          const incomingHash = hashToken(refreshToken);
          user.refreshTokens = user.refreshTokens.filter(
            (t) => t.tokenHash !== incomingHash
          );
          await user.save();
        }
      } catch (e) {
        // Token verification failed or user not found, proceed to clear cookie
      }
    }

    res.clearCookie('refreshToken', getClearCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/forgot-password
 * Generates password reset token simulation without account enumeration.
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    let simulationData = null;

    if (user) {
      const rawResetToken = generateRandomToken();
      const tokenHash = hashToken(rawResetToken);
      const resetExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

      user.passwordResetToken = tokenHash;
      user.passwordResetTokenExpires = resetExpiry;
      await user.save();

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      simulationData = {
        token: rawResetToken,
        resetUrl: `${frontendUrl}/reset-password?token=${rawResetToken}`,
        expiresAt: resetExpiry,
      };
    }

    return res.status(200).json({
      success: true,
      message:
        'If an account with that email exists, password reset instructions have been generated.',
      ...(simulationData && { simulationDetails: simulationData }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 * Resets user password, invalidates reset token, and revokes active refresh sessions.
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required.',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.',
      });
    }

    const tokenHash = hashToken(token);

    const user = await User.findOne({
      $or: [{ passwordResetToken: tokenHash }, { passwordResetToken: token }],
      passwordResetTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.passwordResetToken = null;
    user.passwordResetTokenExpires = null;
    user.refreshTokens = []; // Revoke all active sessions upon password reset!

    await user.save();

    res.clearCookie('refreshToken', getClearCookieOptions());

    return res.status(200).json({
      success: true,
      message:
        'Password reset successful. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Protected route returning current user data.
 */
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

module.exports = {
  signup,
  verifyEmail,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
};
