// Name must match what the Scraping Worker service listens on.
const QUEUE_NAME = 'bookmark-scrape';

/**
 * Enqueues a scrape job for a freshly created bookmark skeleton.
 * The worker service (separate process) picks this up, fetches OG tags,
 * and updates the Bookmark document's status to 'completed' or 'failed'.
 */
const enqueueScrapeJob = async ({ bookmarkId, url }) => {
  const { Queue } = require('bullmq');
  const connection = require('../config/redis');
  const bookmarkQueue = new Queue(QUEUE_NAME, { connection });

  try {
    await bookmarkQueue.add(
      'scrape-bookmark',
      { bookmarkId, url },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      }
    );
  } finally {
    await bookmarkQueue.close();
  }
};

module.exports = { enqueueScrapeJob, QUEUE_NAME };
