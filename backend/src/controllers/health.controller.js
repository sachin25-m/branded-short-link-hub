/**
 * Controller for GET /api/health
 * Returns simple system health status.
 */
const getHealthStatus = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'API is running',
  });
};

module.exports = {
  getHealthStatus,
};
