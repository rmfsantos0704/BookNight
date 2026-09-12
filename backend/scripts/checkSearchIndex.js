require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');

const INDEX_NAME = 'bookmark_search';

const run = async () => {
  await connectDB();
  const collection = mongoose.connection.collection('bookmarks');

  const indexes = await collection.listSearchIndexes().toArray();
  const index = indexes.find((i) => i.name === INDEX_NAME);

  if (!index) {
    console.log(`No search index named "${INDEX_NAME}" found. Run: npm run search:index`);
  } else {
    console.log(`Index "${INDEX_NAME}" status: ${index.status} (queryable: ${index.queryable})`);
    if (index.status === 'FAILED') {
      console.log('\nFull index detail (look for an error message under statusDetail):');
      console.log(JSON.stringify(index, null, 2));
    }
  }

  process.exit(0);
};

run().catch((err) => {
  console.error('Failed to check search index status:', err.message);
  process.exit(1);
});