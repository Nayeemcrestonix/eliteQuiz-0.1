const asyncHandler = require('express-async-handler');
const xlsx = require('xlsx');
const { client } = require('../config/db');
const { 
  createExam, 
  updateExam, 
  deleteExam, 
  findExamById 
} = require('../models/examModel');

/**
 * @desc    Get Admin Dashboard Stats
 * @route   GET /api/v1/admin/dashboard
 * @access  Private/Admin
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  // ... existing stats logic ...
  const examsCountRes = await client.execute('SELECT COUNT(*) as total FROM exams');
  const studentsCountRes = await client.execute("SELECT COUNT(*) as total FROM users WHERE role = 'student'");
  const submissionsCountRes = await client.execute('SELECT COUNT(*) as total FROM attempts WHERE submit_time IS NOT NULL');
  
  const upcomingExamsRes = await client.execute({
    sql: "SELECT id, title, start_time FROM exams WHERE start_time > datetime('now') ORDER BY start_time ASC LIMIT 5",
    args: []
  });

  const recentSubmissionsRes = await client.execute(`
    SELECT 
      a.id, 
      u.name as user_name, 
      e.title as exam_title, 
      a.score, 
      a.submit_time 
    FROM attempts a 
    JOIN users u ON a.user_id = u.id 
    JOIN exams e ON a.exam_id = e.id 
    WHERE a.submit_time IS NOT NULL 
    ORDER BY a.submit_time DESC 
    LIMIT 5
  `);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalExams: examsCountRes.rows[0].total,
        totalStudents: studentsCountRes.rows[0].total,
        totalSubmissions: submissionsCountRes.rows[0].total,
      },
      upcomingExams: upcomingExamsRes.rows,
      recentSubmissions: recentSubmissionsRes.rows,
    },
  });
});

/**
 * @desc    Create a new exam
 * @route   POST /api/v1/admin/exams
 */
const createAdminExam = asyncHandler(async (req, res) => {
  const exam = await createExam(req.body);
  res.status(201).json({ success: true, data: exam });
});

/**
 * @desc    Update an exam (only if draft)
 * @route   PUT /api/v1/admin/exams/:id
 */
const updateAdminExam = asyncHandler(async (req, res) => {
  const exam = await findExamById(req.params.id);
  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
  
  if (exam.is_published) {
    return res.status(400).json({ success: false, message: 'Published exams cannot be edited' });
  }

  const updated = await updateExam(req.params.id, req.body);
  res.status(200).json({ success: true, data: updated });
});

/**
 * @desc    Delete an exam (only if draft)
 * @route   DELETE /api/v1/admin/exams/:id
 */
const deleteAdminExam = asyncHandler(async (req, res) => {
  const examId = req.params.id;
  const exam = await findExamById(examId);
  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

  // 1. Precise Cascading Cleanups (Required for DB Integrity)
  // Remove all student answers for all attempts of this exam
  await client.execute({
    sql: `DELETE FROM answers WHERE attempt_id IN (SELECT id FROM attempts WHERE exam_id = ?)`,
    args: [examId]
  });

  // Remove all attempts for this exam
  await client.execute({
    sql: `DELETE FROM attempts WHERE exam_id = ?`,
    args: [examId]
  });

  // Remove all original questions (The schema has ON DELETE CASCADE but we do it manually for extra safety)
  await client.execute({
    sql: `DELETE FROM questions WHERE exam_id = ?`,
    args: [examId]
  });

  // 2. Final Exam Deletion
  await deleteExam(examId);
  
  res.status(200).json({ 
    success: true, 
    message: 'Exam and all its data have been permanently removed.',
    examId: examId
  });
});

const { notifyAllStudents } = require('../models/notificationModel');

/**
 * @desc    Publish an exam
 * @route   PUT /api/v1/admin/exams/:id/publish
 */
const publishAdminExam = asyncHandler(async (req, res) => {
  const updated = await updateExam(req.params.id, { is_published: 1 });
  
  // Notify all students
  await notifyAllStudents(`New certification released: ${updated.title}`, 'success');
  
  res.status(200).json({ success: true, data: updated });
});

/**
 * @desc    Download Excel Template for Questions
 * @route   GET /api/v1/admin/questions/template
 */
const downloadQuestionTemplate = asyncHandler(async (req, res) => {
  const data = [
    {
      question: "What is 2+2?",
      type: "mcq",
      options: "3 | 4 | 5 | 6",
      correct_answer: "4",
      marks: "1",
      explanation: "Basic arithmetic"
    },
    {
      question: "Explain closure in JS",
      type: "short",
      options: "",
      correct_answer: "",
      marks: "5",
      explanation: ""
    }
  ];

  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.json_to_sheet(data);
  xlsx.utils.book_append_sheet(workbook, worksheet, "Questions");
  
  const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  res.setHeader('Content-Disposition', 'attachment; filename=questions_template.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

const { PDFParse } = require('pdf-parse');

/**
 * @desc    Parse PDF/Excel and categorize questions for preview
 * @route   POST /api/v1/admin/questions/parse
 */
const parseQuestionsForPreview = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const fileType = req.file.originalname.split('.').pop().toLowerCase();
  let questions = [];

  if (fileType === 'pdf') {
    const dataBuffer = req.file.buffer;
    const parser = new PDFParse({ data: dataBuffer });
    
    try {
      const result = await parser.getText();
      const text = result.text;
      
      const sectionAMcq = text.match(/Section A[\s\S]*?(?=Section B|$)/i)?.[0] || text;
      const sectionBShort = text.match(/Section B[\s\S]*?(?=Section C|$)/i)?.[0] || "";
      const sectionCCoding = text.match(/Section C[\s\S]*/i)?.[0] || "";

      // Parse MCQs
      const mcqBlocks = sectionAMcq.split(/(?=Q\d+[:.)]|\d+[:.)])/);
      mcqBlocks.forEach(block => {
        const lines = block.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length < 2) return;
        
        const qText = lines[0].replace(/^(Q\d+[:.)]|\d+[:.)])\s*/i, '');
        const options = [];
        let correctAns = null;
        
        lines.slice(1).forEach(line => {
          if (line.match(/^[A-D][:.)]/i)) {
            options.push(line.replace(/^[A-D][:.)]\s*/i, ''));
          } else if (line.toLowerCase().includes('ans:')) {
            correctAns = line.split(/ans:\s*/i)[1]?.trim() || null;
          }
        });
        
        if (options.length > 0) {
          questions.push({
            type: 'mcq',
            question_text: qText,
            options,
            correct_answer: correctAns,
            marks: 2
          });
        }
      });

      // Parse Short Answers
      if (sectionBShort) {
        const shortBlocks = sectionBShort.split(/(?=Q\d+[:.)]|\d+[:.)])/);
        shortBlocks.forEach(block => {
          const lines = block.split('\n').map(l => l.trim()).filter(l => l);
          if (lines.length === 0) return;
          const qText = lines[0].replace(/^(Q\d+[:.)]|\d+[:.)])\s*/i, '');
          if (qText.length > 5) {
            questions.push({ type: 'short', question_text: qText, marks: 5 });
          }
        });
      }

      // Parse Coding Challenges
      if (sectionCCoding) {
        const codingBlocks = sectionCCoding.split(/(?=Q\d+[:.)]|\d+[:.)])/);
        codingBlocks.forEach(block => {
          const lines = block.split('\n').map(l => l.trim()).filter(l => l);
          if (lines.length === 0) return;
          const qText = lines[0].replace(/^(Q\d+[:.)]|\d+[:.)])\s*/i, '');
          
          const sample_input = block.match(/Input:\s*([\s\S]*?)(?=Output|$)/i)?.[1]?.trim() || "";
          const sample_output = block.match(/Output:\s*([\s\S]*?)(?=Constraints|$)/i)?.[1]?.trim() || "";
          const constraints = block.match(/Constraints:\s*([\s\S]*?)(?=$)/i)?.[1]?.trim() || "";

          if (qText.length > 5) {
            questions.push({
              type: 'coding',
              question_text: qText,
              sample_input,
              sample_output,
              constraints,
              marks: 10
            });
          }
        });
      }
    } finally {
      await parser.destroy();
    }
  } else {
    // Excel logic
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    questions = data.map(item => ({
        type: item.type || 'mcq',
        question_text: item.question || item.question_text,
        options: item.options ? String(item.options).split('|').map(o => o.trim()) : null,
        correct_answer: item.correct_answer || null,
        marks: item.marks || 1,
        sample_input: item.sample_input || null,
        sample_output: item.sample_output || null,
        constraints: item.constraints || null
    }));
  }

  res.status(200).json({ success: true, count: questions.length, data: questions });
});

/**
 * @desc    Bulk Save Questions
 * @route   POST /api/v1/admin/questions/bulk-save
 */
const saveBulkQuestions = asyncHandler(async (req, res) => {
  const { examId, questions } = req.body;
  if (!examId || !questions) return res.status(400).json({ success: false, message: 'Missing examId or questions' });

  const counts = { mcq: 0, short: 0, coding: 0 };

  for (const q of questions) {
    await client.execute({
      sql: `INSERT INTO questions (exam_id, type, question_text, options, correct_answer, marks, sample_input, sample_output, constraints)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        examId,
        q.type,
        q.question_text,
        q.options ? JSON.stringify(q.options) : null,
        q.correct_answer || null,
        q.marks || 1,
        q.sample_input || null,
        q.sample_output || null,
        q.constraints || null
      ]
    });
    counts[q.type]++;
  }

  res.status(200).json({
    success: true,
    examId,
    inserted: counts,
    message: 'Questions uploaded successfully'
  });
});

/**
 * @desc    Get all students (with search)
 * @route   GET /api/v1/admin/students
 */
const getAllAdminStudents = asyncHandler(async (req, res) => {
  const { search } = req.query;
  let sql = `
    SELECT 
      u.id, u.name, u.email, 
      COUNT(a.id) as total_exams,
      COALESCE(AVG(a.score), 0) as avg_score
    FROM users u
    LEFT JOIN attempts a ON u.id = a.user_id AND a.submit_time IS NOT NULL
    WHERE u.role = 'student'
  `;

  let args = [];
  if (search) {
    sql += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
    args.push(`%${search}%`, `%${search}%`);
  }

  sql += ` GROUP BY u.id ORDER BY u.name ASC`;

  const result = await client.execute({ sql, args });
  res.status(200).json({ success: true, data: result.rows });
});

/**
 * @desc    Grant Retake (Clear All Attempts for a student)
 * @route   DELETE /api/v1/admin/students/:id/attempts
 */
const clearStudentAttempts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await client.execute({
    sql: 'DELETE FROM attempts WHERE user_id = ?',
    args: [id]
  });
  res.status(200).json({ success: true, message: 'All attempts cleared. Retake granted.' });
});

/**
 * @desc    Export Students to CSV
 * @route   GET /api/v1/admin/students/export
 */
const exportStudentsCSV = asyncHandler(async (req, res) => {
  const result = await client.execute(`
    SELECT u.name, u.email, COUNT(a.id) as total_exams, AVG(a.score) as avg_score
    FROM users u
    LEFT JOIN attempts a ON u.id = a.user_id AND a.submit_time IS NOT NULL
    WHERE u.role = 'student'
    GROUP BY u.id
  `);

  let csv = 'Name,Email,Exams Taken,Avg Score\n';
  result.rows.forEach(r => {
    csv += `${r.name},${r.email},${r.total_exams},${Number(r.avg_score || 0).toFixed(2)}\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=students_report.csv');
  res.send(csv);
});

/**
 * @desc    Get In-depth Analytics for an Exam
 * @route   GET /api/v1/admin/results/:examId
 */
const getExamResultsAnalytics = asyncHandler(async (req, res) => {
  const { examId } = req.params;

  // 1. Leaderboard
  const leaderboardRes = await client.execute({
    sql: `
      SELECT u.id, u.name, u.email, a.score, a.submit_time
      FROM attempts a
      JOIN users u ON a.user_id = u.id
      WHERE a.exam_id = ? AND a.submit_time IS NOT NULL
      ORDER BY a.score DESC, a.submit_time ASC
      LIMIT 50
    `,
    args: [examId]
  });

  // 2. Score Distribution (0-20, 21-40, 41-60, 61-80, 81-100)
  const distributionRes = await client.execute({
    sql: `
      SELECT 
        CASE 
          WHEN score <= 20 THEN '0-20'
          WHEN score <= 40 THEN '21-40'
          WHEN score <= 60 THEN '41-60'
          WHEN score <= 80 THEN '61-80'
          ELSE '81-100'
        END as range,
        COUNT(*) as count
      FROM attempts
      WHERE exam_id = ? AND submit_time IS NOT NULL
      GROUP BY range
    `,
    args: [examId]
  });

  // 3. Most Failed Questions
  const failedQuestionsRes = await client.execute({
    sql: `
      SELECT q.id, q.question_text, COUNT(ans.id) as fail_count
      FROM questions q
      JOIN answers ans ON q.id = ans.question_id
      WHERE q.exam_id = ? AND ans.is_correct = 0
      GROUP BY q.id
      ORDER BY fail_count DESC
      LIMIT 5
    `,
    args: [examId]
  });

  res.status(200).json({
    success: true,
    data: {
      leaderboard: leaderboardRes.rows,
      distribution: distributionRes.rows,
      failedQuestions: failedQuestionsRes.rows
    }
  });
});

module.exports = {
  getDashboardStats,
  createAdminExam,
  updateAdminExam,
  deleteAdminExam,
  publishAdminExam,
  downloadQuestionTemplate,
  getAllAdminStudents,
  clearStudentAttempts,
  exportStudentsCSV,
  getExamResultsAnalytics,
  parseQuestionsForPreview,
  saveBulkQuestions
};
