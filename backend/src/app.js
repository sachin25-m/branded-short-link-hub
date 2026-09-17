const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const linkRoutes = require('./routes/link.routes');
const bioRoutes = require('./routes/bio.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middleware configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bio', bioRoutes);
app.use('/api/analytics', analyticsRoutes);
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
