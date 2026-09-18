const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const linkRoutes = require('./routes/link.routes');
const bioRoutes = require('./routes/bio.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Ensure DB is connected
if (process.env.MONGODB_URI || process.env.NODE_ENV === 'production') {
  connectDB();
}

// Middleware configuration
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/health', healthRoutes);

app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/bio', bioRoutes);
app.use('/bio', bioRoutes);

app.use('/api/analytics', analyticsRoutes);
app.use('/analytics', analyticsRoutes);

app.use('/api', linkRoutes);
app.use('/', linkRoutes);




// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

// Centralized Error Middleware
app.use(errorHandler);

module.exports = app;
