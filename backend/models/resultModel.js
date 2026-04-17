const { client } = require('../config/db');

/**
 * Get leaderboard for a specific exam
 * Sorting: Max Score DESC, Min Time Taken ASC, Earliest Submission ASC
 * Only considering one (the best) attempt per user
 * @param {number|string} examId 
 */
const getLeaderboardForExam = async (examId) => {
  const sql = `
    WITH RankedAttempts AS (
      SELECT 
        a.id, a.user_id, u.name as user_name, u.email, e.title as exam_title,
        a.score, a.submit_time,
        (unixepoch(a.submit_time) - unixepoch(a.start_time)) AS time_taken,
        ROW_NUMBER() OVER (
          PARTITION BY a.user_id 
          ORDER BY a.score DESC, (unixepoch(a.submit_time) - unixepoch(a.start_time)) ASC, a.submit_time ASC
        ) as rank_priority
      FROM attempts a
      JOIN users u ON a.user_id = u.id
      JOIN exams e ON a.exam_id = e.id
      WHERE a.exam_id = ? AND a.submit_time IS NOT NULL
    )
    SELECT id, user_id, user_name, email, exam_title, score, submit_time, time_taken
    FROM RankedAttempts
    WHERE rank_priority = 1
    ORDER BY score DESC, time_taken ASC, submit_time ASC
    LIMIT 50
  `;

  const result = await client.execute({ sql, args: [examId] });
  return result.rows;
};

/**
 * Get global leaderboard across all exams
 * Ranking: Max Score DESC, Min Time Taken ASC
 */
const getGlobalLeaderboard = async () => {
  const sql = `
    SELECT 
      u.name as user_name, u.email, e.title as exam_title,
      a.score, (unixepoch(a.submit_time) - unixepoch(a.start_time)) AS time_taken,
      a.submit_time
    FROM attempts a
    JOIN users u ON a.user_id = u.id
    JOIN exams e ON a.exam_id = e.id
    WHERE a.submit_time IS NOT NULL
    ORDER BY a.score DESC, time_taken ASC, a.submit_time ASC
    LIMIT 100
  `;
  const result = await client.execute({ sql, args: [] });
  return result.rows;
};

/**
 * Get overall statistics for an exam
 * @param {number|string} examId 
 */
const getExamAnalytics = async (examId) => {
  const statsSql = `
    SELECT 
      COUNT(*) as total_attempts,
      AVG(score) as average_score,
      MAX(score) as highest_score,
      MIN(score) as lowest_score
    FROM attempts 
    WHERE exam_id = ? AND submit_time IS NOT NULL
  `;
  
  const passFailSql = `
    SELECT 
      SUM(CASE WHEN a.score >= e.passing_score THEN 1 ELSE 0 END) as pass_count,
      SUM(CASE WHEN a.score < e.passing_score THEN 1 ELSE 0 END) as fail_count
    FROM attempts a
    JOIN exams e ON a.exam_id = e.id
    WHERE a.exam_id = ? AND a.submit_time IS NOT NULL
  `;

  const statsResult = await client.execute({ sql: statsSql, args: [examId] });
  const passFailResult = await client.execute({ sql: passFailSql, args: [examId] });

  return {
    ...statsResult.rows[0],
    ...passFailResult.rows[0],
  };
};

/**
 * Get score distribution bins for an exam
 * @param {number|string} examId 
 */
const getScoreDistribution = async (examId) => {
  const sql = `
    SELECT 
      CASE 
        WHEN (score * 100.0 / COALESCE((SELECT SUM(marks) FROM questions WHERE exam_id = ?), 1)) <= 20 THEN '0-20%'
        WHEN (score * 100.0 / COALESCE((SELECT SUM(marks) FROM questions WHERE exam_id = ?), 1)) <= 40 THEN '21-40%'
        WHEN (score * 100.0 / COALESCE((SELECT SUM(marks) FROM questions WHERE exam_id = ?), 1)) <= 60 THEN '41-60%'
        WHEN (score * 100.0 / COALESCE((SELECT SUM(marks) FROM questions WHERE exam_id = ?), 1)) <= 80 THEN '61-80%'
        ELSE '81-100%'
      END as range,
      COUNT(*) as count
    FROM attempts
    WHERE exam_id = ? AND submit_time IS NOT NULL
    GROUP BY range
    ORDER BY range ASC
  `;
  const result = await client.execute({ sql, args: [examId, examId, examId, examId, examId] });
  return result.rows;
};

/**
 * Get a summary of a specific student's performance
 * @param {number|string} userId 
 */
const getUserSummary = async (userId) => {
  const sql = `
    SELECT 
      a.id as attempt_id,
      e.title as exam_title,
      a.score,
      a.start_time,
      a.submit_time,
      (unixepoch(a.submit_time) - unixepoch(a.start_time)) as time_taken,
      CASE WHEN a.score >= e.passing_score THEN 'Pass' ELSE 'Fail' END as status
    FROM attempts a
    JOIN exams e ON a.exam_id = e.id
    WHERE a.user_id = ? AND a.submit_time IS NOT NULL
    ORDER BY a.submit_time DESC
  `;

  const result = await client.execute({
    sql,
    args: [userId],
  });
  return result.rows;
};

/**
 * Get statistics for all students (Admin Dashboard)
 * Returns: name, email, total exams taken, avg percentage
 * @param {string} search string for name or email filtering
 */
const getAllStudentStats = async (search = '') => {
  let sql = `
    SELECT 
      u.id,
      u.name,
      u.email,
      u.created_at,
      COUNT(a.id) as total_exams,
      COALESCE(AVG(a.score), 0) as avg_score
    FROM users u
    LEFT JOIN attempts a ON u.id = a.user_id AND a.submit_time IS NOT NULL
    WHERE u.role = 'student'
  `;

  const args = [];
  if (search) {
    sql += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
    args.push(`%${search}%`, `%${search}%`);
  }

  sql += `
    GROUP BY u.id
    ORDER BY u.created_at DESC, total_exams DESC
  `;

  const result = await client.execute({ sql, args });
  return result.rows;
};

/**
 * Get an overall summary for the admin dashboard
 */
const getAdminSummary = async () => {
  const statsSql = `
    SELECT 
      (SELECT COUNT(*) FROM exams) as totalExams,
      (SELECT COUNT(*) FROM users WHERE role = 'student') as totalStudents,
      (SELECT COUNT(*) FROM attempts WHERE submit_time IS NOT NULL) as totalSubmissions,
      (SELECT AVG(score) FROM attempts WHERE submit_time IS NOT NULL) as avgScore
    FROM (SELECT 1)
  `;
  
  const passRateSql = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN a.score >= e.passing_score THEN 1 ELSE 0 END) as passCount
    FROM attempts a
    JOIN exams e ON a.exam_id = e.id
    WHERE a.submit_time IS NOT NULL
  `;

  const stats = await client.execute(statsSql);
  const passRate = await client.execute(passRateSql);

  const total = passRate.rows[0].total || 1;
  const passCount = passRate.rows[0].passCount || 0;

  return {
    ...stats.rows[0],
    passRate: (passCount / total) * 100,
    failRate: ((total - passCount) / total) * 100
  };
};

/**
 * Get aggregated stats for the student dashboard
 * @param {number|string} userId 
 */
const getStudentDashboardStats = async (userId) => {
  // 1. Upcoming & Live Exams (Scheduled Windows)
  const upcomingSql = `
    SELECT e.*, 
    (SELECT COUNT(*) FROM questions q WHERE q.exam_id = e.id) as question_count,
    (SELECT id FROM attempts WHERE user_id = ? AND exam_id = e.id AND submit_time IS NOT NULL LIMIT 1) as attempt_id
    FROM exams e 
    WHERE e.is_published = 1 AND (e.end_time > datetime('now') OR e.end_time IS NULL)
    ORDER BY e.start_time ASC
  `;
  const upcomingRes = await client.execute({ sql: upcomingSql, args: [userId] });
  const allUpcoming = upcomingRes.rows;

  // Categorize for summary
  const liveCount = allUpcoming.filter(e => new Date(e.start_time) <= new Date()).length;
  const totalUpcoming = allUpcoming.length;

  // 2. Recent Results with Marks
  const resultsSql = `
    SELECT 
      a.id, e.title as exam_title, a.score, a.submit_time,
      (SELECT SUM(marks) FROM questions q WHERE q.exam_id = e.id) as total_marks,
      CASE WHEN a.score >= e.passing_score THEN 'Pass' ELSE 'Fail' END as status
    FROM attempts a
    JOIN exams e ON a.exam_id = e.id
    WHERE a.user_id = ? AND a.submit_time IS NOT NULL
    ORDER BY a.submit_time DESC
  `;
  const resultsRes = await client.execute({ sql: resultsSql, args: [userId] });
  const allResults = resultsRes.rows;
  const totalCompleted = allResults.length;
  const lastScore = allResults.length > 0 ? allResults[0].score : 'N/A';

  // 3. Find Rank in Latest Exam
  let lastExamRank = null;
  try {
    if (allResults.length > 0) {
      const latestAttempt = allResults[0];
      const leaderboard = await getLeaderboardForExam(latestAttempt.exam_id || (await client.execute({sql: 'SELECT exam_id FROM attempts WHERE id = ?', args: [latestAttempt.id]})).rows[0].exam_id);
      const userRank = leaderboard.findIndex(r => r.id == latestAttempt.id) + 1;
      
      lastExamRank = {
          examTitle: latestAttempt.exam_title,
          rank: userRank > 0 ? userRank : 'N/A',
          score: latestAttempt.score,
          totalStudents: leaderboard.length
      };
    }
  } catch (rankErr) {
    console.warn('Rank calculation skipped:', rankErr.message);
  }

  // 4. Notifications
  const notifications = await client.execute({
    sql: 'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT 5',
    args: [userId]
  });

  return {
    summary: {
        totalUpcoming,
        liveCount,
        totalCompleted,
        lastScore,
        currentRank: lastExamRank ? `#${lastExamRank.rank}` : 'N/A'
    },
    upcoming: allUpcoming.slice(0, 5), // Only top 5 for dashboard
    results: allResults.slice(0, 5),
    lastExamRank,
    notifications: notifications.rows
  };
};

/**
 * Get detailed audit for a single attempt (Question + User Answer + Correct Answer)
 * @param {number|string} attemptId 
 */
const getAttemptAudit = async (attemptId) => {
  const sql = `
    SELECT 
      q.question_text,
      q.type,
      q.correct_answer,
      q.explanation,
      a.answer as user_answer,
      CASE WHEN a.is_correct = 1 THEN 'Correct' ELSE 'Incorrect' END as status,
      q.marks
    FROM answers a
    JOIN questions q ON a.question_id = q.id
    WHERE a.attempt_id = ?
  `;
  const result = await client.execute({ sql, args: [attemptId] });
  return result.rows;
};

/**
 * Get questions with the highest failure rates for an exam
 * @param {number|string} examId 
 */
const getMostMissedQuestions = async (examId) => {
  const sql = `
    SELECT 
      q.question_text,
      COUNT(a.id) as total_attempts,
      SUM(CASE WHEN a.is_correct = 0 THEN 1 ELSE 0 END) as failure_count,
      CAST(SUM(CASE WHEN a.is_correct = 0 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(a.id) * 100 as failure_rate
    FROM questions q
    JOIN answers a ON q.id = a.question_id
    WHERE q.exam_id = ?
    GROUP BY q.id
    HAVING total_attempts > 0
    ORDER BY failure_rate DESC
    LIMIT 5
  `;
  const result = await client.execute({ sql, args: [examId] });
  return result.rows;
};

/**
 * Get unread notifications for a user
 * @param {number|string} userId 
 */
const getNotifications = async (userId) => {
  const result = await client.execute({
    sql: 'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC',
    args: [userId],
  });
  return result.rows;
};

/**
 * Get trend data for a student (last 5 exam scores)
 * @param {number|string} userId 
 */
const getTrendData = async (userId) => {
  const sql = `
    SELECT e.title, a.score, a.submit_time
    FROM attempts a
    JOIN exams e ON a.exam_id = e.id
    WHERE a.user_id = ? AND a.submit_time IS NOT NULL
    ORDER BY a.submit_time DESC
    LIMIT 5
  `;
  const result = await client.execute({ sql, args: [userId] });
  return result.rows.reverse(); // Chronological order for chart
};

/**
 * Get detailed analysis for a specific student (Admin only)
 * @param {number|string} userId 
 */
const getStudentAnalysis = async (userId) => {
  const [user, attempts, stats] = await Promise.all([
    client.execute({ sql: 'SELECT id, name, email FROM users WHERE id = ?', args: [userId] }),
    client.execute({ 
      sql: `SELECT a.id as attempt_id, e.title as exam_title, a.score, a.submit_time, 
            CASE WHEN a.score >= e.passing_score THEN 'Pass' ELSE 'Fail' END as status
            FROM attempts a JOIN exams e ON a.exam_id = e.id 
            WHERE a.user_id = ? AND a.submit_time IS NOT NULL ORDER BY a.submit_time DESC`, 
      args: [userId] 
    }),
    client.execute({
      sql: `SELECT COUNT(DISTINCT a.exam_id) as total_exams, AVG(a.score) as avg_score,
            SUM(CASE WHEN a.score < e.passing_score THEN 1 ELSE 0 END) * 100.0 / COUNT(a.id) as fail_rate
            FROM attempts a JOIN exams e ON a.exam_id = e.id
            WHERE a.user_id = ? AND a.submit_time IS NOT NULL`,
      args: [userId]
    })
  ]);

  return {
    user: user.rows[0],
    attempts: attempts.rows,
    stats: stats.rows[0]
  };
};

/**
 * Delete all attempts for a specific student (Grant Retake)
 * @param {number|string} userId 
 */
const deleteStudentAttempts = async (userId) => {
  await client.execute({ sql: 'DELETE FROM answers WHERE attempt_id IN (SELECT id FROM attempts WHERE user_id = ?)', args: [userId] });
  await client.execute({ sql: 'DELETE FROM attempts WHERE user_id = ?', args: [userId] });
};

module.exports = {
  getLeaderboardForExam,
  getGlobalLeaderboard,
  getExamAnalytics,
  getUserSummary,
  getAdminSummary,
  getAllStudentStats,
  getStudentDashboardStats,
  getAttemptAudit,
  getMostMissedQuestions,
  getNotifications,
  getTrendData,
  getStudentAnalysis,
  deleteStudentAttempts,
  getScoreDistribution
};
