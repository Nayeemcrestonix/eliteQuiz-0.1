const { client } = require('../config/db');

/**
 * Create a new exam
 * @param {Object} examData 
 */
const createExam = async (examData) => {
  const { title, duration, start_time, end_time, passing_score, is_published = 0 } = examData;
  const result = await client.execute({
    sql: `INSERT INTO exams (title, duration, start_time, end_time, passing_score, is_published) 
          VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
    args: [
      title, 
      duration, 
      start_time ?? null, 
      end_time ?? null, 
      passing_score ?? 0, 
      is_published ?? 0
    ],
  });
  return result.rows[0];
};

/**
 * Get all exams
 * @param {Object} filter - Filter by is_published, etc.
 */
const findAllExams = async (filter = {}) => {
  let sql = `
    SELECT 
      e.*,
      COUNT(a.id) as attempt_count,
      COALESCE(AVG(a.score), 0) as avg_score
    FROM exams e
    LEFT JOIN attempts a ON e.id = a.exam_id AND a.submit_time IS NOT NULL
  `;
  let args = [];

  if (filter.is_published !== undefined) {
    sql += ' WHERE e.is_published = ?';
    args.push(filter.is_published);
  }

  sql += ' GROUP BY e.id ORDER BY e.created_at DESC';

  const result = await client.execute({ sql, args });
  return result.rows;
};

/**
 * Get exam by ID
 * @param {number|string} id 
 */
const findExamById = async (id) => {
  const result = await client.execute({
    sql: 'SELECT * FROM exams WHERE id = ?',
    args: [id],
  });
  return result.rows[0];
};

/**
 * Update an exam
 * @param {number|string} id 
 * @param {Object} updateData 
 */
const updateExam = async (id, updateData) => {
  const fields = Object.keys(updateData);
  const values = Object.values(updateData);
  
  if (fields.length === 0) return null;

  const setClause = fields.map((field) => `${field} = ?`).join(', ');
  const sql = `UPDATE exams SET ${setClause} WHERE id = ? RETURNING *`;
  
  const result = await client.execute({
    sql,
    args: [...values, id],
  });
  return result.rows[0];
};

/**
 * Delete an exam and all related data (cascade)
 * @param {number|string} id 
 */
const deleteExam = async (id) => {
  // 1. Delete student answers associated with this exam's attempts
  await client.execute({
    sql: `DELETE FROM answers WHERE attempt_id IN (SELECT id FROM attempts WHERE exam_id = ?)`,
    args: [id]
  });

  // 2. Delete all attempts for this exam
  await client.execute({
    sql: `DELETE FROM attempts WHERE exam_id = ?`,
    args: [id]
  });

  // 3. Delete all questions for this exam
  await client.execute({
    sql: `DELETE FROM questions WHERE exam_id = ?`,
    args: [id]
  });

  // 4. Finally, delete the exam record itself
  const result = await client.execute({
    sql: 'DELETE FROM exams WHERE id = ? RETURNING *',
    args: [id],
  });
  return result.rows[0];
};

module.exports = {
  createExam,
  findAllExams,
  findExamById,
  updateExam,
  deleteExam,
};
