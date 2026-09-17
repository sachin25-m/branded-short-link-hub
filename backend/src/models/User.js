const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
    },
    familyId: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
      index: true,
    },
    emailVerificationTokenExpires: {
      type: Date,
      default: null,
    },
    passwordResetToken: {
      type: String,
      default: null,
      index: true,
    },
    passwordResetTokenExpires: {
      type: Date,
      default: null,
    },
    refreshTokens: [refreshTokenSchema],
  },
  {
    timestamps: true,
  }
);

/**
 * Password comparison helper method.
 * Compare candidate password with stored password hash.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Remove sensitive fields from JSON output.
 */
userSchema.set('toJSON', {
  transform: function (_doc, ret) {
    delete ret.passwordHash;
    delete ret.emailVerificationToken;
    delete ret.emailVerificationTokenExpires;
    delete ret.passwordResetToken;
    delete ret.passwordResetTokenExpires;
    delete ret.refreshTokens;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
