const mongoose = require('mongoose');

const digestSubscriptionSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    channel: {
      type: String,
      enum: ['email', 'telegram', 'discord'],
      required: true,
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly'],
      default: 'daily',
    },
    // Meaning depends on channel: an email address, a Telegram chat ID,
    // or a Discord webhook URL.
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    lastSentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

digestSubscriptionSchema.index({ workspaceId: 1, createdAt: -1 });

module.exports = mongoose.model('DigestSubscription', digestSubscriptionSchema);