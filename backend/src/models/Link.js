const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Link owner is required'],
      index: true,
    },
    destinationUrl: {
      type: String,
      required: [true, 'Destination URL is required'],
      trim: true,
    },
    shortCode: {
      type: String,
      required: [true, 'Short code is required'],
      unique: true,
      trim: true,
      index: true,
    },
    isCustomSlug: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user link lookups, sorting, and pagination
linkSchema.index({ owner: 1, createdAt: -1 });

linkSchema.set('toJSON', {
  transform: function (_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const Link = mongoose.model('Link', linkSchema);

module.exports = Link;
