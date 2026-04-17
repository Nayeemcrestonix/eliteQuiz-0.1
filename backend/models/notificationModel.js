const { client } = require('../config/db');

/**
 * Create a notification for a user
 */
const createNotification = async (userId, message, type = 'info') => {
  const result = await client.execute({
    sql: 'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?) RETURNING *',
    args: [userId, message, type],
  });
  return result.rows[0];
};

/**
 * Notify all students about something (e.g., new exam)
 */
const notifyAllStudents = async (message, type = 'info') => {
  // Get all students
  const students = await client.execute("SELECT id FROM users WHERE role = 'student'");
  
  for (const student of students.rows) {
    await createNotification(student.id, message, type);
  }
};

/**
 * Get notifications for a user
 */
const findNotificationsByUserId = async (userId) => {
  const result = await client.execute({
    sql: 'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
    args: [userId],
  });
  return result.rows;
};

/**
 * Mark notification as read
 */
const markAsRead = async (id) => {
  await client.execute({
    sql: 'UPDATE notifications SET is_read = 1 WHERE id = ?',
    args: [id],
  });
};

module.exports = {
  createNotification,
  notifyAllStudents,
  findNotificationsByUserId,
  markAsRead,
};
