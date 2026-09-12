require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { startScrapeWorker } = require('./workers/bookmarkWorker');

const run = async () => {
  await connectDB();

  const worker = await startScrapeWorker();
  console.log('Worker: listening for scrape jobs on the bookmark-scrape queue');

  const shutdown = async () => {
    console.log('Worker: shutting down...');
    await worker.close();
    await mongoose.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

run().catch((err) => {
  console.error('Worker failed to start:', err.message);
  process.exit(1);
});