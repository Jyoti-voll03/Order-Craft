const { validationResult } = require('express-validator');

/**
 * Middleware to validate express-validator rules and return standardized error response.
 */
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstMsg = errors.array()[0].msg;
    return res.status(400).json({
      success: false,
      message: firstMsg || 'Validation error',
      error: 'Validation error',
      details: errors.array(),
    });
  }
  next();
}

module.exports = { validateRequest };
