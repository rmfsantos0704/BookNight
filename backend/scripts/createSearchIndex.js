require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');

const INDEX_NAME = 'bookmark_search';

// Field mappings:
// - title/tags get a "multi" autocomplete sub-field (edge n-grams) for
//   partial/prefix matching, on top of normal text search.
// - description is plain text only (lower priority in the query, see
//   bookmarkController.searchBookmarks - no need for autocomplete there).
// - workspaceId is mapped as objectId so we can filter to one workspace
//   *inside* the same $search stage (cheaper than a separate $match after).
const definition = {
  mappings: {
    dynamic: false,
    fields: {
      // Multiple type mappings on the same field use an ARRAY here, not
      // "multi" - "multi" is only for alternate string analyzers, not for
      // combining different field types like string + autocomplete.
      title: [
        { type: 'string' },
        {
          type: 'autocomplete',
          tokenization: 'edgeGram',
          minGrams: 2,
          maxGrams: 15,
          foldDiacritics: false,
        },
      ],
      tags: {
        type: 'string',
      },
      description: {
        type: 'string',
      },
      workspaceId: {
        type: 'objectId',
      },
    },
  },
};

const run = async () => {
  await connectDB();
  const collection = mongoose.connection.collection('bookmarks');

  const existing = await collection
    .listSearchIndexes()
    .toArray()
    .catch(() => []);

  const existingIndex = existing.find((i) => i.name === INDEX_NAME);

  if (existingIndex) {
    if (existingIndex.status !== 'FAILED') {
      console.log(`Search index "${INDEX_NAME}" already exists (status: ${existingIndex.status}) - nothing to do.`);
      process.exit(0);
    }
    console.log(`Found a FAILED index "${INDEX_NAME}" - dropping it so it can be recreated...`);
    await collection.dropSearchIndex(INDEX_NAME);
    // Atlas needs a moment to actually remove it before we can recreate.
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  await collection.createSearchIndex({ name: INDEX_NAME, definition });
  console.log(`Requested creation of search index "${INDEX_NAME}".`);
  console.log('Atlas takes roughly 30-90 seconds to build it. Check status with:');
  console.log('  npm run search:status');
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed to create search index:', err.message);
  process.exit(1);
});