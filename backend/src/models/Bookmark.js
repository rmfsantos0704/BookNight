const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
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
    url: {
      type: String,
      required: [true, 'URL is required'],
      trim: true,
    },
    // Precomputed by normalizeUrl() at creation time - lets duplicate checks
    // use an indexed exact-match query instead of comparing raw URLs.
    normalizedUrl: {
      type: String,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    faviconUrl: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    failureReason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Compound index: most list views are "all bookmarks in a workspace, newest first"
bookmarkSchema.index({ workspaceId: 1, createdAt: -1 });
// Compound index for the duplicate-detection lookup (workspace + normalized URL)
bookmarkSchema.index({ workspaceId: 1, normalizedUrl: 1 });

module.exports = mongoose.model('Bookmark', bookmarkSchema);