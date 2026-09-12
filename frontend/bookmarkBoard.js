const normalizeBookmark = (bookmark = {}) => {
  const normalized = {
    id: bookmark._id ? bookmark._id.toString() : bookmark.id || '',
    url: bookmark.url || '',
    title: bookmark.title || '',
    description: bookmark.description || '',
    imageUrl: bookmark.imageUrl || '',
    faviconUrl: bookmark.faviconUrl || '',
    tags: Array.isArray(bookmark.tags) ? bookmark.tags : [],
    status: bookmark.status || 'pending',
    workspaceId: bookmark.workspaceId ? bookmark.workspaceId.toString() : '',
    createdAt: bookmark.createdAt || new Date().toISOString(),
  };

  return normalized;
};

const createBookmarkBoardView = (bookmarks = []) => {
  return bookmarks.map((bookmark) => normalizeBookmark(bookmark));
};

const buildBookmarkSummary = (bookmark = {}) => {
  const normalized = normalizeBookmark(bookmark);
  return {
    id: normalized.id,
    title: normalized.title || normalized.url,
    description: normalized.description || 'No description yet',
    status: normalized.status,
    tags: normalized.tags,
    imageUrl: normalized.imageUrl,
    faviconUrl: normalized.faviconUrl,
  };
};

module.exports = {
  normalizeBookmark,
  createBookmarkBoardView,
  buildBookmarkSummary,
};
