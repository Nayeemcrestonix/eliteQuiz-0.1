const asyncHandler = require('express-async-handler');

/**
 * @desc    Mock Code Runner (Pattern-based validation)
 * @route   POST /api/v1/exams/run-code
 * @access  Private
 */
const runCode = asyncHandler(async (req, res) => {
  const { code, language, questionId } = req.body;

  if (!code) {
    res.status(400);
    throw new Error('No code provided');
  }

  // Simulations of execution
  const startTime = Date.now();
  
  // Basic sanity checks (Mock sandbox)
  const isMalicious = code.includes('process.exit') || code.includes('require(') || code.includes('import os');
  
  // Mocking execution delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const executionTime = (Date.now() - startTime) / 1000;
  
  let output = '';
  let status = 'success';
  let stderr = '';

  if (isMalicious) {
    status = 'error';
    stderr = 'Security Violation: Restricted operation detected.';
  } else {
    // Generate mock output based on language
    if (language === 'python') {
      output = "Python 3.10 execution complete.\nResult: 42\n------------------\n[LOG] Memory usage: 12MB";
    } else if (language === 'javascript') {
      output = "V8 Engine execution complete.\nResult: 42\n------------------\n[LOG] Memory usage: 8MB";
    } else {
      output = "Java Runtime 17 execution complete.\nResult: 42\n------------------\n[LOG] Memory usage: 48MB";
    }
  }

  res.status(200).json({
    success: true,
    data: {
      status,
      output,
      stderr,
      executionTime: `${executionTime.toFixed(3)}s`,
      memory: '12MB'
    }
  });
});

/**
 * @desc    Mock Test Runner
 * @route   POST /api/v1/exams/run-tests
 * @access  Private
 */
const runTests = asyncHandler(async (req, res) => {
    const { code, language, questionId } = req.body;
    
    // Simulate test cases
    await new Promise(resolve => setTimeout(resolve, 1200));

    const testResults = [
        { id: 1, name: 'Sample Case 1', status: 'passed', time: '0.012s' },
        { id: 2, name: 'Sample Case 2', status: 'passed', time: '0.008s' },
        { id: 3, name: 'Hidden Case 1', status: 'failed', message: 'Expected 42, got 0' }
    ];

    res.status(200).json({
        success: true,
        data: {
            tests: testResults,
            summary: {
                total: 3,
                passed: 2,
                failed: 1
            }
        }
    });
});

module.exports = {
  runCode,
  runTests
};
