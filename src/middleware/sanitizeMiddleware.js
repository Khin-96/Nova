const mongoSanitize = require('express-mongo-sanitize');
const validator = require('validator');

// Use a simpler approach for XSS protection that doesn't require DOM
const escapeHtml = (unsafe) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// MongoDB injection protection
exports.sanitizeMongo = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized potentially malicious input in ${key}`);
  },
});

// XSS protection for text fields
exports.sanitizeInput = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      // Simply escape HTML entities - safest approach
      // This prevents XSS by encoding all special characters
      return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    }
    return value;
  };

  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      return sanitizeValue(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }

    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Validate email
exports.validateEmail = (email) => {
  return validator.isEmail(email);
};

// Validate and sanitize search queries to prevent ReDoS
exports.sanitizeSearchQuery = (req, res, next) => {
  if (req.query.search) {
    // Escape special regex characters
    req.query.search = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Limit length to prevent ReDoS
    if (req.query.search.length > 100) {
      req.query.search = req.query.search.substring(0, 100);
    }
  }
  
  if (req.query.category) {
    // Escape special regex characters in category
    req.query.category = req.query.category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Limit length
    if (req.query.category.length > 50) {
      req.query.category = req.query.category.substring(0, 50);
    }
  }
  
  next();
};
