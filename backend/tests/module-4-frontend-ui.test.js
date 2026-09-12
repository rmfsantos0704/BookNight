const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeBookmark,
  createBookmarkBoardView,
  buildBookmarkSummary,
} = require('../../frontend/bookmarkBoard');

test('frontend board adapter exposes canonical bookmark normalization and board view helpers', () => {
  assert.equal(typeof normalizeBookmark, 'function');
  assert.equal(typeof createBookmarkBoardView, 'function');
  assert.equal(typeof buildBookmarkSummary, 'function');
});
