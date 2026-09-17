const mongoose = require('mongoose');

/**
 * Connects to MongoDB database using Mongoose.
 * Logs connection status cleanly.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    // Log error cleanly without crashing process so API stays up even if DB is pending
  }
};

module.exports = connectDB;
