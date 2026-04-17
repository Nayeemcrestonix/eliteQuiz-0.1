const axios = require('axios');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzc2MjQ5ODk1LCJleHAiOjE3Nzg4NDE4OTV9.YT5ujCo5cdMJPJQEHyExhHjV_7ql4M49TsDvGMxc9d4';
const API_URL = 'http://localhost:5000/api/v1';

const exams = [
    {
        title: 'JavaScript Basics',
        duration: 30,
        passing_score: 50,
        is_published: 1,
        questions: [
            { type: 'mcq', question_text: 'What is the correct way to write a JavaScript array?', options: ['var txt = new Array(1:\"tim\",2:\"kim\")', 'var txt = new Array:1=(\"tim\")2=(\"kim\")', 'var txt = [\"tim\",\"kim\"]', 'var txt = (1:\"tim\",2:\"kim\")'], correct_answer: 'var txt = [\"tim\",\"kim\"]', marks: 10 },
            { type: 'mcq', question_text: 'Which operator is used to assign a value to a variable?', options: ['*', 'x', '-', '='], correct_answer: '=', marks: 10 },
            { type: 'mcq', question_text: 'How do you create a function in JavaScript?', options: ['function myFunction()', 'function:myFunction()', 'function = myFunction()', 'myFunction()'], correct_answer: 'function myFunction()', marks: 10 },
            { type: 'mcq', question_text: 'How to write an IF statement in JavaScript?', options: ['if i = 5 then', 'if i == 5 then', 'if (i == 5)', 'if i = 5'], correct_answer: 'if (i == 5)', marks: 10 },
            { type: 'mcq', question_text: 'Which event occurs when the user clicks on an HTML element?', options: ['onclick', 'onmouseclick', 'onchange', 'onmouseover'], correct_answer: 'onclick', marks: 10 }
        ]
    },
    {
        title: 'HTML & CSS Fundamentals',
        duration: 25,
        passing_score: 40,
        is_published: 1,
        questions: [
            { type: 'mcq', question_text: 'What does HTML stand for?', options: ['Hyper Text Markup Language', 'Hyperlinks and Text Markup Language', 'Home Tool Markup Language', 'Hyper Tool Markup Language'], correct_answer: 'Hyper Text Markup Language', marks: 8 },
            { type: 'mcq', question_text: 'What is the correct HTML element for the largest heading?', options: ['<head>', '<h1>', '<h6>', '<heading>'], correct_answer: '<h1>', marks: 8 },
            { type: 'mcq', question_text: 'Where in an HTML document is the correct place to refer to an external style sheet?', options: ['At the end of the document', 'In the <body> section', 'In the <head> section', 'At the top of the body'], correct_answer: 'In the <head> section', marks: 8 },
            { type: 'mcq', question_text: 'Which CSS property is used to change the text color of an element?', options: ['fgcolor', 'text-color', 'color', 'font-color'], correct_answer: 'color', marks: 8 },
            { type: 'mcq', question_text: 'Which CSS property controls the text size?', options: ['font-style', 'text-size', 'font-size', 'text-style'], correct_answer: 'font-size', marks: 8 }
        ]
    },
    {
        title: 'React.js Beginner Test',
        duration: 35,
        passing_score: 50,
        is_published: 1,
        questions: [
            { type: 'mcq', question_text: 'What is the correct command to create a new React project?', options: ['npx create-react-app my-app', 'npm install create-react-app', 'npx install react', 'npm create-react-app my-app'], correct_answer: 'npx create-react-app my-app', marks: 12 },
            { type: 'mcq', question_text: 'What is JSX?', options: ['A CSS framework', 'A syntax extension for JavaScript', 'A database', 'A React hook'], correct_answer: 'A syntax extension for JavaScript', marks: 12 },
            { type: 'mcq', question_text: 'What is the use of the useState() hook?', options: ['To perform side effects', 'To manage state in functional components', 'To context share', 'To skip rendering'], correct_answer: 'To manage state in functional components', marks: 12 },
            { type: 'mcq', question_text: 'What are Props?', options: ['Internal state', 'External data passed into a component', 'Part of React core', 'A type of hook'], correct_answer: 'External data passed into a component', marks: 12 },
            { type: 'mcq', question_text: 'How do you render a list of items in React?', options: ['Using a for loop', 'Using the map() method', 'Using the each() method', 'Using a while loop'], correct_answer: 'Using the map() method', marks: 12 }
        ]
    },
    {
        title: 'Node.js & Express',
        duration: 40,
        passing_score: 50,
        is_published: 1,
        questions: [
            { type: 'mcq', question_text: 'Which module is used to create a web server in Node.js?', options: ['url', 'http', 'fs', 'path'], correct_answer: 'http', marks: 14 },
            { type: 'mcq', question_text: 'What command starts a Node.js file?', options: ['node start myFile.js', 'node myFile.js', 'npm run myFile.js', 'run myFile.js'], correct_answer: 'node myFile.js', marks: 14 },
            { type: 'mcq', question_text: 'What is Express.js?', options: ['A database', 'A web framework for Node.js', 'A JavaScript compiler', 'A version of CSS'], correct_answer: 'A web framework for Node.js', marks: 14 },
            { type: 'mcq', question_text: 'Which function is used to define a route in Express?', options: ['router.get()', 'router.route()', 'app.path()', 'api.define()'], correct_answer: 'router.get()', marks: 14 },
            { type: 'mcq', question_text: 'How do you install a package in Node.js?', options: ['npm create name', 'npm install name', 'install name', 'npm get name'], correct_answer: 'npm install name', marks: 14 }
        ]
    },
    {
        title: 'Database (SQL & SQLite)',
        duration: 30,
        passing_score: 50,
        is_published: 1,
        questions: [
            { type: 'mcq', question_text: 'What does SQL stand for?', options: ['Strong Query Language', 'Structured Question Language', 'Structured Query Language', 'Simple Query Language'], correct_answer: 'Structured Query Language', marks: 10 },
            { type: 'mcq', question_text: 'Which SQL statement is used to extract data from a database?', options: ['GET', 'OPEN', 'EXTRACT', 'SELECT'], correct_answer: 'SELECT', marks: 10 },
            { type: 'mcq', question_text: 'Which SQL statement is used to update data in a database?', options: ['MODIFY', 'UPDATE', 'SAVE', 'CHANGE'], correct_answer: 'UPDATE', marks: 10 },
            { type: 'mcq', question_text: 'What is SQLite?', options: ['A full-featured database server', 'A self-contained, serverless database engine', 'A cloud-only database', 'A type of SQL syntax'], correct_answer: 'A self-contained, serverless database engine', marks: 10 },
            { type: 'mcq', question_text: 'Which SQL keyword is used to sort the result-set?', options: ['SORT BY', 'ORDER', 'ORDER BY', 'GROUP BY'], correct_answer: 'ORDER BY', marks: 10 }
        ]
    }
];

async function seed() {
    console.log('Starting seed process...');
    for (const exam of exams) {
        try {
            // Create Exam
            const examRes = await axios.post(`${API_URL}/exams`, {
                title: exam.title,
                duration: exam.duration,
                passing_score: exam.passing_score,
                is_published: exam.is_published
            }, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });

            const examId = examRes.data.data.id;
            console.log(`Created Exam: ${exam.title} (ID: ${examId})`);

            // Add Questions
            for (const q of exam.questions) {
                await axios.post(`${API_URL}/exams/${examId}/questions`, q, {
                    headers: { 'Authorization': `Bearer ${TOKEN}` }
                });
            }
            console.log(`Added ${exam.questions.length} questions to ${exam.title}`);

        } catch (error) {
            console.error(`Error processing ${exam.title}:`, error.response ? error.response.data : error.message);
        }
    }
    console.log('Seed process complete!');
}

seed();
