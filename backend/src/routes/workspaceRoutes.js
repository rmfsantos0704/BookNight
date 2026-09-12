const express = require('express');
const {
  createWorkspace,
  listWorkspaces,
  getWorkspace,
  addMember,
  updateWorkspace,
  deleteWorkspace,
  removeMember,
} = require('../controllers/workspaceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // every workspace route requires a logged-in user

router.route('/').post(createWorkspace).get(listWorkspaces);
router.route('/:id').get(getWorkspace).patch(updateWorkspace).delete(deleteWorkspace);
router.route('/:id/members').post(addMember);
router.route('/:id/members/:memberId').delete(removeMember);

module.exports = router;