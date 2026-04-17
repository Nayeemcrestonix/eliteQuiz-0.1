const { client } = require('../config/db');

/**
 * Find user by email
 * @param {string} email 
 */
const findUserByEmail = async (email) => {
  const result = await client.execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: [email],
  });
  return result.rows[0];
};

/**
 * Find user by ID
 * @param {number|string} id 
 */
const findUserById = async (id) => {
  const result = await client.execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [id],
  });
  return result.rows[0];
};

/**
 * Create a new user
 * @param {Object} userData 
 */
const createUser = async (userData) => {
  const { name, email, password, role = 'student' } = userData;
  const result = await client.execute({
    sql: 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?) RETURNING *',
    args: [name, email, password, role],
  });
  return result.rows[0];
};

/**
 * Update user data
 * @param {number|string} id 
 * @param {Object} userData 
 */
const updateUser = async (id, userData) => {
  const { name, email } = userData;
  const result = await client.execute({
    sql: 'UPDATE users SET name = ?, email = ? WHERE id = ? RETURNING *',
    args: [name, email, id],
  });
  return result.rows[0];
};

/**
 * Update user password
 * @param {number|string} id 
 * @param {string} hashedPassword 
 */
const updatePassword = async (id, hashedPassword) => {
  await client.execute({
    sql: 'UPDATE users SET password = ? WHERE id = ?',
    args: [hashedPassword, id],
  });
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  updatePassword,
};
