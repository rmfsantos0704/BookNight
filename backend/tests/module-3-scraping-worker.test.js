const test = require('node:test');
const assert = require('node:assert/strict');
const { startScrapeWorker, processScrapeJob } = require('../src/workers/bookmarkWorker');

test('scraping worker exposes queue consumer and metadata enrichment contract', () => {
  assert.equal(typeof startScrapeWorker, 'function');
  assert.equal(typeof processScrapeJob, 'function');
});
