const { client } = require('./config/db');

async function seedMultisection() {
  try {
    const result = await client.execute({
      sql: 'INSERT INTO exams (title, duration, passing_score, is_published) VALUES (?, ?, ?, ?) RETURNING id',
      args: ['Full-Stack Engineering Certification', 120, 60, 1]
    });
    const id = result.rows[0].id;
    
    // MCQ SECTION
    const mcqs = [
      { type: 'mcq', q: 'Which of these is NOT a React Hook?', opts: ['useState', 'useEffect', 'useServer', 'useContext'], ans: 'useServer' },
      { type: 'mcq', q: 'What is the purpose of the virtual DOM?', opts: ['Faster page loads', 'Efficient UI updates', 'Reducing CSS size', 'Server-side rendering'], ans: 'Efficient UI updates' }
    ];
    for (const q of mcqs) {
      await client.execute({
        sql: 'INSERT INTO questions (exam_id, type, question_text, options, correct_answer, marks) VALUES (?, ?, ?, ?, ?, ?)',
        args: [id, q.type, q.q, JSON.stringify(q.opts), q.ans, 5]
      });
    }

    // SHORT ANSWER SECTION
    await client.execute({
      sql: 'INSERT INTO questions (exam_id, type, question_text, correct_answer, marks) VALUES (?, ?, ?, ?, ?)',
      args: [id, 'short', 'Explain the concept of Closure in JavaScript.', 'Closure', 10]
    });

    // CODING SECTION
    await client.execute({
      sql: 'INSERT INTO questions (exam_id, type, question_text, correct_answer, marks, explanation) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, 'coding', 'Write a function to reverse a string.', 'reverse', 20, 'Example: reverseString("hello") -> "olleh"']
    });

    console.log('Multi-section exam seeded with ID:', id);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedMultisection();
