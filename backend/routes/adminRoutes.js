const express = require('express');
const router = express.Router();
const { 
  getDashboardStats,
  createAdminExam,
  updateAdminExam,
  deleteAdminExam,
  publishAdminExam,
  downloadQuestionTemplate,
  getAllAdminStudents,
  clearStudentAttempts,
  exportStudentsCSV,
  getExamResultsAnalytics,
  parseQuestionsForPreview,
  saveBulkQuestions
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/dashboard', protect, authorize('admin'), getDashboardStats);

// Exam Management
router.post('/exams', protect, authorize('admin'), createAdminExam);
router.put('/exams/:id', protect, authorize('admin'), updateAdminExam);
router.delete('/exams/:id', protect, authorize('admin'), deleteAdminExam);
router.put('/exams/:id/publish', protect, authorize('admin'), publishAdminExam);

// Question Import & Review
router.get('/questions/template', protect, authorize('admin'), downloadQuestionTemplate);
router.post('/questions/parse', protect, authorize('admin'), upload.single('file'), parseQuestionsForPreview);
router.post('/questions/bulk-save', protect, authorize('admin'), saveBulkQuestions);

// Student Management
router.get('/students', protect, authorize('admin'), getAllAdminStudents);
router.get('/students/export', protect, authorize('admin'), exportStudentsCSV);
router.delete('/students/:id/attempts', protect, authorize('admin'), clearStudentAttempts);

// Results & Analytics
router.get('/results/:examId', protect, authorize('admin'), getExamResultsAnalytics);

module.exports = router;
