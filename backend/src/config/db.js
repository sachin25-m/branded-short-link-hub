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

  const rawUri = process.env.MONGODB_URI;
  let uri = rawUri ? rawUri.trim() : '';
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1).trim();
  }

  const isConfigured = Boolean(uri);
  const readyStateBefore = mongoose.connection.readyState;

  console.log(`[Diagnostic Log] MONGODB_URI configured: ${isConfigured ? 'yes' : 'no'}`);
  console.log(`[Diagnostic Log] mongoose readyState before connect: ${readyStateBefore}`);

  if (!isConfigured) {
    console.error('[MongoDB] MONGODB_URI is not configured in environment variables.');
    return false;
  }

  // Return true if already fully connected
  if (mongoose.connection.readyState === 1) {
    console.log('[Diagnostic Log] connectDB() called: no (already connected)');
    console.log(`[Diagnostic Log] mongoose readyState after connect: 1`);
    return true;
  }

  // Return existing pending connection promise if in progress
  if (cachedPromise && (mongoose.connection.readyState === 2 || mongoose.connection.readyState === 1)) {
    console.log('[Diagnostic Log] connectDB() called: yes (awaiting in-flight promise)');
    try {
      await cachedPromise;
      const readyStateAfter = mongoose.connection.readyState;
      console.log(`[Diagnostic Log] mongoose readyState after connect: ${readyStateAfter}`);
      return readyStateAfter === 1;
    } catch (err) {
      cachedPromise = null;
    }
  }

  console.log('[Diagnostic Log] connectDB() called: yes');
  console.log('[MongoDB] Initiating connection to database...');

  try {
    const opts = {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    };

    cachedPromise = mongoose.connect(uri, opts);
    const conn = await cachedPromise;
    const readyStateAfter = mongoose.connection.readyState;
    console.log(`[Diagnostic Log] mongoose readyState after connect: ${readyStateAfter}`);
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    cachedPromise = null;
    const readyStateAfter = mongoose.connection.readyState;
    console.log(`[Diagnostic Log] mongoose readyState after connect: ${readyStateAfter}`);
    console.error(`[MongoDB Connection Error] Connection failed: ${error.message}`);
    return false;
  }
};

module.exports = connectDB;
