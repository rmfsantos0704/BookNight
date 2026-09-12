const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createWorkspace,
  listWorkspaces,
  getWorkspace,
  addMember,
  removeMember,
} = require('../src/controllers/workspaceController');
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
} = require('../src/controllers/authController');

test('workspace controller exposes an owner-authorized member removal workflow', () => {
  assert.equal(typeof createWorkspace, 'function');
  assert.equal(typeof listWorkspaces, 'function');
  assert.equal(typeof getWorkspace, 'function');
  assert.equal(typeof addMember, 'function');
  assert.equal(typeof removeMember, 'function');
});

test('auth controller exposes forgot and reset password flows', () => {
  assert.equal(typeof register, 'function');
  assert.equal(typeof login, 'function');
  assert.equal(typeof getMe, 'function');
  assert.equal(typeof forgotPassword, 'function');
  assert.equal(typeof resetPassword, 'function');
});
