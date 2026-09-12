const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createBookmark,
  listBookmarks,
  getBookmark,
  updateBookmark,
  deleteBookmark,
  assertWorkspaceAccess,
} = require('../src/controllers/bookmarkController');

test('bookmark controller exposes workspace-gated CRUD and list endpoints', () => {
  assert.equal(typeof createBookmark, 'function');
  assert.equal(typeof listBookmarks, 'function');
  assert.equal(typeof getBookmark, 'function');
  assert.equal(typeof updateBookmark, 'function');
  assert.equal(typeof deleteBookmark, 'function');
  assert.equal(typeof assertWorkspaceAccess, 'function');
});
