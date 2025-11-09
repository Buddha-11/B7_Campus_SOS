// controllers/leaderboardController.js
const User = require('../models/User');

// simple leaderboard: sort by points desc
const leaderboard = async (req, res) => {
  try {
    const { limit = 10, timeframe = 'all' } = req.query;

    // timeframe not implemented in-depth here (would require tracking points with timestamps).
    const users = await User.find().select('name avatarUrl points reportsSubmitted').sort({ points: -1 }).limit(parseInt(limit));
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Leaderboard fetch failed', error: err.message });
  }
};

module.exports = { leaderboard };
