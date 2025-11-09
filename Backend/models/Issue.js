// models/Issue.js
const mongoose = require('mongoose');
const { PREDEFINED_TAGS } = require('../config/tags');

const issueSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageUrl: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
  },
  tags: [{
    type: String,
    enum: PREDEFINED_TAGS
  }],
  severity: { type: String, enum: ['Low','Medium','High','Critical'], default: 'Low' },
  status: { type: String, enum: ['Open','InProgress','Resolved'], default: 'Open' },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  assignedAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date }
}, { timestamps: true });

// 2dsphere index for geospatial queries
issueSchema.index({ location: '2dsphere' });

// optional: create text index if you want search on title/description
issueSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Issue', issueSchema);
