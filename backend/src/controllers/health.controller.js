const mongoose = require('mongoose');

/**
 * Controller for GET /api/health
 * Reports system health and MongoDB connection status accurately.
 */
const getHealthStatus = async (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  if (isDbConnected) {
    return res.status(200).json({
      status: 'ok',
      success: true,
      message: 'API and Database are operational',
      database: 'connected',
    });
  }

  return res.status(503).json({
    status: 'error',
    success: false,
    message: 'API is running but Database connection is unavailable',
    database: 'disconnected',
  });
};

module.exports = {
  getHealthStatus,
};
