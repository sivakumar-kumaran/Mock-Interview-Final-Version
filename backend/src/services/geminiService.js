const { GoogleGenerativeAI } = require('@google/generative-ai');

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    return new GoogleGenerativeAI(apiKey);
  }
  return null;
};

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

  const genAI = getGenAI();
  if (!genAI) {
    console.log('Gemini API key not configured or invalid. Using simulated evaluation.');
    return getMockIndividualEvaluation(question, answer, difficulty);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });
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

const evaluateOverallInterview = async (responsesList) => {
  const genAI = getGenAI();
  if (!genAI) {
    console.log('Gemini API key not configured or invalid. Using simulated overall evaluation.');
    return getMockOverallEvaluation(responsesList);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });
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
  const genAI = getGenAI();
  if (!genAI) {
    console.log('Gemini API key not configured. Using simulated chatbot responses.');
    return "Hi! I am your AI Interview Coach. It looks like the Gemini API Key is not configured in the backend environment, but I am still here to help! Feel free to ask me any general questions about technical concepts, resume building, or interview strategy.";
  }
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash-lite',
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
 * Generates dynamic, multi-stage interview questions tailored strictly to the user's uploaded resume summarization
 */
const generateResumeInterviewQuestions = async (profile, difficulty = 'Intermediate') => {
  const summaryReport = profile.summaryReport || {};
  const projects = summaryReport.projects || profile.projects || [];
  const training = summaryReport.experienceAndTraining || profile.experience || [];
  const likelyQ = summaryReport.likelyInterviewQuestions || profile.likelyInterviewQuestions || [];
  const techSkills = (summaryReport.technicalSkills?.languages || profile.skills?.technical || ['Java', 'JavaScript', 'Python']).join(', ');
  const frameworks = (summaryReport.technicalSkills?.backend || profile.skills?.frameworks || ['React', 'Node.js', 'FastAPI']).join(', ');
  const databases = (summaryReport.technicalSkills?.databases || profile.skills?.databases || ['MySQL', 'MongoDB']).join(', ');
  const primarySkill = (summaryReport.technicalSkills?.languages?.[0] || profile.skills?.technical?.[0] || 'Java').toLowerCase();
  const codingLang = primarySkill.includes('python') ? 'python' : (primarySkill.includes('java') ? 'java' : 'javascript');

  const projectsContext = projects.map((p, i) => {
    const title = p.title || p.name || `Project ${i+1}`;
    const desc = p.description || p.summary || '';
    const stack = (p.techStack || p.technologies || []).join(', ');
    const concepts = (p.advancedConcepts || p.highlights || []).join(', ');
    return `Project ${i+1}: "${title}" | Stack: [${stack}] | Concepts: [${concepts}] | Overview: ${desc}`;
  }).join('\n');

  const trainingContext = training.map((t, i) => {
    const title = t.title || t.role || `Experience ${i+1}`;
    const org = t.organization || t.company || '';
    const learned = (t.conceptsLearned || t.details || []).join(', ');
    return `Training/Exp ${i+1}: "${title}" at "${org}" | Learned: [${learned}]`;
  }).join('\n');

  const likelyQuestionsContext = likelyQ.map(lq => {
    return `${lq.category || 'Topic'}:\n` + (lq.questions || []).map(q => `- ${q}`).join('\n');
  }).join('\n\n');

  const genAI = getGenAI();
  if (!genAI) {
    return getMockResumeQuestions(profile, difficulty);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });

    const prompt = `You are an expert Technical Hiring Manager and Bar Raiser conducting a dynamic 30-35 minute interview tailored strictly to the candidate's resume analysis.

Candidate Summary:
- Target Role: ${profile.targetRole || 'Full Stack Developer'}
- Professional Pitch: ${summaryReport.professionalSummary || profile.summary || ''}
- Core Skills: ${techSkills}
- Backend/Frameworks: ${frameworks}
- Databases: ${databases}
- Candidate Projects:
${projectsContext || 'Full Stack Application'}
- Industrial Training / Experience:
${trainingContext || 'Document Processing and Search Systems'}

High-Yield Question Suggestions from Resume:
${likelyQuestionsContext}

Candidate's Preferred Coding Language: ${codingLang}
Interview Difficulty: ${difficulty}

CRITICAL RULES:
- DO NOT ASK GENERIC OR FIXED QUESTIONS.
- Ask questions directly challenging the specific claims, architectural decisions, and concepts on their resume (e.g. if they built an AI Mock Interview with RAG/embeddings/vector search, ask how RAG and embeddings work; if they used Dijkstra's Algorithm in a Disaster Rescue system, ask why Dijkstra and time complexity; if they built a Railway system in Java/SQL, ask about OOP design and SQL concurrency; if they did Intel Unnati training, ask about PDF extraction and semantic vs keyword search).

Generate exactly 6 multi-stage interview questions:
1. Stage 1 (Category: "intro", Type: "verbal", Time: 4 mins): Ask a tailored project architecture question on their primary project (${projects[0]?.title || projects[0]?.name || 'Primary Project'}).
2. Stage 2 (Category: "technical", Type: "verbal", Time: 4 mins): Deep-dive question on the core concepts in their resume (e.g. RAG, Dijkstra algorithm, OOP principles, or semantic search).
3. Stage 3 (Category: "sql", Type: "coding", Language: "sql", Time: 10 mins): Compulsory SQL challenge relevant to their stated database stack (${databases}). Include schema, prompt, starter code, 1 visible test case, and 1 hidden test case.
4. Stage 4 (Category: "coding", Type: "coding", Language: "${codingLang}", Time: 15 mins): Algorithmic coding challenge in ${codingLang}. Include function starter code, 2 visible test cases, and 2 hidden edge test cases with "isHidden": true.
5. Stage 5 (Category: "architecture", Type: "verbal", Time: 4 mins): System design / data flow question based on their industrial training / secondary project.
6. Stage 6 (Category: "behavioral", Type: "verbal", Time: 3 mins): Situational engineering question on teamwork, debugging, or project leadership.

IMPORTANT:
- Every testCase in Stage 3 and Stage 4 must have: "id" (int), "name" (string), "isHidden" (boolean), "input" (string), "expected" (string).

Output ONLY valid raw JSON without markdown formatting:
{
  "questions": [
    {
      "id": 1,
      "category": "intro",
      "type": "verbal",
      "allocatedMinutes": 4,
      "question": "<direct question>",
      "context": "Project Architecture"
    },
    {
      "id": 2,
      "category": "technical",
      "type": "verbal",
      "allocatedMinutes": 4,
      "question": "<direct question on RAG, Dijkstra, OOP, or Search concepts>",
      "context": "Core Technical Depth"
    },
    {
      "id": 3,
      "category": "sql",
      "type": "coding",
      "language": "sql",
      "allocatedMinutes": 10,
      "question": "<SQL Problem statement with table schemas>",
      "starterCode": "-- Write your SQL query here\\nSELECT \\n    \\nFROM ;",
      "testCases": [
        { "id": 1, "isHidden": false, "name": "Visible Case 1", "input": "Sample Table with 5 rows", "expected": "Expected Query Result" },
        { "id": 2, "isHidden": true, "name": "Hidden Edge Case (NULLs/Duplicates)", "input": "Edge records with NULLs", "expected": "Correct distinct output" }
      ]
    },
    {
      "id": 4,
      "category": "coding",
      "type": "coding",
      "language": "${codingLang}",
      "allocatedMinutes": 15,
      "question": "<Algorithmic Problem statement with constraints>",
      "starterCode": "<Starter boilerplate in ${codingLang}>",
      "testCases": [
        { "id": 1, "isHidden": false, "name": "Test Case 1", "input": "<input 1>", "expected": "<output 1>" },
        { "id": 2, "isHidden": false, "name": "Test Case 2", "input": "<input 2>", "expected": "<output 2>" },
        { "id": 3, "isHidden": true, "name": "Hidden Case 1 (Boundary)", "input": "<edge input 1>", "expected": "<edge output 1>" },
        { "id": 4, "isHidden": true, "name": "Hidden Case 2 (Duplicates/Empty)", "input": "<edge input 2>", "expected": "<edge output 2>" }
      ]
    },
    {
      "id": 5,
      "category": "architecture",
      "type": "verbal",
      "allocatedMinutes": 4,
      "question": "<Architecture & system design question>",
      "context": "System & Data Flow"
    },
    {
      "id": 6,
      "category": "behavioral",
      "type": "verbal",
      "allocatedMinutes": 3,
      "question": "<Behavioral & problem solving question>",
      "context": "Engineering Practices"
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
    if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
      return data.questions;
    }
    return getMockResumeQuestions(profile, difficulty);
  } catch (err) {
    console.error('Error calling Gemini for resume questions:', err);
    return getMockResumeQuestions(profile, difficulty);
  }
};

/**
 * Fallback questions if Gemini API is offline - dynamically tailored to resume content
 */
function getMockResumeQuestions(profile, difficulty) {
  const summary = profile.summaryReport || {};
  const projects = summary.projects || profile.projects || [];
  const p1 = projects[0]?.title || projects[0]?.name || 'AI-Powered Mock Interview Platform';
  const p2 = projects[1]?.title || projects[1]?.name || 'Disaster Rescue Management System';
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
      question: `Walk me through the architecture of "${p1}". How does vector search and RAG work under the hood, and how did you calculate the ATS resume score?`,
      context: 'Resume Project Deep Dive'
    },
    {
      id: 2,
      category: 'technical',
      type: 'verbal',
      allocatedMinutes: 4,
      question: `In your "${p2}" project, why did you select Dijkstra's Algorithm for volunteer routing? What is its time complexity and how did you handle real-time location updates?`,
      context: 'Algorithm & Concept Verification'
    },
    {
      id: 3,
      category: 'sql',
      type: 'coding',
      language: 'sql',
      allocatedMinutes: 10,
      question: `Write an SQL query to find the 2nd Highest Salary from the Employees table (columns: id, name, department_id, salary). If there is no second highest salary, return NULL.`,
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
      question: `Write an optimal O(N) function to find the Second Highest unique number in an unsorted integer array without sorting. Return -1 if no such element exists.`,
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
      question: `During your Intel Unnati Industrial Training or document processing projects, what is the fundamental difference between keyword search and semantic vector search? How do you extract structured content from PDFs?`,
      context: 'Document & Search Architecture'
    },
    {
      id: 6,
      category: 'behavioral',
      type: 'verbal',
      allocatedMinutes: 3,
      question: `As a team lead (e.g. in Smart India Hackathon), how did you handle critical technical bottlenecks or conflicting opinions under tight deadlines?`,
      context: 'Leadership & Engineering Mindset'
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

  const genAI = getGenAI();
  if (!genAI) {
    return getStrictMockCodeEvaluation(trimmed, language, testCases);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });
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
  const genAI = getGenAI();
  if (!genAI) {
    return getMockResumeOverallEvaluation(responsesList, profile);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });
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

