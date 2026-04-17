const asyncHandler = require('express-async-handler');
const {
  createAttempt,
  findAttemptById,
  updateAttempt,
  findAttemptsByUserId,
  findActiveAttempt,
  getDetailedReview,
} = require('../models/attemptModel');
const { saveAnswer, findAnswersByAttemptId, bulkUpdateGradedAnswers } = require('../models/answerModel');
const { createNotification } = require('../models/notificationModel');
const { findExamById } = require('../models/examModel');
const { findQuestionsByExamId } = require('../models/questionModel');
const { calculateResults, getRemainingTime } = require('../utils/gradingUtils');

/**
 * @desc    Start an exam attempt
 * @route   POST /api/v1/attempts
 * @access  Private
 */
const startExamAttempt = asyncHandler(async (req, res) => {
  const { examId } = req.body;
  const userId = req.user.id;

  // Check if exam exists and is published
  const exam = await findExamById(examId);
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }

  if (!exam.is_published && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('This examination protocol is not yet authorized for deployment.');
  }

  const now = new Date();
  const examStart = exam.start_time ? new Date(exam.start_time) : null;
  const examEnd = exam.end_time ? new Date(exam.end_time) : null;

  if (examStart && now < examStart && req.user.role !== 'admin') {
    res.status(403);
    throw new Error(`Temporal synchronization failed. This examination will become live at ${examStart.toLocaleString()}.`);
  }

  if (examEnd && now > examEnd && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('This examination window has officially closed.');
  }

  // Check for existing submitted attempts for this user/exam
  const existingAttempts = await findAttemptsByUserId(userId);
  const alreadySubmitted = existingAttempts.find(a => a.exam_id == examId && a.submit_time);
  
  if (alreadySubmitted && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Re-attempt not allowed. You have already submitted this exam.');
  }

  // Check for existing active attempt
  let attempt = await findActiveAttempt(userId, examId);
  let answers = [];

  if (attempt) {
    // Check if expired
    const timing = getRemainingTime(attempt.start_time, attempt.duration, 30);
    if (timing.isHardExpired) {
      // Auto-finalize and reject
      await finalizeAttemptLogic(attempt, null, true);
      res.status(403);
      throw new Error('This examination session has reached institutional deadlines and is now closed.');
    } else {
      // Fetch already saved answers
      answers = await findAnswersByAttemptId(attempt.id);
    }
  }

  if (!attempt) {
    // Check if there was any attempt at all (to respect "finished" state)
    if (alreadySubmitted) {
        res.status(403);
        throw new Error('Submission finalized. Cannot re-initialize.');
    }
    // Create new attempt
    attempt = await createAttempt(userId, examId);
  }

  const timing = getRemainingTime(attempt.start_time, exam.duration, 30);

  res.status(201).json({
    success: true,
    data: {
      ...attempt,
      exam_title: exam.title,
      duration: exam.duration,
      remaining_time: timing.remainingSeconds,
      is_grace_period: timing.isGracePeriod,
      answers: answers.map(a => ({ question_id: a.question_id, answer: a.answer })),
    },
  });
});

/**
 * @desc    Get current attempt status/timer
 * @route   GET /api/v1/attempts/:id
 * @access  Private
 */
const getAttemptStatus = asyncHandler(async (req, res) => {
  const attempt = await findAttemptById(req.params.id);

  if (!attempt) {
    res.status(404);
    throw new Error('Attempt not found');
  }

  // Security check: only the user who started the attempt (or admin) can see it
  if (attempt.user_id !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to access this attempt');
  }

  const timing = attempt.submit_time 
    ? { remainingSeconds: 0, isHardExpired: true, isGracePeriod: false }
    : getRemainingTime(attempt.start_time, attempt.duration, 30);

  res.status(200).json({
    success: true,
    data: {
      ...attempt,
      remaining_time: timing.remainingSeconds,
      is_expired: timing.isHardExpired && !attempt.submit_time,
      is_grace_period: timing.isGracePeriod
    },
  });
});

/**
 * @desc    Submit an answer
 * @route   POST /api/v1/attempts/:id/answers
 * @access  Private
 */
const submitQuestionAnswer = asyncHandler(async (req, res) => {
  const { questionId, answer, last_question_idx, flagged_questions } = req.body;
  const attemptId = req.params.id;

  const attempt = await findAttemptById(attemptId);
  if (!attempt) {
    res.status(404);
    throw new Error('Attempt not found');
  }

  if (attempt.submit_time) {
    res.status(400);
    throw new Error('Exam already submitted');
  }

  // Timer Enforcement (30s Grace Period)
  const timing = getRemainingTime(attempt.start_time, attempt.duration, 30);
  if (timing.isHardExpired) {
    return await finalizeAttemptLogic(attempt, res, true);
  }

  // Save the answer
  if (questionId) {
    await saveAnswer({
        attempt_id: attemptId,
        question_id: questionId,
        answer,
    });
  }

  // Update session state
  const updates = {};
  if (last_question_idx !== undefined) updates.last_question_idx = last_question_idx;
  if (flagged_questions !== undefined) updates.flagged_questions = JSON.stringify(flagged_questions);
  
  if (Object.keys(updates).length > 0) {
    await updateAttempt(attemptId, updates);
  }

  res.status(200).json({
    success: true,
    message: 'Progress preserved.',
    remaining_time: timing.remainingSeconds,
  });
});

/**
 * @desc    Finalize attempt (Manual Submit)
 * @route   POST /api/v1/attempts/:id/submit
 * @access  Private
 */
const submitExam = asyncHandler(async (req, res) => {
  const attempt = await findAttemptById(req.params.id);
  
  if (!attempt) {
    res.status(404);
    throw new Error('Attempt not found');
  }

  if (attempt.submit_time) {
    res.status(400);
    throw new Error('Exam already submitted');
  }

  await finalizeAttemptLogic(attempt, res, false);
});

/**
 * Shared logic to finalize and grade an attempt
 */
const finalizeAttemptLogic = async (attempt, res, isAutoSubmit) => {
  const questions = await findQuestionsByExamId(attempt.exam_id);
  const answers = await findAnswersByAttemptId(attempt.id);

  // Grade the attempt
  const { totalScore, gradedAnswers } = calculateResults(questions, answers);

  // Update answers with grading info
  await bulkUpdateGradedAnswers(gradedAnswers);

  // Calculate Aggregated Metrics
  const totalPossibleMarks = questions.reduce((acc, q) => acc + (q.marks || 1), 0);
  const percentage = totalPossibleMarks > 0 ? (totalScore * 100) / totalPossibleMarks : 0;
  
  const exam = await findExamById(attempt.exam_id);
  const passStatus = percentage >= (exam.passing_score || 40) ? 'Passed' : 'Failed';

  // Calculate Time Taken (Seconds)
  const startTime = new Date(attempt.start_time).getTime();
  const endTime = new Date().getTime();
  const timeTakenSeconds = Math.floor((endTime - startTime) / 1000);

  // Update Attempt record with all PRD-required fields
  const updatedAttempt = await updateAttempt(attempt.id, {
    submit_time: new Date().toISOString(),
    score: totalScore,
    total_marks: totalPossibleMarks,
    percentage: parseFloat(percentage.toFixed(2)),
    pass_fail_status: passStatus,
    time_taken_seconds: timeTakenSeconds,
    auto_submitted: isAutoSubmit ? 1 : 0,
  });

  // Notify the student immediately
  await createNotification(
    attempt.user_id, 
    `Certification Complete: ${exam.title}. Score: ${totalScore}/${totalPossibleMarks} (${passStatus})`, 
    passStatus === 'Passed' ? 'success' : 'warning'
  );

  if (res) {
    res.status(200).json({
      success: true,
      message: isAutoSubmit ? 'Time expired. Exam auto-submitted.' : 'Certification protocol successfully finalized.',
      data: {
        ...updatedAttempt,
        score: totalScore,
        total_marks: totalPossibleMarks,
        percentage: percentage.toFixed(2),
        status: passStatus
      },
    });
  }
  return updatedAttempt;
};

/**
 * @desc    Get user's attempts
 * @route   GET /api/v1/attempts
 * @access  Private
 */
const getMyAttempts = asyncHandler(async (req, res) => {
  const attempts = await findAttemptsByUserId(req.user.id);
  res.status(200).json({
    success: true,
    data: attempts,
  });
});

/**
 * @desc    Get detailed attempt review
 * @route   GET /api/v1/attempts/:id/review
 * @access  Private
 */
const getAttemptReviewDetails = asyncHandler(async (req, res) => {
  const attempt = await findAttemptById(req.params.id);
  
  if (!attempt) {
    res.status(404);
    throw new Error('Attempt not found');
  }

  // Security check
  if (attempt.user_id !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }

  const review = await getDetailedReview(req.params.id);

  res.status(200).json({
    success: true,
    data: {
      attempt,
      review,
    },
  });
});

module.exports = {
  startExamAttempt,
  getAttemptStatus,
  submitQuestionAnswer,
  submitExam,
  getMyAttempts,
  getAttemptReviewDetails,
};
