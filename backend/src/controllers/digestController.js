const asyncHandler = require('express-async-handler');
const Workspace = require('../models/Workspace');
const DigestSubscription = require('../models/Digestsubscription');

const VALID_CHANNELS = ['email', 'telegram', 'discord'];
const VALID_FREQUENCIES = ['daily', 'weekly'];

// Only the workspace owner can manage digests - matches the pattern used
// for rename/delete/member-management in workspaceController.
const assertIsOwner = async (workspaceId, userId) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    const err = new Error('Workspace not found');
    err.statusCode = 404;
    throw err;
  }
  if (workspace.ownerId.toString() !== userId.toString()) {
    const err = new Error('Only the workspace owner can manage digests');
    err.statusCode = 403;
    throw err;
  }
  return workspace;
};

// @route POST /api/workspaces/:id/digests
const createDigest = asyncHandler(async (req, res) => {
  const { channel, frequency, destination } = req.body;

  if (!VALID_CHANNELS.includes(channel)) {
    res.status(400);
    throw new Error(`channel must be one of: ${VALID_CHANNELS.join(', ')}`);
  }
  if (frequency && !VALID_FREQUENCIES.includes(frequency)) {
    res.status(400);
    throw new Error(`frequency must be one of: ${VALID_FREQUENCIES.join(', ')}`);
  }
  if (!destination || !destination.trim()) {
    res.status(400);
    throw new Error('destination is required');
  }
  if (channel === 'email' && !/^\S+@\S+\.\S+$/.test(destination)) {
    res.status(400);
    throw new Error('destination must be a valid email address for the email channel');
  }

  await assertIsOwner(req.params.id, req.user._id).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const digest = await DigestSubscription.create({
    workspaceId: req.params.id,
    createdBy: req.user._id,
    channel,
    frequency: frequency || 'daily',
    destination: destination.trim(),
  });

  res.status(201).json({ success: true, digest });
});

// @route GET /api/workspaces/:id/digests
const listDigests = asyncHandler(async (req, res) => {
  await assertIsOwner(req.params.id, req.user._id).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const digests = await DigestSubscription.find({ workspaceId: req.params.id }).sort({ createdAt: -1 });
  res.json({ success: true, digests });
});

// @route PATCH /api/workspaces/:id/digests/:digestId
const updateDigest = asyncHandler(async (req, res) => {
  await assertIsOwner(req.params.id, req.user._id).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const digest = await DigestSubscription.findOne({
    _id: req.params.digestId,
    workspaceId: req.params.id,
  });
  if (!digest) {
    res.status(404);
    throw new Error('Digest subscription not found');
  }

  const { frequency, destination, enabled } = req.body;
  if (frequency !== undefined) {
    if (!VALID_FREQUENCIES.includes(frequency)) {
      res.status(400);
      throw new Error(`frequency must be one of: ${VALID_FREQUENCIES.join(', ')}`);
    }
    digest.frequency = frequency;
  }
  if (destination !== undefined) digest.destination = destination.trim();
  if (enabled !== undefined) digest.enabled = Boolean(enabled);

  await digest.save();
  res.json({ success: true, digest });
});

// @route DELETE /api/workspaces/:id/digests/:digestId
const deleteDigest = asyncHandler(async (req, res) => {
  await assertIsOwner(req.params.id, req.user._id).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const digest = await DigestSubscription.findOneAndDelete({
    _id: req.params.digestId,
    workspaceId: req.params.id,
  });
  if (!digest) {
    res.status(404);
    throw new Error('Digest subscription not found');
  }

  res.json({ success: true, message: 'Digest subscription removed' });
});

module.exports = { createDigest, listDigests, updateDigest, deleteDigest };