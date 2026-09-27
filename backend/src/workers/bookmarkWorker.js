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

const processBookmark = async (bookmark) => {
  const { _id: bookmarkId, url } = bookmark;

  try {
    const metadata = await extractMetadata(url);

    // If a title was already set when this bookmark was created (e.g. the
    // extension's "add a title" field, or an edit), keep it - only fall
    // back to the scraped title when the user didn't provide one. Every
    // other field always takes the freshest scraped value.
    bookmark.title = bookmark.title || metadata.title || '';
    bookmark.description = metadata.description || bookmark.description || '';
    bookmark.imageUrl = metadata.imageUrl || bookmark.imageUrl || '';
    bookmark.faviconUrl = metadata.faviconUrl || bookmark.faviconUrl || '';
    bookmark.status = 'completed';
    bookmark.failureReason = '';

    await bookmark.save();
    return { status: 'completed', bookmarkId };
  } catch (error) {
    await Bookmark.findByIdAndUpdate(bookmarkId, {
      status: 'failed',
      failureReason: error.message,
    });
    return { status: 'failed', bookmarkId };
  }
};

const STALE_PROCESSING_MS = 3 * 60 * 1000; // 3 minutes

/**
 * Finds bookmarks still marked 'pending' and processes them. Called
 * repeatedly by the polling route/script instead of listening on a queue.
 *
 * Each bookmark is atomically "claimed" (-> processing) via findOneAndUpdate
 * before scraping, so two overlapping runs can't both grab and scrape the
 * same bookmark. Also reclaims bookmarks stuck in 'processing' for too long
 * (e.g. a serverless invocation that got killed mid-scrape by a platform
 * timeout) rather than leaving them stranded forever.
 */
const processPendingBookmarks = async (limit = 20) => {
  const results = { completed: 0, failed: 0, claimed: 0 };
  const staleCutoff = new Date(Date.now() - STALE_PROCESSING_MS);

  const candidates = await Bookmark.find({
    $or: [{ status: 'pending' }, { status: 'processing', updatedAt: { $lt: staleCutoff } }],
  })
    .select('_id')
    .limit(limit);

  for (const { _id } of candidates) {
    const claimed = await Bookmark.findOneAndUpdate(
      { _id, $or: [{ status: 'pending' }, { status: 'processing', updatedAt: { $lt: staleCutoff } }] },
      { status: 'processing' },
      { new: true }
    );
    if (!claimed) continue; // another run already claimed it

    results.claimed += 1;
    const result = await processBookmark(claimed);
    results[result.status] += 1;
  }

  return results;
};

module.exports = { processPendingBookmarks, processBookmark, extractMetadata };