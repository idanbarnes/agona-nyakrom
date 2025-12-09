/**
 * Consistent JSON response helpers for controllers.
 */

const success = (res, data, message = 'OK', status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

const error = (res, message = 'An error occurred', status = 400) => {
  return res.status(status).json({
    success: false,
    message,
  });
};

module.exports = {
  success,
  error,
};
