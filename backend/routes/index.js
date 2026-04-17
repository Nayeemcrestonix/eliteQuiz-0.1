const express = require('express');
const router = express.Router();

/**
 * Health Check Route
 * @route GET /api/v1/health
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Import Other Routes
const authRoutes = require('./authRoutes');
const examRoutes = require('./examRoutes');
const attemptRoutes = require('./attemptRoutes');
const resultRoutes = require('./resultRoutes');
const adminRoutes = require('./adminRoutes');
const notificationRoutes = require('./notificationRoutes');

// Mount Modules
router.use('/auth', authRoutes);
router.use('/exams', examRoutes);
router.use('/attempts', attemptRoutes);
router.use('/results', resultRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
