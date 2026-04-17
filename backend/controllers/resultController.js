const asyncHandler = require('express-async-handler');
const {
  getLeaderboardForExam,
  getGlobalLeaderboard,
  getExamAnalytics,
  getUserSummary,
  getAdminSummary,
  getAllStudentStats,
  getStudentDashboardStats,
  getAttemptAudit,
  getMostMissedQuestions,
  getNotifications,
  getTrendData,
  getStudentAnalysis,
  deleteStudentAttempts,
  getScoreDistribution,
} = require('../models/resultModel');
const { findExamById } = require('../models/examModel');

/**
 * @desc    Get exam leaderboard
 * @route   GET /api/v1/results/leaderboard/:examId
 * @access  Private
 */
const getLeaderboard = asyncHandler(async (req, res) => {
  const examId = req.params.examId;

  let leaderboard;
  if (!examId || examId === 'global') {
    leaderboard = await getGlobalLeaderboard();
  } else {
    // Check if exam exists
    const exam = await findExamById(examId);
    if (!exam) {
      res.status(404);
      throw new Error('Exam not found');
    }
    leaderboard = await getLeaderboardForExam(examId);
  }

  res.status(200).json({
    success: true,
    count: leaderboard.length,
    data: leaderboard,
  });
});

/**
 * @desc    Get detailed exam analytics
 * @route   GET /api/v1/results/stats/:examId
 * @access  Private/Admin
 */
const getStats = asyncHandler(async (req, res) => {
  const examId = req.params.examId;

  // Check if exam exists
  const exam = await findExamById(examId);
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }

  const stats = await getExamAnalytics(examId);

  res.status(200).json({
    success: true,
    data: stats,
  });
});

/**
 * @desc    Get current user's performance summary
 * @route   GET /api/v1/results/me
 * @access  Private
 */
const getMyResults = asyncHandler(async (req, res) => {
  const summary = await getUserSummary(req.user.id);

  res.status(200).json({
    success: true,
    count: summary.length,
    data: summary,
  });
});

/**
 * @desc    Get all students with their overall stats
 * @route   GET /api/v1/results/students
 * @access  Private/Admin
 */
const getAllStudentsProgress = asyncHandler(async (req, res) => {
  const { search = '' } = req.query;
  const stats = await getAllStudentStats(search);
  res.status(200).json({
    success: true,
    data: stats,
  });
});

/**
 * @desc    Get aggregated stats for the student dashboard
 * @route   GET /api/v1/results/dashboard
 * @access  Private
 */
const getStudentDashboard = asyncHandler(async (req, res) => {
  const stats = await getStudentDashboardStats(req.user.id);
  res.status(200).json({
    success: true,
    data: stats,
  });
});

/**
 * @desc    Get most missed questions for an exam
 * @route   GET /api/v1/results/missed/:examId
 * @access  Private/Admin
 */
const getMissed = asyncHandler(async (req, res) => {
  const missed = await getMostMissedQuestions(req.params.examId);
  res.status(200).json({
    success: true,
    data: missed,
  });
});

/**
 * @desc    Get user notifications
 * @route   GET /api/v1/results/notifications
 * @access  Private
 */
const getUserNotifications = asyncHandler(async (req, res) => {
  const notifications = await getNotifications(req.user.id);
  res.status(200).json({
    success: true,
    data: notifications,
  });
});

/**
 * @desc    Get detailed audit for an attempt
 * @route   GET /api/v1/results/audit/:attemptId
 * @access  Private
 */
const getAudit = asyncHandler(async (req, res) => {
  const audit = await getAttemptAudit(req.params.attemptId);
  res.status(200).json({
    success: true,
    data: audit,
  });
});

/**
 * @desc    Get consolidated analytics for an exam
 * @route   GET /api/v1/results/analytics/:examId
 * @access  Private/Admin
 */
const getDetailedAnalytics = asyncHandler(async (req, res) => {
  const examId = req.params.examId;
  const [stats, leaderboard, missed, distribution] = await Promise.all([
    getExamAnalytics(examId),
    getLeaderboardForExam(examId),
    getMostMissedQuestions(examId),
    getScoreDistribution(examId)
  ]);

  res.status(200).json({
    success: true,
    data: { stats, leaderboard, missed, distribution }
  });
});

/**
 * @desc    Get student performance trend
 * @route   GET /api/v1/results/trend
 * @access  Private
 */
const getTrend = asyncHandler(async (req, res) => {
  const trend = await getTrendData(req.user.id);
  res.status(200).json({
    success: true,
    data: trend
  });
});

/**
 * @desc    Get global stats for the admin home dashboard
 * @route   GET /api/v1/results/admin-summary
 * @access  Private/Admin
 */
const getAdminDashboardStats = asyncHandler(async (req, res) => {
  const summary = await getAdminSummary();
  res.status(200).json({
    success: true,
    data: summary,
  });
});

/**
 * @desc    Get detailed analysis for a specific student
 * @route   GET /api/v1/results/student/:id
 * @access  Private/Admin
 */
const getStudentDetail = asyncHandler(async (req, res) => {
  const analysis = await getStudentAnalysis(req.params.id);
  res.status(200).json({
    success: true,
    data: analysis,
  });
});

/**
 * @desc    Delete all attempts for a student (Grant Retake)
 * @route   DELETE /api/v1/results/student/:id/attempts
 * @access  Private/Admin
 */
const clearAttempts = asyncHandler(async (req, res) => {
  await deleteStudentAttempts(req.params.id);
  res.status(200).json({
    success: true,
    message: 'Attempts cleared successfully',
  });
});

module.exports = {
  getLeaderboard,
  getStats,
  getMyResults,
  getAllStudentsProgress,
  getStudentDashboard,
  getAudit,
  getMissed,
  getNotifications: getUserNotifications,
  getDetailedAnalytics,
  getTrend,
  getAdminDashboardStats,
  getStudentDetail,
  clearAttempts
};
