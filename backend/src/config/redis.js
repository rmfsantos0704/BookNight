const IORedis = require('ioredis');

// BullMQ requires maxRetriesPerRequest to be null on the connection it manages.
const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

connection.on('connect', () => console.log('Redis connected'));
connection.on('error', (err) => console.error(`Redis error: ${err.message}`));

module.exports = connection;
