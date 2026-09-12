const asyncHandler = require('express-async-handler');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const Bookmark = require('../models/Bookmark');

// @route POST /api/workspaces
const createWorkspace = asyncHandler(async (req, res) => {
  const { name, isPublic } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Workspace name is required');
  }

  const workspace = await Workspace.create({
    name,
    isPublic: Boolean(isPublic),
    ownerId: req.user._id,
    members: [req.user._id],
  });

  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { workspaces: workspace._id },
  });

  res.status(201).json({ success: true, workspace });
});

// @route GET /api/workspaces
// Returns every workspace the current user owns or is a member of
const listWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await Workspace.find({
    $or: [{ ownerId: req.user._id }, { members: req.user._id }],
  }).sort({ createdAt: -1 });

  res.json({ success: true, count: workspaces.length, workspaces });
});

// @route GET /api/workspaces/:id
const getWorkspace = asyncHandler(async (req, res) => {
  const workspace = await Workspace.findById(req.params.id)
    .populate('ownerId', 'email displayName')
    .populate('members', 'email displayName');

  if (!workspace) {
    res.status(404);
    throw new Error('Workspace not found');
  }

  if (!workspace.isPublic && !workspace.isAccessibleBy(req.user._id)) {
    res.status(403);
    throw new Error('You do not have access to this workspace');
  }

  res.json({ success: true, workspace });
});

// @route POST /api/workspaces/:id/members
const addMember = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const workspace = await Workspace.findById(req.params.id);

  if (!workspace) {
    res.status(404);
    throw new Error('Workspace not found');
  }

  if (workspace.ownerId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the workspace owner can add members');
  }

  const newMember = await User.findOne({ email: email.toLowerCase() });
  if (!newMember) {
    res.status(404);
    throw new Error('No user found with that email');
  }

  workspace.members.addToSet(newMember._id);
  await workspace.save();
  await User.findByIdAndUpdate(newMember._id, { $addToSet: { workspaces: workspace._id } });

  res.json({ success: true, workspace });
});

// @route PATCH /api/workspaces/:id
// Only the owner can rename or change visibility - members can view/add
// bookmarks but shouldn't be able to rename someone else's workspace.
const updateWorkspace = asyncHandler(async (req, res) => {
  const workspace = await Workspace.findById(req.params.id);

  if (!workspace) {
    res.status(404);
    throw new Error('Workspace not found');
  }

  if (workspace.ownerId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the workspace owner can edit this workspace');
  }

  const { name, isPublic } = req.body;
  if (name !== undefined) {
    if (!name.trim()) {
      res.status(400);
      throw new Error('Workspace name cannot be empty');
    }
    workspace.name = name.trim();
  }
  if (isPublic !== undefined) {
    workspace.isPublic = Boolean(isPublic);
  }

  await workspace.save();
  res.json({ success: true, workspace });
});

// @route DELETE /api/workspaces/:id
// Owner-only. Cascades to delete every bookmark in the workspace and pulls
// the workspace reference off every member's user doc, so nothing is left
// orphaned.
const deleteWorkspace = asyncHandler(async (req, res) => {
  const workspace = await Workspace.findById(req.params.id);

  if (!workspace) {
    res.status(404);
    throw new Error('Workspace not found');
  }

  if (workspace.ownerId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the workspace owner can delete this workspace');
  }

  await Bookmark.deleteMany({ workspaceId: workspace._id });
  await User.updateMany(
    { workspaces: workspace._id },
    { $pull: { workspaces: workspace._id } }
  );
  await workspace.deleteOne();

  res.json({ success: true, message: 'Workspace and its bookmarks were deleted' });
});

// @route DELETE /api/workspaces/:id/members/:memberId
// Owner-only, and the owner can't remove themselves this way (delete the
// whole workspace instead) - keeps every workspace guaranteed to have an
// accountable owner.
const removeMember = asyncHandler(async (req, res) => {
  const { id, memberId } = req.params;
  const workspace = await Workspace.findById(id);

  if (!workspace) {
    res.status(404);
    throw new Error('Workspace not found');
  }

  if (workspace.ownerId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the workspace owner can remove members');
  }

  if (workspace.ownerId.toString() === memberId) {
    res.status(400);
    throw new Error('The owner cannot be removed from the workspace');
  }

  workspace.members = workspace.members.filter((m) => m.toString() !== memberId);
  await workspace.save();
  await User.findByIdAndUpdate(memberId, { $pull: { workspaces: workspace._id } });

  res.json({ success: true, workspace });
});

module.exports = {
  createWorkspace,
  listWorkspaces,
  getWorkspace,
  addMember,
  updateWorkspace,
  deleteWorkspace,
  removeMember,
};