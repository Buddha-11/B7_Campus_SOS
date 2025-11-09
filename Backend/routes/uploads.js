// routes/uploads.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload'); // multer memory storage
const { authMiddleware } = require('../middleware/auth');
const { uploadImage } = require('../controllers/uploadController');

// POST /api/uploads/image
// Requires Authorization: Bearer <token>
// Form-data key: image (file)
router.post('/image', authMiddleware, upload.single('image'), uploadImage);

module.exports = router;
