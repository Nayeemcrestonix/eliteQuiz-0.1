const { client } = require('../config/db');

/**
 * Create a new question
 * @param {Object} questionData 
 */
const createQuestion = async (questionData) => {
  const {
    exam_id,
    type,
    question_text,
    options, // Should be passed as array/object, will be stringified
    correct_answer,
    marks = 1,
    explanation,
    sample_input,
    sample_output,
    constraints,
  } = questionData;

  const result = await client.execute({
    sql: `INSERT INTO questions (exam_id, type, question_text, options, correct_answer, marks, explanation, sample_input, sample_output, constraints) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    args: [
      exam_id,
      type,
      question_text,
      options ? JSON.stringify(options) : null,
      correct_answer,
      marks ?? 1,
      explanation ?? null,
      sample_input ?? null,
      sample_output ?? null,
      constraints ?? null,
    ],
  });
  
  const question = result.rows[0];
  if (question && question.options) {
    question.options = JSON.parse(question.options);
  }
  return question;
};

/**
 * Get questions by exam ID
 * @param {number|string} examId 
 */
const findQuestionsByExamId = async (examId) => {
  const result = await client.execute({
    sql: 'SELECT * FROM questions WHERE exam_id = ?',
    args: [examId],
  });
  
  return result.rows.map((row) => {
    if (row.options) {
      row.options = JSON.parse(row.options);
    }
    return row;
  });
};

/**
 * Get question by ID
 * @param {number|string} id 
 */
const findQuestionById = async (id) => {
  const result = await client.execute({
    sql: 'SELECT * FROM questions WHERE id = ?',
    args: [id],
  });
  
  const question = result.rows[0];
  if (question && question.options) {
    question.options = JSON.parse(question.options);
  }
  return question;
};

/**
 * Update a question
 * @param {number|string} id 
 * @param {Object} updateData 
 */
const updateQuestion = async (id, updateData) => {
  const fields = Object.keys(updateData);
  const values = Object.values(updateData);
  
  if (fields.length === 0) return null;

  // Handle JSON serialization for options field
  const processedValues = values.map((val, index) => {
    if (fields[index] === 'options' && val !== null) {
      return JSON.stringify(val);
    }
    return val;
  });

  const setClause = fields.map((field) => `${field} = ?`).join(', ');
  const sql = `UPDATE questions SET ${setClause} WHERE id = ? RETURNING *`;
  
  const result = await client.execute({
    sql,
    args: [...processedValues, id],
  });
  
  const question = result.rows[0];
  if (question && question.options) {
    question.options = JSON.parse(question.options);
  }
  return question;
};

/**
 * Delete a question and related answers (manual cascade)
 * @param {number|string} id 
 */
const deleteQuestion = async (id) => {
  // 1. Delete student answers for this question
  await client.execute({
    sql: 'DELETE FROM answers WHERE question_id = ?',
    args: [id]
  });

  // 2. Delete the question itself
  const result = await client.execute({
    sql: 'DELETE FROM questions WHERE id = ? RETURNING *',
    args: [id],
  });
  return result.rows[0];
};

module.exports = {
  createQuestion,
  findQuestionsByExamId,
  findQuestionById,
  updateQuestion,
  deleteQuestion,
};
