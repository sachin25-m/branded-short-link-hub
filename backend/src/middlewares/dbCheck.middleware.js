const mongoose = require('mongoose');
const connectDB = require('../config/db');

/**
 * Middleware ensuring MongoDB is connected prior to executing database operations.
 */
const ensureDbConnected = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const isConnected = await connectDB();
      if (!isConnected || mongoose.connection.readyState !== 1) {
        return res.status(503).json({
          status: 'error',
          success: false,
          message:
            'Database connection is unavailable. Please verify MONGODB_URI configuration and MongoDB Atlas IP Network Access.',
          database: 'disconnected',
        });
      }
    }
    next();
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      success: false,
      message: `Database connection error: ${error.message}`,
      database: 'disconnected',
    });
  }
};

module.exports = {
  ensureDbConnected,
};
