const express = require('express');
const router = express.Router();
const {
  getLeaderboard,
  getStats,
  getMyResults,
  getAllStudentsProgress,
  getStudentDashboard,
  getAudit,
  getMissed,
  getNotifications,
  getDetailedAnalytics,
  getTrend,
  getAdminDashboardStats,
  getStudentDetail,
  clearAttempts,
} = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/v1/results/leaderboard/:examId
 * @desc    Get exam leaderboard (Sorted by Score, Time, Submission)
 * @access  Private
 */
router.get('/leaderboard', protect, getLeaderboard);
router.get('/leaderboard/:examId', protect, getLeaderboard);

/**
 * @route   GET /api/v1/results/stats/:examId
 * @desc    Get detailed exam analytics (Total attempts, Avg score, Pass/Fail)
 * @access  Private/Admin
 */
router.get('/stats/:examId', protect, authorize('admin'), getStats);

/**
 * @route   GET /api/v1/results/students
 * @desc    Get stats for all students
 * @access  Private/Admin
 */
router.get('/students', protect, authorize('admin'), getAllStudentsProgress);

/**
 * @route   GET /api/v1/results/dashboard
 * @desc    Get aggregated stats for the student dashboard
 * @access  Private
 */
router.get('/dashboard', protect, getStudentDashboard);

/**
 * @route   GET /api/v1/results/me
 * @desc    Get current user's performance history
 * @access  Private
 */
router.get('/me', protect, getMyResults);

/**
 * @route   GET /api/v1/results/audit/:attemptId
 * @desc    Get detailed audit for an attempt
 * @access  Private
 */
router.get('/audit/:attemptId', protect, getAudit);

/**
 * @route   GET /api/v1/results/missed/:examId
 * @desc    Get most missed questions for an exam
 * @access  Private/Admin
 */
router.get('/missed/:examId', protect, authorize('admin'), getMissed);

/**
 * @route   GET /api/v1/results/analytics/:examId
 * @desc    Get consolidated analytics for an exam
 * @access  Private/Admin
 */
router.get('/analytics/:examId', protect, authorize('admin'), getDetailedAnalytics);

/**
 * @route   GET /api/v1/results/trend
 * @desc    Get student performance trend
 * @access  Private
 */
router.get('/trend', protect, getTrend);

/**
 * @route   GET /api/v1/results/admin-summary
 * @desc    Get global stats for the admin dashboard
 * @access  Private/Admin
 */
router.get('/admin-summary', protect, authorize('admin'), getAdminDashboardStats);

router.get('/student/:id', protect, authorize('admin'), getStudentDetail);

/**
 * @route   DELETE /api/v1/results/student/:id/attempts
 * @desc    Get detailed analysis for a specific student
 * @access  Private/Admin
 */
router.delete('/student/:id/attempts', protect, authorize('admin'), clearAttempts);

/**
 * @route   GET /api/v1/results/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/notifications', protect, getNotifications);

module.exports = router;
