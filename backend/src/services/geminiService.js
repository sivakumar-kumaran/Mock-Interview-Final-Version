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

module.exports = {
  evaluateResponse,
  evaluateOverallInterview,
  chatWithAI
};
