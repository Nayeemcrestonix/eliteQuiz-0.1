const { client } = require('../config/db');

/**
 * Save or update an answer for a question in an attempt
 * @param {Object} answerData 
 */
const saveAnswer = async (answerData) => {
  const { attempt_id, question_id, answer } = answerData;

  // Check if answer already exists for this question in this attempt
  const existing = await client.execute({
    sql: 'SELECT id FROM answers WHERE attempt_id = ? AND question_id = ?',
    args: [attempt_id, question_id],
  });

  if (existing.rows.length > 0) {
    // Update existing answer
    const result = await client.execute({
      sql: 'UPDATE answers SET answer = ? WHERE attempt_id = ? AND question_id = ? RETURNING *',
      args: [answer, attempt_id, question_id],
    });
    return result.rows[0];
  } else {
    // Insert new answer
    const result = await client.execute({
      sql: 'INSERT INTO answers (attempt_id, question_id, answer) VALUES (?, ?, ?) RETURNING *',
      args: [attempt_id, question_id, answer],
    });
    return result.rows[0];
  }
};

/**
 * Find all answers for a specific attempt
 * @param {number|string} attemptId 
 */
const findAnswersByAttemptId = async (attemptId) => {
  const result = await client.execute({
    sql: 'SELECT * FROM answers WHERE attempt_id = ?',
    args: [attemptId],
  });
  return result.rows;
};

/**
 * Bulk update answers with grading info
 * @param {Array} gradedAnswers 
 */
const bulkUpdateGradedAnswers = async (gradedAnswers) => {
  // SQLite/Libsql helper for bulk updates can be complex with standard execute
  // For now, we'll perform them in a transaction or loop (depending on scale)
  const statements = gradedAnswers.map((ans) => ({
    sql: 'UPDATE answers SET is_correct = ?, marks_awarded = ? WHERE id = ?',
    args: [ans.is_correct ? 1 : 0, ans.marks_awarded, ans.id],
  }));

  await client.batch(statements);
};

module.exports = {
  saveAnswer,
  findAnswersByAttemptId,
  bulkUpdateGradedAnswers,
};
