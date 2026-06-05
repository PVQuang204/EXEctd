const ApiError = require('../utils/ApiError');

const validateRequest = (schema) => (req, res, next) => {
  const errors = [];
  const body = req.body || {};
  const query = req.query || {};
  const params = req.params || {};
  for (const [field, rules] of Object.entries(schema)) {
    const value = body[field] ?? query[field] ?? params[field];
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }
    if (value === undefined || value === null || value === '') continue;
    if (rules.type === 'email' && !/^\S+@\S+\.\S+$/.test(value)) {
      errors.push(`${field} must be a valid email`);
    }
    if (rules.type === 'number' && Number.isNaN(Number(value))) {
      errors.push(`${field} must be a number`);
    }
    if (rules.minLength && String(value).length < rules.minLength) {
      errors.push(`${field} must be at least ${rules.minLength} characters`);
    }
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
    }
  }
  if (errors.length) return next(new ApiError(400, 'Validation failed', errors));
  next();
};

module.exports = validateRequest;
