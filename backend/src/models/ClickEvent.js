const mongoose = require('mongoose');

const clickEventSchema = new mongoose.Schema(
  {
    link: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Link',
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    referrer: {
      type: String,
      default: 'Direct',
      trim: true,
    },
    deviceType: {
      type: String,
      enum: ['Mobile', 'Desktop', 'Tablet'],
      required: true,
    },
    ipHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for querying click telemetry by link and date range
clickEventSchema.index({ link: 1, timestamp: -1 });

clickEventSchema.set('toJSON', {
  transform: function (_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const ClickEvent = mongoose.model('ClickEvent', clickEventSchema);

module.exports = ClickEvent;
