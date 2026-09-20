const express = require('express');
const {
  createBookmark,
  listBookmarks,
  getBookmark,
  updateBookmark,
  deleteBookmark,
  searchBookmarks,
  searchAllWorkspaces,
} = require('../controllers/bookmarkController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// IMPORTANT: /search and /search-all must come before /:id, or Express will
// treat "search"/"search-all" as an :id value and route it to getBookmark.
router.get('/search', searchBookmarks);
router.get('/search-all', searchAllWorkspaces);

router.route('/').post(createBookmark).get(listBookmarks);
router.route('/:id').get(getBookmark).patch(updateBookmark).delete(deleteBookmark);

module.exports = router;