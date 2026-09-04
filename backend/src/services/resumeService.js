const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { GoogleGenerativeAI } = require('@google/generative-ai');

let pdfParseModule = null;
try {
  pdfParseModule = require('pdf-parse');
} catch (e) {
  // Loaded on demand
}

const RESUME_ANALYZER_URL = process.env.RESUME_ANALYZER_URL || 'http://localhost:8000';
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
if (apiKey && apiKey !== 'your_gemini_api_key_here') {
  genAI = new GoogleGenerativeAI(apiKey);
}

// Canonical Skill Dictionary
const TECH_SKILLS_DICTIONARY = {
  technical: [
    'JavaScript', 'TypeScript', 'Java', 'Python', 'C++', 'C#', 'C', 'Go', 'Golang', 'Rust',
    'PHP', 'Ruby', 'Swift', 'Kotlin', 'Dart', 'HTML5', 'CSS3', 'SQL', 'NoSQL', 'DSA', 'OOP'
  ],
  frameworks: [
    'React', 'Next.js', 'Angular', 'Vue.js', 'Node.js', 'Express', 'Spring Boot',
    'Django', 'Flask', 'FastAPI', 'ASP.NET', 'Tailwind CSS', 'Redux', 'GraphQL', 'REST API'
  ],
  databases: [
    'MongoDB', 'MySQL', 'PostgreSQL', 'Oracle', 'SQLite', 'Redis', 'Cassandra', 'Firebase'
  ],
  tools: [
    'Git', 'GitHub', 'GitLab', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Linux',
    'Postman', 'Vercel', 'Netlify', 'Vite', 'Webpack', 'Jest', 'JUnit', 'CI/CD', 'Kafka'
  ],
  softSkills: [
    'Problem Solving', 'Communication', 'Teamwork', 'Agile Methodology', 'Leadership'
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
  try {
    if (!pdfParseModule) {
      pdfParseModule = require('pdf-parse');
    }

    if (typeof pdfParseModule === 'function') {
      const data = await pdfParseModule(fileBuffer);
      if (data && data.text) return data.text;
    } else if (pdfParseModule.PDFParse) {
      const parser = new pdfParseModule.PDFParse({ data: fileBuffer });
      const res = await parser.getText();
      if (res && res.text) return res.text;
    }
  } catch (err) {
    console.warn('[ResumeService] Native PDF parsing exception:', err.message);
  }

  // Fallback: extract ASCII strings from buffer preserving line breaks
  try {
    const utf8String = fileBuffer.toString('utf8');
    if (utf8String.includes('\n') && utf8String.length > 20 && !utf8String.startsWith('%PDF')) {
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
  const headerLines = lines.slice(0, 8).join('\n');

  // GitHub: Candidate profile
  const ghMatch = headerLines.match(/https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9_.-]+/i) || headerLines.match(/(?:^|[\s,|])(?:www\.)?github\.com\/[a-zA-Z0-9_.-]+/i);
  let github = '';
  if (ghMatch) {
    const raw = ghMatch[0].trim().replace(/^[|,\s]+/, '');
    github = raw.startsWith('http') ? raw : `https://${raw}`;
  }

  // LinkedIn: Candidate profile
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

  // Extract Portfolio ONLY if explicitly stated with the word 'portfolio' in candidate contact header
  let portfolio = '';
  const pfHeaderMatch = headerLines.match(/\bportfolio\b\s*[:|-]?\s*(https?:\/\/[^\s,)]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s,)]*)/i);
  if (pfHeaderMatch) {
    const rawPf = pfHeaderMatch[1].trim();
    if (!rawPf.includes('github.com') && !rawPf.includes('linkedin.com') && !rawPf.includes('leetcode.com')) {
      portfolio = rawPf.startsWith('http') ? rawPf : `https://${rawPf}`;
    }
  }

  // 3. Extract Candidate Name
  let candidateName = userInfo.name || '';
  if (lines.length > 0) {
    const firstLine = lines[0].replace(/[^\w\s]/g, '').trim();
    if (firstLine.length > 2 && firstLine.length < 40 && !/resume|curriculum|profile|contact|education|skills|experience/i.test(firstLine)) {
      candidateName = firstLine;
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
  if (/full\s*stack/i.test(text) || (extractedSkills.frameworks.includes('React') && (extractedSkills.frameworks.includes('Node.js') || extractedSkills.frameworks.includes('Express') || extractedSkills.technical.includes('Java')))) {
    targetRole = 'Full Stack Developer';
  } else if (/ai|machine\s*learning|data\s*science|llm|deep\s*learning/i.test(text)) {
    targetRole = 'AI / Machine Learning Engineer';
  } else if (/java\s*developer|spring/i.test(text) || extractedSkills.technical.includes('Java')) {
    targetRole = 'Java Developer';
  } else if (/python\s*developer|django|fastapi/i.test(text) || extractedSkills.technical.includes('Python')) {
    targetRole = 'Python Developer';
  } else if (/frontend|front\s*end|react/i.test(text)) {
    targetRole = 'Frontend Developer';
  } else if (/backend|back\s*end|node/i.test(text)) {
    targetRole = 'Backend Developer';
  } else if (/devops|cloud|docker|kubernetes/i.test(text)) {
    targetRole = 'DevOps Engineer';
  }

  // 6. Section Identification & Clean Parsing: Projects, Experience, Certifications
  const projects = [];
  const experience = [];
  const certifications = [];
  let currentSection = null; // 'projects' | 'experience' | 'skills' | 'education' | 'certifications' | 'other'

  let currentProject = null;
  let currentExp = null;

  const isSectionHeader = (line) => {
    const l = line.toLowerCase().replace(/[:\-_#]/g, '').trim();
    if (l.includes('project')) return 'projects';
    if (l.includes('experience') || l.includes('internship') || l.includes('employment') || l.includes('work history') || l.includes('training')) return 'experience';
    if (l.includes('skill') || l.includes('competenc') || l.includes('technologies')) return 'skills';
    if (l.includes('education') || l.includes('academic') || l.includes('qualification')) return 'education';
    if (l.includes('certificat') || l.includes('course') || l.includes('license') || l.includes('achievement')) return 'certifications';
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

    // Process Projects Section
    if (currentSection === 'projects') {
      const isBullet = isDetailLine(line);
      const isNumbered = /^(?:project\s*)?\d+[\.\:\)\-]\s*/i.test(line);
      const isExplicitTitle = !isBullet && (isNumbered || line.includes('|') || line.includes(' - ') || (line.length < 65 && !line.includes('.') && /^[A-Z]/.test(line)));

      if (isExplicitTitle) {
        if (currentProject) projects.push(currentProject);

        // Extract clean project name (before URL or spaced dash/pipe)
        let name = line.split(/[|:]|\s+-\s+/)[0].replace(/^(?:project\s*)?\d+[\.\:\)\-]\s*/i, '').trim();
        if (!name || name.length < 3) name = line.split('|')[0].replace(/^\d+\.\s*/, '').trim();
        if (!name || name.length < 3) name = line;

        // Extract URLs directly from project line
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

        // Extract technologies mentioned in the title line
        for (const [cat, sl] of Object.entries(TECH_SKILLS_DICTIONARY)) {
          for (const s of sl) {
            const escaped = s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const reg = new RegExp(`(?:^|[^a-zA-Z0-9+#])${escaped}(?:$|[^a-zA-Z0-9+#])`, 'i');
            if (reg.test(line) && !currentProject.technologies.includes(s)) currentProject.technologies.push(s);
          }
        }
      } else if (currentProject) {
        // Look for links in description lines
        const gh = line.match(/https?:\/\/github\.com\/[^\s,)]+/i) || line.match(/github\.com\/[^\s,)]+/i);
        if (gh && !currentProject.githubUrl) currentProject.githubUrl = gh[0].startsWith('http') ? gh[0] : `https://${gh[0]}`;

        const live = line.match(/https?:\/\/(?!github\.com)[a-zA-Z0-9\-.]+\.[a-zA-Z]{2,}[^\s,)]*/i);
        if (live && !currentProject.liveUrl) currentProject.liveUrl = live[0];

        // Clean bullet point
        const cleanBullet = line.replace(/^[•\-*o>]\s*/, '').trim();
        if (cleanBullet.length > 5 && !cleanBullet.toLowerCase().startsWith('technologies:') && !cleanBullet.toLowerCase().startsWith('tech stack:')) {
          currentProject.highlights.push(cleanBullet);
          if (!currentProject.summary) currentProject.summary = cleanBullet;
        }

        // Extract technologies mentioned in the bullet line
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

    // Process Experience / Internship Section
    if (currentSection === 'experience') {
      const isBullet = isDetailLine(line);
      const isTitle = !isBullet && (line.includes(' - ') || line.includes('|') || line.includes(' at ') || /intern|developer|engineer|trainee|analyst|specialist|associate/i.test(line));

      if (isTitle && line.length < 120) {
        if (currentExp) experience.push(currentExp);

        const isInternship = /intern|trainee|apprentice/i.test(line);
        const cleanLine = line.replace(/^[•\-*o>]\s*/, '').trim();

        // Extract dates in parens or standard formats
        const dateMatch = cleanLine.match(/\((.*?)\)/) || cleanLine.match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})\s*[-–—to]+\s*(?:present|\d{4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*\d{4})/i);
        const duration = dateMatch ? (Array.isArray(dateMatch) ? dateMatch[0].replace(/[()]/g, '') : dateMatch) : 'Recent';

        const lineWithoutDates = cleanLine.replace(/\(.*?\)/g, '').trim();
        const parts = lineWithoutDates.split(/[|–—]|\s+-\s+|\s+at\s+/i);

        let roleCandidate = parts[0] ? parts[0].trim() : 'Software Developer';
        let companyCandidate = parts[1] ? parts[1].trim() : (parts[0] || 'Tech Organization');

        // If first part is company name and second is role
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

    // Process Certifications Section
    if (currentSection === 'certifications') {
      const cleanCert = line.replace(/^[•\-*o>\d+.]\s*/, '').trim();
      if (cleanCert.length > 3 && cleanCert.length < 120 && !isSectionHeader(line)) {
        certifications.push(cleanCert);
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
    education: [],
    certifications: deduplicateList(certifications)
  };
}

/**
 * Extract structured information from uploaded resume
 */
const extractResumeData = async (fileBuffer, fileName, mimeType, userInfo = {}) => {
  // 1. Try FastAPI microservice if available
  try {
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: mimeType || 'application/pdf'
    });

    const response = await axios.post(`${RESUME_ANALYZER_URL}/api/v1/extract`, formData, {
      headers: { ...formData.getHeaders() },
      timeout: 5000
    });

    if (response.data && response.data.success !== false) {
      return normalizeExtractedProfile(response.data.data || response.data, userInfo);
    }
  } catch (err) {
    // Microservice offline, proceed to built-in parser
  }

  // 2. Extract raw text from PDF
  const rawText = await extractRawPdfText(fileBuffer);

  // 3. Generate high-precision structured data using our NLP parser
  const parsedData = extractProfileFromRawText(rawText, userInfo);

  return normalizeExtractedProfile(parsedData, userInfo);
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
    summary: '',
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
    certifications: deduplicateList(data.certifications || [])
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
  computeSkillGrowth,
  normalizeExtractedProfile
};
