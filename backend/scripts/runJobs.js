require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const { processPendingBookmarks } = require('../src/workers/bookmarkWorker');
const { runDigestCheck } = require('../src/workers/digestWorker');

// GitHub Actions' scheduler can't fire more often than every 5 minutes -
// that's a hard platform floor, not something we can configure around at
// the trigger level. To get faster effective responsiveness anyway, this
// script loops internally: it stays alive for ~4.5 minutes, checking every
// ~75 seconds, then exits cleanly before the next scheduled invocation
// fires. Both processPendingBookmarks() and runDigestCheck() are idempotent
// (they only touch documents actually in a 'pending'/'due' state), so it's
// safe if a run ever slightly overlaps the next one.
const LOOP_DURATION_MS = 4.5 * 60 * 1000;
const POLL_INTERVAL_MS = 75 * 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runOnce = async () => {
  const bookmarkResults = await processPendingBookmarks();
  if (bookmarkResults.completed || bookmarkResults.failed) {
    console.log(`Bookmarks: ${bookmarkResults.completed} completed, ${bookmarkResults.failed} failed`);
  }

  const digestResults = await runDigestCheck();
  if (digestResults.sent || digestResults.failed) {
    console.log(
      `Digests: ${digestResults.sent} sent, ${digestResults.skipped} skipped, ${digestResults.failed} failed`
    );
  }
};

const run = async () => {
  await connectDB();
  console.log(`Job runner started, looping for ~${LOOP_DURATION_MS / 60000} minutes`);

  const startedAt = Date.now();
  while (Date.now() - startedAt < LOOP_DURATION_MS) {
    try {
      await runOnce();
    } catch (err) {
      // Log and keep looping - one bad pass shouldn't kill the whole run.
      console.error('Job pass failed:', err.message);
    }
    await sleep(POLL_INTERVAL_MS);
  }

  console.log('Job runner exiting cleanly.');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Job runner crashed:', err.message);
  process.exit(1);
});