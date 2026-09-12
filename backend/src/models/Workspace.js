const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// A user can access a workspace if they own it or are a member
workspaceSchema.methods.isAccessibleBy = function isAccessibleBy(userId) {
  const uid = userId.toString();
  return (
    this.ownerId.toString() === uid ||
    this.members.some((m) => m.toString() === uid)
  );
};

module.exports = mongoose.model('Workspace', workspaceSchema);
