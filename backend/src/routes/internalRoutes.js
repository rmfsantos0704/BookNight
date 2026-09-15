const express = require('express');
const asyncHandler = require('express-async-handler');
const { requireCronSecret } = require('../middleware/cronAuth');
const { processPendingBookmarks } = require('../workers/bookmarkWorker');
const { runDigestCheck } = require('../workers/digestWorker');

const router = express.Router();

router.use(requireCronSecret);

// @route POST /api/internal/process-scrapes
// Trigger this every 5-10 minutes from an external scheduler. Processes a
// batch of pending bookmarks and returns immediately after - safe to call
// even if a previous run is mid-flight (bookmarks are claimed atomically).
router.post(
  '/process-scrapes',
  asyncHandler(async (req, res) => {
    const results = await processPendingBookmarks();
    res.json({ success: true, ...results });
  })
);

// @route POST /api/internal/run-digests
// Trigger this once daily from an external scheduler (e.g. 08:00 UTC).
// runDigestCheck() internally figures out which subscriptions are actually
// due, so triggering it more or less often than exactly once a day is safe.
router.post(
  '/run-digests',
  asyncHandler(async (req, res) => {
    const results = await runDigestCheck();
    res.json({ success: true, ...results });
  })
);

module.exports = router;