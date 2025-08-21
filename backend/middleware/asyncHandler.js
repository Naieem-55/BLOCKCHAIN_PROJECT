/**
 * Async Handler Middleware
 * Wraps async route handlers to catch errors and pass them to error middleware
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;