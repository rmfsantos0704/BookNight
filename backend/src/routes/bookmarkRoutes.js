const express = require('express');
const {
  createBookmark,
  listBookmarks,
  getBookmark,
  updateBookmark,
  deleteBookmark,
} = require('../controllers/bookmarkController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/').post(createBookmark).get(listBookmarks);
router.route('/:id').get(getBookmark).patch(updateBookmark).delete(deleteBookmark);

module.exports = router;
