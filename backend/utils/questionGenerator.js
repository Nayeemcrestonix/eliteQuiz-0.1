/**
 * Topic-based Question Library and Generator
 */

const library = {
    'JavaScript': {
        mcq: [
            { q: 'What is the correct way to write a JavaScript array?', opts: ["var list = (1,2,3)", "var list = [1,2,3]", "var list = {1,2,3}", "var list = <1,2,3>"], ans: 'var list = [1,2,3]' },
            { q: 'Which operator is used to assign a value to a variable?', opts: ["*", "-", "=", "x"], ans: '=' },
            { q: 'How do you create a function in JavaScript?', opts: ["function:myFunc()", "function = myFunc()", "function myFunc()", "myFunc() = function"], ans: 'function myFunc()' },
            { q: 'Which method adds an element to the end of an array?', opts: ["push()", "pop()", "shift()", "unshift()"], ans: 'push()' },
            { q: 'What is the result of 2 + "2"?', opts: ["4", "22", "undefined", "NaN"], ans: '22' },
            { q: 'Which keyword is used to declare a block-scoped variable?', opts: ["var", "let", "global", "set"], ans: 'let' },
            { q: 'How do you check the length of a string?', opts: ["length()", "size", "length", "count"], ans: 'length' },
            { q: 'Which of the following is NOT a JavaScript data type?', opts: ["Undefined", "Number", "Boolean", "Float"], ans: 'Float' },
            { q: 'What does "NaN" stand for?', opts: ["Not a Number", "Not a Null", "New and Now", "None available Now"], ans: 'Not a Number' },
            { q: 'Which event occurs when the user clicks on an HTML element?', opts: ["onmouseclick", "onchange", "onclick", "onmouseover"], ans: 'onclick' },
            { q: 'How do you call a function named "myFunction"?', opts: ["call myFunction()", "myFunction()", "call function myFunction()", "execute myFunction()"], ans: 'myFunction()' },
            { q: 'What is the purpose of the "this" keyword?', opts: ["Refers to the current object", "Refers to the window only", "Refers to the parent function", "None of the above"], ans: 'Refers to the current object' },
            { q: 'Which built-in method converts a string to all lowercase?', opts: ["toLowerCase()", "changeCase(lower)", "toSmall()", "lower()"], ans: 'toLowerCase()' },
            { q: 'Which of these is used for multi-line comments?', opts: ["//", "/* */", "<!-- -->", "##"], ans: '/* */' },
            { q: 'How do you round 7.25 to the nearest integer?', opts: ["Math.rnd(7.25)", "round(7.25)", "Math.round(7.25)", "rnd(7.25)"], ans: 'Math.round(7.25)' },
            { q: 'Which symbol is used for strict equality?', opts: ["=", "==", "===", "!=="], ans: '===' },
            { q: 'How do you find the highest number in JavaScript?', opts: ["Math.max(x, y)", "Math.ceil(x, y)", "ceil(x, y)", "top(x, y)"], ans: 'Math.max(x, y)' },
            { q: 'What is the return type of typeof null?', opts: ["null", "undefined", "object", "string"], ans: 'object' },
            { q: 'How do you log data to the browser console?', opts: ["print()", "console.log()", "log.console()", "browser.log()"], ans: 'console.log()' },
            { q: 'What does the spread operator (...) do?', opts: ["Joins two arrays", "Expands an iterable onto its elements", "Performs addition", "Loops through an array"], ans: 'Expands an iterable onto its elements' }
        ],
        short: [
            { q: 'Explain what Hoisting is in JavaScript.', ans: 'Hoisting' },
            { q: 'What is a Closure?', ans: 'Closure' },
            { q: 'Explain the difference between let and var.', ans: 'Scope' },
            { q: 'What is a Promise?', ans: 'Asynchronous' },
            { q: 'What is JSON.stringify used for?', ans: 'Serializing' },
            { q: 'What are Arrow functions?', ans: 'lambda' },
            { q: 'Explain "strict mode".', ans: 'Restrictions' },
            { q: 'What is the difference between null and undefined?', ans: 'Value' },
            { q: 'What is the Event Loop?', ans: 'Concurrency' },
            { q: 'Explain Event Bubbling.', ans: 'Propagation' }
        ],
        coding: [
            { q: 'Write a function "reverseString(str)" that returns a reversed string.', ans: 'reverse', exp: 'Example: "hello" -> "olleh"' },
            { q: 'Write a function "sumArray(arr)" that returns the sum of all numbers in an array.', ans: 'sum', exp: 'Example: [1, 2, 3] -> 6' },
            { q: 'Write a function "isPalindrome(str)" that checks if a word is the same forwards and backwards.', ans: 'split', exp: 'Example: "madam" -> true' }
        ]
    },
    'SQL': {
        mcq: Array(20).fill({ q: 'What does SQL stand for?', opts: ["Strong Query Language", "Structured Question Language", "Structured Query Language", "Simple Query Language"], ans: 'Structured Query Language' }),
        short: [
            { q: 'What is a Primary Key?', ans: 'Unique identifier' },
            { q: 'What is the purpose of the GROUP BY clause?', ans: 'Aggregate' },
            { q: 'Explain the difference between INNER and LEFT JOIN.', ans: 'Intersection' }
        ],
        coding: [
            { q: 'Write a query to select all columns from a table named "employees".', ans: 'SELECT * FROM employees', exp: 'SELECT * FROM employees' }
        ]
    }
};

const generateQuestions = (topic) => {
    // Exact match or fallback to JS if topic not found
    const data = library[topic] || library['JavaScript'];
    
    const questions = [];
    
    // 20 MCQs
    data.mcq.forEach(q => {
        questions.push({ ...q, type: 'mcq', marks: 5 });
    });

    // 10 Shorts
    data.short.forEach(q => {
        questions.push({ ...q, type: 'short', marks: 10 });
    });

    // 3 Coding
    data.coding.forEach(q => {
        questions.push({ ...q, type: 'coding', marks: 20 });
    });

    return questions;
};

module.exports = { generateQuestions };
