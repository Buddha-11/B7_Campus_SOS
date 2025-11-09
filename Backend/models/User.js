// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  collegeId: { type: String },
  avatarUrl: { type: String },
  points: { type: Number, default: 0 },
  // stat counters
  reportsSubmitted: { type: Number, default: 0 },
  issuesResolved: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
