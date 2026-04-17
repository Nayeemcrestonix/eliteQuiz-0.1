// EliteQuiz Backend v2 - Final Leaderboard Sync
const app = require('./app');
const config = require('./config/config');
const { connectDB } = require('./config/db');

// Start Server
const startServer = async () => {
  try {
    // 1. Connect to Database (Optional: skip errors during development if DB is not ready)
    if (config.db.url) {
      await connectDB();
    } else {
      console.warn('TURSO_DATABASE_URL not found. Skipping DB connection check.');
    }

    // 2. Listen for requests
    const server = app.listen(config.port, () => {
      console.log(`
🚀 Server running in ${config.env} mode on port ${config.port}
🔗 Health Check: http://localhost:${config.port}/api/v1/health
      `);
    });

    // Handle Graceful Shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
