// config/tags.js
// Central place for all predefined tags and points for awarding points on resolution.

const PREDEFINED_TAGS = [
  // general categories & technical/expertise tags
  'Wifi', 'Network', 'Cleanliness', 'Plumbing', 'Electrical', 'Lighting',
  'Safety', 'Security', 'Maintenance', 'Sanitation', 'Structural',
  'Accessibility', 'HVAC', 'Pest Control', 'Gardening', 'Transport',
  'Signage', 'Fire Safety', 'Other'
];

// Points awarded per tag when resolved (sum across tags on an issue)
const TAG_POINTS = {
  Wifi: 10,
  Network: 12,
  Cleanliness: 5,
  Plumbing: 15,
  Electrical: 12,
  Lighting: 6,
  Safety: 20,
  Security: 18,
  Maintenance: 8,
  Sanitation: 6,
  Structural: 25,
  Accessibility: 15,
  HVAC: 10,
  'Pest Control': 8,
  Gardening: 5,
  Transport: 10,
  Signage: 4,
  'Fire Safety': 22,
  Other: 5
};

module.exports = { PREDEFINED_TAGS, TAG_POINTS };
