const express = require('express');
const router = express.Router();
const {
  createNewExam,
  getExams,
  getExam,
  updateExistingExam,
  removeExam,
  generateExamQuestions
} = require('../controllers/examController');
const { runCode, runTests } = require('../controllers/codeExecutionController');
const {
  addQuestion,
  getExamQuestions,
  updateExistingQuestion,
  removeQuestion,
  bulkAddQuestions,
} = require('../controllers/questionController');
const { protect, authorize } = require('../middleware/authMiddleware');

// -- Exam Routes --

/**
 * @route   POST /api/v1/exams
 * @desc    Create a new exam
 * @access  Private/Admin
 */
router.post('/', protect, authorize('admin'), createNewExam);

/**
 * @route   GET /api/v1/exams
 * @desc    Get all exams (Admins see all, Students see published)
 * @access  Private
 */
router.get('/', protect, getExams);

/**
 * @route   GET /api/v1/exams/:id
 * @desc    Get single exam details
 * @access  Private
 */
router.get('/:id', protect, getExam);

/**
 * @route   GET /api/v1/exams/:id/generate-questions
 * @desc    Generate questions for an exam dynamically
 * @access  Private
 */
router.get('/:id/generate-questions', protect, generateExamQuestions);

/**
 * @route   PUT /api/v1/exams/:id
 * @desc    Update an exam
 * @access  Private/Admin
 */
router.put('/:id', protect, authorize('admin'), updateExistingExam);

/**
 * @route   DELETE /api/v1/exams/:id
 * @desc    Delete an exam
 * @access  Private/Admin
 */
router.delete('/:id', protect, authorize('admin'), removeExam);

// -- Code Execution Routes --
router.post('/run-code', protect, runCode);
router.post('/run-tests', protect, runTests);

// -- Question Routes (Nested under Exam) --

/**
 * @route   POST /api/v1/exams/:examId/questions
 * @desc    Add a question to an exam
 * @access  Private/Admin
 */
router.post('/:examId/questions', protect, authorize('admin'), addQuestion);
router.post('/:examId/questions/bulk', protect, authorize('admin'), bulkAddQuestions);

/**
 * @route   GET /api/v1/exams/:examId/questions
 * @desc    Get all questions for an exam
 * @access  Private
 */
router.get('/:examId/questions', protect, getExamQuestions);

// -- Standalone Question Routes --

/**
 * @route   PUT /api/v1/questions/:id
 * @desc    Update a question
 * @access  Private/Admin
 */
router.put('/questions/:id', protect, authorize('admin'), updateExistingQuestion);

/**
 * @route   DELETE /api/v1/questions/:id
 * @desc    Delete a question
 * @access  Private/Admin
 */
router.delete('/questions/:id', protect, authorize('admin'), removeQuestion);

module.exports = router;
