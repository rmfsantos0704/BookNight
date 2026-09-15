const Bookmark = require('../models/Bookmark');

const parseMeta = (html, field) => {
  const pattern = new RegExp(`<meta[^>]+property=["']og:${field}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i');
  const fallback = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${field}["'][^>]*>`, 'i');

  const match = html.match(pattern) || html.match(fallback);
  return match ? match[1] : '';
};

const extractMetadata = async (url) => {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { title: '', description: '', imageUrl: '', faviconUrl: '' };
    }

    const html = await response.text();
    const title = parseMeta(html, 'title') || html.match(/<title>(.*?)<\/title>/i)?.[1]?.trim() || '';
    const description = parseMeta(html, 'description') || '';
    const imageUrl = parseMeta(html, 'image') || '';
    const faviconUrl = html.match(/<link[^>]+rel=["']icon["'][^>]+href=["']([^"']+)["'][^>]*>/i)?.[1] || '';

    return { title, description, imageUrl, faviconUrl };
  } catch {
    return { title: '', description: '', imageUrl: '', faviconUrl: '' };
  }
};

/**
 * Processes ONE pending bookmark: scrapes it and updates its status.
 * No longer takes a BullMQ job object - just the bookmark doc itself,
 * so it can be called directly from a polling loop instead of a queue.
 */
const processBookmark = async (bookmark) => {
  try {
    const metadata = await extractMetadata(bookmark.url);

    bookmark.title = metadata.title || bookmark.title || '';
    bookmark.description = metadata.description || bookmark.description || '';
    bookmark.imageUrl = metadata.imageUrl || bookmark.imageUrl || '';
    bookmark.faviconUrl = metadata.faviconUrl || bookmark.faviconUrl || '';
    bookmark.status = 'completed';
    bookmark.failureReason = '';

    await bookmark.save();
    return { status: 'completed', bookmarkId: bookmark._id };
  } catch (error) {
    bookmark.status = 'failed';
    bookmark.failureReason = error.message;
    await bookmark.save();
    return { status: 'failed', bookmarkId: bookmark._id, error: error.message };
  }
};

/**
 * Finds every bookmark still marked 'pending' and processes it. Called
 * repeatedly by the polling script instead of listening on a queue.
 */
const processPendingBookmarks = async () => {
  const pending = await Bookmark.find({ status: 'pending' }).limit(50);
  const results = { completed: 0, failed: 0 };

  for (const bookmark of pending) {
    const result = await processBookmark(bookmark);
    results[result.status] += 1;
  }

  return results;
};

module.exports = { extractMetadata, processBookmark, processPendingBookmarks };