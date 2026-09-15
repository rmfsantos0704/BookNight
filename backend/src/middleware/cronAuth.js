/**
 * Guards the internal /api/internal/* routes that an external scheduler
 * (cron-job.org) triggers. Not user auth - a single shared secret, since
 * these routes do real work (scraping, sending digests) and must not be
 * triggerable by anyone who finds the URL.
 *
 * Accepts the secret via header (preferred) or query param (in case the
 * scheduler you're using can only set query params, not custom headers).
 */
const requireCronSecret = (req, res, next) => {
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    console.error('CRON_SECRET is not set - refusing all internal route requests');
    return res.status(500).json({ success: false, message: 'Server is not configured for this route' });
  }

  const provided = req.headers['x-cron-secret'] || req.query.secret;

  if (provided !== expected) {
    return res.status(401).json({ success: false, message: 'Invalid or missing cron secret' });
  }

  next();
};

module.exports = { requireCronSecret };