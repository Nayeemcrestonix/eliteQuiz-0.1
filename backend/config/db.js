const { createClient } = require('@libsql/client');
const config = require('./config');

const client = createClient({
  url: config.db.url,
  authToken: config.db.authToken,
});

/**
 * Connect to Turso Database
 * This is a helper to verify connection on startup
 */
const connectDB = async () => {
  try {
    // Basic query to check connection
    await client.execute('SELECT 1');
    console.log('Connected to Turso Database successfully.');

    // Initialize Tables
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'student')) DEFAULT 'student',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS exams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        duration INTEGER,
        start_time DATETIME,
        end_time DATETIME,
        passing_score INTEGER DEFAULT 0,
        is_published BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
        type TEXT CHECK(type IN ('mcq', 'short', 'coding')),
        question_text TEXT NOT NULL,
        options TEXT,
        correct_answer TEXT,
        marks INTEGER DEFAULT 1,
        explanation TEXT,
        sample_input TEXT,
        sample_output TEXT,
        constraints TEXT
      )
    `);

    // Migration for existing tables: Try to add new columns if they don't exist
    try { await client.execute('ALTER TABLE questions ADD COLUMN sample_input TEXT'); } catch (e) {}
    try { await client.execute('ALTER TABLE questions ADD COLUMN sample_output TEXT'); } catch (e) {}
    try { await client.execute('ALTER TABLE questions ADD COLUMN constraints TEXT'); } catch (e) {}

    await client.execute(`
      CREATE TABLE IF NOT EXISTS attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        exam_id INTEGER REFERENCES exams(id),
        start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        submit_time DATETIME,
        score INTEGER DEFAULT 0,
        auto_submitted BOOLEAN DEFAULT 0,
        last_question_idx INTEGER DEFAULT 0,
        flagged_questions TEXT DEFAULT '[]'
      )
    `);

    // Migration for attempts table
    try { await client.execute('ALTER TABLE attempts ADD COLUMN last_question_idx INTEGER DEFAULT 0'); } catch (e) {}
    try { await client.execute("ALTER TABLE attempts ADD COLUMN flagged_questions TEXT DEFAULT '[]'"); } catch (e) {}
    try { await client.execute("ALTER TABLE attempts ADD COLUMN total_marks INTEGER DEFAULT 0"); } catch (e) {}
    try { await client.execute("ALTER TABLE attempts ADD COLUMN percentage REAL DEFAULT 0"); } catch (e) {}
    try { await client.execute("ALTER TABLE attempts ADD COLUMN pass_fail_status TEXT"); } catch (e) {}
    try { await client.execute("ALTER TABLE attempts ADD COLUMN time_taken_seconds INTEGER"); } catch (e) {}

    await client.execute(`
      CREATE TABLE IF NOT EXISTS answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        attempt_id INTEGER REFERENCES attempts(id) ON DELETE CASCADE,
        question_id INTEGER REFERENCES questions(id),
        answer TEXT,
        is_correct BOOLEAN,
        marks_awarded INTEGER
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        message TEXT NOT NULL,
        type TEXT CHECK(type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
        is_read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database tables initialized.');
  } catch (error) {
    console.error('Turso Connection/Initialization Error:', error.message);
    if (config.env === 'production') {
      process.exit(1);
    }
  }
};

module.exports = {
  client,
  connectDB,
};
