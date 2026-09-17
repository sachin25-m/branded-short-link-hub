const mongoose = require('mongoose');

const socialLinkSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ['github', 'linkedin', 'instagram', 'x', 'youtube', 'facebook'],
      required: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const bioProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
      maxLength: [50, 'Display name cannot exceed 50 characters'],
    },
    bio: {
      type: String,
      default: '',
      trim: true,
      maxLength: [300, 'Bio cannot exceed 300 characters'],
    },
    avatarUrl: {
      type: String,
      default: '',
      trim: true,
    },
    socialLinks: [socialLinkSchema],
    theme: {
      type: String,
      enum: ['minimal-light', 'dark-slate', 'gradient'],
      default: 'minimal-light',
    },
  },
  {
    timestamps: true,
  }
);

bioProfileSchema.set('toJSON', {
  transform: function (_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const BioProfile = mongoose.model('BioProfile', bioProfileSchema);

module.exports = BioProfile;
