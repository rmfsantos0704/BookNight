require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { startScrapeWorker } = require('./workers/bookmarkWorker');

// Render's free tier only sleeps *Web Services*, but a "Web Service" is
// really just anything that binds to a port and answers HTTP requests.
// This tiny server has no purpose other than making the worker process
// qualify as one - Render's paid "Background Worker" service type is the
// architecturally "correct" fit but isn't available on the free tier.
// An external uptime pinger (e.g. UptimeRobot) hitting this endpoint every
// ~10 minutes is what actually keeps the process from going idle.
const startHealthServer = () => {
  const port = process.env.PORT || 8080;
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'booknight-worker' }));
  });
  server.listen(port, () => {
    console.log(`Worker: health check server listening on port ${port}`);
  });
  return server;
};

const run = async () => {
  await connectDB();

  const healthServer = startHealthServer();
  const worker = await startScrapeWorker();
  console.log('Worker: listening for scrape jobs on the bookmark-scrape queue');

  const shutdown = async () => {
    console.log('Worker: shutting down...');
    await worker.close();
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