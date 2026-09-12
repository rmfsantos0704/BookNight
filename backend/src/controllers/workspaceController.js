const asyncHandler = require('express-async-handler');
const Workspace = require('../models/Workspace');
const User = require('../models/User');

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
  const workspace = await Workspace.findById(req.params.id);

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

// @route DELETE /api/workspaces/:id/members/:memberId
const removeMember = asyncHandler(async (req, res) => {
  const workspace = await Workspace.findById(req.params.id);

  if (!workspace) {
    res.status(404);
    throw new Error('Workspace not found');
  }

  if (workspace.ownerId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the workspace owner can remove members');
  }

  const memberId = req.params.memberId;
  if (!memberId) {
    res.status(400);
    throw new Error('memberId is required');
  }

  if (memberId === workspace.ownerId.toString()) {
    res.status(400);
    throw new Error('The workspace owner cannot be removed from the workspace');
  }

  const existingMember = await User.findById(memberId);
  if (!existingMember) {
    res.status(404);
    throw new Error('No user found with that id');
  }

  const inMembers = workspace.members.some((m) => m.toString() === memberId);
  if (!inMembers) {
    res.status(404);
    throw new Error('Member is not part of this workspace');
  }

  workspace.members = workspace.members.filter((m) => m.toString() !== memberId);
  await workspace.save();
  await User.findByIdAndUpdate(memberId, { $pull: { workspaces: workspace._id } });

  res.json({ success: true, workspace, message: 'Member removed' });
});

module.exports = {
  createWorkspace,
  listWorkspaces,
  getWorkspace,
  addMember,
  removeMember,
};
