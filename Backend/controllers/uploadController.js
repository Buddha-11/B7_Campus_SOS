// controllers/uploadController.js
const cloudinary = require('../config/cloudinary');

/**
 * Upload buffer (from multer memoryStorage) to Cloudinary.
 * Returns result object from Cloudinary.
 */
const uploadBufferToCloudinary = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'campus_sos', public_id: filename, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

const uploadImage = async (req, res) => {
  try {
    // multer placed file in req.file (memoryStorage)
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const uniqueName = `issue-${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    let result;
    try {
      result = await uploadBufferToCloudinary(req.file.buffer, uniqueName);
    } catch (err) {
      console.error('Cloudinary upload failed:', err);
      return res.status(500).json({ message: 'Image upload to Cloudinary failed', error: err.message || err });
    }

    // respond with useful information
    return res.status(201).json({
      public_id: result.public_id,
      secure_url: result.secure_url,
      url: result.url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      created_at: result.created_at
    });
  } catch (err) {
    console.error('uploadImage error:', err);
    return res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

module.exports = { uploadImage };
