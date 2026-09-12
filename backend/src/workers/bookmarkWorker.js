const Bookmark = require('../models/Bookmark');
const { QUEUE_NAME } = require('../queues/bookmarkQueue');

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

const processScrapeJob = async (job) => {
  const { bookmarkId, url } = job.data || {};

  if (!bookmarkId || !url) {
    return { status: 'failed', message: 'bookmarkId and url are required' };
  }

  try {
    const bookmark = await Bookmark.findById(bookmarkId);
    if (!bookmark) {
      return { status: 'failed', message: 'Bookmark not found' };
    }

    const metadata = await extractMetadata(url);

    bookmark.title = metadata.title || bookmark.title || '';
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

    throw error;
  }
};

const startScrapeWorker = async () => {
  const { Worker } = require('bullmq');
  const connection = require('../config/redis');

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => processScrapeJob(job),
    { connection }
  );

  worker.on('completed', (job) => {
    console.log(`Scrape job completed: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Scrape job failed: ${job?.id}`, err.message);
  });

  return worker;
};

module.exports = { startScrapeWorker, processScrapeJob, extractMetadata };
