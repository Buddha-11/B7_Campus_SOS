// controllers/userController.js
const User = require('../models/User');
const Issue = require('../models/Issue');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const recentReports = await Issue.find({ reporter: user._id }).limit(5).sort({ createdAt: -1 }).populate('tags');

    res.json({ user, recentReports });
  } catch (err) {
    res.status(500).json({ message: 'Get profile failed', error: err.message });
  }
};

module.exports = { getProfile };
