const createDOMPurify = require('isomorphic-dompurify');
const validator = require('validator');

const DOMPurify = createDOMPurify();

// Escape regex special characters to prevent ReDoS
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Sanitize a single value
const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    // First escape HTML to prevent XSS
    let sanitized = validator.escape(value);
    // Then use DOMPurify for additional sanitization
    sanitized = DOMPurify.sanitize(sanitized, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });
    return sanitized;
  }
  return value;
};

// Recursively sanitize object/array
const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return sanitizeValue(obj);
};

// Middleware to sanitize all request inputs
const sanitizeInput = (req, res, next) => {
  try {
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }
    next();
  } catch (error) {
    console.error('Sanitization error:', error);
    res.status(500).json({ msg: 'Error processing request data.' });
  }
};

// Sanitize email specifically
const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return email;
  }
  return validator.normalizeEmail(email.trim().toLowerCase());
};

// Validate and sanitize phone number
const sanitizePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return phone;
  }
  // Remove all non-numeric characters except +
  return phone.replace(/[^\d+]/g, '');
};

module.exports = {
  sanitizeInput,
  sanitizeValue,
  sanitizeObject,
  sanitizeEmail,
  sanitizePhone,
  escapeRegex
};
