// routes/users.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getProfile } = require('../controllers/userController');

router.get('/me/:id', authMiddleware, getProfile); // authenticated users can fetch profiles (or restrict to same user)

module.exports = router;
