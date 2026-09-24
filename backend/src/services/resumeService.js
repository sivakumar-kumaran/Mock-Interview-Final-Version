const { GoogleGenerativeAI } = require('@google/generative-ai');

let OpenAI = null;
try {
  OpenAI = require('openai');
} catch (e) {
  // Loaded on demand
}

let pdfParseModule = null;
try {
  pdfParseModule = require('pdf-parse');
} catch (e) {
  // Loaded on demand
}

const getGenAI = () => {
  const key = process.env.GEMINI_API_KEY;
  if (key && key !== 'your_gemini_api_key_here') {
    return new GoogleGenerativeAI(key);
  }
  return null;
};

const getOpenAI = () => {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && openaiKey !== 'your_openai_api_key_here' && OpenAI) {
    try {
      return new OpenAI({ apiKey: openaiKey });
    } catch (err) {
      console.warn('[ResumeService] OpenAI init error:', err.message);
    }
  }
  return null;
};

// Gemini models to try in priority order (only real, valid model IDs)
const WORKING_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b'
];

// Generation config for all extraction tasks: temperature=0 for determinism
const EXTRACTION_GENERATION_CONFIG = {
  temperature: 0,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192
};

/**
 * Deduplicate an array of strings (case-insensitive deduplication)
 */
function deduplicateList(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const result = [];
  for (const item of list) {
    if (!item || typeof item !== 'string') continue;
    const trimmed = item.trim();
    const lower = trimmed.toLowerCase();
    if (trimmed.length > 0 && !seen.has(lower)) {
      seen.add(lower);
      result.push(trimmed);
    }
  }
  return result;
}

/**
 * Global cross-category deduplication ensuring no skill appears twice across categories
 */
function deduplicateSkillsAcrossCategories(techSkillsObj = {}) {
  const seen = new Set();
  const clean = (list) => {
    if (!Array.isArray(list)) return [];
    const res = [];
    for (const item of list) {
      if (!item || typeof item !== 'string') continue;
      const trimmed = item.trim();
      const lower = trimmed.toLowerCase();
      if (trimmed.length > 0 && !seen.has(lower)) {
        seen.add(lower);
        res.push(trimmed);
      }
    }
    return res;
  };

  const languages = clean(techSkillsObj.languages || []);
  const techStacks = clean(techSkillsObj.techStacks || [
    ...(techSkillsObj.frameworks || []),
    ...(techSkillsObj.backend || []),
    ...(techSkillsObj.frontend || []),
    ...(techSkillsObj.databases || [])
  ]);
  const tools = clean(techSkillsObj.tools || []);

  return {
    languages,
    techStacks,
    tools
  };
}

/**
 * Deduplicate projects by name
 */
function deduplicateProjects(projects) {
  if (!Array.isArray(projects)) return [];
  const seen = new Set();
  const result = [];
  for (const p of projects) {
    if (!p) continue;
    const name = (p.title || p.name || '').trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push({
        title: name,
        name: name,
        techStack: deduplicateList(p.techStack || p.technologies || []),
        technologies: deduplicateList(p.techStack || p.technologies || []),
        description: (p.description || p.summary || '').trim(),
        summary: (p.description || p.summary || '').trim(),
        highlights: deduplicateList(p.highlights || p.features || []),
        githubUrl: p.githubUrl || '',
        liveUrl: p.liveUrl || ''
      });
    }
  }
  return result;
}

/**
 * Safely parse text from PDF Buffer
 */
async function extractRawPdfText(fileBuffer) {
  if (!fileBuffer || fileBuffer.length === 0) return '';

  try {
    if (!pdfParseModule) {
      pdfParseModule = require('pdf-parse');
    }

    // Support pdf-parse v2 (PDFParse class)
    if (pdfParseModule && pdfParseModule.PDFParse) {
      const parser = new pdfParseModule.PDFParse({ data: fileBuffer });
      const res = await parser.getText();
      try {
        if (typeof parser.destroy === 'function') await parser.destroy();
      } catch (dErr) {
        // ignore destroy error
      }
      if (res && res.text && res.text.trim().length > 0) {
        return res.text.trim();
      }
      if (typeof res === 'string' && res.trim().length > 0) {
        return res.trim();
      }
    }

    // Support pdf-parse v1 (function)
    if (typeof pdfParseModule === 'function') {
      const data = await pdfParseModule(fileBuffer);
      if (data && data.text && data.text.trim().length > 0) {
        return data.text.trim();
      }
    }
  } catch (err) {
    console.warn('[ResumeService] PDF parsing notice:', err.message);
  }

  // Fallback: extract ASCII / UTF-8 strings from buffer preserving line breaks
  try {
    const utf8String = fileBuffer.toString('utf8');
    if (utf8String.includes('\n') && utf8String.length > 30 && !utf8String.startsWith('%PDF')) {
      return utf8String;
    }
    const matches = utf8String.match(/[A-Za-z0-9 ,.\-_@:/()\r\n]{4,}/g);
    if (matches && matches.length > 5) {
      return matches.join('\n');
    }
  } catch (e) {
    // Ignore fallback
  }

  return '';
}

/**
 * Common skill dictionary used solely for regex keyword extraction fallback
 */
const TECH_SKILLS_DICTIONARY = {
  languages: [
    'JavaScript', 'TypeScript', 'Java', 'Python', 'C++', 'C#', 'C', 'Go', 'Golang', 'Rust',
    'PHP', 'Ruby', 'Swift', 'Kotlin', 'Dart', 'SQL', 'HTML5', 'CSS3'
  ],
  techStacks: [
    'React', 'React.js', 'Next.js', 'Angular', 'Vue.js', 'Node.js', 'Express', 'Express.js',
    'Spring Boot', 'Django', 'Flask', 'FastAPI', 'ASP.NET', 'Tailwind CSS', 'Redux',
    'MongoDB', 'MySQL', 'PostgreSQL', 'Oracle', 'SQLite', 'Redis', 'Cassandra', 'Firebase', 'Supabase'
  ],
  tools: [
    'Git', 'GitHub', 'GitLab', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Linux',
    'Postman', 'Vercel', 'Netlify', 'Vite', 'Webpack', 'Jest', 'JUnit', 'CI/CD', 'Kafka', 'VS Code'
  ]
};

/**
 * Clean local regex/NLP parser used ONLY as offline fallback.
 * Strictly extracts what is in the text without injecting ANY fake skills or projects.
 */
function extractProfileFromRawTextFallback(rawText, userInfo = {}) {
  const text = rawText || '';
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 1. Email & Phone
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : (userInfo.email || '');

  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : '';

  // 2. Candidate Name (from first few lines)
  let candidateName = userInfo.name || '';
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const cleanLine = lines[i].replace(/[|•\-_:]/g, ' ').replace(/\s+/g, ' ').trim();
    if (
      cleanLine.length >= 3 &&
      cleanLine.length <= 40 &&
      !cleanLine.includes('@') &&
      !cleanLine.includes('.com') &&
      !/resume|curriculum|profile|contact|education|skills|experience|phone|email/i.test(cleanLine) &&
      /^[a-zA-Z\s.]+$/.test(cleanLine)
    ) {
      candidateName = cleanLine;
      break;
    }
  }

  // 3. Highlighted CGPA / Percentage
  // IMPORTANT: keyword prefix is REQUIRED to avoid matching random numbers like years, phone digits, etc.
  let cgpaOrPercentage = '';
  const cgpaPatterns = [
    // e.g. "CGPA: 8.5" or "CGPA: 8.5/10"
    /(?:cgpa|gpa)\s*[:=]?\s*(\d{1,2}\.\d{1,2})(?:\s*\/\s*(?:10|4\.0))?/i,
    // e.g. "8.5/10" standalone
    /(\d{1,2}\.\d{1,2})\s*\/\s*10/i,
    // e.g. "Percentage: 85%" or "85%"
    /(?:percentage|aggregate|score)\s*[:=]?\s*(\d{2,3}(?:\.\d{1,2})?)\s*%/i,
    // e.g. "85 percent"
    /(?:percentage|aggregate|score)\s*[:=]?\s*(\d{2,3}(?:\.\d{1,2})?)\s*percent/i,
    // e.g. bare "85%" only if it's a plausible score (50-100)
    /\b([5-9]\d(?:\.\d{1,2})?)\s*%/i
  ];
  for (const pat of cgpaPatterns) {
    const m = text.match(pat);
    if (m && m[1]) {
      cgpaOrPercentage = m[1].trim();
      break;
    }
  }

  // 4. Skills extraction strictly from text matches
  const extractedSkills = {
    languages: [],
    techStacks: [],
    tools: []
  };

  const seenSkillsLower = new Set();
  for (const [category, skillsList] of Object.entries(TECH_SKILLS_DICTIONARY)) {
    for (const skill of skillsList) {
      const lower = skill.toLowerCase();
      if (seenSkillsLower.has(lower)) continue;

      const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(?:^|[^a-zA-Z0-9+#])${escaped}(?:$|[^a-zA-Z0-9+#])`, 'i');
      if (regex.test(text)) {
        extractedSkills[category].push(skill);
        seenSkillsLower.add(lower);
      }
    }
  }

  // 5. Target Role prediction based on real matched skills
  let targetRole = 'Full Stack Developer';
  if (/data\s*science|machine\s*learning|deep\s*learning|ai\s*engineer/i.test(text)) {
    targetRole = 'AI / Machine Learning Engineer';
  } else if (/frontend|front\s*end/i.test(text) && !extractedSkills.techStacks.includes('Node.js')) {
    targetRole = 'Frontend Developer';
  } else if (/backend|back\s*end/i.test(text)) {
    targetRole = 'Backend Developer';
  } else if (/java/i.test(text) && extractedSkills.languages.includes('Java')) {
    targetRole = 'Java Developer';
  } else if (/python/i.test(text) && extractedSkills.languages.includes('Python')) {
    targetRole = 'Python Developer';
  }

  // 6. Section parsing for projects, internships, education, certifications, achievements
  const projects = [];
  const internships = [];
  const education = [];
  const certifications = [];
  const achievements = [];
  const areasOfInterest = [];

  let currentSection = null;
  let currentProj = null;
  let currentIntern = null;

  for (const line of lines) {
    const l = line.toLowerCase().replace(/[:\-_#]/g, '').trim();

    if (l === 'projects' || l.startsWith('project') || l === 'academic projects') {
      if (currentProj) projects.push(currentProj);
      if (currentIntern) internships.push(currentIntern);
      currentSection = 'projects';
      currentProj = null;
      currentIntern = null;
      continue;
    }
    if (l.includes('internship') || l.includes('experience') || l.includes('training') || l.includes('work history')) {
      if (currentProj) projects.push(currentProj);
      if (currentIntern) internships.push(currentIntern);
      currentSection = 'internship';
      currentProj = null;
      currentIntern = null;
      continue;
    }
    if (l.includes('education') || l.includes('academic') || l.includes('qualification')) {
      currentSection = 'education';
      continue;
    }
    if (l.includes('certificat') || l.includes('course') || l.includes('licenses')) {
      currentSection = 'certifications';
      continue;
    }
    if (l.includes('achievement') || l.includes('honors') || l.includes('awards')) {
      currentSection = 'achievements';
      continue;
    }
    if (l.includes('area of interest') || l.includes('areas of interest') || l.includes('interests') || l.includes('domain')) {
      currentSection = 'areasOfInterest';
      continue;
    }
    if (l.includes('skill') || l.includes('technical stack') || l.includes('competencies')) {
      currentSection = 'skills';
      continue;
    }

    // Projects Section
    if (currentSection === 'projects') {
      const isBullet = /^[•\-*o>]\s*/.test(line);
      const isNumbered = /^(?:project\s*)?\d+[\.\:\)\-]\s*/i.test(line);
      const isTitle = !isBullet && (isNumbered || line.includes('|') || line.includes(' - ') || (line.length < 70 && !line.includes('.') && /^[A-Z]/.test(line)));

      if (isTitle) {
        if (currentProj) projects.push(currentProj);
        let title = line.split(/[|:]|\s+-\s+/)[0].replace(/^(?:project\s*)?\d+[\.\:\)\-]\s*/i, '').trim();
        currentProj = {
          title: title || line,
          description: '',
          techStack: [],
          highlights: []
        };
      } else if (currentProj) {
        const cleanBullet = line.replace(/^[•\-*o>]\s*/, '').trim();
        if (cleanBullet.length > 5) {
          currentProj.highlights.push(cleanBullet);
          if (!currentProj.description) currentProj.description = cleanBullet;
        }
      }
    }

    // Internship Section
    if (currentSection === 'internship') {
      const isBullet = /^[•\-*o>]\s*/.test(line);
      const isTitle = !isBullet && (line.includes(' - ') || line.includes('|') || line.includes(' at ') || /intern|developer|engineer|trainee|analyst/i.test(line));

      if (isTitle && line.length < 120) {
        if (currentIntern) internships.push(currentIntern);
        const parts = line.split(/[|–—]|\s+-\s+|\s+at\s+/i);
        currentIntern = {
          title: parts[0] ? parts[0].trim() : 'Intern',
          company: parts[1] ? parts[1].trim() : 'Organization',
          duration: '',
          description: ''
        };
      } else if (currentIntern) {
        const cleanBullet = line.replace(/^[•\-*o>]\s*/, '').trim();
        if (cleanBullet) {
          currentIntern.description += (currentIntern.description ? ' ' : '') + cleanBullet;
        }
      }
    }

    // Education Section
    if (currentSection === 'education') {
      const cleanLine = line.replace(/^[•\-*o>]\s*/, '').trim();
      if (cleanLine.length > 5 && /b\.tech|b\.e\.|b\.sc|m\.tech|m\.s\.|bachelor|master|diploma|secondary|college|university|institute/i.test(cleanLine)) {
        const yearMatch = cleanLine.match(/\b(20\d{2}\s*[-–—]\s*(?:20\d{2}|present)|\b20\d{2}\b)/i);
        const scoreMatch = cleanLine.match(/(?:cgpa|gpa|percentage|score)?\s*[:=]?\s*(\d{1,2}(?:\.\d{1,2})?(?:\s*\/\s*10|\s*%)?)/i);
        education.push({
          degree: cleanLine.split(/[|\-,]/)[0].trim(),
          institution: cleanLine.split(/[|\-,]/)[1]?.trim() || cleanLine,
          year: yearMatch ? yearMatch[0] : '',
          score: scoreMatch ? scoreMatch[0].trim() : ''
        });
      }
    }

    // Certifications Section
    if (currentSection === 'certifications') {
      const cleanCert = line.replace(/^[•\-*o>\d+.]\s*/, '').trim();
      if (cleanCert.length > 3 && cleanCert.length < 120) {
        certifications.push(cleanCert);
      }
    }

    // Achievements Section
    if (currentSection === 'achievements') {
      const cleanAch = line.replace(/^[•\-*o>\d+.]\s*/, '').trim();
      if (cleanAch.length > 3 && cleanAch.length < 140) {
        achievements.push(cleanAch);
      }
    }

    // Areas of Interest Section
    if (currentSection === 'areasOfInterest') {
      const cleanLine = line.replace(/^[•\-*o>\d+.]\s*/, '').trim();
      if (cleanLine.length > 3 && cleanLine.length < 100) {
        const items = cleanLine.split(/[,|•]/).map(s => s.trim()).filter(s => s.length > 2);
        areasOfInterest.push(...items);
      }
    }
  }

  if (currentProj) projects.push(currentProj);
  if (currentIntern) internships.push(currentIntern);

  // Build authentic summary purely from extracted facts
  const eduStr = education.length > 0 ? `${education[0].degree || 'Engineering graduate'} from ${education[0].institution || 'university'}` : targetRole;
  const topTech = [...extractedSkills.languages, ...extractedSkills.techStacks].slice(0, 4).join(', ');
  const professionalSummary = `Dedicated ${eduStr} with skills in ${topTech || 'modern software engineering'}. Experienced in developing software applications with an emphasis on clean architecture and practical problem solving.`;

  return {
    candidateName: candidateName || 'Candidate',
    email,
    phone,
    targetRole,
    professionalSummary,
    cgpaOrPercentage: cgpaOrPercentage || (education[0]?.score || ''),
    education,
    skills: deduplicateSkillsAcrossCategories(extractedSkills),
    projects: deduplicateProjects(projects),
    hasInternship: internships.length > 0,
    internships,
    hasCertifications: certifications.length > 0,
    certifications: deduplicateList(certifications),
    hasAchievements: achievements.length > 0,
    achievements: deduplicateList(achievements),
    hasAreasOfInterest: areasOfInterest.length > 0,
    areasOfInterest: deduplicateList(areasOfInterest),
    likelyInterviewQuestions: generateDynamicQuestionsFromRealData(projects, extractedSkills)
  };
}

/**
 * Generate interview questions strictly from candidate's real projects and skills
 */
function generateDynamicQuestionsFromRealData(projects = [], skills = {}) {
  const questionsList = [];

  for (const p of projects) {
    const title = p.title || p.name || 'Project';
    const tech = (p.techStack || p.technologies || []).slice(0, 3).join(', ');
    const desc = p.description || p.summary || '';

    const pQuestions = [
      `Walk me through the system design of "${title}". What were the key architectural decisions you made?`,
      `How did you implement the core features in "${title}" using ${tech || 'your tech stack'}, and what was the most difficult bug or technical hurdle you solved?`
    ];

    questionsList.push({
      category: title,
      questions: pQuestions
    });
  }

  // Add questions for real languages/technologies
  const langs = skills.languages || [];
  if (langs.length > 0) {
    questionsList.push({
      category: `${langs[0]} Fundamentals`,
      questions: [
        `How does memory management and concurrency work in ${langs[0]}?`,
        `Explain a real-world scenario where you optimized performance or solved an edge case in ${langs[0]}.`
      ]
    });
  }

  return questionsList;
}

/**
 * Master Extraction Function using Gemini / OpenAI
 * Sends the full resume content and extracts ALL 6 required details with 100% precision.
 */
async function extractResumeWithAI(fileBuffer, mimeType, rawText, userInfo = {}) {
  const prompt = `You are an expert technical interviewer and executive engineering hiring manager.
Analyze the provided resume document or text.
Extract REAL, ACCURATE data strictly and solely from the provided resume.

CRITICAL REQUIREMENTS:
1. Candidate Name: Extract the candidate's real full name from the header/top of the resume. If missing or only a file name, use "${userInfo.name || 'Candidate'}".
2. Professional Summary: Write a concise 2-3 sentence professional summary based purely on their actual education, skills, and projects.
3. Highlighted CGPA / Percentage: Extract their CGPA, GPA, or percentage score (e.g., "8.8 / 10 CGPA", "85%", "3.9/4.0 GPA") explicitly found in their education or resume details. If no score is mentioned, return null.
4. Education: Array of educational qualifications with institution, degree, year, and score.
5. Languages & Tech Stacks & Tools:
   - "languages": Array of programming languages mentioned in the resume (e.g. Python, Java, JavaScript, C++, TypeScript). DO NOT include frameworks or tools here.
   - "techStacks": Array of web/backend/frontend frameworks, libraries, and databases mentioned in the resume (e.g. React, Node.js, Express, Spring Boot, MongoDB, PostgreSQL).
   - "tools": Array of developer tools, cloud services, and platforms mentioned in the resume (e.g. Git, Docker, Postman, AWS, VS Code, Linux).
   - STRICT RULE: NO DUPLICATES. If a skill is in languages, do NOT include it in techStacks or tools.
   - STRICT RULE: ONLY include skills that are actually stated in this resume. Do NOT fabricate skills!
6. Projects: How many projects were completed in this resume? Extract each one with:
   - "title": Exact project title
   - "description": 1-2 sentence description of what was built based solely on the resume
   - "techStack": Array of technologies used in this project
   - "highlights": Key bullets or features mentioned in resume
   - "githubUrl": Link if in resume, else ""
   - "liveUrl": Link if in resume, else ""
   - STRICT RULE: Extract ONLY real projects from the resume. Do NOT fabricate projects!
7. Internship: Did the candidate complete any internship or industrial training?
   - "hasInternship": true if an internship/industrial training is present, false otherwise.
   - "internships": Array of [{ "title": string, "company": string, "duration": string, "description": string }]. If hasInternship is false, return an EMPTY array [].
8. Certifications:
   - "hasCertifications": true if certifications are present in resume, false otherwise.
   - "certifications": Array of certification strings. If false, return empty array [].
9. Achievements:
   - "hasAchievements": true if achievements/awards are present in resume, false otherwise.
   - "achievements": Array of achievement strings. If false, return empty array [].
10. Area of Interest:
   - "hasAreasOfInterest": true if areas of interest/specialization are in resume, false otherwise.
   - "areasOfInterest": Array of area strings (e.g. "Cloud Computing", "Web Development", "AI/ML"). If false, return empty array [].
11. Likely Interview Questions:
   - 3-5 high-quality interview questions specifically challenging their real project architecture and tech stacks.

OUTPUT ONLY A VALID RAW JSON OBJECT with this EXACT schema (NO MARKDOWN BACKTICKS, NO EXTRA TEXT):
{
  "candidateName": "Full name",
  "email": "Email",
  "phone": "Phone",
  "targetRole": "Inferred target role",
  "professionalSummary": "Concise 2-3 sentence summary",
  "cgpaOrPercentage": "Highlighted CGPA or percentage or null",
  "education": [{ "degree": "", "institution": "", "year": "", "score": "" }],
  "skills": {
    "languages": ["Only programming languages"],
    "techStacks": ["Frameworks, backend, frontend, databases"],
    "tools": ["Developer tools, platforms, cloud"]
  },
  "projects": [{ "title": "", "description": "", "techStack": [], "highlights": [], "githubUrl": "", "liveUrl": "" }],
  "hasInternship": true,
  "internships": [{ "title": "", "company": "", "duration": "", "description": "" }],
  "hasCertifications": true,
  "certifications": [],
  "hasAchievements": true,
  "achievements": [],
  "hasAreasOfInterest": true,
  "areasOfInterest": [],
  "likelyInterviewQuestions": [{ "category": "Project or Skill name", "questions": ["Question 1", "Question 2"] }]
}`;

  // 1. Try Gemini with temperature=0 for deterministic, accurate extraction
  const genAI = getGenAI();
  if (genAI) {
    for (const modelName of WORKING_GEMINI_MODELS) {
      try {
        // Use temperature=0 so the same resume always yields the same extraction
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: EXTRACTION_GENERATION_CONFIG
        });

        // Only send raw text — sending both PDF bytes and raw text duplicates context
        // and can cause the model to conflate information from the two sources.
        // Raw text extracted by pdf-parse is more reliable for structured extraction.
        const fullPromptText = rawText
          ? `${prompt}\n\nRAW RESUME TEXT:\n"""\n${rawText}\n"""`
          : prompt;

        const result = await model.generateContent(fullPromptText);
        const response = await result.response;
        let responseText = response.text().trim();

        if (responseText.startsWith('```')) {
          responseText = responseText.replace(/^```json\s*/i, '').replace(/^```\w*\s*/i, '').replace(/```$/, '').trim();
        }

        const parsed = JSON.parse(responseText);
        if (parsed && (parsed.candidateName || parsed.skills || parsed.projects)) {
          console.log(`[ResumeService] Successfully parsed resume via Gemini model: ${modelName}`);
          const normalized = normalizeAiExtraction(parsed, rawText, userInfo);

          // Run post-extraction validation & second-call cross-check
          const validated = await validateAndCrossCheckExtraction(normalized, rawText, genAI, modelName);
          return validated;
        }
      } catch (err) {
        console.warn(`[ResumeService] Gemini ${modelName} error:`, err.message);
      }
    }
  }

  // 2. Try OpenAI
  const openaiClient = getOpenAI();
  if (openaiClient && rawText) {
    try {
      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You extract structured resume data. Output only valid raw JSON.' },
          { role: 'user', content: `${prompt}\n\nRAW RESUME TEXT:\n"""\n${rawText}\n"""` }
        ],
        temperature: 0,
        response_format: { type: 'json_object' }
      });
      const content = completion.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        console.log('[ResumeService] Successfully parsed resume via OpenAI');
        const normalized = normalizeAiExtraction(parsed, rawText, userInfo);
        return await validateAndCrossCheckExtraction(normalized, rawText, genAI, null);
      }
    } catch (err) {
      console.warn('[ResumeService] OpenAI analysis error:', err.message);
    }
  }

  // 3. Fallback: Clean Regex NLP parser (Strictly extracts real text without fake skills or fake projects)
  console.log('[ResumeService] Using real local NLP extraction fallback');
  const fallbackResult = extractProfileFromRawTextFallback(rawText, userInfo);
  // Mark as low-confidence so the frontend can optionally warn the user
  fallbackResult._extractionMethod = 'regex-fallback';
  fallbackResult._lowConfidence = true;
  return fallbackResult;
}

/**
 * ─────────────────────────────────────────────────────────────────
 * POST-EXTRACTION VALIDATION + SECOND GEMINI CROSS-CHECK
 * ─────────────────────────────────────────────────────────────────
 * After the first Gemini extraction, this function:
 *  1. Validates every returned skill actually exists in the raw text
 *  2. Validates the CGPA/percentage can be traced back to the raw text
 *  3. Validates project titles actually appear in the raw text
 *  4. Makes a SECOND lightweight Gemini call to verify uncertain fields
 *  5. Returns a cleaned, evidence-based result
 */
async function validateAndCrossCheckExtraction(extracted, rawText, genAI, successfulModel) {
  if (!rawText || rawText.trim().length < 30) return extracted;

  const textLower = rawText.toLowerCase();

  // --- 1. Validate skills ------------------------------------------------
  const validateSkillList = (list) => {
    if (!Array.isArray(list)) return [];
    return list.filter(skill => {
      if (!skill || typeof skill !== 'string') return false;
      // Accept the skill only if it literally appears in the raw resume text
      return textLower.includes(skill.toLowerCase());
    });
  };

  const validatedSkills = {
    languages: validateSkillList(extracted.skills?.languages || []),
    techStacks: validateSkillList(extracted.skills?.techStacks || []),
    tools: validateSkillList(extracted.skills?.tools || [])
  };

  // Collect skills that were removed (for the cross-check prompt)
  const removedLanguages = (extracted.skills?.languages || []).filter(s => !validatedSkills.languages.includes(s));
  const removedTechStacks = (extracted.skills?.techStacks || []).filter(s => !validatedSkills.techStacks.includes(s));
  const removedTools = (extracted.skills?.tools || []).filter(s => !validatedSkills.tools.includes(s));
  const hasRemovedSkills = removedLanguages.length > 0 || removedTechStacks.length > 0 || removedTools.length > 0;

  // --- 2. Validate CGPA / Percentage ------------------------------------
  let validatedCgpa = extracted.cgpaOrPercentage || '';
  let cgpaUncertain = false;
  if (validatedCgpa) {
    // Strip units and check if the numeric value appears in the raw text
    const numericPart = validatedCgpa.replace(/[^\d.]/g, '');
    if (numericPart && !textLower.includes(numericPart)) {
      console.warn(`[ResumeService] CGPA validation failed: "${validatedCgpa}" not found in raw text. Marking uncertain.`);
      validatedCgpa = '';
      cgpaUncertain = true;
    }
  }

  // --- 3. Validate project titles ----------------------------------------
  const validatedProjects = (extracted.projects || []).filter(p => {
    const title = (p.title || p.name || '').trim();
    if (!title) return false;
    // Accept if at least the first meaningful word of the title appears in text
    const firstWord = title.split(/\s+/)[0].toLowerCase();
    return firstWord.length > 2 && textLower.includes(firstWord);
  });

  // --- 4. Second Gemini cross-check call (only if something was uncertain) --
  const needsCrossCheck = cgpaUncertain || hasRemovedSkills || validatedProjects.length !== (extracted.projects || []).length;
  let crossCheckData = null;

  if (needsCrossCheck && genAI && (successfulModel || WORKING_GEMINI_MODELS[0])) {
    const modelToUse = successfulModel || WORKING_GEMINI_MODELS[0];
    try {
      const crossCheckPrompt = `You are a precise resume data verifier.
Below is the raw resume text. Answer ONLY based on this text — do NOT invent any information.

RAW RESUME TEXT:
"""
${rawText.slice(0, 6000)}
"""

Verification Tasks:
1. What is the exact CGPA, GPA, or percentage score stated in this resume? Look for formats like "8.5/10", "85%", "CGPA: 8.5", "3.9/4.0". If none is found, return null.
2. List ONLY the programming languages that are explicitly mentioned in this resume text.
3. List ONLY the frameworks, libraries, and databases explicitly mentioned.
4. List ONLY developer tools, cloud services, and platforms explicitly mentioned.
5. List project titles that actually appear in this resume.

Respond with ONLY a valid raw JSON object (no markdown, no extra text):
{
  "cgpaOrPercentage": "<exact value from resume or null>",
  "languages": ["only what is literally in the text"],
  "techStacks": ["only what is literally in the text"],
  "tools": ["only what is literally in the text"],
  "projectTitles": ["only project names that actually appear"]
}`;

      const crossModel = genAI.getGenerativeModel({
        model: modelToUse,
        generationConfig: EXTRACTION_GENERATION_CONFIG
      });
      const crossResult = await crossModel.generateContent(crossCheckPrompt);
      let crossText = crossResult.response.text().trim();
      if (crossText.startsWith('```')) {
        crossText = crossText.replace(/^```json\s*/i, '').replace(/^```\w*\s*/i, '').replace(/```$/, '').trim();
      }
      crossCheckData = JSON.parse(crossText);
      console.log('[ResumeService] Cross-check validation completed successfully.');
    } catch (err) {
      console.warn('[ResumeService] Cross-check call failed (non-critical):', err.message);
    }
  }

  // --- 5. Merge cross-check results -------------------------------------
  if (crossCheckData) {
    // Use cross-check CGPA if original was uncertain or empty
    if (cgpaUncertain && crossCheckData.cgpaOrPercentage && crossCheckData.cgpaOrPercentage !== 'null') {
      validatedCgpa = String(crossCheckData.cgpaOrPercentage).trim();
    }

    // Merge cross-check skills with validated skills (union, still text-verified)
    if (Array.isArray(crossCheckData.languages) && crossCheckData.languages.length > 0) {
      const merged = [...validatedSkills.languages, ...validateSkillList(crossCheckData.languages)];
      validatedSkills.languages = deduplicateList(merged);
    }
    if (Array.isArray(crossCheckData.techStacks) && crossCheckData.techStacks.length > 0) {
      const merged = [...validatedSkills.techStacks, ...validateSkillList(crossCheckData.techStacks)];
      validatedSkills.techStacks = deduplicateList(merged);
    }
    if (Array.isArray(crossCheckData.tools) && crossCheckData.tools.length > 0) {
      const merged = [...validatedSkills.tools, ...validateSkillList(crossCheckData.tools)];
      validatedSkills.tools = deduplicateList(merged);
    }

    // Recover any valid projects identified by cross-check
    if (Array.isArray(crossCheckData.projectTitles) && crossCheckData.projectTitles.length > 0) {
      const crossTitlesLower = crossCheckData.projectTitles.map(t => t.toLowerCase());
      const allProjects = extracted.projects || [];
      const recoveredProjects = allProjects.filter(p => {
        const title = (p.title || p.name || '').toLowerCase();
        return crossTitlesLower.some(ct => title.includes(ct) || ct.includes(title.split(' ')[0]));
      });
      // Use validated list or recovered list, whichever is longer
      if (recoveredProjects.length > validatedProjects.length) {
        extracted.projects = recoveredProjects;
      }
    }
  }

  // --- 6. Apply validated results ---------------------------------------
  // Apply globally deduplicated skills (no skill in two categories)
  const finalSkills = deduplicateSkillsAcrossCategories(validatedSkills);

  return {
    ...extracted,
    skills: finalSkills,
    cgpaOrPercentage: validatedCgpa,
    projects: validatedProjects.length > 0 ? validatedProjects : (extracted.projects || []),
    _extractionMethod: 'gemini-validated',
    _lowConfidence: false,
    _cgpaUncertain: cgpaUncertain && !validatedCgpa
  };
}

/**
 * Normalizes the AI extraction and guarantees valid schema structure with strict deduplication
 */
function normalizeAiExtraction(data, rawText, userInfo = {}) {
  const candidateName = (data.candidateName && data.candidateName !== 'Candidate Profile')
    ? data.candidateName.trim()
    : (userInfo.name || 'Candidate');

  const email = (data.email && data.email !== 'candidate@mockwithsiva.com')
    ? data.email.trim()
    : (userInfo.email || '');

  const phone = data.phone || '';
  const targetRole = data.targetRole || userInfo.targetRole || 'Full Stack Developer';

  // Highlighted CGPA / Percentage
  // Guard against: literal null string, prompt placeholder text, or non-numeric garbage
  let cgpaOrPercentage = data.cgpaOrPercentage ? String(data.cgpaOrPercentage).trim() : '';
  const CGPA_GARBAGE_PATTERNS = [
    /^null$/i,
    /^n\/a$/i,
    /highlighted cgpa/i,
    /or percentage/i,
    /not mentioned/i,
    /not stated/i,
    /not available/i,
    /not found/i
  ];
  if (cgpaOrPercentage && CGPA_GARBAGE_PATTERNS.some(p => p.test(cgpaOrPercentage))) {
    cgpaOrPercentage = '';
  }
  const eduList = Array.isArray(data.education) ? data.education : [];
  if (!cgpaOrPercentage && eduList.length > 0 && eduList[0].score) {
    const rawScore = String(eduList[0].score).trim();
    if (!CGPA_GARBAGE_PATTERNS.some(p => p.test(rawScore))) {
      cgpaOrPercentage = rawScore;
    }
  }

  // Strict cross-category deduplication for skills
  const rawSkills = data.skills || {};
  const dedupedSkills = deduplicateSkillsAcrossCategories({
    languages: rawSkills.languages || [],
    techStacks: rawSkills.techStacks || rawSkills.frameworks || [],
    tools: rawSkills.tools || []
  });

  // Projects
  const projects = deduplicateProjects(data.projects || []);

  // Internships (only if completed!)
  const internshipsRaw = Array.isArray(data.internships) ? data.internships : [];
  const hasInternship = Boolean(data.hasInternship && internshipsRaw.length > 0);
  const internships = hasInternship ? internshipsRaw.map(intern => ({
    title: intern.title || intern.role || 'Intern',
    company: intern.company || intern.organization || '',
    duration: intern.duration || '',
    description: intern.description || ''
  })) : [];

  // Certifications
  const certsRaw = deduplicateList(data.certifications || []);
  const hasCertifications = Boolean(data.hasCertifications && certsRaw.length > 0);
  const certifications = hasCertifications ? certsRaw : [];

  // Achievements
  const achRaw = deduplicateList(data.achievements || []);
  const hasAchievements = Boolean(data.hasAchievements && achRaw.length > 0);
  const achievements = hasAchievements ? achRaw : [];

  // Areas of Interest
  const aoiRaw = deduplicateList(data.areasOfInterest || []);
  const hasAreasOfInterest = Boolean((data.hasAreasOfInterest || aoiRaw.length > 0) && aoiRaw.length > 0);
  const areasOfInterest = hasAreasOfInterest ? aoiRaw : [];

  // Likely interview questions
  let likelyQuestions = Array.isArray(data.likelyInterviewQuestions) && data.likelyInterviewQuestions.length > 0
    ? data.likelyInterviewQuestions
    : generateDynamicQuestionsFromRealData(projects, dedupedSkills);

  return {
    candidateName,
    email,
    phone,
    targetRole,
    professionalSummary: data.professionalSummary || '',
    cgpaOrPercentage,
    education: eduList,
    skills: dedupedSkills,
    projects,
    hasInternship,
    internships,
    hasCertifications,
    certifications,
    hasAchievements,
    achievements,
    hasAreasOfInterest,
    areasOfInterest,
    likelyInterviewQuestions: likelyQuestions,
    rawText: rawText || ''
  };
}

/**
 * Standardizes structured profile for database saving & frontend consumption
 */
function buildCompleteProfileData(extracted, rawText, userInfo = {}) {
  const basicDetails = {
    fullName: extracted.candidateName || userInfo.name || 'Candidate',
    email: extracted.email || userInfo.email || '',
    phone: extracted.phone || '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: '',
    leetcode: '',
    cgpaOrPercentage: extracted.cgpaOrPercentage || ''
  };

  // Convert experience to ResumeProfile experience schema
  const experience = (extracted.internships || []).map(intern => ({
    role: intern.title || 'Intern',
    company: intern.company || '',
    duration: intern.duration || '',
    description: intern.description || '',
    isInternship: true
  }));

  // Convert projects to ResumeProfile projects schema
  const projects = (extracted.projects || []).map(p => ({
    name: p.title || p.name || 'Project',
    technologies: p.techStack || p.technologies || [],
    summary: p.description || p.summary || '',
    highlights: p.highlights || [],
    githubUrl: p.githubUrl || '',
    liveUrl: p.liveUrl || ''
  }));

  // Build summaryReport object
  const summaryReport = {
    professionalSummary: extracted.professionalSummary || '',
    cgpaOrPercentage: extracted.cgpaOrPercentage || '',
    technicalSkills: {
      languages: extracted.skills?.languages || [],
      backend: extracted.skills?.techStacks || [],
      frontend: [],
      databases: [],
      tools: extracted.skills?.tools || []
    },
    projects: projects.map(p => ({
      title: p.name,
      description: p.summary,
      techStack: p.technologies,
      features: p.highlights,
      advancedConcepts: [],
      interviewOneLiner: `Developed ${p.name} using ${(p.technologies || []).slice(0, 3).join(', ')}.`
    })),
    experienceAndTraining: experience.map(e => ({
      title: e.role,
      organization: e.company,
      details: [e.description],
      conceptsLearned: [],
      interviewOneLiner: `Completed internship as ${e.role} at ${e.company}.`
    })),
    education: extracted.education || [],
    certifications: extracted.certifications || [],
    achievements: extracted.achievements || [],
    areasOfInterest: extracted.areasOfInterest || [],
    likelyInterviewQuestions: extracted.likelyInterviewQuestions || [],
    generatedAt: new Date()
  };

  return {
    basicDetails,
    targetRole: extracted.targetRole || 'Full Stack Developer',
    summary: extracted.professionalSummary || '',
    skills: {
      technical: extracted.skills?.languages || [],
      frameworks: extracted.skills?.techStacks || [],
      databases: [],
      tools: extracted.skills?.tools || [],
      softSkills: []
    },
    experience,
    projects,
    education: extracted.education || [],
    certifications: extracted.certifications || [],
    achievements: extracted.achievements || [],
    areasOfInterest: extracted.areasOfInterest || [],
    likelyInterviewQuestions: extracted.likelyInterviewQuestions || [],
    summaryReport,
    rawText: rawText || ''
  };
}

/**
 * Extract structured information from uploaded resume PDF buffer
 */
const extractResumeData = async (fileBuffer, fileName, mimeType, userInfo = {}) => {
  // 1. Extract raw text from PDF
  const rawText = await extractRawPdfText(fileBuffer);

  // 2. Extract structured profile using Gemini / OpenAI or clean fallback
  const extracted = await extractResumeWithAI(fileBuffer, mimeType, rawText, userInfo);

  // 3. Build complete profile data ready for database save
  return buildCompleteProfileData(extracted, rawText, userInfo);
};

/**
 * Extract structured information from pasted resume text directly
 */
const extractResumeFromText = async (rawText, userInfo = {}) => {
  // 1. Extract structured profile using Gemini / OpenAI or clean fallback
  const extracted = await extractResumeWithAI(null, 'text/plain', rawText, userInfo);

  // 2. Build complete profile data ready for database save
  return buildCompleteProfileData(extracted, rawText, userInfo);
};

/**
 * Re-analyze existing profile and generate AI summary report
 */
const generateResumeSummaryAndReport = async (rawText, basicProfile = {}, userInfo = {}) => {
  const extracted = await extractResumeWithAI(null, 'text/plain', rawText, userInfo);
  const profileData = buildCompleteProfileData(extracted, rawText, userInfo);
  return profileData.summaryReport;
};

/**
 * Calculates new skills added compared to previous version
 */
const computeSkillGrowth = (currentSkillsObj, previousSkillsObj) => {
  const getAllSkills = (obj) => {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj;
    return [
      ...(obj.technical || []),
      ...(obj.frameworks || []),
      ...(obj.databases || []),
      ...(obj.tools || []),
      ...(obj.softSkills || [])
    ].map(s => (typeof s === 'string' ? s.trim().toLowerCase() : ''));
  };

  const currentList = getAllSkills(currentSkillsObj);
  const prevList = new Set(getAllSkills(previousSkillsObj));

  const added = currentList.filter(skill => skill && !prevList.has(skill));
  return [...new Set(added)];
};

module.exports = {
  extractResumeData,
  extractResumeFromText,
  generateResumeSummaryAndReport,
  computeSkillGrowth,
  extractRawPdfText
};
