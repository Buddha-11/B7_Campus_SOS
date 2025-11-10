// controllers/leaderboardController.js
const User = require('../models/User');

// Simple leaderboard: sort by points (descending) and exclude admins
const leaderboard = async (req, res) => {
  try {
    const { limit = 10, timeframe = 'all' } = req.query;

    // Filter only normal users (exclude admins)
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('name avatarUrl points reportsSubmitted')
      .sort({ points: -1 })
      .limit(parseInt(limit));

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Leaderboard fetch failed', error: err.message });
  }
};

module.exports = { leaderboard };
