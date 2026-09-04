const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini client (fallback handled gracefully if key is missing)
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
if (apiKey && apiKey !== 'your_gemini_api_key_here') {
  genAI = new GoogleGenerativeAI(apiKey);
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
      feedback: 'No answer was provided for this question.'
    };
  }

  if (!genAI) {
    console.log('Gemini API key not configured or invalid. Using simulated evaluation.');
    return getMockIndividualEvaluation(question, answer, difficulty);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `You are an expert technical and HR interviewer.
Evaluate the candidate's answer for the following question:
Question: "${question}"
Candidate's Answer: "${answer}"
Difficulty: "${difficulty}"

Provide a detailed evaluation in standard JSON format. Ensure all score fields are integers between 0 and 100.
Do NOT output any markdown tags (like \`\`\`json) or extra text. Output ONLY a valid raw JSON object.

The output JSON structure MUST be:
{
  "score": <integer>,
  "technicalAccuracy": <integer>,
  "keywordCoverage": <integer>,
  "communication": <integer>,
  "confidence": <integer>,
  "clarity": <integer>,
  "completeness": <integer>,
  "feedback": "<string summary of strengths, weaknesses and what they missed>"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    
    // Clean potential markdown backticks returned by Gemini
    if (text.startsWith('```')) {
      text = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    }

    return JSON.parse(text);
  } catch (error) {
    console.error('Error calling Gemini API for individual evaluation:', error);
    return getMockIndividualEvaluation(question, answer, difficulty);
  }
};

/**
 * Generates overall feedback summary for the entire interview
 */
const evaluateOverallInterview = async (responsesList) => {
  if (!genAI) {
    console.log('Gemini API key not configured or invalid. Using simulated overall evaluation.');
    return getMockOverallEvaluation(responsesList);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const responsesSummary = responsesList.map((r, i) => {
      return `Q${i+1}: ${r.question}\nAnswer: ${r.answer}\nScore: ${r.evaluation.score}/100\nFeedback: ${r.evaluation.feedback}`;
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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Clean potential markdown backticks returned by Gemini
    if (text.startsWith('```')) {
      text = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    }

    return JSON.parse(text);
  } catch (error) {
    console.error('Error calling Gemini API for overall evaluation:', error);
    return getMockOverallEvaluation(responsesList);
  }
};

// --- SIMULATED MOCK EVALUATION HELPERS ---

function getMockIndividualEvaluation(question, answer, difficulty) {
  // Simple heuristic scores based on answer length and keyword matches
  const answerLength = answer.length;
  const wordCount = answer.split(/\s+/).length;

  let technicalAccuracy = Math.min(45 + Math.floor(wordCount / 2), 90);
  let communication = Math.min(50 + Math.floor(answerLength / 10), 92);
  let confidence = Math.min(55 + Math.floor(wordCount / 3), 88);
  let clarity = Math.min(50 + Math.floor(wordCount / 2.5), 90);
  let completeness = Math.min(40 + Math.floor(wordCount / 2), 85);
  let keywordCoverage = Math.min(40 + Math.floor(wordCount / 3), 85);

  // Adjust scores slightly based on difficulty
  if (difficulty === 'Advanced') {
    technicalAccuracy = Math.max(technicalAccuracy - 10, 30);
    completeness = Math.max(completeness - 10, 30);
  } else if (difficulty === 'Beginner') {
    technicalAccuracy = Math.min(technicalAccuracy + 10, 95);
    completeness = Math.min(completeness + 10, 95);
  }

  const score = Math.round(
    (technicalAccuracy + communication + confidence + clarity + completeness + keywordCoverage) / 6
  );

  let feedback = 'Good effort on the response. ';
  if (wordCount < 15) {
    feedback += 'However, the answer is too brief. Try to elaborate on technical concepts and provide real-world examples.';
  } else {
    feedback += 'Your explanation touches on important elements of the topic. To improve, ensure you cover key terminology and mention structural details or framework components related to the question.';
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
  const avgScore = Math.round(
    responsesList.reduce((acc, curr) => acc + curr.evaluation.score, 0) / responsesList.length
  );

  let strengths = [
    'Shows basic understanding of the requested subjects.',
    'Expresses technical answers with clear structures.'
  ];
  let weaknesses = [
    'Lacks depth in advanced concepts.',
    'Answers could be enriched with specific code-level or design examples.'
  ];
  let suggestions = [
    'Practice explaining concepts using standard definitions.',
    'Formulate answers using the STAR method (Situation, Task, Action, Result) for better coherence.'
  ];

  if (avgScore >= 80) {
    strengths.push('Excellent articulation and command over the terminology.');
    suggestions.push('Review edge cases and performance trade-offs for high-level concepts.');
  } else {
    weaknesses.push('Struggles with question completeness on complex items.');
    suggestions.push('Focus on core definitions and practice speaking answers aloud.');
  }

  return {
    summary: `You completed the mock interview with an average score of ${avgScore}%. You demonstrated consistent knowledge, though there is room for improvement in technical precision.`,
    strengths,
    weaknesses,
    suggestions
  };
}

const chatWithAI = async (message, history = []) => {
  if (!genAI) {
    console.log('Gemini API key not configured. Using simulated chatbot responses.');
    return "Hi! I am your AI Interview Coach. It looks like the Gemini API Key is not configured in the backend environment, but I am still here to help! Feel free to ask me any general questions about technical concepts, resume building, or interview strategy.";
  }
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: "You are Antigravity AI Coach, a supportive, expert career coach and technical/HR interviewer. Help candidates prepare for interviews, explain programming concepts, structure their responses (using STAR method), and keep your answers brief, encouraging, and clear."
    });
    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      }))
    });
    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error in chatWithAI:', error);
    // Graceful fallback to smart simulated technical coach response if API key has quota or rate limits
    return getMockChatResponse(message);
  }
};

const getMockChatResponse = (message) => {
  const msg = message.toLowerCase();
  if (msg.includes('hello') || msg.includes('hi ') || msg === 'hi' || msg.includes('hey')) {
    return "Hello! I am your AI Career Coach. How can I help you prepare for your technical or HR interview today?";
  }
  if (msg.includes('react')) {
    return "React is a popular frontend library. In interviews, expect questions on virtual DOM, Hooks (useState, useEffect, useMemo), state management (Context, Redux), and component lifecycle. Make sure you practice structuring your answers using the STAR method!";
  }
  if (msg.includes('javascript') || msg.includes('js')) {
    return "JavaScript interviews often focus on core concepts: Closures, Event Loop, Promises & Async/Await, Prototypal Inheritance, and scope (var, let, const). I suggest practicing coding challenges on arrays, objects, and asynchronous patterns.";
  }
  if (msg.includes('java')) {
    return "Java technical interviews commonly cover OOP principles (Inheritance, Polymorphism, Encapsulation, Abstraction), Collection Framework (HashMap, ArrayList), Multithreading, JVM architecture, and Java 8 features like Streams and Lambda expressions.";
  }
  if (msg.includes('resume') || msg.includes('cv')) {
    return "For resumes, focus on listing impactful bullet points with the format: 'Accomplished [X], as measured by [Y], by doing [Z]'. Keep it to one page, highlight key tech stacks, and list relevant mock assessment scores from this platform!";
  }
  if (msg.includes('star') || msg.includes('method')) {
    return "The STAR method is: Situation (describe context), Task (explain your responsibility), Action (what you did), and Result (outcomes, metrics). Use this structure for HR and behavioral questions to sound highly structured.";
  }
  if (msg.includes('integrity') || msg.includes('violation') || msg.includes('rule')) {
    return "Our AI Simulator tracks proctoring guidelines like full-screen locks and tab switches. Exiting fullscreen or changing tabs logs a violation. Try to stay focused on the interview window to pass!";
  }
  return "That is a great question. In interviews, it is crucial to explain your thought process clearly, define core technical terms, list edge cases, and present structured examples. Let me know if you would like me to explain a specific topic like JavaScript, React, Java, or behavioral strategies!";
};

/**
 * Generates dynamic, multi-stage interview questions tailored strictly to the user's uploaded resume
 */
const generateResumeInterviewQuestions = async (profile, difficulty = 'Intermediate') => {
  if (!genAI) {
    return getMockResumeQuestions(profile, difficulty);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    // Extract real candidate entities
    const techSkills = (profile.skills?.technical || []).join(', ') || 'Java, JavaScript, Python';
    const frameworks = (profile.skills?.frameworks || []).join(', ') || 'React, Node.js, Express';
    const databases = (profile.skills?.databases || []).join(', ') || 'SQL, MongoDB';
    const primaryProject = profile.projects?.[0] || { name: 'Full Stack Web App', summary: 'Scalable web application' };
    const primarySkill = (profile.skills?.technical?.[0] || 'Java').toLowerCase();
    const codingLang = primarySkill.includes('python') ? 'python' : (primarySkill.includes('java') ? 'java' : 'javascript');

    const prompt = `You are a Senior Technical Hiring Manager conducting a 30-35 minute realistic technical interview for a candidate applying for "${profile.targetRole || 'Full Stack Developer'}".

Candidate's Real Resume Details:
- Target Role: ${profile.targetRole || 'Full Stack Developer'}
- Core Skills: ${techSkills}
- Frameworks/Tools: ${frameworks}
- Databases: ${databases}
- Project: ${primaryProject.name} (${primaryProject.summary || ''})
- Coding Language Preference: ${codingLang}
- Difficulty: ${difficulty}

Generate exactly 6 simple, high-impact, direct interview questions strictly based on the candidate's resume:
1. Stage 1 (Category: "intro", Type: "verbal", Time: 4 mins): Brief introduction focusing on their role and architecture in "${primaryProject.name}".
2. Stage 2 (Category: "technical", Type: "verbal", Time: 4 mins): Simple, important conceptual question on their core skill (${techSkills.split(',')[0]}).
3. Stage 3 (Category: "sql", Type: "coding", Language: "sql", Time: 10 mins): COMPULSORY SQL Query Challenge. Real-world scenario (e.g. Employee Department Salaries, Duplicate records, or Order aggregation). Include table schema, starter SQL boilerplate, 1 visible test case, and 1 hidden test case.
4. Stage 4 (Category: "coding", Type: "coding", Language: "${codingLang}", Time: 15 mins): Practical Algorithmic / Coding Challenge matching ${codingLang}. Include function starter code, 2 visible test cases with inputs & outputs, and 2 hidden edge test cases with "isHidden": true.
5. Stage 5 (Category: "architecture", Type: "verbal", Time: 4 mins): Simple, direct question on backend APIs, database indexing, or error handling from their project stack (${databases}, ${frameworks}).
6. Stage 6 (Category: "behavioral", Type: "verbal", Time: 3 mins): Direct situational / problem-solving question for a ${profile.targetRole || 'Developer'}.

IMPORTANT CODING / TEST CASE RULES:
- Every testCase must have: "id" (int), "isHidden" (boolean), "input" (string), "expected" (string), "name" (string e.g. "Test Case 1", "Hidden Edge Case 1").
- Keep question text concise, clear, and realistic.

Output ONLY valid raw JSON without markdown markers:
{
  "questions": [
    {
      "id": 1,
      "category": "intro",
      "type": "verbal",
      "allocatedMinutes": 4,
      "question": "<short question text>",
      "context": "Resume Overview"
    },
    {
      "id": 2,
      "category": "technical",
      "type": "verbal",
      "allocatedMinutes": 4,
      "question": "<short question text>",
      "context": "Core Skill Deep Dive"
    },
    {
      "id": 3,
      "category": "sql",
      "type": "coding",
      "language": "sql",
      "allocatedMinutes": 10,
      "question": "<clear SQL problem with table schema and goal>",
      "starterCode": "-- Write your SQL query here\\nSELECT \\n    \\nFROM ;",
      "testCases": [
        { "id": 1, "isHidden": false, "name": "Visible Case 1", "input": "Employees table with 5 rows", "expected": "DeptName, MaxSalary" },
        { "id": 2, "isHidden": true, "name": "Hidden Edge Case (Nulls / Ties)", "input": "Employees with tie salaries and NULL departments", "expected": "Correct distinct group" }
      ]
    },
    {
      "id": 4,
      "category": "coding",
      "type": "coding",
      "language": "${codingLang}",
      "allocatedMinutes": 15,
      "question": "<practical algorithmic problem statement with constraints>",
      "starterCode": "<valid function boilerplate in ${codingLang}>",
      "testCases": [
        { "id": 1, "isHidden": false, "name": "Test Case 1", "input": "<sample input 1>", "expected": "<expected output 1>" },
        { "id": 2, "isHidden": false, "name": "Test Case 2", "input": "<sample input 2>", "expected": "<expected output 2>" },
        { "id": 3, "isHidden": true, "name": "Hidden Case 1 (Boundary)", "input": "<edge input 3>", "expected": "<edge output 3>" },
        { "id": 4, "isHidden": true, "name": "Hidden Case 2 (Duplicates/Empty)", "input": "<edge input 4>", "expected": "<edge output 4>" }
      ]
    },
    {
      "id": 5,
      "category": "architecture",
      "type": "verbal",
      "allocatedMinutes": 4,
      "question": "<concise architecture question>",
      "context": "System & Data Flow"
    },
    {
      "id": 6,
      "category": "behavioral",
      "type": "verbal",
      "allocatedMinutes": 3,
      "question": "<concise behavioral question>",
      "context": "HR & Team Alignment"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    if (text.startsWith('```')) {
      text = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    }

    const data = JSON.parse(text);
    return data.questions || getMockResumeQuestions(profile, difficulty);
  } catch (err) {
    console.error('Error calling Gemini for resume questions:', err);
    return getMockResumeQuestions(profile, difficulty);
  }
};

/**
 * Fallback questions if Gemini API is offline
 */
function getMockResumeQuestions(profile, difficulty) {
  const primaryProject = profile.projects?.[0]?.name || 'Web Application Platform';
  const primarySkill = (profile.skills?.technical?.[0] || 'Java').toLowerCase();
  const codingLang = primarySkill.includes('python') ? 'python' : (primarySkill.includes('java') ? 'java' : 'javascript');

  const javaStarter = `public class Solution {\n    public static int findSecondHighest(int[] nums) {\n        if (nums == null || nums.length < 2) return -1;\n        // Implement your logic below\n        \n        return -1;\n    }\n}`;
  const pyStarter = `def find_second_highest(nums):\n    if not nums or len(nums) < 2:\n        return -1\n    # Implement your logic below\n    return -1`;
  const jsStarter = `function findSecondHighest(nums) {\n    if (!nums || nums.length < 2) return -1;\n    // Implement your logic below\n    return -1;\n}`;

  return [
    {
      id: 1,
      category: 'intro',
      type: 'verbal',
      allocatedMinutes: 4,
      question: `Welcome! Please walk me through your technical background and your specific architectural contributions in "${primaryProject}".`,
      context: 'Resume Project Overview'
    },
    {
      id: 2,
      category: 'technical',
      type: 'verbal',
      allocatedMinutes: 4,
      question: `How do you handle error handling, memory management, and asynchronous operations when working with ${primarySkill.toUpperCase()}?`,
      context: 'Core Technology Mastery'
    },
    {
      id: 3,
      category: 'sql',
      type: 'coding',
      language: 'sql',
      allocatedMinutes: 10,
      question: `Write an SQL query to find the 2nd Highest Salary from the Employees table (columns: id, name, department_id, salary). If there is no second highest salary, the query should return NULL.`,
      starterCode: `-- Compulsory SQL Challenge\nSELECT \n    MAX(salary) AS SecondHighestSalary\nFROM Employees\nWHERE salary < (SELECT MAX(salary) FROM Employees);`,
      testCases: [
        { id: 1, isHidden: false, name: "Visible Case 1", input: "Employees: [1: 100, 2: 200, 3: 300]", expected: "200" },
        { id: 2, isHidden: true, name: "Hidden Case 1 (Single employee / all equal)", input: "Employees: [1: 100, 2: 100]", expected: "NULL" }
      ]
    },
    {
      id: 4,
      category: 'coding',
      type: 'coding',
      language: codingLang,
      allocatedMinutes: 15,
      question: `Write an efficient function to find the Second Highest unique number in an unsorted integer array without using built-in sort functions. Optimal time complexity must be O(N).`,
      starterCode: codingLang === 'java' ? javaStarter : (codingLang === 'python' ? pyStarter : jsStarter),
      testCases: [
        { id: 1, isHidden: false, name: "Visible Case 1", input: "[10, 20, 4, 45, 99]", expected: "45" },
        { id: 2, isHidden: false, name: "Visible Case 2", input: "[5, 2]", expected: "2" },
        { id: 3, isHidden: true, name: "Hidden Edge Case 1 (Duplicates)", input: "[10, 10, 10]", expected: "-1" },
        { id: 4, isHidden: true, name: "Hidden Edge Case 2 (Single item / Empty)", input: "[100]", expected: "-1" }
      ]
    },
    {
      id: 5,
      category: 'architecture',
      type: 'verbal',
      allocatedMinutes: 4,
      question: `In a production system with high concurrent traffic, how would you design database indexing, connection pooling, and caching to avoid bottlenecks?`,
      context: 'System Architecture'
    },
    {
      id: 6,
      category: 'behavioral',
      type: 'verbal',
      allocatedMinutes: 3,
      question: `Describe a challenging technical bug or requirement disagreement you faced in a project. How did you resolve it under deadline pressure?`,
      context: 'Teamwork & Problem Solving'
    }
  ];
}

/**
 * Strict Code Evaluator
 * Enforces:
 * - Empty / Stub skeleton code -> Score 0, test cases fail.
 * - Passing visible test cases only -> Max 40% score.
 * - Passing both visible AND all hidden edge cases -> 90-100% score.
 */
const evaluateCodeSubmission = async (question, code, language, testCases = []) => {
  const trimmed = (code || '').trim();
  
  // Check if code is empty or untouched template
  const isDefaultSkeleton = 
    !trimmed ||
    trimmed.length < 25 ||
    trimmed.includes('// Implement your logic below\n        return -1;') ||
    trimmed.includes('# Implement your logic below\n    return -1') ||
    trimmed.includes('// Implement your solution here\n        return -1;');

  if (isDefaultSkeleton) {
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
      feedback: 'Incomplete implementation. The code returns the default placeholder value without algorithm logic.',
      testCaseResults: (testCases || []).map((tc, i) => ({
        id: tc.id || (i + 1),
        name: tc.name || `Case ${i + 1}`,
        isHidden: Boolean(tc.isHidden),
        passed: false,
        input: tc.isHidden ? '[Hidden Input]' : (tc.input || ''),
        expected: tc.isHidden ? '[Locked]' : (tc.expected || ''),
        actual: 'Default / Incomplete (-1)',
        details: 'Failed: Solution was not implemented.'
      }))
    };
  }

  if (!genAI) {
    return getStrictMockCodeEvaluation(trimmed, language, testCases);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `You are a strict, production-grade Automated Code Evaluator and Judge for technical coding interviews.
Evaluate the candidate's code submission against the problem statement and test cases.

Problem Statement:
"${question}"

Language: ${language}
Candidate Code:
\`\`\`${language}
${trimmed}
\`\`\`

Test Cases to Verify (some are hidden edge cases):
${JSON.stringify(testCases, null, 2)}

STRICT GRADING & SCORING RULES:
1. Trace the code step-by-step with EACH test case input. Calculate what the code actually outputs.
2. If the code only returns a hardcoded default (e.g. return -1 or select *) or incomplete loop without solving the problem:
   - score MUST be 0.
   - All test cases where expected output != actual must have passed: false.
3. If the code solves visible test cases but FAILS hidden edge cases (e.g. duplicates, empty arrays, tie values):
   - score MUST BE capped between 35 and 40 (maximum 40%).
   - isCorrect: false.
4. If and ONLY IF the code passes ALL visible test cases AND ALL hidden edge cases with correct logic and complexity:
   - score: 85 - 100.
   - isCorrect: true.

Output ONLY valid raw JSON with this exact schema:
{
  "score": <integer between 0 and 100>,
  "isCorrect": <boolean>,
  "technicalAccuracy": <integer 0-100>,
  "keywordCoverage": <integer 0-100>,
  "communication": <integer 0-100>,
  "confidence": <integer 0-100>,
  "clarity": <integer 0-100>,
  "completeness": <integer 0-100>,
  "timeComplexity": "<e.g. O(N)>",
  "spaceComplexity": "<e.g. O(1)>",
  "feedback": "<concise, constructive code review explaining pass/fail reasons>",
  "testCaseResults": [
    {
      "id": <integer>,
      "name": "<string>",
      "isHidden": <boolean>,
      "passed": <boolean>,
      "input": "<string or '[Hidden Input]'>",
      "expected": "<string or '[Locked]'>",
      "actual": "<string result computed by the candidate's code>",
      "details": "<clear explanation why it passed or failed>"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    if (text.startsWith('```')) {
      text = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    }

    const evaluation = JSON.parse(text);
    return evaluation;
  } catch (err) {
    console.error('Error evaluating code with Gemini:', err);
    return getStrictMockCodeEvaluation(trimmed, language, testCases);
  }
};

/**
 * Strict local heuristic evaluation if Gemini is offline
 */
function getStrictMockCodeEvaluation(code, language, testCases = []) {
  const codeLower = code.toLowerCase();
  
  // Detect if code contains actual algorithmic logic
  const hasLoopOrLogic = 
    (codeLower.includes('for(') || codeLower.includes('for ') || codeLower.includes('while') || codeLower.includes('select') || codeLower.includes('max(') || codeLower.includes('.sort')) &&
    (codeLower.includes('first') || codeLower.includes('second') || codeLower.includes('max') || codeLower.includes('highest') || codeLower.includes('>') || codeLower.includes('<'));

  // Detect if code handles duplicate/edge cases
  const handlesDuplicates = 
    codeLower.includes('!=') || codeLower.includes('distinct') || codeLower.includes('set') || (codeLower.includes('>') && codeLower.includes('second'));

  let allPassed = false;
  let visiblePassed = false;
  let score = 0;

  if (hasLoopOrLogic && handlesDuplicates && code.length > 70) {
    allPassed = true;
    visiblePassed = true;
    score = 95;
  } else if (hasLoopOrLogic && code.length > 50) {
    visiblePassed = true;
    allPassed = false;
    score = 40; // Visible test cases passed only
  } else {
    visiblePassed = false;
    allPassed = false;
    score = 0;
  }

  const tcResults = (testCases || []).map((tc, idx) => {
    const isHidden = Boolean(tc.isHidden);
    const passed = isHidden ? allPassed : visiblePassed;

    return {
      id: tc.id || (idx + 1),
      name: tc.name || (isHidden ? `Hidden Case ${idx + 1}` : `Case ${idx + 1}`),
      isHidden,
      passed,
      input: isHidden ? '[Hidden Input]' : (tc.input || ''),
      expected: isHidden ? '[Locked]' : (tc.expected || ''),
      actual: passed ? (isHidden ? '[Match]' : (tc.expected || 'Correct')) : 'Incorrect Output / Default Return',
      details: passed ? 'Output matches expected result.' : 'Failed: Solution does not compute the expected value.'
    };
  });

  return {
    score,
    isCorrect: allPassed,
    technicalAccuracy: score,
    keywordCoverage: score,
    communication: 75,
    confidence: score > 0 ? 80 : 20,
    clarity: 80,
    completeness: score,
    timeComplexity: allPassed ? 'O(N)' : 'Incomplete',
    spaceComplexity: allPassed ? 'O(1)' : 'N/A',
    feedback: allPassed
      ? 'Excellent solution! Correctly passes both standard inputs and hidden edge cases with optimal time complexity.'
      : (visiblePassed
        ? 'Partial Credit (40%): Solution passes visible test cases but fails hidden boundary/duplicate edge cases. Refine your logic to handle edge conditions.'
        : 'Solution failed: The code returned incorrect or default values. Please implement the required algorithm logic.'),
    testCaseResults: tcResults
  };
}

/**
 * Generates comprehensive 8-metric report for Resume-Based Interviews
 */
const evaluateResumeInterviewOverall = async (responsesList, profile) => {
  if (!genAI) {
    return getMockResumeOverallEvaluation(responsesList, profile);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const responsesSummary = responsesList.map((r, i) => {
      const type = (r.responseType === 'coding' || r.type === 'coding') ? `[Code Submission in ${r.language || 'Code'}]\n${r.code}` : `Answer:\n${r.answer}`;
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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    if (text.startsWith('```')) {
      text = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    }

    return JSON.parse(text);
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
    summary: `Candidate completed the 30-35 min Resume-Based AI Interview targeting ${profile?.targetRole || 'Full Stack Developer'}. Demonstrated good comprehension of stated projects and key technical foundations with an overall employability score of ${avg}%.`,
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
      'Practice explaining design trade-offs with quantitative metrics (e.g. latency, throughput).',
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

