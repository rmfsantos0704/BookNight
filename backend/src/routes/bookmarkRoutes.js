const express = require('express');
const {
  createBookmark,
  listBookmarks,
  getBookmark,
  updateBookmark,
  deleteBookmark,
  searchBookmarks,
} = require('../controllers/bookmarkController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// IMPORTANT: /search must come before /:id, or Express will treat "search"
// as an :id value and route it to getBookmark instead.
router.get('/search', searchBookmarks);

router.route('/').post(createBookmark).get(listBookmarks);
router.route('/:id').get(getBookmark).patch(updateBookmark).delete(deleteBookmark);

module.exports = router;