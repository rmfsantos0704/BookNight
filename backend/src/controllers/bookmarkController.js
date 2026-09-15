const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Bookmark = require('../models/Bookmark');
const Workspace = require('../models/Workspace');
const { normalizeUrl } = require('../utils/NormalizeUrl');

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
// Creates the skeleton doc as 'pending' and returns immediately. A scheduled
// GitHub Action (scripts/runJobs.js) picks up pending bookmarks and scrapes
// them - no queue push happens here anymore.
const createBookmark = asyncHandler(async (req, res) => {
  const { url, workspaceId, tags, allowDuplicate } = req.body;

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

  const normalized = normalizeUrl(url);

  // Smart duplicate detection: warn (don't block) if this URL - or an
  // equivalent one differing only by tracking params/www/trailing slash -
  // is already saved in this workspace. The client can resend with
  // allowDuplicate:true to save it anyway.
  if (normalized && !allowDuplicate) {
    const existing = await Bookmark.findOne({ workspaceId, normalizedUrl: normalized });
    if (existing) {
      res.status(409);
      const err = new Error('This link is already saved in this workspace.');
      err.duplicate = true;
      err.existingBookmark = existing;
      throw err;
    }
  }

  const bookmark = await Bookmark.create({
    workspaceId: workspace._id,
    createdBy: req.user._id,
    url,
    normalizedUrl: normalized,
    tags: Array.isArray(tags) ? tags : [],
    status: 'pending',
  });

  // Return immediately - the client shows this as an optimistic "processing" card.
  // A scheduled GitHub Action will pick this up within a couple minutes.
  res.status(201).json({ success: true, bookmark });
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

// @route GET /api/bookmarks/search?workspaceId=&q=
// Fuzzy, typo-tolerant, autocomplete-aware search across title/tags/description,
// scoped to one workspace, using the Atlas Search index created by
// scripts/createSearchIndex.js. Tags and title are boosted above description,
// matching the architecture's "custom scoring" requirement.
const searchBookmarks = asyncHandler(async (req, res) => {
  const { workspaceId, q } = req.query;

  if (!workspaceId || !q || !q.trim()) {
    res.status(400);
    throw new Error('workspaceId and q are required');
  }

  await assertWorkspaceAccess(workspaceId, req.user._id).catch((err) => {
    res.status(err.statusCode || 500);
    throw err;
  });

  const query = q.trim();

  const results = await Bookmark.aggregate([
    {
      $search: {
        index: 'bookmark_search',
        compound: {
          filter: [
            {
              equals: {
                path: 'workspaceId',
                value: new mongoose.Types.ObjectId(workspaceId),
              },
            },
          ],
          should: [
            {
              autocomplete: {
                query,
                path: 'title',
                score: { boost: { value: 3 } },
              },
            },
            {
              text: {
                query,
                path: 'title',
                fuzzy: { maxEdits: 1 },
                score: { boost: { value: 3 } },
              },
            },
            {
              text: {
                query,
                path: 'tags',
                fuzzy: { maxEdits: 1 },
                score: { boost: { value: 2 } },
              },
            },
            {
              text: {
                query,
                path: 'description',
                fuzzy: { maxEdits: 1 },
                score: { boost: { value: 1 } },
              },
            },
          ],
          minimumShouldMatch: 1,
        },
      },
    },
    { $limit: 30 },
    { $addFields: { score: { $meta: 'searchScore' } } },
  ]).catch((err) => {
    // Most common cause: the index hasn't finished building yet, or
    // doesn't exist - surface a clear message instead of a raw Mongo error.
    res.status(503);
    throw new Error(
      `Search failed - the Atlas Search index may still be building or missing. (${err.message})`
    );
  });

  res.json({ success: true, count: results.length, bookmarks: results });
});

module.exports = {
  createBookmark,
  listBookmarks,
  getBookmark,
  updateBookmark,
  deleteBookmark,
  searchBookmarks,
};