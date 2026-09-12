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

// A user can access a workspace if they own it or are a member.
// Handles both raw ObjectId refs and populated User documents, since
// getWorkspace populates ownerId/members for display purposes.
const idOf = (value) => (value && value._id ? value._id.toString() : value.toString());

workspaceSchema.methods.isAccessibleBy = function isAccessibleBy(userId) {
  const uid = userId.toString();
  return (
    idOf(this.ownerId) === uid ||
    this.members.some((m) => idOf(m) === uid)
  );
};

module.exports = mongoose.model('Workspace', workspaceSchema);