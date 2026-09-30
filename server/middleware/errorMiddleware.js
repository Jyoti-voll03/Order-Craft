/**
 * Centralized error handling middleware returning standardized JSON format.
 */
function notFound(req, res, next) {
  const error = new Error(`Endpoint Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
}

function errorHandler(err, _req, res, _next) {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: err.name === 'ValidationError' ? 'Validation error' : err.message,
  });
}

module.exports = { notFound, errorHandler };
