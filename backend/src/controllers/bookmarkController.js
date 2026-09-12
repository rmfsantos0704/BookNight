const asyncHandler = require('express-async-handler');
const Bookmark = require('../models/Bookmark');
const Workspace = require('../models/Workspace');

// Shared guard: throws unless the current user can access the workspace
const assertWorkspaceAccess = async (workspaceId, userId) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    const err = new Error('Workspace not found');
    err.statusCode = 404;
    throw err;
  }
  if (!workspace.isPublic && !workspace.isAccessibleBy(userId)) {
    const err = new Error('You do not have access to this workspace');
    err.statusCode = 403;
    throw err;
  }
  return workspace;
};

// @route POST /api/bookmarks
// Step 2-4 of the "Save a Link" data flow: create skeleton doc, return 201
// immediately, then push a scrape job onto the Redis queue.
const createBookmark = asyncHandler(async (req, res) => {
  const { url, workspaceId, tags } = req.body;

  if (!url || !workspaceId) {
    res.status(400);
    throw new Error('url and workspaceId are required');
  }

  try {
    new URL(url); // throws if not a valid absolute URL
  } catch {
    res.status(400);
    throw new Error('Please provide a valid URL');
  }

  const workspace = await assertWorkspaceAccess(workspaceId, req.user._id).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const bookmark = await Bookmark.create({
    workspaceId: workspace._id,
    createdBy: req.user._id,
    url,
    tags: Array.isArray(tags) ? tags : [],
    status: 'pending',
  });

  // Return immediately - the client shows this as an optimistic "processing" card.
  res.status(201).json({ success: true, bookmark });

  // Fire-and-forget: import the queue only when a scrape request is actually made.
  // This avoids creating an eager Redis/BullMQ connection during app startup.
  try {
    const { enqueueScrapeJob } = require('../queues/bookmarkQueue');
    enqueueScrapeJob({ bookmarkId: bookmark._id.toString(), url }).catch((err) => {
      console.error(`Failed to enqueue scrape job for ${bookmark._id}:`, err.message);
    });
  } catch (err) {
    console.error(`Failed to load scrape queue for ${bookmark._id}:`, err.message);
  }
});

// @route GET /api/bookmarks?workspaceId=&status=&tag=&page=&limit=
const listBookmarks = asyncHandler(async (req, res) => {
  const { workspaceId, status, tag, page = 1, limit = 30 } = req.query;

  if (!workspaceId) {
    res.status(400);
    throw new Error('workspaceId query parameter is required');
  }

  await assertWorkspaceAccess(workspaceId, req.user._id).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const filter = { workspaceId };
  if (status) filter.status = status;
  if (tag) filter.tags = tag;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));

  const [bookmarks, total] = await Promise.all([
    Bookmark.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Bookmark.countDocuments(filter),
  ]);

  res.json({
    success: true,
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
    bookmarks,
  });
});

// @route GET /api/bookmarks/:id
const getBookmark = asyncHandler(async (req, res) => {
  const bookmark = await Bookmark.findById(req.params.id);
  if (!bookmark) {
    res.status(404);
    throw new Error('Bookmark not found');
  }

  await assertWorkspaceAccess(bookmark.workspaceId, req.user._id).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  res.json({ success: true, bookmark });
});

// @route PATCH /api/bookmarks/:id
// For user edits (tags, title override) - not for scraper writes, which go
// straight to Mongo from the worker process.
const updateBookmark = asyncHandler(async (req, res) => {
  const bookmark = await Bookmark.findById(req.params.id);
  if (!bookmark) {
    res.status(404);
    throw new Error('Bookmark not found');
  }

  await assertWorkspaceAccess(bookmark.workspaceId, req.user._id).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const editableFields = ['title', 'description', 'tags'];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) bookmark[field] = req.body[field];
  });

  await bookmark.save();
  res.json({ success: true, bookmark });
});

// @route DELETE /api/bookmarks/:id
const deleteBookmark = asyncHandler(async (req, res) => {
  const bookmark = await Bookmark.findById(req.params.id);
  if (!bookmark) {
    res.status(404);
    throw new Error('Bookmark not found');
  }

  await assertWorkspaceAccess(bookmark.workspaceId, req.user._id).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  await bookmark.deleteOne();
  res.json({ success: true, message: 'Bookmark deleted' });
});

module.exports = {
  assertWorkspaceAccess,
  createBookmark,
  listBookmarks,
  getBookmark,
  updateBookmark,
  deleteBookmark,
};
