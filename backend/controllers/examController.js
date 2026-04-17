const asyncHandler = require('express-async-handler');
const {
  createExam,
  findAllExams,
  findExamById,
  updateExam,
  deleteExam,
} = require('../models/examModel');

/**
 * @desc    Create a new exam
 * @route   POST /api/v1/exams
 * @access  Private/Admin
 */
const createNewExam = asyncHandler(async (req, res) => {
  const { title, duration, start_time, end_time, passing_score, is_published } = req.body;

  if (!title || !duration) {
    res.status(400);
    throw new Error('Title and duration are required');
  }

  const exam = await createExam({
    title,
    duration,
    start_time,
    end_time,
    passing_score,
    is_published,
  });

  res.status(201).json({
    success: true,
    data: exam,
  });
});

/**
 * @desc    Get all exams
 * @route   GET /api/v1/exams
 * @access  Private
 */
const getExams = asyncHandler(async (req, res) => {
  // Students only see published exams
  const filter = req.user.role === 'admin' ? {} : { is_published: 1 };
  
  const exams = await findAllExams(filter);

  res.status(200).json({
    success: true,
    count: exams.length,
    data: exams,
  });
});

/**
 * @desc    Get single exam
 * @route   GET /api/v1/exams/:id
 * @access  Private
 */
const getExam = asyncHandler(async (req, res) => {
  const exam = await findExamById(req.params.id);

  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }

  // Check if student is trying to access unpublished exam
  if (req.user.role !== 'admin' && !exam.is_published) {
    res.status(403);
    throw new Error('Not authorized to access this exam');
  }

  res.status(200).json({
    success: true,
    data: exam,
  });
});

/**
 * @desc    Update exam
 * @route   PUT /api/v1/exams/:id
 * @access  Private/Admin
 */
const updateExistingExam = asyncHandler(async (req, res) => {
  let exam = await findExamById(req.params.id);

  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }

  exam = await updateExam(req.params.id, req.body);

  res.status(200).json({
    success: true,
    data: exam,
  });
});

/**
 * @desc    Delete exam
 * @route   DELETE /api/v1/exams/:id
 * @access  Private/Admin
 */
const removeExam = asyncHandler(async (req, res) => {
  const exam = await findExamById(req.params.id);

  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }

  await deleteExam(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Exam deleted successfully',
  });
});

const { generateQuestions } = require('../utils/questionGenerator');
const { createQuestion, findQuestionsByExamId, deleteQuestion } = require('../models/questionModel');
const { client } = require('../config/db');

/**
 * @desc    Generate and save questions for an exam based on its title
 * @route   GET /api/v1/exams/:id/generate-questions
 * @access  Private
 */
const generateExamQuestions = asyncHandler(async (req, res) => {
  const exam = await findExamById(req.params.id);

  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }

  // 1. Delete all student answers for this exam specifically
  await client.execute({
    sql: `DELETE FROM answers WHERE attempt_id IN (SELECT id FROM attempts WHERE exam_id = ?)`,
    args: [req.params.id]
  });

  // 2. Delete all attempts for this exam
  await client.execute({
    sql: `DELETE FROM attempts WHERE exam_id = ?`,
    args: [req.params.id]
  });

  // 3. Clear existing questions for this exam
  const existing = await findQuestionsByExamId(req.params.id);
  for (const q of existing) {
    await client.execute({
      sql: 'DELETE FROM answers WHERE question_id = ?',
      args: [q.id]
    });
    await deleteQuestion(q.id);
  }

  // Generate new set based on title (e.g., "JavaScript Basics" -> target "JavaScript")
  const topic = exam.title.split(' ')[0]; // Basic logic to get primary topic
  const generated = generateQuestions(topic);

  const savedQuestions = [];
  for (const q of generated) {
    const saved = await createQuestion({
      exam_id: req.params.id,
      type: q.type,
      question_text: q.q,
      options: q.opts,
      correct_answer: q.ans,
      marks: q.marks,
      explanation: q.exp || ''
    });
    savedQuestions.push(saved);
  }

  res.status(200).json({
    success: true,
    count: savedQuestions.length,
    data: savedQuestions
  });
});

module.exports = {
  createNewExam,
  getExams,
  getExam,
  updateExistingExam,
  removeExam,
  generateExamQuestions
};
