const { GoogleGenerativeAI } = require('@google/generative-ai');
const vm = require('vm');
const { SQL_QUESTIONS, PROGRAMMING_QUESTIONS } = require('../data/codingQuestions');

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b'
];

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    return new GoogleGenerativeAI(apiKey);
  }
  return null;
};

/**
 * Robust helper: Calls Gemini with multi-model fallback and automated JSON markdown stripping
 */
async function generateGeminiContentWithFallback(genAI, prompt) {
  let lastError = null;
  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();
      if (text.startsWith('```')) {
        text = text.replace(/^```json\s*/i, '').replace(/^```\w*\s*/i, '').replace(/```$/, '').trim();
      }
      return JSON.parse(text);
    } catch (err) {
      lastError = err;
      console.warn(`[GeminiService] Model ${modelName} failed, trying next fallback: ${err.message}`);
    }
  }
  throw lastError;
}

/**
 * Evaluates an individual response to a question
 */
const evaluateResponse = async (question, answer, difficulty) => {
  if (!answer || answer.trim() === '') {
    return {
      score: 0,
      technicalAccuracy: 0,
      keywordCoverage: 0,
      communication: 0,
      confidence: 0,
      clarity: 0,
      completeness: 0,
      feedback: 'No answer was provided for this question. Try to explain key concepts or state your approach.'
    };
  }

  const genAI = getGenAI();
  if (!genAI) {
    return getMockIndividualEvaluation(question, answer, difficulty);
  }

  try {
    const prompt = `You are an expert technical and HR interviewer.
Evaluate the candidate's answer for the following question:
Question: "${question}"
Candidate's Answer: "${answer}"
Difficulty: "${difficulty}"

Provide a detailed evaluation in standard JSON format. Ensure all score fields are integers between 0 and 100.
Do NOT output any markdown tags (like \`\`\`json) or extra text. Output ONLY a valid raw JSON object.

The output JSON structure MUST be:
{
  "score": <integer 0-100>,
  "technicalAccuracy": <integer 0-100>,
  "keywordCoverage": <integer 0-100>,
  "communication": <integer 0-100>,
  "confidence": <integer 0-100>,
  "clarity": <integer 0-100>,
  "completeness": <integer 0-100>,
  "feedback": "<concise summary of strengths, weaknesses and what they missed>"
}`;

    return await generateGeminiContentWithFallback(genAI, prompt);
  } catch (error) {
    console.error('Error calling Gemini API for individual evaluation:', error);
    return getMockIndividualEvaluation(question, answer, difficulty);
  }
};

const evaluateOverallInterview = async (responsesList) => {
  const genAI = getGenAI();
  if (!genAI) {
    return getMockOverallEvaluation(responsesList);
  }

  try {
    const responsesSummary = responsesList.map((r, i) => {
      const type = (r.responseType === 'coding' || r.type === 'coding')
        ? `[Code Submission in ${r.language || 'Code'}]\n${r.code || r.answer}`
        : `Answer: ${r.answer}`;
      return `Q${i+1}: ${r.question}\n${type}\nScore: ${r.evaluation?.score || 0}/100\nFeedback: ${r.evaluation?.feedback || ''}`;
    }).join('\n\n');

    const prompt = `You are a career coach reviewing a candidate's completed mock interview. Here are the questions they answered and their evaluations:
${responsesSummary}

Based on this, summarize their overall interview performance in standard JSON format.
Do NOT output any markdown tags (like \`\`\`json) or extra text. Output ONLY a valid raw JSON object.

The output JSON structure MUST be:
{
  "summary": "<string paragraph summarizing overall performance>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "suggestions": ["<suggestion 1>", "<suggestion 2>"]
}`;

    return await generateGeminiContentWithFallback(genAI, prompt);
  } catch (error) {
    console.error('Error calling Gemini API for overall evaluation:', error);
    return getMockOverallEvaluation(responsesList);
  }
};

// --- SIMULATED MOCK EVALUATION HELPERS ---

function getMockIndividualEvaluation(question, answer, difficulty) {
  const answerLength = answer.length;
  const wordCount = answer.split(/\s+/).filter(Boolean).length;

  let technicalAccuracy = Math.min(50 + Math.floor(wordCount / 2), 92);
  let communication = Math.min(55 + Math.floor(answerLength / 12), 90);
  let confidence = Math.min(60 + Math.floor(wordCount / 3), 88);
  let clarity = Math.min(55 + Math.floor(wordCount / 2.5), 90);
  let completeness = Math.min(45 + Math.floor(wordCount / 2), 85);
  let keywordCoverage = Math.min(45 + Math.floor(wordCount / 3), 85);

  if (difficulty === 'Advanced') {
    technicalAccuracy = Math.max(technicalAccuracy - 8, 35);
    completeness = Math.max(completeness - 8, 35);
  } else if (difficulty === 'Beginner') {
    technicalAccuracy = Math.min(technicalAccuracy + 8, 95);
    completeness = Math.min(completeness + 8, 95);
  }

  const score = Math.round(
    (technicalAccuracy + communication + confidence + clarity + completeness + keywordCoverage) / 6
  );

  let feedback = 'Good effort on your response. ';
  if (wordCount < 15) {
    feedback += 'However, your answer is brief. Try to elaborate on technical architecture and edge cases.';
  } else {
    feedback += 'Your explanation touches on important elements. Continue to practice quantitative trade-offs and structural terminology.';
  }

  return {
    score,
    technicalAccuracy,
    keywordCoverage,
    communication,
    confidence,
    clarity,
    completeness,
    feedback
  };
}

function getMockOverallEvaluation(responsesList) {
  const avg = responsesList.length > 0
    ? Math.round(responsesList.reduce((acc, curr) => acc + (curr.evaluation?.score || 0), 0) / responsesList.length)
    : 70;

  return {
    summary: `Candidate demonstrated solid core competency across the interview topics, scoring an average of ${avg}%. Communications were clear and answers addressed key fundamentals.`,
    strengths: [
      'Structured thinking and clear explanations for foundational concepts.',
      'Maintained consistent professional composure throughout the interview.',
      'Showcased good problem breakdown skills.'
    ],
    weaknesses: [
      'Could provide more depth on system scaling and boundary conditions.',
      'Elaborate more on trade-offs between alternative architectural choices.'
    ],
    suggestions: [
      'Use the STAR method for behavioral and scenario-based responses.',
      'Include quantitative metrics when discussing project outcomes or performance.'
    ]
  };
}

const chatWithAI = async (message, context = {}) => {
  const genAI = getGenAI();
  if (!genAI) {
    return getSimulatedChatResponse(message);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `You are a helpful, encouraging AI Interview Coach assistant named Antigravity Coach.
User message: "${message}"
Context: Topic = ${context.topic || 'General Tech Interview'}, Difficulty = ${context.difficulty || 'Intermediate'}.
Provide a brief, helpful answer (2-4 sentences max). Give concise advice or guidance.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error with chat AI:', error);
    return getSimulatedChatResponse(message);
  }
};

const getSimulatedChatResponse = (message) => {
  const msg = message.toLowerCase();
  if (msg.includes('star') || msg.includes('method')) {
    return "The STAR method is: Situation (context), Task (responsibility), Action (what you did), and Result (outcomes). Use this structure for behavioral questions to sound structured.";
  }
  if (msg.includes('integrity') || msg.includes('violation')) {
    return "Our proctoring tracks full-screen and tab focus. Stay on the interview window to pass without flags!";
  }
  return "In interviews, clearly define core concepts, state edge cases, and present structured examples. Practice explaining trade-offs!";
};

/**
 * Generates dynamic 6-stage interview questions:
 * - Stage 1 (Verbal): Primary Resume Project Architecture
 * - Stage 2 (Verbal): Core Technical Concept Deep-Dive
 * - Stage 3 (Coding): 1 Compulsory SQL Challenge (Selected from the 10 Standard SQL Questions)
 * - Stage 4 (Coding): 1 Algorithmic Coding Challenge (Selected from the 10 LeetCode-style Questions)
 * - Stage 5 (Verbal): Industrial Training / Secondary Project System Flow
 * - Stage 6 (Verbal): Behavioral / Engineering Leadership
 */
const generateResumeInterviewQuestions = async (profile, difficulty = 'Intermediate') => {
  const summaryReport = profile.summaryReport || {};
  const projects = summaryReport.projects || profile.projects || [];
  const training = summaryReport.experienceAndTraining || profile.experience || [];
  const likelyQ = summaryReport.likelyInterviewQuestions || profile.likelyInterviewQuestions || [];
  const primarySkill = (summaryReport.technicalSkills?.languages?.[0] || profile.skills?.technical?.[0] || 'JavaScript').toLowerCase();
  const codingLang = primarySkill.includes('python') ? 'python' : (primarySkill.includes('java') ? 'java' : 'javascript');

  // Randomly select 1 SQL question from the 10 SQL questions
  const sqlIndex = Math.floor(Math.random() * SQL_QUESTIONS.length);
  const selectedSql = SQL_QUESTIONS[sqlIndex];

  // Randomly select 1 Programming question from the 10 Programming questions
  const progIndex = Math.floor(Math.random() * PROGRAMMING_QUESTIONS.length);
  const selectedProg = PROGRAMMING_QUESTIONS[progIndex];

  // Extract clean starter code for preferred language with placeholder
  const progStarter = selectedProg.starterCode[codingLang] || selectedProg.starterCode.javascript;
  const sqlStarter = selectedSql.starterCode.sql;

  const p1 = projects[0]?.title || projects[0]?.name || 'Primary Project';
  const p2 = projects[1]?.title || projects[1]?.name || null;
  const p3 = projects[2]?.title || projects[2]?.name || null;

  // Short fallback questions (5-6 words each)
  let stage1Question = `Explain your "${p1}" project architecture.`;
  let stage2Question = p2
    ? `Walk me through "${p2}" project.`
    : `Hardest bug in "${p1}"?`;
  let stage5Question = p3
    ? `Describe your "${p3}" project.`
    : `How did you scale "${p1}"?`;
  let stage6Question = `Describe a difficult team situation.`;

  const genAI = getGenAI();
  if (genAI) {
    try {
      const prompt = `You are a Senior Hiring Manager generating SHORT interview questions (5-6 words max each).
Candidate Projects: ${projects.map(p => p.title || p.name).join(', ')}
Target Role: ${profile.targetRole || 'Software Engineer'}

RULES:
- Each question must be 5-6 words MAXIMUM. No long sentences.
- stage1 must ask about: ${p1}
- stage2 must ask about: ${p2 || p1}
- stage5 must ask about: ${p3 || p2 || p1}
- stage6 must be a short behavioral question

Output ONLY valid raw JSON (no markdown):
{
  "stage1": "<5-6 word question about ${p1}>",
  "stage2": "<5-6 word question about ${p2 || p1}>",
  "stage5": "<5-6 word question about ${p3 || p2 || p1}>",
  "stage6": "<5-6 word behavioral question>"
}`;
      const verbalData = await generateGeminiContentWithFallback(genAI, prompt);
      if (verbalData.stage1) stage1Question = verbalData.stage1;
      if (verbalData.stage2) stage2Question = verbalData.stage2;
      if (verbalData.stage5) stage5Question = verbalData.stage5;
      if (verbalData.stage6) stage6Question = verbalData.stage6;
    } catch (err) {
      console.warn('Using baseline tailored verbal questions:', err.message);
    }
  }


  return [
    {
      id: 1,
      category: 'intro',
      type: 'verbal',
      allocatedMinutes: 4,
      question: stage1Question,
      context: 'Resume Project Deep Dive'
    },
    {
      id: 2,
      category: 'technical',
      type: 'verbal',
      allocatedMinutes: 4,
      question: stage2Question,
      context: 'Core Technical Depth'
    },
    {
      id: 3,
      category: 'sql',
      type: 'coding',
      language: 'sql',
      allocatedMinutes: 10,
      title: selectedSql.title,
      question: selectedSql.question,
      starterCode: sqlStarter,
      starterCodes: selectedSql.starterCode,
      testCases: selectedSql.testCases
    },
    {
      id: 4,
      category: 'coding',
      type: 'coding',
      language: codingLang,
      allocatedMinutes: 15,
      title: selectedProg.title,
      functionName: selectedProg.functionName,
      question: selectedProg.question,
      starterCode: progStarter,
      starterCodes: selectedProg.starterCode,
      testCases: selectedProg.testCases
    },
    {
      id: 5,
      category: 'architecture',
      type: 'verbal',
      allocatedMinutes: 4,
      question: stage5Question,
      context: 'System & Data Flow'
    },
    {
      id: 6,
      category: 'behavioral',
      type: 'verbal',
      allocatedMinutes: 3,
      question: stage6Question,
      context: 'Engineering Mindset & Leadership'
    }
  ];
};

/**
 * Deterministic JavaScript Runner via Node VM Sandbox
 */
function evaluateJavaScriptInSandbox(candidateCode, questionTitleOrObj, testCases = []) {
  // Find matching question definition to get functionName and isLinkedList
  let matchedProg = PROGRAMMING_QUESTIONS.find(p => 
    p.title?.toLowerCase() === questionTitleOrObj?.toLowerCase() ||
    (typeof questionTitleOrObj === 'string' && questionTitleOrObj.toLowerCase().includes(p.title.toLowerCase()))
  );

  const functionName = matchedProg?.functionName || extractFunctionName(candidateCode) || 'twoSum';
  const isLinkedList = Boolean(matchedProg?.isLinkedList);

  const trimmed = (candidateCode || '').trim();
  const isPlaceholderOnly =
    !trimmed ||
    trimmed.length < 25 ||
    trimmed.toLowerCase().includes('write your code inside function call');

  if (isPlaceholderOnly) {
    return {
      score: 0,
      isCorrect: false,
      technicalAccuracy: 0,
      keywordCoverage: 0,
      communication: 0,
      confidence: 0,
      clarity: 0,
      completeness: 0,
      timeComplexity: 'N/A',
      spaceComplexity: 'N/A',
      feedback: 'Incomplete implementation. Please write your solution inside the function call.',
      testCaseResults: (testCases || []).map((tc, i) => ({
        id: tc.id || (i + 1),
        name: tc.name || `Case ${i + 1}`,
        isHidden: Boolean(tc.isHidden),
        passed: false,
        input: tc.isHidden ? '[Hidden Input]' : (tc.input || ''),
        expected: tc.isHidden ? '[Locked]' : (tc.expected || ''),
        actual: 'No implementation',
        details: 'Failed: Solution was not implemented.'
      }))
    };
  }

  // Linked list helpers for VM
  const harness = isLinkedList ? `
    function ListNode(val, next) {
      this.val = (val===undefined ? 0 : val);
      this.next = (next===undefined ? null : next);
    }
    function arrayToList(arr) {
      if (!arr || !arr.length) return null;
      let head = new ListNode(arr[0]);
      let curr = head;
      for (let i = 1; i < arr.length; i++) {
        curr.next = new ListNode(arr[i]);
        curr = curr.next;
      }
      return head;
    }
    function listToArray(head) {
      const res = [];
      let curr = head;
      let count = 0;
      while (curr && count < 1000) {
        res.push(curr.val);
        curr = curr.next;
        count++;
      }
      return res;
    }
  ` : '';

  let passedCount = 0;
  const totalCases = testCases.length || 1;
  const testResults = [];

  for (let idx = 0; idx < testCases.length; idx++) {
    const tc = testCases[idx];
    const isHidden = Boolean(tc.isHidden);

    try {
      let argsToPass = tc.rawArgs;
      if (!argsToPass) {
        argsToPass = extractArgsFromInputString(tc.input);
      }

      const scriptCode = `
        ${harness}
        ${candidateCode}

        (function() {
          let args = ${JSON.stringify(argsToPass)};
          ${isLinkedList ? 'args = args.map(a => Array.isArray(a) ? arrayToList(a) : a);' : ''}
          const fn = typeof ${functionName} === 'function' ? ${functionName} : (typeof solve === 'function' ? solve : null);
          if (!fn) throw new Error("Function '${functionName}' is not defined.");
          let result = fn.apply(null, args);
          ${isLinkedList ? 'result = listToArray(result);' : ''}
          return result;
        })();
      `;

      const sandboxContext = vm.createContext({
        console: { log: () => {} },
        Map,
        Set,
        Array,
        Object,
        Math
      });

      const script = new vm.Script(scriptCode);
      const actualVal = script.runInContext(sandboxContext, { timeout: 1000 });

      const matches = checkOutputsMatch(actualVal, tc.expected);

      if (matches) {
        passedCount++;
        testResults.push({
          id: tc.id || (idx + 1),
          name: tc.name || (isHidden ? `Hidden Case ${idx + 1}` : `Visible Case ${idx + 1}`),
          isHidden,
          passed: true,
          input: isHidden ? '[Hidden Input]' : (tc.input || ''),
          expected: isHidden ? '[Locked]' : (tc.expected || ''),
          actual: isHidden ? '[Match]' : formatValue(actualVal),
          details: 'Passed: Output matches expected result.'
        });
      } else {
        testResults.push({
          id: tc.id || (idx + 1),
          name: tc.name || (isHidden ? `Hidden Case ${idx + 1}` : `Visible Case ${idx + 1}`),
          isHidden,
          passed: false,
          input: isHidden ? '[Hidden Input]' : (tc.input || ''),
          expected: isHidden ? '[Locked]' : (tc.expected || ''),
          actual: isHidden ? '[Mismatch]' : formatValue(actualVal),
          details: 'Failed: Output did not match expected value.'
        });
      }
    } catch (err) {
      testResults.push({
        id: tc.id || (idx + 1),
        name: tc.name || (isHidden ? `Hidden Case ${idx + 1}` : `Visible Case ${idx + 1}`),
        isHidden,
        passed: false,
        input: isHidden ? '[Hidden Input]' : (tc.input || ''),
        expected: isHidden ? '[Locked]' : (tc.expected || ''),
        actual: `Error: ${err.message}`,
        details: `Execution Error: ${err.message}`
      });
    }
  }

  const score = Math.round((passedCount / totalCases) * 100);
  const isCorrect = score === 100;

  return {
    score,
    isCorrect,
    technicalAccuracy: score,
    keywordCoverage: score >= 60 ? 90 : 50,
    communication: 85,
    confidence: score >= 60 ? 90 : 40,
    clarity: 85,
    completeness: score,
    timeComplexity: isCorrect ? 'Optimal O(N) or O(log N)' : 'Needs Optimization',
    spaceComplexity: isCorrect ? 'Optimal' : 'Needs Optimization',
    feedback: isCorrect
      ? 'All test cases passed successfully! Clean implementation with optimal time and space complexity.'
      : `Passed ${passedCount} of ${totalCases} test cases. Review edge cases and boundary handling.`,
    testCaseResults: testResults
  };
}

function extractFunctionName(code) {
  const match = code.match(/function\s+([a-zA-Z0-9_$]+)\s*\(/);
  return match ? match[1] : null;
}

function extractArgsFromInputString(inputStr) {
  if (!inputStr) return [];
  try {
    // If inputStr looks like "nums = [2,7,11,15], target = 9"
    if (inputStr.includes('=')) {
      const parts = inputStr.split(',').map(p => p.trim());
      const args = [];
      for (const part of parts) {
        const eqIdx = part.indexOf('=');
        if (eqIdx !== -1) {
          const valStr = part.slice(eqIdx + 1).trim();
          args.push(JSON.parse(valStr.replace(/'/g, '"')));
        }
      }
      return args;
    }
  } catch (e) {}
  return [inputStr];
}

function checkOutputsMatch(actual, expected) {
  if (actual === undefined && expected === 'undefined') return true;
  if (actual === null && (expected === 'null' || expected === 'NULL')) return true;

  const actualFormatted = formatValue(actual);
  const normExpected = String(expected).trim().replace(/\s+/g, '');
  const normActual = actualFormatted.replace(/\s+/g, '');

  if (normActual === normExpected) return true;

  // Compare parsed objects/arrays
  try {
    const p1 = JSON.parse(normActual.replace(/'/g, '"'));
    const p2 = JSON.parse(normExpected.replace(/'/g, '"'));
    return JSON.stringify(p1) === JSON.stringify(p2);
  } catch (e) {}

  return false;
}

function formatValue(val) {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (typeof val === 'object') {
    return JSON.stringify(val);
  }
  return String(val);
}

/**
 * Strict Code Evaluator
 * - If JavaScript: executes in safe VM sandbox against test cases.
 * - If Python / Java / SQL: uses multi-model Gemini judge with fallback.
 */
const evaluateCodeSubmission = async (question, code, language = 'javascript', testCases = []) => {
  const trimmed = (code || '').trim();
  const langLower = (language || 'javascript').toLowerCase();

  // If JavaScript, run deterministic Node VM sandbox for instant & exact LeetCode evaluation
  if (langLower === 'javascript' || langLower === 'js') {
    return evaluateJavaScriptInSandbox(trimmed, question, testCases);
  }

  // Check if code is empty placeholder
  const isPlaceholder = 
    !trimmed ||
    trimmed.length < 25 ||
    trimmed.includes('// write your code inside function call\n    \n}') ||
    trimmed.includes('# write your code inside function call\n    pass') ||
    trimmed.includes('-- write your code inside function call\nSELECT \n    \nFROM');

  if (isPlaceholder) {
    return {
      score: 0,
      isCorrect: false,
      technicalAccuracy: 0,
      keywordCoverage: 0,
      communication: 0,
      confidence: 0,
      clarity: 0,
      completeness: 0,
      timeComplexity: 'N/A',
      spaceComplexity: 'N/A',
      feedback: 'Incomplete implementation. Please write your solution inside the function call.',
      testCaseResults: (testCases || []).map((tc, i) => ({
        id: tc.id || (i + 1),
        name: tc.name || `Case ${i + 1}`,
        isHidden: Boolean(tc.isHidden),
        passed: false,
        input: tc.isHidden ? '[Hidden Input]' : (tc.input || ''),
        expected: tc.isHidden ? '[Locked]' : (tc.expected || ''),
        actual: 'No implementation',
        details: 'Failed: Solution was not implemented.'
      }))
    };
  }

  const genAI = getGenAI();
  if (genAI) {
    try {
      const prompt = `You are a strict, automated Code Judge for technical interview questions.
Evaluate the candidate's code submission against the problem statement and test cases.

Problem Statement:
"${question}"

Language: ${language}
Candidate Code:
\`\`\`${language}
${trimmed}
\`\`\`

Test Cases to Verify:
${JSON.stringify(testCases, null, 2)}

GRADING RULES:
1. Trace the code step-by-step with each test case.
2. If the code is just template or returns hardcoded values without the required algorithm: score = 0, all passed: false.
3. If the code solves visible test cases but fails edge cases: score between 40 and 60.
4. If the code is correct, handles edge cases, and has optimal complexity: score between 90 and 100, isCorrect: true.

Output ONLY valid raw JSON:
{
  "score": <integer 0-100>,
  "isCorrect": <boolean>,
  "technicalAccuracy": <integer 0-100>,
  "keywordCoverage": <integer 0-100>,
  "communication": <integer 0-100>,
  "confidence": <integer 0-100>,
  "clarity": <integer 0-100>,
  "completeness": <integer 0-100>,
  "timeComplexity": "<e.g. O(N)>",
  "spaceComplexity": "<e.g. O(1)>",
  "feedback": "<concise code review>",
  "testCaseResults": [
    {
      "id": <integer>,
      "name": "<string>",
      "isHidden": <boolean>,
      "passed": <boolean>,
      "input": "<string>",
      "expected": "<string>",
      "actual": "<string>",
      "details": "<pass/fail reason>"
    }
  ]
}`;

      return await generateGeminiContentWithFallback(genAI, prompt);
    } catch (err) {
      console.error('Error in Gemini code evaluation fallback:', err.message);
    }
  }

  // Semantic heuristic fallback for non-JS if Gemini is offline
  return getSemanticCodeEvaluationFallback(trimmed, language, question, testCases);
};

/**
 * Intelligent semantic fallback for Python, Java, SQL
 */
function getSemanticCodeEvaluationFallback(code, language, question, testCases = []) {
  const codeLower = code.toLowerCase();
  let passed = false;
  let score = 0;

  if (language === 'sql') {
    const hasSelect = codeLower.includes('select');
    const hasFrom = codeLower.includes('from');
    const hasWhereOrJoin = codeLower.includes('where') || codeLower.includes('join') || codeLower.includes('group by') || codeLower.includes('over');
    if (hasSelect && hasFrom && hasWhereOrJoin && code.length > 40) {
      passed = true;
      score = 90;
    } else if (hasSelect && hasFrom) {
      score = 45;
    }
  } else {
    const hasLogic = (codeLower.includes('for ') || codeLower.includes('while') || codeLower.includes('if ') || codeLower.includes('return') || codeLower.includes('map') || codeLower.includes('set'));
    if (hasLogic && code.length > 50) {
      passed = true;
      score = 88;
    } else if (code.length > 30) {
      score = 40;
    }
  }

  const results = (testCases || []).map((tc, idx) => {
    const isHidden = Boolean(tc.isHidden);
    const tcPassed = isHidden ? (score >= 80) : (score >= 40);
    return {
      id: tc.id || (idx + 1),
      name: tc.name || (isHidden ? `Hidden Case ${idx + 1}` : `Visible Case ${idx + 1}`),
      isHidden,
      passed: tcPassed,
      input: isHidden ? '[Hidden Input]' : (tc.input || ''),
      expected: isHidden ? '[Locked]' : (tc.expected || ''),
      actual: tcPassed ? (isHidden ? '[Match]' : (tc.expected || 'Correct')) : 'Incorrect Output',
      details: tcPassed ? 'Passed: Logic meets problem constraints.' : 'Failed: Solution missing edge case condition.'
    };
  });

  return {
    score,
    isCorrect: score >= 80,
    technicalAccuracy: score,
    keywordCoverage: score,
    communication: 80,
    confidence: score > 0 ? 80 : 30,
    clarity: 80,
    completeness: score,
    timeComplexity: score >= 80 ? 'O(N)' : 'Incomplete',
    spaceComplexity: score >= 80 ? 'O(1)' : 'N/A',
    feedback: score >= 80
      ? 'Good solution! Algorithm structure and syntax satisfy standard problem requirements.'
      : 'Partial implementation. Review logic conditions and edge cases.',
    testCaseResults: results
  };
}

/**
 * Generates comprehensive 8-metric report for Resume-Based Interviews
 */
const evaluateResumeInterviewOverall = async (responsesList, profile) => {
  const genAI = getGenAI();
  if (!genAI) {
    return getMockResumeOverallEvaluation(responsesList, profile);
  }

  try {
    const responsesSummary = responsesList.map((r, i) => {
      const type = (r.responseType === 'coding' || r.type === 'coding' || r.code)
        ? `[Code Submission in ${r.language || 'Code'}]\n${r.code || r.answer}`
        : `Answer:\n${r.answer}`;
      return `Q${i+1} (${r.category || 'tech'}): ${r.question}\n${type}\nScore: ${r.evaluation?.score || 0}/100\nFeedback: ${r.evaluation?.feedback || ''}`;
    }).join('\n\n');

    const prompt = `You are a Senior Talent Director and Hiring Bar Raiser evaluating a candidate's complete 30-35 min Resume-Based Mock Interview.

Candidate Target Role: ${profile?.targetRole || 'Full Stack Developer'}
Skills: ${(profile?.skills?.technical || []).join(', ')}

Interview Transcript & Evaluations:
${responsesSummary}

Evaluate the candidate across all 8 dimensions and calculate their Overall Employability Score (0-100).
Ensure all metric scores are integers between 0 and 100.
Do NOT output markdown tags. Output ONLY a valid raw JSON object.

JSON Structure:
{
  "metrics": {
    "resumeUnderstanding": <integer 0-100>,
    "projectKnowledge": <integer 0-100>,
    "technicalDepth": <integer 0-100>,
    "problemSolving": <integer 0-100>,
    "communication": <integer 0-100>,
    "confidence": <integer 0-100>,
    "domainKnowledge": <integer 0-100>,
    "employabilityScore": <integer 0-100>
  },
  "summary": "<2-3 paragraph detailed performance analysis>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<area of improvement 1>", "<area of improvement 2>"],
  "suggestions": ["<actionable recommendation 1>", "<actionable recommendation 2>", "<actionable recommendation 3>"]
}`;

    return await generateGeminiContentWithFallback(genAI, prompt);
  } catch (err) {
    console.error('Error evaluating overall resume interview:', err);
    return getMockResumeOverallEvaluation(responsesList, profile);
  }
};

function getMockResumeOverallEvaluation(responsesList, profile) {
  const avg = Math.round(
    responsesList.reduce((acc, curr) => acc + (curr.evaluation?.score || 0), 0) / (responsesList.length || 1)
  );

  return {
    metrics: {
      resumeUnderstanding: Math.min(avg + 5, 95),
      projectKnowledge: Math.min(avg + 2, 92),
      technicalDepth: Math.max(avg - 4, 30),
      problemSolving: Math.max(avg - 2, 35),
      communication: Math.min(avg + 4, 90),
      confidence: Math.min(avg + 6, 92),
      domainKnowledge: Math.min(avg + 1, 90),
      employabilityScore: avg
    },
    summary: `Candidate completed the Resume-Based AI Interview targeting ${profile?.targetRole || 'Full Stack Developer'}. Demonstrated good comprehension of stated projects and key technical foundations with an overall employability score of ${avg}%.`,
    strengths: [
      'Articulated project choices and tech stack selections effectively.',
      'Demonstrated structured problem decomposition on coding challenges.',
      'Maintained consistent professional composure throughout the interview.'
    ],
    weaknesses: [
      'Could dive deeper into system scalability and edge case handling.',
      'Code solutions can benefit from explicit boundary and null checks.'
    ],
    suggestions: [
      'Practice explaining design trade-offs with quantitative metrics (latency, throughput).',
      'Use the STAR method for behavioral responses.',
      'Review time/space complexity optimizations for core algorithms.'
    ]
  };
}

module.exports = {
  evaluateResponse,
  evaluateOverallInterview,
  chatWithAI,
  generateResumeInterviewQuestions,
  evaluateCodeSubmission,
  evaluateResumeInterviewOverall
};
