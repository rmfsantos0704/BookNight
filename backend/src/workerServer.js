require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { startScrapeWorker } = require('./workers/bookmarkWorker');
const { startDigestWorker } = require('./workers/digestWorker');
const { scheduleDigestCheck } = require('./queues/DigestQueue');

// Render's free tier only sleeps *Web Services*, but a "Web Service" is
// really just anything that binds to a port and answers HTTP requests.
// This tiny server has no purpose other than making the worker process
// qualify as one - Render's paid "Background Worker" service type is the
// architecturally "correct" fit but isn't available on the free tier.
// An external uptime pinger (e.g. UptimeRobot) hitting this endpoint every
// ~10 minutes is what actually keeps the process from going idle.
const startHealthServer = () => {
  // Locally, the API and worker both read the same .env file, which sets
  // PORT=5000 for the API - falling back to that here would collide when
  // running both at once. WORKER_PORT lets them coexist locally. On Render,
  // there's no shared .env (env vars come from Render's dashboard/platform),
  // and Render auto-injects PORT for whatever service is deployed - so this
  // still does the right thing in production even without WORKER_PORT set.
  const port = process.env.WORKER_PORT || process.env.PORT || 8080;
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'booknight-worker' }));
  });
  server.listen(port, '0.0.0.0', () => {
    console.log(`Worker: health check server listening on port ${port}`);
  });
  return server;
};

const run = async () => {
  await connectDB();

  const healthServer = startHealthServer();
  const worker = await startScrapeWorker();
  console.log('Worker: listening for scrape jobs on the bookmark-scrape queue');

  const digestWorker = await startDigestWorker();
  await scheduleDigestCheck();
  console.log('Worker: digest checker scheduled (runs daily at 08:00 UTC)');

  const shutdown = async () => {
    console.log('Worker: shutting down...');
    await worker.close();
    await digestWorker.close();
    healthServer.close();
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