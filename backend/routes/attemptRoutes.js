const express = require('express');
const router = express.Router();
const {
  startExamAttempt,
  getAttemptStatus,
  submitQuestionAnswer,
  submitExam,
  getMyAttempts,
  getAttemptReviewDetails,
} = require('../controllers/attemptController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/v1/attempts
 * @desc    Start a new exam attempt
 * @access  Private
 */
router.post('/', protect, startExamAttempt);

/**
 * @route   GET /api/v1/attempts
 * @desc    Get all attempts for the current user
 * @access  Private
 */
router.get('/', protect, getMyAttempts);

/**
 * @route   GET /api/v1/attempts/:id
 * @desc    Get status/timer for a specific attempt
 * @access  Private
 */
router.get('/:id', protect, getAttemptStatus);

/**
 * @route   POST /api/v1/attempts/:id/answers
 * @desc    Submit an answer for a question in an attempt
 * @access  Private
 */
router.post('/:id/answers', protect, submitQuestionAnswer);

/**
 * @route   POST /api/v1/attempts/:id/submit
 * @desc    Finalize and submit the exam attempt
 * @access  Private
 */
router.post('/:id/submit', protect, submitExam);

/**
 * @route   GET /api/v1/attempts/:id/review
 * @desc    Get detailed review/answers for an attempt
 * @access  Private
 */
router.get('/:id/review', protect, getAttemptReviewDetails);

module.exports = router;
