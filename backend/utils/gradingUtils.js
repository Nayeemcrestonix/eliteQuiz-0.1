/**
 * Calculate the score for an attempt and grade answers
 * @param {Array} questions - The questions for the exam
 * @param {Array} answers - The student's submitted answers
 * @returns {Object} - { totalScore, gradedAnswers }
 */
const calculateResults = (questions, answers) => {
  let totalScore = 0;
  
  const gradedAnswers = answers.map((ans) => {
    const question = questions.find((q) => q.id === ans.question_id);
    
    if (!question) {
      return { ...ans, is_correct: false, marks_awarded: 0 };
    }

    let isCorrect = false;
    let marksAwarded = 0;
    const questionMarks = question.marks || 1;

    const studentAnsRaw = String(ans.answer || '').trim();
    const correctAnsRaw = String(question.correct_answer || '').trim();

    // Automatic grading for MCQ and Short Answer
    if (question.type === 'mcq' || question.type === 'short') {
      // Normalize: lowercase and collapse spaces
      const normalize = (str) => str.toLowerCase().replace(/\s+/g, ' ').trim();
      
      if (normalize(studentAnsRaw) === normalize(correctAnsRaw)) {
        isCorrect = true;
        marksAwarded = questionMarks;
      }
    } else if (question.type === 'coding') {
      // For coding questions, we match against expected output OR common keywords
      const code = studentAnsRaw.toLowerCase();
      const expected = correctAnsRaw.toLowerCase();
      
      // Multi-layered validation: exact match OR keyword inclusion
      if (code === expected || (expected.length > 0 && code.includes(expected))) {
        isCorrect = true;
        marksAwarded = questionMarks;
      }
    }

    totalScore += marksAwarded;

    return {
      ...ans,
      is_correct: isCorrect,
      marks_awarded: marksAwarded,
    };
  });

  return { totalScore, gradedAnswers };
};

/**
 * Calculate remaining time in seconds
 * @param {string} startTime - ISO string of attempt start
 * @param {number} durationMinutes - Exam duration in minutes
 * @returns {number} - Seconds remaining (clamped to 0)
 */
const getRemainingTime = (startTime, durationMinutes, graceSeconds = 0) => {
  if (!startTime) return (durationMinutes || 0) * 60;
  
  // Normalize SQL timestamp (replace space with T for better parsing)
  const normalizedStart = typeof startTime === 'string' && !startTime.includes('T') 
    ? startTime.replace(' ', 'T') + 'Z' 
    : startTime;

  const start = new Date(normalizedStart).getTime();
  const now = new Date().getTime();
  const durationMs = (durationMinutes || 0) * 60 * 1000;
  const graceMs = (graceSeconds || 0) * 1000;
  
  if (isNaN(start)) return (durationMinutes || 0) * 60;

  const elapsedMs = now - start;
  const totalAllowedMs = durationMs + graceMs;
  const remainingMs = durationMs - elapsedMs; // Standard timer for frontend
  
  // Return standard remaining seconds, but also status
  return {
    remainingSeconds: Math.max(0, Math.floor(remainingMs / 1000)),
    isHardExpired: elapsedMs > totalAllowedMs,
    isGracePeriod: elapsedMs > durationMs && elapsedMs <= totalAllowedMs
  };
};

module.exports = {
  calculateResults,
  getRemainingTime,
};
