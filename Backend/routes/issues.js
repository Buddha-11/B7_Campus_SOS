// routes/issues.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/issueController');

// public list (with filters)
router.get('/', ctrl.listIssues);

// create issue (auth required) - file field name: image
router.post('/', authMiddleware, upload.single('image'), ctrl.createIssue);

// user-specific issues
router.get('/me', authMiddleware, ctrl.listUserIssues);

// single issue
router.get('/:id', ctrl.getIssue);

// toggle upvote (auth)
router.post('/:id/upvote', authMiddleware, ctrl.toggleUpvote);

// update tags (reporter or admin)
router.patch('/:id/tags', authMiddleware, ctrl.updateTags);

// admin updates status (role/permission checked in controller)
router.patch('/:id/status', authMiddleware, ctrl.updateStatus);

module.exports = router;
