const asyncHandler = require('express-async-handler');
const {
  createQuestion,
  findQuestionsByExamId,
  findQuestionById,
  updateQuestion,
  deleteQuestion,
} = require('../models/questionModel');
const { findExamById } = require('../models/examModel');

/**
 * @desc    Add question to exam
 * @route   POST /api/v1/exams/:examId/questions
 * @access  Private/Admin
 */
const addQuestion = asyncHandler(async (req, res) => {
  const { type, question_text, options, correct_answer, marks, explanation } = req.body;
  const examId = req.params.examId;

  // Check if exam exists
  const exam = await findExamById(examId);
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }

  if (!type || !question_text || !correct_answer) {
    res.status(400);
    throw new Error('Type, question text, and correct answer are required');
  }

  const question = await createQuestion({
    exam_id: examId,
    type,
    question_text,
    options,
    correct_answer,
    marks,
    explanation,
  });

  res.status(201).json({
    success: true,
    data: question,
  });
});

/**
 * @desc    Get all questions for an exam
 * @route   GET /api/v1/exams/:examId/questions
 * @access  Private
 */
const getExamQuestions = asyncHandler(async (req, res) => {
  const examId = req.params.examId;

  // 1. Fetch Exam and Questions
  const exam = await findExamById(examId);
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }

  // 2. Authorization (Students only see published exam questions)
  if (req.user.role !== 'admin' && !exam.is_published) {
    res.status(403);
    throw new Error('Not authorized to access questions for this exam');
  }

  const allQuestions = await findQuestionsByExamId(examId);
  const totalMarks = allQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);

  // 3. Process and Categorize
  const responseData = {
    exam: {
      id: exam.id,
      title: exam.title,
      duration: exam.duration,
      total_marks: totalMarks
    },
    questions: {
      mcq: [],
      short: [],
      coding: []
    }
  };

  allQuestions.forEach(q => {
    // 4. Student Masking: Remove sensitive fields if not admin
    if (req.user.role !== 'admin') {
      delete q.correct_answer;
      delete q.explanation;
    }

    if (q.type === 'mcq') responseData.questions.mcq.push(q);
    else if (q.type === 'short') responseData.questions.short.push(q);
    else if (q.type === 'coding') responseData.questions.coding.push(q);
  });

  res.status(200).json({
    success: true,
    data: responseData
  });
});

/**
 * @desc    Update question
 * @route   PUT /api/v1/questions/:id
 * @access  Private/Admin
 */
const updateExistingQuestion = asyncHandler(async (req, res) => {
  let question = await findQuestionById(req.params.id);

  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }

  question = await updateQuestion(req.params.id, req.body);

  res.status(200).json({
    success: true,
    data: question,
  });
});

/**
 * @desc    Delete question
 * @route   DELETE /api/v1/questions/:id
 * @access  Private/Admin
 */
const removeQuestion = asyncHandler(async (req, res) => {
  const question = await findQuestionById(req.params.id);

  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }

  await deleteQuestion(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Question deleted successfully',
  });
});

/**
 * @desc    Bulk add questions to exam
 * @route   POST /api/v1/exams/:examId/questions/bulk
 * @access  Private/Admin
 */
const bulkAddQuestions = asyncHandler(async (req, res) => {
  const { questions } = req.body;
  const examId = req.params.examId;

  if (!questions || !Array.isArray(questions)) {
    res.status(400);
    throw new Error('Please provide an array of questions');
  }

  const savedQuestions = [];
  const errors = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    try {
      // Basic normalization of fields
      const type = (q.type || q.Type || 'mcq').toLowerCase();
      const question_text = q.question_text || q['Question Text'];
      const correct_answer = q.correct_answer || q['Correct Answer'];
      const marks = parseInt(q.marks || q.Marks || 1);
      const options = q.options || q.Options;
      const explanation = q.explanation || q.Explanation;

      if (!question_text || !correct_answer) {
        throw new Error(`Row ${i + 1}: Question text and correct answer are required`);
      }

      const saved = await createQuestion({
        exam_id: examId,
        type,
        question_text,
        options,
        correct_answer,
        marks,
        explanation,
      });
      savedQuestions.push(saved);
    } catch (err) {
      errors.push(`Row ${i + 1}: ${err.message}`);
    }
  }

  if (errors.length > 0 && savedQuestions.length === 0) {
    res.status(400);
    throw new Error(`Ingestion failed:\n${errors.join('\n')}`);
  }

  res.status(201).json({
    success: true,
    count: savedQuestions.length,
    errors: errors.length > 0 ? errors : null,
    data: savedQuestions,
  });
});

module.exports = {
  addQuestion,
  getExamQuestions,
  updateExistingQuestion,
  removeQuestion,
  bulkAddQuestions,
};
