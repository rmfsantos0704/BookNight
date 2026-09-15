const DigestSubscription = require('../models/Digestsubscription');
const Bookmark = require('../models/Bookmark');
const Workspace = require('../models/Workspace');
const { sendDigestEmail } = require('../utils/mailer');
const { sendTelegramDigest, sendDiscordDigest } = require('../utils/DigestSender');

const DAY_MS = 24 * 60 * 60 * 1000;

// A subscription is "due" if it's never fired before, or enough time has
// passed for its frequency - daily gives a little slack (20h) so a job that
// runs slightly early/late each day doesn't skip a day; weekly uses ~6.5
// days for the same reason.
const isDue = (subscription) => {
  if (!subscription.lastSentAt) return true;
  const elapsed = Date.now() - subscription.lastSentAt.getTime();
  return subscription.frequency === 'weekly' ? elapsed >= 6.5 * DAY_MS : elapsed >= 0.83 * DAY_MS;
};

const formatDigestText = (workspaceName, bookmarks) => {
  const lines = bookmarks.map((b) => `• ${b.title || b.url}\n  ${b.url}`);
  return `*${bookmarks.length} new link${bookmarks.length === 1 ? '' : 's'} in ${workspaceName}*\n\n${lines.join('\n\n')}`;
};

const sendForSubscription = async (subscription, workspace, bookmarks) => {
  const text = formatDigestText(workspace.name, bookmarks);

  if (subscription.channel === 'email') {
    await sendDigestEmail(subscription.destination, workspace.name, bookmarks);
  } else if (subscription.channel === 'telegram') {
    await sendTelegramDigest(subscription.destination, text);
  } else if (subscription.channel === 'discord') {
    await sendDiscordDigest(subscription.destination, text);
  } else {
    throw new Error(`Unknown digest channel: ${subscription.channel}`);
  }
};

/**
 * Runs one full digest-check pass: for every enabled subscription that's
 * due, compiles bookmarks added since it last fired (or since it was
 * created, on first run) and sends them. Subscriptions with zero new
 * bookmarks are skipped entirely - no empty digests. Each subscription is
 * handled independently so one failure (e.g. a bad webhook URL) doesn't
 * stop the others from sending.
 */
const runDigestCheck = async () => {
  const subscriptions = await DigestSubscription.find({ enabled: true });
  const results = { sent: 0, skipped: 0, failed: 0 };

  for (const subscription of subscriptions) {
    if (!isDue(subscription)) {
      results.skipped += 1;
      continue;
    }

    try {
      const workspace = await Workspace.findById(subscription.workspaceId);
      if (!workspace) {
        results.skipped += 1;
        continue;
      }

      const since = subscription.lastSentAt || subscription.createdAt;
      const bookmarks = await Bookmark.find({
        workspaceId: subscription.workspaceId,
        status: 'completed',
        createdAt: { $gt: since },
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .select('title url description');

      if (bookmarks.length === 0) {
        // Still "due" but nothing new - update lastSentAt so we don't
        // recheck it again until the next full period.
        subscription.lastSentAt = new Date();
        await subscription.save();
        results.skipped += 1;
        continue;
      }

      await sendForSubscription(subscription, workspace, bookmarks);
      subscription.lastSentAt = new Date();
      await subscription.save();
      results.sent += 1;
    } catch (err) {
      console.error(`Digest failed for subscription ${subscription._id} (${subscription.channel}):`, err.message);
      results.failed += 1;
    }
  }

  return results;
};

module.exports = { runDigestCheck, isDue };