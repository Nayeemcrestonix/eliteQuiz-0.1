const { client } = require('../config/db');

/**
 * Create a new exam attempt
 * @param {number|string} userId 
 * @param {number|string} examId 
 */
const createAttempt = async (userId, examId) => {
  const result = await client.execute({
    sql: `INSERT INTO attempts (user_id, exam_id, start_time) 
          VALUES (?, ?, CURRENT_TIMESTAMP) 
          RETURNING *`,
    args: [userId, examId],
  });
  return result.rows[0];
};

/**
 * Find attempt by ID with exam details
 * @param {number|string} id 
 */
const findAttemptById = async (id) => {
  const result = await client.execute({
    sql: `SELECT a.*, e.duration, e.title as exam_title,
          (SELECT SUM(marks) FROM questions WHERE exam_id = a.exam_id) as total_marks
          FROM attempts a 
          JOIN exams e ON a.exam_id = e.id 
          WHERE a.id = ?`,
    args: [id],
  });
  return result.rows[0];
};

/**
 * Update exam attempt
 * @param {number|string} id 
 * @param {Object} updateData 
 */
const updateAttempt = async (id, updateData) => {
  const fields = Object.keys(updateData);
  const values = Object.values(updateData);
  
  if (fields.length === 0) return null;

  const setClause = fields.map((field) => `${field} = ?`).join(', ');
  const sql = `UPDATE attempts SET ${setClause} WHERE id = ? RETURNING *`;
  
  const result = await client.execute({
    sql,
    args: [...values, id],
  });
  return result.rows[0];
};

/**
 * Find an active (unsubmitted) attempt for user/exam
 * @param {number|string} userId 
 * @param {number|string} examId 
 */
const findActiveAttempt = async (userId, examId) => {
  const result = await client.execute({
    sql: `SELECT a.*, e.duration 
          FROM attempts a 
          JOIN exams e ON a.exam_id = e.id 
          WHERE a.user_id = ? AND a.exam_id = ? AND a.submit_time IS NULL
          ORDER BY a.start_time DESC LIMIT 1`,
    args: [userId, examId],
  });
  return result.rows[0];
};

/**
 * Find all attempts for a specific user
 * @param {number|string} userId 
 */
const findAttemptsByUserId = async (userId) => {
  const result = await client.execute({
    sql: `SELECT a.*, e.title as exam_title 
          FROM attempts a 
          JOIN exams e ON a.exam_id = e.id 
          WHERE a.user_id = ? 
          ORDER BY a.start_time DESC`,
    args: [userId],
  });
  return result.rows;
};

/**
 * Get detailed review data (questions + answers + correct info)
 * @param {number|string} id 
 */
const getDetailedReview = async (id) => {
  const result = await client.execute({
    sql: `SELECT 
            q.question_text, q.type, q.options, q.correct_answer, q.explanation, q.marks,
            ans.answer as user_answer, 
            ans.is_correct, 
            ans.marks_awarded as marks_earned,
            CASE WHEN ans.is_correct = 1 THEN 'Correct' ELSE 'Incorrect' END as status
          FROM answers ans
          JOIN questions q ON ans.question_id = q.id
          WHERE ans.attempt_id = ?`,
    args: [id],
  });
  return result.rows;
};

module.exports = {
  createAttempt,
  findAttemptById,
  updateAttempt,
  findAttemptsByUserId,
  findActiveAttempt,
  getDetailedReview,
};
