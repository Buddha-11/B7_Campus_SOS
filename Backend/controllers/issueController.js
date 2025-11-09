// controllers/issueController.js
const Issue = require('../models/Issue');
const User = require('../models/User');
const { PREDEFINED_TAGS, TAG_POINTS } = require('../config/tags');
const mongoose = require('mongoose');

const validateTags = (tags) => {
  if (!tags) return [];
  if (!Array.isArray(tags)) throw new Error('Tags must be an array');
  // filter only allowed tags
  const filtered = tags.filter(t => PREDEFINED_TAGS.includes(t));
  return filtered;
};

// Create issue (user)
const createIssue = async (req, res) => {
  try {
    const { title, description, lng, lat, tags = [], severity = 'Low' } = req.body;
    if (!title || !lng || !lat) return res.status(400).json({ message: 'title and location required' });

    // validate tags
    let tagArray = [];
    try { tagArray = validateTags(Array.isArray(tags) ? tags : JSON.parse(tags)); } catch (e) {
      // if tags sent as JSON string or as array
      tagArray = validateTags(tags);
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const issue = await Issue.create({
      title,
      description,
      reporter: req.user._id,
      imageUrl,
      location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
      tags: tagArray,
      severity
    });

    // increment user's reports count
    await User.findByIdAndUpdate(req.user._id, { $inc: { reportsSubmitted: 1 } });

    res.status(201).json(issue);
  } catch (err) {
    res.status(500).json({ message: 'Create issue failed', error: err.message });
  }
};

// Get single issue
const getIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reporter', 'name email avatarUrl')
    ;
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: 'Get issue failed', error: err.message });
  }
};

// Fetch issues (global) with filters, pagination, search
const listIssues = async (req, res) => {
  try {
    const { page = 1, limit = 20, severity, status, q, lng, lat, radiusKm, tag, sortBy = 'createdAt' } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (tag && PREDEFINED_TAGS.includes(tag)) filter.tags = tag;
    if (q) filter.$text = { $search: q };
    if (severity) filter.severity = severity;

    // geo query
    if (lng && lat && radiusKm) {
      filter.location = {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radiusKm) * 1000
        }
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const issues = await Issue.find(filter)
      .populate('reporter', 'name avatarUrl')
      .sort({ [sortBy]: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const count = await Issue.countDocuments(filter);
    res.json({ items: issues, total: count, page: parseInt(page), pages: Math.ceil(count / limit) });
  } catch (err) {
    res.status(500).json({ message: 'List issues failed', error: err.message });
  }
};

// Get user issues
const listUserIssues = async (req, res) => {
  try {
    const issues = await Issue.find({ reporter: req.user._id }).sort({ createdAt: -1 });
    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: 'User issues fetch failed', error: err.message });
  }
};

// Upvote/Toggle upvote
const toggleUpvote = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    const uid = req.user._id;
    const has = issue.upvotes.find(u => u.equals(uid));
    if (has) {
      issue.upvotes = issue.upvotes.filter(u => !u.equals(uid));
    } else {
      issue.upvotes.push(uid);
    }
    await issue.save();
    res.json({ upvotesCount: issue.upvotes.length });
  } catch (err) {
    res.status(500).json({ message: 'Upvote failed', error: err.message });
  }
};

// Admin or reporter: change status (Open -> InProgress -> Resolved)
const updateStatus = async (req, res) => {
  try {
    const { status, assignedAdminId } = req.body;
    const issue = await Issue.findById(req.params.id).populate('reporter');
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    // permission check: only admin or assigned admin can update status (or optionally the reporter can request)
    const isAdmin = req.user.role === 'admin';
    const isAssignedAdmin = issue.assignedAdmin && issue.assignedAdmin.equals(req.user._id);
    const isReporter = issue.reporter._id.equals(req.user._id);
    if (!isAdmin && !isAssignedAdmin && !isReporter) {
      return res.status(403).json({ message: 'Not allowed to change status' });
    }

    const prevStatus = issue.status;
    issue.status = status;
    if (assignedAdminId && mongoose.Types.ObjectId.isValid(assignedAdminId)) issue.assignedAdmin = assignedAdminId;
    if (status === 'Resolved' && prevStatus !== 'Resolved') {
      issue.resolvedAt = new Date();

      // award points based on TAG_POINTS
      let points = 0;
      for (const t of issue.tags) {
        points += (TAG_POINTS[t] || 0);
      }
      if (points === 0) {
        if (issue.severity === 'High') points = 20;
        else if (issue.severity === 'Medium') points = 10;
        else points = 5;
      }

      await User.findByIdAndUpdate(issue.reporter._id, {
        $inc: { points: points, issuesResolved: 1 }
      });
    }

    await issue.save();
    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: 'Update status failed', error: err.message });
  }
};

// Update tags on an issue (reporter or admin can do it)
const updateTags = async (req, res) => {
  try {
    const { tags } = req.body;
    let tagArray;
    try { tagArray = validateTags(tags); } catch (e) { return res.status(400).json({ message: 'Invalid tags payload' }); }

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const isAdmin = req.user.role === 'admin';
    const isReporter = issue.reporter.equals(req.user._id);
    if (!isAdmin && !isReporter) return res.status(403).json({ message: 'Not allowed to update tags' });

    issue.tags = tagArray;
    await issue.save();
    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: 'Update tags failed', error: err.message });
  }
};

module.exports = {
  createIssue,
  getIssue,
  listIssues,
  listUserIssues,
  toggleUpvote,
  updateStatus,
  updateTags
};
