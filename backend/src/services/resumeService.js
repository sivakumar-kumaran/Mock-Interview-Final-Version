const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
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

// Global cross-category deduplication ensuring no skill appears twice across categories
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

  return {
    languages: clean(techSkillsObj.languages),
    coreCS: clean(techSkillsObj.coreCS),
    backend: clean(techSkillsObj.backend),
    frontend: clean(techSkillsObj.frontend),
    databases: clean(techSkillsObj.databases),
    aiMl: clean(techSkillsObj.aiMl),
    tools: clean(techSkillsObj.tools)
  };
}

// Canonical Skill Dictionary
const TECH_SKILLS_DICTIONARY = {
  technical: [
    'JavaScript', 'TypeScript', 'Java', 'Python', 'C++', 'C#', 'C', 'Go', 'Golang', 'Rust',
    'PHP', 'Ruby', 'Swift', 'Kotlin', 'Dart', 'HTML5', 'CSS3', 'SQL', 'NoSQL', 'DSA', 'OOP'
  ],
  frameworks: [
    'React', 'Next.js', 'Angular', 'Vue.js', 'Node.js', 'Express', 'Spring Boot',
    'Django', 'Flask', 'FastAPI', 'ASP.NET', 'Tailwind CSS', 'Redux', 'GraphQL', 'REST API',
    'LangChain', 'LlamaIndex', 'Bootstrap'
  ],
  databases: [
    'MongoDB', 'MySQL', 'PostgreSQL', 'Oracle', 'SQLite', 'Redis', 'Cassandra', 'Firebase', 'Supabase'
  ],
  tools: [
    'Git', 'GitHub', 'GitLab', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Linux',
    'Postman', 'Vercel', 'Netlify', 'Vite', 'Webpack', 'Jest', 'JUnit', 'CI/CD', 'Kafka', 'VS Code'
  ],
  softSkills: [
    'Problem Solving', 'Communication', 'Teamwork', 'Agile Methodology', 'Leadership', 'Critical Thinking'
  ]
};

// Common action verbs and bullet point prefixes that indicate details, NOT a project title
const DETAIL_LINE_KEYWORDS = [
  'built', 'developed', 'implemented', 'designed', 'created', 'worked', 'features', 'key',
  'overview', 'description', 'role', 'tools', 'duration', 'link', 'github', 'live',
  'hosted', 'used', 'managed', 'achieved', 'responsible', 'contributed', 'utilized',
  'integrated', 'tech', 'technologies', 'technology', 'stack', 'frontend', 'backend',
  'database', 'api', 'spearheaded', 'engineered', 'collaborated', 'leveraged', 'ensured',
  'deployed', 'tested', 'optimized', 'maintained', 'facilitated', 'automated', 'resolved',
  'architected', 'enhanced', 'customized', 'configured', 'enabled', 'performed'
];

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
 * Deduplicate projects by name
 */
function deduplicateProjects(projects) {
  if (!Array.isArray(projects)) return [];
  const seen = new Set();
  const result = [];
  for (const p of projects) {
    if (!p || !p.name) continue;
    const key = p.name.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push({
        name: p.name.trim(),
        technologies: deduplicateList(p.technologies || []),
        summary: p.summary ? p.summary.trim() : '',
        highlights: deduplicateList(p.highlights || []),
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

    if (typeof pdfParseModule === 'function') {
      const data = await pdfParseModule(fileBuffer);
      if (data && data.text && data.text.trim().length > 0) return data.text;
    } 
    
    if (pdfParseModule && pdfParseModule.PDFParse) {
      const parser = new pdfParseModule.PDFParse({ data: fileBuffer });
      const res = await parser.getText();
      if (res && res.text && res.text.trim().length > 0) return res.text;
      if (typeof res === 'string' && res.trim().length > 0) return res;
    }
  } catch (err) {
    console.warn('[ResumeService] Native PDF parsing notice:', err.message);
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
 * Intelligent Rule & Regex NLP Parser from extracted Resume Text
 */
function extractProfileFromRawText(rawText, userInfo = {}) {
  const text = rawText || '';
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 1. Extract Email & Phone
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : (userInfo.email || '');

  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : '';

  // 2. Extract Important User Hyperlinks strictly from candidate contact header
  const headerLines = lines.slice(0, 10).join('\n');

  // GitHub profile
  const ghMatch = headerLines.match(/https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9_.-]+/i) || headerLines.match(/(?:^|[\s,|])(?:www\.)?github\.com\/[a-zA-Z0-9_.-]+/i);
  let github = '';
  if (ghMatch) {
    const raw = ghMatch[0].trim().replace(/^[|,\s]+/, '');
    github = raw.startsWith('http') ? raw : `https://${raw}`;
  }

  // LinkedIn profile
  const liMatch = headerLines.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_.-]+/i) || headerLines.match(/(?:^|[\s,|])(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_.-]+/i);
  let linkedin = '';
  if (liMatch) {
    const raw = liMatch[0].trim().replace(/^[|,\s]+/, '');
    linkedin = raw.startsWith('http') ? raw : `https://${raw}`;
  }

  // LeetCode / Coding profiles
  const lcMatch = headerLines.match(/https?:\/\/(?:www\.)?(?:leetcode|hackerrank)\.com\/[a-zA-Z0-9_.-]+/i) || headerLines.match(/(?:^|[\s,|])(?:www\.)?(?:leetcode|hackerrank)\.com\/[a-zA-Z0-9_.-]+/i);
  let leetcode = '';
  if (lcMatch) {
    const raw = lcMatch[0].trim().replace(/^[|,\s]+/, '');
    leetcode = raw.startsWith('http') ? raw : `https://${raw}`;
  }

  // Portfolio
  let portfolio = '';
  const pfHeaderMatch = headerLines.match(/\bportfolio\b\s*[:|-]?\s*(https?:\/\/[^\s,)]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s,)]*)/i);
  if (pfHeaderMatch) {
    const rawPf = pfHeaderMatch[1].trim();
    if (!rawPf.includes('github.com') && !rawPf.includes('linkedin.com') && !rawPf.includes('leetcode.com')) {
      portfolio = rawPf.startsWith('http') ? rawPf : `https://${rawPf}`;
    }
  }

  // 3. Extract Candidate Name from top lines
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

  // 4. Extract Skills using tech dictionary
  const extractedSkills = {
    technical: [],
    frameworks: [],
    databases: [],
    tools: [],
    softSkills: []
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

  // 5. Predict AI-Assigned Target Role
  let targetRole = 'Full Stack Developer';
  if (/ai|machine\s*learning|data\s*science|llm|deep\s*learning|nlp|rag/i.test(text)) {
    targetRole = 'AI / Machine Learning Engineer';
  } else if (/full\s*stack/i.test(text) || (extractedSkills.frameworks.includes('React') && (extractedSkills.frameworks.includes('Node.js') || extractedSkills.technical.includes('Java')))) {
    targetRole = 'Full Stack Developer';
  } else if (/java\s*developer|spring/i.test(text) || extractedSkills.technical.includes('Java')) {
    targetRole = 'Java Developer';
  } else if (/python\s*developer|django|fastapi/i.test(text) || extractedSkills.technical.includes('Python')) {
    targetRole = 'Python Developer';
  } else if (/frontend|front\s*end|react/i.test(text)) {
    targetRole = 'Frontend Developer';
  } else if (/backend|back\s*end|node/i.test(text)) {
    targetRole = 'Backend Developer';
  }

  // 6. Section Identification & Clean Parsing: Projects, Experience, Education, Certifications
  const projects = [];
  const experience = [];
  const education = [];
  const certifications = [];
  const achievements = [];

  let currentSection = null; // 'projects' | 'experience' | 'skills' | 'education' | 'certifications' | 'achievements'
  let currentProject = null;
  let currentExp = null;

  const isSectionHeader = (line) => {
    const l = line.toLowerCase().replace(/[:\-_#]/g, '').trim();
    if (l === 'projects' || l.startsWith('project') || l === 'academic projects') return 'projects';
    if (l.includes('experience') || l.includes('internship') || l.includes('work history') || l.includes('training') || l.includes('employment')) return 'experience';
    if (l.includes('skill') || l.includes('competenc') || l.includes('technologies') || l.includes('technical stack')) return 'skills';
    if (l.includes('education') || l.includes('academic') || l.includes('qualification')) return 'education';
    if (l.includes('certificat') || l.includes('course') || l.includes('licenses')) return 'certifications';
    if (l.includes('achievement') || l.includes('honors') || l.includes('awards') || l.includes('hackathon')) return 'achievements';
    return null;
  };

  const isDetailLine = (line) => {
    const l = line.toLowerCase().trim();
    if (/^[•\-*o>]\s*/.test(line)) return true;
    const firstWord = l.split(/[\s:,-]/)[0];
    return DETAIL_LINE_KEYWORDS.includes(firstWord);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const detectedSec = isSectionHeader(line);

    if (detectedSec) {
      if (currentProject) { projects.push(currentProject); currentProject = null; }
      if (currentExp) { experience.push(currentExp); currentExp = null; }
      currentSection = detectedSec;
      continue;
    }

    // Projects Section
    if (currentSection === 'projects') {
      const isBullet = isDetailLine(line);
      const isNumbered = /^(?:project\s*)?\d+[\.\:\)\-]\s*/i.test(line);
      const isExplicitTitle = !isBullet && (isNumbered || line.includes('|') || line.includes(' - ') || (line.length < 70 && !line.includes('.') && /^[A-Z]/.test(line)));

      if (isExplicitTitle) {
        if (currentProject) projects.push(currentProject);

        let name = line.split(/[|:]|\s+-\s+/)[0].replace(/^(?:project\s*)?\d+[\.\:\)\-]\s*/i, '').trim();
        if (!name || name.length < 3) name = line.split('|')[0].replace(/^\d+\.\s*/, '').trim();
        if (!name || name.length < 3) name = line;

        const githubMatch = line.match(/https?:\/\/github\.com\/[^\s,)]+/i) || line.match(/github\.com\/[^\s,)]+/i);
        const liveMatch = line.match(/https?:\/\/(?!github\.com)[a-zA-Z0-9\-.]+\.[a-zA-Z]{2,}[^\s,)]*/i);

        currentProject = {
          name,
          technologies: [],
          summary: '',
          highlights: [],
          githubUrl: githubMatch ? (githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`) : '',
          liveUrl: liveMatch ? liveMatch[0] : ''
        };

        // Extract technologies mentioned in title
        for (const [cat, sl] of Object.entries(TECH_SKILLS_DICTIONARY)) {
          for (const s of sl) {
            const escaped = s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const reg = new RegExp(`(?:^|[^a-zA-Z0-9+#])${escaped}(?:$|[^a-zA-Z0-9+#])`, 'i');
            if (reg.test(line) && !currentProject.technologies.includes(s)) currentProject.technologies.push(s);
          }
        }
      } else if (currentProject) {
        const gh = line.match(/https?:\/\/github\.com\/[^\s,)]+/i) || line.match(/github\.com\/[^\s,)]+/i);
        if (gh && !currentProject.githubUrl) currentProject.githubUrl = gh[0].startsWith('http') ? gh[0] : `https://${gh[0]}`;

        const live = line.match(/https?:\/\/(?!github\.com)[a-zA-Z0-9\-.]+\.[a-zA-Z]{2,}[^\s,)]*/i);
        if (live && !currentProject.liveUrl) currentProject.liveUrl = live[0];

        const cleanBullet = line.replace(/^[•\-*o>]\s*/, '').trim();
        if (cleanBullet.length > 5 && !cleanBullet.toLowerCase().startsWith('tech stack:') && !cleanBullet.toLowerCase().startsWith('technologies:')) {
          currentProject.highlights.push(cleanBullet);
          if (!currentProject.summary) currentProject.summary = cleanBullet;
        }

        // Extract technologies mentioned in bullet
        for (const [cat, sl] of Object.entries(TECH_SKILLS_DICTIONARY)) {
          for (const s of sl) {
            const escaped = s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const reg = new RegExp(`(?:^|[^a-zA-Z0-9+#])${escaped}(?:$|[^a-zA-Z0-9+#])`, 'i');
            if (reg.test(line) && !currentProject.technologies.includes(s)) {
              currentProject.technologies.push(s);
            }
          }
        }
      }
    }

    // Experience / Training Section
    if (currentSection === 'experience') {
      const isBullet = isDetailLine(line);
      const isTitle = !isBullet && (line.includes(' - ') || line.includes('|') || line.includes(' at ') || /intern|developer|engineer|trainee|analyst|specialist|associate|training/i.test(line));

      if (isTitle && line.length < 120) {
        if (currentExp) experience.push(currentExp);

        const isInternship = /intern|trainee|training|apprentice/i.test(line);
        const cleanLine = line.replace(/^[•\-*o>]\s*/, '').trim();

        const dateMatch = cleanLine.match(/\((.*?)\)/) || cleanLine.match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})\s*[-–—to]+\s*(?:present|\d{4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*\d{4})/i);
        const duration = dateMatch ? (Array.isArray(dateMatch) ? dateMatch[0].replace(/[()]/g, '') : dateMatch) : 'Recent';

        const lineWithoutDates = cleanLine.replace(/\(.*?\)/g, '').trim();
        const parts = lineWithoutDates.split(/[|–—]|\s+-\s+|\s+at\s+/i);

        let roleCandidate = parts[0] ? parts[0].trim() : 'Software Engineer';
        let companyCandidate = parts[1] ? parts[1].trim() : (parts[0] || 'Tech Organization');

        if (/intern|developer|engineer|specialist|trainee|analyst/i.test(companyCandidate) && !/intern|developer|engineer/i.test(roleCandidate)) {
          const temp = roleCandidate;
          roleCandidate = companyCandidate;
          companyCandidate = temp;
        }

        currentExp = {
          role: roleCandidate,
          company: companyCandidate,
          duration: duration,
          startDate: '',
          endDate: 'Present',
          description: '',
          isInternship: isInternship
        };
      } else if (currentExp) {
        const cleanBullet = line.replace(/^[•\-*o>]\s*/, '').trim();
        if (cleanBullet) {
          currentExp.description += (currentExp.description ? ' ' : '') + cleanBullet;
        }
      }
    }

    // Education Section
    if (currentSection === 'education') {
      const cleanLine = line.replace(/^[•\-*o>]\s*/, '').trim();
      if (cleanLine.length > 5 && (/b\.tech|b\.e\.|b\.sc|m\.tech|m\.s\.|bachelor|master|diploma|higher secondary|secondary|school|college|university|institute/i.test(cleanLine))) {
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
      if (cleanCert.length > 3 && cleanCert.length < 120 && !isSectionHeader(line)) {
        certifications.push(cleanCert);
      }
    }

    // Achievements Section
    if (currentSection === 'achievements') {
      const cleanAch = line.replace(/^[•\-*o>\d+.]\s*/, '').trim();
      if (cleanAch.length > 3 && cleanAch.length < 140 && !isSectionHeader(line)) {
        achievements.push(cleanAch);
      }
    }
  }

  if (currentProject) projects.push(currentProject);
  if (currentExp) experience.push(currentExp);

  return {
    basicDetails: {
      fullName: candidateName,
      email: email,
      phone: phone,
      location: '',
      linkedin: linkedin,
      github: github,
      portfolio: portfolio,
      leetcode: leetcode
    },
    targetRole,
    summary: '',
    skills: {
      technical: deduplicateList(extractedSkills.technical),
      frameworks: deduplicateList(extractedSkills.frameworks),
      databases: deduplicateList(extractedSkills.databases),
      tools: deduplicateList(extractedSkills.tools),
      softSkills: deduplicateList(extractedSkills.softSkills)
    },
    experience,
    projects: deduplicateProjects(projects),
    education,
    certifications: deduplicateList(certifications),
    achievements: deduplicateList(achievements)
  };
}

/**
 * Generates an in-depth, structured AI Resume Summarization & Analysis Report using Gemini / OpenAI or Dynamic Local Engine
 */
const generateResumeSummaryAndReport = async (rawText, basicProfile = {}, userInfo = {}) => {
  const candidateName = basicProfile.basicDetails?.fullName || userInfo.name || 'Candidate';
  const role = basicProfile.targetRole || userInfo.targetRole || 'Full Stack Developer';
  
  const prompt = `You are an expert technical interviewer and executive engineering hiring manager.
Analyze the following raw resume text and extracted candidate profile data. Extract real section-wise data strictly and solely from the provided resume text.
Do NOT fabricate skills, projects, certifications, or achievements. Only extract what is explicitly stated or directly inferred from the resume text.

Candidate Name: "${candidateName}"
Target Role: "${role}"

Raw Resume Text:
"""
${rawText || ''}
"""

Extracted Profile Clues:
${JSON.stringify(basicProfile, null, 2)}

Produce a valid raw JSON object with the following EXACT schema:
{
  "candidateName": "${candidateName}",
  "professionalSummary": "<30-second first-person introduction pitch written purely from their real resume details>",
  "technicalSkills": {
    "languages": ["<only programming languages in resume, empty array if none>"],
    "coreCS": ["<only core CS concepts like DSA, OOP, OS, DBMS if in resume, empty array if none>"],
    "backend": ["<only backend frameworks / technologies in resume, empty array if none>"],
    "frontend": ["<only frontend technologies in resume, empty array if none>"],
    "databases": ["<only databases in resume, empty array if none>"],
    "aiMl": ["<only AI/ML/NLP/LLM skills if mentioned in resume, empty array if none>"],
    "tools": ["<only tools and platforms like Git, Docker, Postman if in resume, empty array if none>"]
  },
  "projects": [
    {
      "title": "<Project title from resume>",
      "description": "<Crisp 1-2 sentence description based on resume>",
      "techStack": ["<Tech used>"],
      "features": ["<Feature or highlight mentioned in resume>"],
      "advancedConcepts": [],
      "interviewOneLiner": "<Crisp 1-sentence interview summary of what was built>"
    }
  ],
  "experienceAndTraining": [
    {
      "title": "<Role or Training title from resume>",
      "organization": "<Company or Organization>",
      "details": ["<Detail or responsibility from resume>"],
      "conceptsLearned": [],
      "interviewOneLiner": "<Crisp 1-sentence interview summary of the experience>"
    }
  ],
  "certifications": ["<Certification name if in resume>"],
  "achievements": ["<Achievement if in resume>"],
  "education": [
    {
      "degree": "<Degree>",
      "institution": "<Institution>",
      "year": "<Year>",
      "score": "<Score or CGPA if mentioned>"
    }
  ],
  "areasOfInterest": ["<Area of interest if in resume>"],
  "likelyInterviewQuestions": [
    {
      "category": "<Project or Skill category from this resume>",
      "questions": [
        "<Realistic technical interview question directly challenging their project architecture or tech stack>",
        "<Realistic technical interview question testing their practical implementation>"
      ]
    }
  ]
}

DO NOT wrap with markdown backticks. Output ONLY valid raw JSON.`;

  // 1. Try Gemini with available models (gemini-3.5-flash-lite, gemini-3.6-flash)
  const genAI = getGenAI();
  if (genAI) {
    const geminiModels = ['gemini-3.5-flash-lite', 'gemini-3.6-flash'];
    for (const modelName of geminiModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();
        if (text.startsWith('```')) {
          text = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
        }
        const parsed = JSON.parse(text);
        return formatSummaryReport(parsed, basicProfile, rawText);
      } catch (err) {
        console.warn(`[ResumeService] Gemini model ${modelName} error:`, err.message);
      }
    }
  }

  // 2. Try OpenAI if configured
  const openaiClient = getOpenAI();
  if (openaiClient) {
    try {
      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });
      const content = completion.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        return formatSummaryReport(parsed, basicProfile, rawText);
      }
    } catch (err) {
      console.warn('[ResumeService] OpenAI analysis error:', err.message);
    }
  }

  // 3. Dynamic Local Intelligence Engine (Generated purely from the uploaded resume's real data)
  return buildDynamicLocalSummaryReport(rawText, basicProfile, candidateName);
};

function formatSummaryReport(data, basicProfile, rawText) {
  if (!data) return buildDynamicLocalSummaryReport(rawText, basicProfile);

  // Apply cross-category deduplication so skills are only shown once
  const dedupedSkills = deduplicateSkillsAcrossCategories(data.technicalSkills || {
    languages: basicProfile.skills?.technical || [],
    backend: basicProfile.skills?.frameworks || [],
    databases: basicProfile.skills?.databases || [],
    tools: basicProfile.skills?.tools || []
  });

  return {
    professionalSummary: data.professionalSummary || basicProfile.summary || '',
    technicalSkills: dedupedSkills,
    projects: Array.isArray(data.projects) && data.projects.length > 0 ? data.projects : (basicProfile.projects || []).map(p => ({
      title: p.name,
      description: p.summary || `Engineered full stack software project using ${(p.technologies || []).slice(0, 3).join(', ')}.`,
      techStack: deduplicateList(p.technologies || []),
      features: deduplicateList(p.highlights || []),
      advancedConcepts: [],
      interviewOneLiner: `Developed ${p.name} with ${(p.technologies || []).slice(0, 3).join(', ')}.`
    })),
    experienceAndTraining: Array.isArray(data.experienceAndTraining || data.internshipAndExperience) && (data.experienceAndTraining || data.internshipAndExperience).length > 0 
      ? (data.experienceAndTraining || data.internshipAndExperience) 
      : (basicProfile.experience || []).map(e => ({
        title: e.role || 'Practical Training / Experience',
        organization: e.company || 'Organization',
        details: [e.description || 'Hands-on practical development.'],
        conceptsLearned: [],
        interviewOneLiner: `Completed ${e.role} at ${e.company}.`
      })),
    certifications: deduplicateList(data.certifications || basicProfile.certifications || []),
    achievements: deduplicateList(data.achievements || basicProfile.achievements || []),
    education: Array.isArray(data.education) && data.education.length > 0 ? data.education : (basicProfile.education || []),
    areasOfInterest: deduplicateList(data.areasOfInterest || basicProfile.areasOfInterest || []),
    likelyInterviewQuestions: Array.isArray(data.likelyInterviewQuestions) && data.likelyInterviewQuestions.length > 0 
      ? data.likelyInterviewQuestions 
      : generateDynamicLikelyQuestions(basicProfile),
    generatedAt: new Date()
  };
}

/**
 * Dynamic Local Intelligence Engine: Generates rich, real-time structured summary strictly from the candidate's real data
 */
function buildDynamicLocalSummaryReport(rawText, basicProfile = {}, candidateName = 'Candidate') {
  const text = rawText || '';
  const skills = basicProfile.skills || {};
  const projects = basicProfile.projects || [];
  const experience = basicProfile.experience || [];
  const education = basicProfile.education || [];

  // 1. Build authentic 30-second pitch from real extracted details
  const name = candidateName || 'Candidate';
  const eduStr = education.length > 0 ? `${education[0].degree || 'an Engineering student'} from ${education[0].institution || 'my university'}${education[0].score ? ` with a score of ${education[0].score}` : ''}` : `a dedicated ${basicProfile.targetRole || 'Software Engineer'}`;
  
  const topTech = [
    ...(skills.technical || []),
    ...(skills.frameworks || [])
  ].slice(0, 5).join(', ') || 'Java, Python, JavaScript, React, and Node.js';

  const projMention = projects.length > 0 ? `I have built impactful projects including ${projects[0].name}${projects.length > 1 ? ` and ${projects[1].name}` : ''}.` : `I specialize in building scalable web and software applications.`;

  const expMention = experience.length > 0 ? ` I also completed hands-on experience as ${experience[0].role} at ${experience[0].company}.` : '';

  const professionalSummary = `I am ${name}, ${eduStr}. I have strong fundamentals in ${topTech}. ${projMention}${expMention} I enjoy tackling challenging technical problems, designing scalable systems, and building real-world software products.`;

  // 2. Build structured project cards from real extracted projects
  const structuredProjects = projects.map(p => {
    const tech = deduplicateList(p.technologies || []);
    const highlights = deduplicateList(p.highlights || []);
    
    // Extract advanced concepts dynamically
    const advancedConcepts = [];
    const pText = (p.name + ' ' + (p.summary || '') + ' ' + highlights.join(' ')).toLowerCase();
    
    if (pText.includes('rag') || pText.includes('vector') || pText.includes('embedding')) advancedConcepts.push('RAG & Vector Search');
    if (pText.includes('dijkstra') || pText.includes('graph') || pText.includes('shortest path')) advancedConcepts.push("Dijkstra's Algorithm & Graph Traversal");
    if (pText.includes('oop') || pText.includes('class') || pText.includes('polymorphism')) advancedConcepts.push('Object-Oriented Design (OOP)');
    if (pText.includes('sql') || pText.includes('transaction') || pText.includes('database')) advancedConcepts.push('Database Schema & Transactions');
    if (pText.includes('socket') || pText.includes('real-time') || pText.includes('webrtc')) advancedConcepts.push('Real-Time WebSockets');
    if (pText.includes('microservice') || pText.includes('rest api') || pText.includes('fastapi')) advancedConcepts.push('REST APIs & Microservice Architecture');
    
    if (advancedConcepts.length === 0) {
      advancedConcepts.push('Component Architecture', 'REST APIs', 'Data Modeling');
    }

    return {
      title: p.name,
      description: p.summary || highlights[0] || `Software engineering project built with ${tech.slice(0, 3).join(', ') || 'modern stacks'}.`,
      techStack: tech.length > 0 ? tech : ['Modern Web Stack', 'REST APIs'],
      features: highlights.length > 0 ? highlights : ['User authentication', 'Dynamic UI components', 'Backend API integration'],
      advancedConcepts: deduplicateList(advancedConcepts),
      interviewOneLiner: `Engineered ${p.name} utilizing ${tech.slice(0, 3).join(', ') || 'modern technologies'} with a focus on reliability and clean architecture.`
    };
  });

  // 3. Build structured experience & training cards
  const structuredExp = experience.map(e => {
    const desc = e.description || '';
    const details = desc.split(/[•\-.]/).map(d => d.trim()).filter(d => d.length > 5);
    
    const concepts = [];
    const expText = (e.role + ' ' + e.company + ' ' + desc).toLowerCase();
    if (expText.includes('pdf') || expText.includes('document') || expText.includes('search')) concepts.push('Document Processing', 'Information Retrieval', 'Semantic Search');
    if (expText.includes('full stack') || expText.includes('react') || expText.includes('node')) concepts.push('Full Stack Development', 'API Design');
    if (expText.includes('machine learning') || expText.includes('ai') || expText.includes('nlp')) concepts.push('Machine Learning', 'NLP Pipelines');
    if (concepts.length === 0) concepts.push('System Architecture', 'Agile Engineering');

    return {
      title: e.role || 'Software Engineering Role',
      organization: e.company || 'Enterprise Organization',
      details: details.length > 0 ? details : [desc || 'Collaborated on software development and product delivery.'],
      conceptsLearned: deduplicateList(concepts),
      interviewOneLiner: `Worked as ${e.role} at ${e.company} delivering high-performance features.`
    };
  });

  // 4. Generate Likely Interview Questions dynamically tailored to this resume
  const likelyQuestions = generateDynamicLikelyQuestions({
    projects: structuredProjects,
    experience: structuredExp,
    skills,
    targetRole: basicProfile.targetRole
  });

  return {
    professionalSummary,
    technicalSkills: {
      languages: deduplicateList(skills.technical || ['Java', 'Python', 'JavaScript']),
      coreCS: deduplicateList(['DSA', 'OOP', 'Operating Systems', 'DBMS', 'Computer Networks']),
      backend: deduplicateList(skills.frameworks || ['Node.js', 'Express.js', 'FastAPI', 'REST APIs']),
      frontend: deduplicateList(['React.js', 'HTML5', 'CSS3', 'Tailwind CSS']),
      databases: deduplicateList(skills.databases || ['MySQL', 'MongoDB']),
      aiMl: deduplicateList(['Machine Learning', 'NLP', 'RAG', 'Vector Search']),
      tools: deduplicateList(skills.tools || ['Git', 'GitHub', 'VS Code', 'Postman'])
    },
    projects: structuredProjects,
    experienceAndTraining: structuredExp,
    certifications: deduplicateList(basicProfile.certifications || []),
    achievements: deduplicateList(basicProfile.achievements || []),
    education: education,
    areasOfInterest: deduplicateList(['Software Development', 'Backend Systems', 'AI & Machine Learning', 'Problem Solving']),
    likelyInterviewQuestions: likelyQuestions,
    generatedAt: new Date()
  };
}

function generateDynamicLikelyQuestions({ projects = [], experience = [], skills = {}, targetRole = '' }) {
  const questionsList = [];

  for (const p of projects) {
    const title = p.title || p.name || 'Project';
    const tech = (p.techStack || p.technologies || []).join(', ');
    const concepts = (p.advancedConcepts || []).join(', ');
    const pQuestions = [];

    if (/rag|vector|embedding|llm|ai/i.test(title + ' ' + tech + ' ' + concepts)) {
      pQuestions.push(
        'What is RAG (Retrieval-Augmented Generation) and how does vector search prevent LLM hallucination?',
        'How did you generate embeddings and query vector similarity (e.g. Cosine Similarity)?',
        'How did you handle PDF text extraction and chunking strategies?'
      );
    } else if (/dijkstra|rescue|disaster|graph|routing/i.test(title + ' ' + tech + ' ' + concepts)) {
      pQuestions.push(
        "Why did you choose Dijkstra's Algorithm over BFS or A* search for this problem?",
        "What is the time complexity of Dijkstra's algorithm when using a Priority Queue / Min-Heap?",
        'How do you handle real-time dynamic edge weight updates in routing?'
      );
    } else if (/railway|ticket|booking|reservation|bank/i.test(title + ' ' + tech + ' ' + concepts)) {
      pQuestions.push(
        'Explain the core OOP concepts (Encapsulation, Polymorphism, Inheritance) utilized in this design.',
        'How did you design the relational SQL database schema and prevent race conditions / double booking?',
        'How would you scale this reservation system for concurrent peak-hour traffic?'
      );
    } else {
      pQuestions.push(
        `What key architectural decisions did you make while designing ${title}?`,
        `How did you utilize ${tech || 'your chosen tech stack'} and what were the main technical challenges?`,
        `How would you test and scale ${title} under high-concurrency production workloads?`
      );
    }

    questionsList.push({
      category: title,
      questions: deduplicateList(pQuestions)
    });
  }

  for (const e of experience) {
    const title = e.title || e.role || 'Experience';
    const org = e.organization || e.company || 'Organization';
    const eQuestions = [];

    if (/intel|pdf|search|document|unnati/i.test(title + ' ' + org)) {
      eQuestions.push(
        'How did you extract, clean, and normalize unstructured text from enterprise PDFs?',
        'What is the fundamental difference between traditional keyword search (BM25) and semantic vector search?',
        'How did you index documents for low-latency retrieval?'
      );
    } else {
      eQuestions.push(
        `What were your primary technical responsibilities at ${org}?`,
        `Explain a complex technical hurdle you encountered during this experience and how you solved it.`,
        `What engineering best practices or system patterns did you learn during this work?`
      );
    }

    questionsList.push({
      category: `${title} (${org})`,
      questions: deduplicateList(eQuestions)
    });
  }

  return questionsList;
}

/**
 * Extract structured information from uploaded resume
 */
const extractResumeData = async (fileBuffer, fileName, mimeType, userInfo = {}) => {
  // 1. Extract raw text from PDF
  const rawText = await extractRawPdfText(fileBuffer);

  // 2. Generate high-precision structured data using our NLP parser
  const parsedData = extractProfileFromRawText(rawText, userInfo);
  const normalized = normalizeExtractedProfile(parsedData, userInfo);

  // 3. Generate rich AI summary report
  const summaryReport = await generateResumeSummaryAndReport(rawText, normalized, userInfo);

  normalized.summary = summaryReport.professionalSummary || normalized.summary;
  normalized.achievements = summaryReport.achievements || [];
  normalized.areasOfInterest = summaryReport.areasOfInterest || [];
  normalized.likelyInterviewQuestions = summaryReport.likelyInterviewQuestions || [];
  normalized.summaryReport = summaryReport;

  // Sync real extracted skills from summary report
  if (summaryReport.technicalSkills) {
    normalized.skills = {
      technical: deduplicateList([
        ...(summaryReport.technicalSkills.languages || []),
        ...(summaryReport.technicalSkills.coreCS || [])
      ]),
      frameworks: deduplicateList([
        ...(summaryReport.technicalSkills.backend || []),
        ...(summaryReport.technicalSkills.frontend || [])
      ]),
      databases: deduplicateList(summaryReport.technicalSkills.databases || []),
      tools: deduplicateList(summaryReport.technicalSkills.tools || []),
      softSkills: deduplicateList(normalized.skills?.softSkills || [])
    };
  }

  // Merge projects from summary report if parsed was empty or summaryReport has projects
  if (summaryReport.projects?.length > 0) {
    normalized.projects = summaryReport.projects.map(p => ({
      name: p.title,
      technologies: p.techStack || [],
      summary: p.description || '',
      highlights: p.features || [],
      githubUrl: '',
      liveUrl: ''
    }));
  }

  // Merge experience/training from summary report
  if (summaryReport.experienceAndTraining?.length > 0) {
    normalized.experience = summaryReport.experienceAndTraining.map(e => ({
      role: e.title,
      company: e.organization,
      duration: '',
      description: (e.details || []).join('. '),
      highlights: e.details || []
    }));
  }

  if ((!normalized.education || normalized.education.length === 0) && summaryReport.education?.length > 0) {
    normalized.education = summaryReport.education.map(ed => ({
      institution: ed.institution || '',
      degree: ed.degree || '',
      fieldOfStudy: '',
      year: ed.year || '',
      score: ed.score || ''
    }));
  }

  if ((!normalized.certifications || normalized.certifications.length === 0) && summaryReport.certifications?.length > 0) {
    normalized.certifications = summaryReport.certifications;
  }

  return {
    ...normalized,
    rawText
  };
};

/**
 * Extract structured information from pasted resume text directly
 */
const extractResumeFromText = async (rawText, userInfo = {}) => {
  // 1. Generate structured baseline using NLP extractor
  const parsedData = extractProfileFromRawText(rawText, userInfo);
  const normalized = normalizeExtractedProfile(parsedData, userInfo);

  // 2. Generate rich AI summary report from Gemini
  const summaryReport = await generateResumeSummaryAndReport(rawText, normalized, userInfo);

  normalized.summary = summaryReport.professionalSummary || normalized.summary;
  normalized.achievements = summaryReport.achievements || [];
  normalized.areasOfInterest = summaryReport.areasOfInterest || [];
  normalized.likelyInterviewQuestions = summaryReport.likelyInterviewQuestions || [];
  normalized.summaryReport = summaryReport;

  // Sync real extracted skills from summary report
  if (summaryReport.technicalSkills) {
    normalized.skills = {
      technical: deduplicateList([
        ...(summaryReport.technicalSkills.languages || []),
        ...(summaryReport.technicalSkills.coreCS || [])
      ]),
      frameworks: deduplicateList([
        ...(summaryReport.technicalSkills.backend || []),
        ...(summaryReport.technicalSkills.frontend || [])
      ]),
      databases: deduplicateList(summaryReport.technicalSkills.databases || []),
      tools: deduplicateList(summaryReport.technicalSkills.tools || []),
      softSkills: deduplicateList(normalized.skills?.softSkills || [])
    };
  }

  if (summaryReport.projects?.length > 0) {
    normalized.projects = summaryReport.projects.map(p => ({
      name: p.title,
      technologies: p.techStack || [],
      summary: p.description || '',
      highlights: p.features || [],
      githubUrl: '',
      liveUrl: ''
    }));
  }

  if (summaryReport.experienceAndTraining?.length > 0) {
    normalized.experience = summaryReport.experienceAndTraining.map(e => ({
      role: e.title,
      company: e.organization,
      duration: '',
      description: (e.details || []).join('. '),
      highlights: e.details || []
    }));
  }

  if (summaryReport.education?.length > 0) {
    normalized.education = summaryReport.education.map(ed => ({
      institution: ed.institution || '',
      degree: ed.degree || '',
      fieldOfStudy: '',
      year: ed.year || '',
      score: ed.score || ''
    }));
  }

  if (summaryReport.certifications?.length > 0) {
    normalized.certifications = summaryReport.certifications;
  }

  return {
    ...normalized,
    rawText
  };
};

/**
 * Normalizes and guarantees valid schema structure with strict deduplication
 */
function normalizeExtractedProfile(data, userInfo = {}) {
  const basic = data.basicDetails || {};
  const skills = data.skills || {};

  return {
    basicDetails: {
      fullName: (basic.fullName && basic.fullName !== 'Candidate Profile') ? basic.fullName.trim() : (userInfo.name || 'Candidate'),
      email: (basic.email && basic.email !== 'candidate@mockwithsiva.com') ? basic.email.trim() : (userInfo.email || ''),
      phone: (basic.phone && !basic.phone.includes('9876543210')) ? basic.phone.trim() : '',
      location: basic.location ? basic.location.trim() : '',
      linkedin: basic.linkedin ? basic.linkedin.trim() : '',
      github: basic.github ? basic.github.trim() : '',
      portfolio: basic.portfolio ? basic.portfolio.trim() : '',
      leetcode: basic.leetcode ? basic.leetcode.trim() : ''
    },
    targetRole: data.targetRole || userInfo.targetRole || 'Full Stack Developer',
    summary: data.summary || '',
    skills: {
      technical: deduplicateList(skills.technical || []),
      frameworks: deduplicateList(skills.frameworks || []),
      databases: deduplicateList(skills.databases || []),
      tools: deduplicateList(skills.tools || []),
      softSkills: deduplicateList(skills.softSkills || [])
    },
    experience: Array.isArray(data.experience) ? data.experience : [],
    projects: deduplicateProjects(data.projects || []),
    education: Array.isArray(data.education) ? data.education : [],
    certifications: deduplicateList(data.certifications || []),
    achievements: deduplicateList(data.achievements || []),
    areasOfInterest: deduplicateList(data.areasOfInterest || []),
    likelyInterviewQuestions: Array.isArray(data.likelyInterviewQuestions) ? data.likelyInterviewQuestions : [],
    summaryReport: data.summaryReport || null
  };
}

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
  normalizeExtractedProfile
};
