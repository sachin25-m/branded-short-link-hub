const mongoose = require('mongoose');

let cachedPromise = null;
let isListenersAttached = false;

/**
 * Attaches Mongoose connection lifecycle listeners once.
 */
const attachListeners = () => {
  if (isListenersAttached) return;
  isListenersAttached = true;

  mongoose.connection.on('connected', () => {
    console.log('[MongoDB Event] Connection established successfully.');
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[MongoDB Event Error] ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB Event] Connection disconnected.');
  });
};

/**
 * Connects to MongoDB using Mongoose with connection caching for serverless/Vercel functions.
 * @returns {Promise<boolean>}
 */
const connectDB = async () => {
  attachListeners();

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('[MongoDB] MONGODB_URI is not configured.');
    return false;
  }

  // Return true if already fully connected
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  // Return existing pending connection promise if in progress
  if (cachedPromise && (mongoose.connection.readyState === 2 || mongoose.connection.readyState === 1)) {
    try {
      await cachedPromise;
      return mongoose.connection.readyState === 1;
    } catch (err) {
      cachedPromise = null;
    }
  }

  console.log('[MongoDB] Initiating connection to database...');

  try {
    const opts = {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    };

    cachedPromise = mongoose.connect(uri, opts);
    const conn = await cachedPromise;
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    cachedPromise = null;
    console.error(`[MongoDB Connection Error] Connection failed: ${error.message}`);
    return false;
  }
};

module.exports = connectDB;
