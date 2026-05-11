// services/fileService.js — File upload handling + text extraction

const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const UPLOAD_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    const ext    = path.extname(file.originalname).toLowerCase();
    cb(null, `resume-${unique}${ext}`);
  },
});

// File filter: allow PDF, DOCX, DOC, TXT only
const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.docx', '.doc', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} not allowed. Use: PDF, DOCX, DOC, or TXT`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024 },
});

/**
 * extractTextFromFile — Extract raw text from uploaded resume file
 * Supports: PDF, DOCX, TXT
 */
async function extractTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf-8');
  }

  if (ext === '.pdf') {
    try {
      const pdfParse = require('pdf-parse');
      const buffer   = fs.readFileSync(filePath);
      const data     = await pdfParse(buffer);
      return data.text;
    } catch (err) {
      console.error('PDF parse error:', err.message);
      return null;
    }
  }

  if (ext === '.docx' || ext === '.doc') {
    try {
      const mammoth = require('mammoth');
      const result  = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (err) {
      console.error('DOCX parse error:', err.message);
      return null;
    }
  }

  return null;
}

/**
 * parseResumeText — Extract structured info from raw resume text using AI
 * Returns: { name, email, phone, skills, experience, education }
 */
async function parseResumeText(text) {
  // Simple rule-based extraction for common patterns
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.[a-z]{2,}/i);
  const phoneMatch = text.match(/(\+91|91)?[6-9]\d{9}/);

  // Extract years of experience
  const expMatch = text.match(/(\d+)\s*(?:\+\s*)?(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)/i);

  // Extract common tech skills
  const skillKeywords = [
    'Python','JavaScript','TypeScript','Java','C++','C#','Ruby','Go','Rust','Swift',
    'React','Vue','Angular','Node.js','Django','Flask','Spring','Express',
    'MySQL','PostgreSQL','MongoDB','Redis','SQLite','Oracle',
    'Docker','Kubernetes','AWS','Azure','GCP','CI/CD','Jenkins','Git',
    'Machine Learning','Deep Learning','TensorFlow','PyTorch','NLP','Computer Vision',
    'Data Analysis','Tableau','Power BI','Pandas','NumPy','Scikit-learn',
    'HTML','CSS','Sass','Tailwind','Bootstrap','REST API','GraphQL',
    'Figma','Adobe XD','UI/UX','Agile','Scrum','Linux','Bash',
  ];

  const foundSkills = skillKeywords.filter(sk =>
    new RegExp(`\\b${sk.replace('.', '\\.')}\\b`, 'i').test(text)
  );

  // Extract education
  const eduKeywords = ['B.Tech','M.Tech','B.E.','M.E.','BCA','MCA','B.Sc','M.Sc','MBA','Ph.D','Bachelor','Master'];
  const eduMatch = text.match(new RegExp(`(${eduKeywords.join('|')})[^\\n]{0,60}`, 'i'));

  return {
    email:      emailMatch ? emailMatch[0] : '',
    phone:      phoneMatch ? phoneMatch[0] : '',
    skills:     foundSkills.join(', ') || 'See resume for details',
    experience: expMatch ? parseInt(expMatch[1]) : 0,
    education:  eduMatch ? eduMatch[0].trim() : '',
    rawText:    text.substring(0, 3000), // First 3000 chars for AI evaluation
  };
}

/** Delete a file after processing */
function deleteFile(filePath) {
  try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); }
  catch (e) { console.error('Delete file error:', e.message); }
}

module.exports = { upload, extractTextFromFile, parseResumeText, deleteFile, UPLOAD_DIR };
