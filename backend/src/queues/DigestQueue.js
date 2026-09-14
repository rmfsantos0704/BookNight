const QUEUE_NAME = 'digest-check';
const REPEATABLE_JOB_ID = 'digest-check-daily';

let _queue = null;
const getQueue = () => {
  if (!_queue) {
    const { Queue } = require('bullmq');
    const connection = require('../config/redis');
    _queue = new Queue(QUEUE_NAME, { connection });
  }
  return _queue;
};

/**
 * Schedules the recurring digest-check job (runs once daily at 08:00 UTC).
 * Safe to call on every worker boot - BullMQ dedupes repeatable jobs by
 * jobId, so this won't create duplicate schedules on restart.
 * The job itself checks every subscription and only actually sends to the
 * ones that are due (daily ones each run, weekly ones only every ~7 days).
 */
const scheduleDigestCheck = async () => {
  const queue = getQueue();
  await queue.add(
    'check-digests',
    {},
    {
      repeat: { pattern: '0 8 * * *' }, // 08:00 UTC daily
      jobId: REPEATABLE_JOB_ID,
      removeOnComplete: 50,
      removeOnFail: 50,
    }
  );
};

module.exports = { getQueue, scheduleDigestCheck, QUEUE_NAME };