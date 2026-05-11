// agents/recruitmentAgent.js — Resume upload, AI scoring, email on schedule

const db = require('../db/database');
const { callAI } = require('../services/aiService');
const { sendInterviewScheduledEmail } = require('../services/emailService');
const { extractTextFromFile, parseResumeText } = require('../services/fileService');
const socket = require('../services/socketService');

const EVAL_PROMPT = `You are an expert HR Recruiter and Technical Interviewer.
Evaluate the candidate objectively. Provide:
1. Score (0–100) — format exactly as "Score: XX"
2. Key Strengths (2-3 bullets with ✅)
3. Skill Gaps (1-2 bullets with ⚠️ if any)
4. Recommendation: "Select" / "Shortlist" / "Reject"
5. Suggested Interview: "Technical" / "HR" / "Technical + HR"
Be fair and data-driven.`;

async function evaluateCandidate(data, lang = 'en', userId = null) {
  const { name, email, phone, skills, experience, education, appliedRole, resumeFilePath } = data;

  let resumeText = null;
  let parsedFromFile = {};

  // Extract text from uploaded resume file if provided
  if (resumeFilePath) {
    resumeText = await extractTextFromFile(resumeFilePath);
    if (resumeText) {
      parsedFromFile = await parseResumeText(resumeText);
    }
  }

  const finalSkills = skills || parsedFromFile.skills || 'Not provided';
  const finalExp    = experience || parsedFromFile.experience || 0;
  const finalEdu    = education  || parsedFromFile.education  || '';
  const finalEmail  = email      || parsedFromFile.email      || '';
  const finalPhone  = phone      || parsedFromFile.phone      || '';

  const jobReqs  = getJobRequirements(appliedRole);
  const baseScore = calculateBaseScore(finalSkills, finalExp, appliedRole);

  const evalPrompt = `
Candidate: ${name}
Role Applied: ${appliedRole}
Skills: ${finalSkills}
Experience: ${finalExp} years
Education: ${finalEdu}
${resumeText ? `Resume Extract:\n${resumeText.substring(0, 1500)}` : ''}
Job Requirements: ${jobReqs}
Preliminary Score: ${baseScore}/100`;

  const evaluation = await callAI(EVAL_PROMPT, evalPrompt, lang);

  const finalScore = extractScore(evaluation) || baseScore;
  const status     = scoreToStatus(finalScore);
  const today      = new Date().toISOString().split('T')[0];

  const result = db.prepare(`
    INSERT INTO candidates (name,email,phone,skills,experience,education,score,status,applied_role,resume_file,applied_on,user_id)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(name, finalEmail, finalPhone, finalSkills, parseInt(finalExp)||0,
         finalEdu, finalScore, status, appliedRole,
         resumeFilePath ? require('path').basename(resumeFilePath) : null,
         today, userId);

  socket.notifyNewCandidate({ name, score: finalScore, role: appliedRole, status });

  return {
    success: true,
    candidateId: result.lastInsertRowid,
    name, appliedRole,
    score: finalScore, status, evaluation,
    parsedFromFile: resumeFilePath ? parsedFromFile : null,
  };
}

async function scheduleInterview(candidateId, scheduledAt, interviewer, mode = 'Online') {
  const candidate = db.prepare(`SELECT * FROM candidates WHERE id=?`).get(candidateId);
  if (!candidate) throw new Error('Candidate not found');

  db.prepare(`INSERT INTO interviews (candidate_id,scheduled_at,interviewer,mode,status) VALUES (?,?,?,?,'Scheduled')`
  ).run(candidateId, scheduledAt, interviewer, mode);

  db.prepare(`UPDATE candidates SET status='Interview Scheduled' WHERE id=?`).run(candidateId);

  const interview = { scheduledAt, interviewer, mode };

  // Send email notification
  if (candidate.email) {
    sendInterviewScheduledEmail(candidate, interview).catch(console.error);
  }

  return {
    success: true, candidateId,
    message: `Interview scheduled for ${candidate.name}`,
    candidate: candidate.name,
    emailSent: !!candidate.email,
    scheduledAt, interviewer, mode
  };
}

function getCandidates(role = null, status = null) {
  let sql = `SELECT * FROM candidates WHERE 1=1`;
  const params = [];
  if (role)   { sql += ` AND LOWER(applied_role) LIKE LOWER(?)`; params.push(`%${role}%`); }
  if (status) { sql += ` AND status=?`; params.push(status); }
  sql += ` ORDER BY score DESC, applied_on DESC`;
  return db.prepare(sql).all(...params);
}

function getStats() {
  return {
    total:       db.prepare(`SELECT COUNT(*) as c FROM candidates`).get().c,
    selected:    db.prepare(`SELECT COUNT(*) as c FROM candidates WHERE status='Selected'`).get().c,
    shortlisted: db.prepare(`SELECT COUNT(*) as c FROM candidates WHERE status='Shortlisted'`).get().c,
    pending:     db.prepare(`SELECT COUNT(*) as c FROM candidates WHERE status='Pending'`).get().c,
    avgScore:    db.prepare(`SELECT ROUND(AVG(score),1) as v FROM candidates`).get().v,
    interviews:  db.prepare(`SELECT COUNT(*) as c FROM interviews WHERE status='Scheduled'`).get().c,
  };
}

function getCandidateScoreChart() {
  const rows = db.prepare(`SELECT applied_role, ROUND(AVG(score),1) as avg_score, COUNT(*) as count FROM candidates GROUP BY applied_role ORDER BY avg_score DESC`).all();
  return {
    type: 'bar',
    labels: rows.map(r => r.applied_role),
    datasets: [
      { label: 'Avg Score', data: rows.map(r => r.avg_score), backgroundColor: '#a855f799', borderColor: '#a855f7', borderWidth: 2, borderRadius: 6 },
      { label: 'Count', data: rows.map(r => r.count), backgroundColor: '#22c55e55', borderColor: '#22c55e', borderWidth: 2, borderRadius: 6, yAxisID: 'y2' }
    ]
  };
}

// ── Helpers ────────────────────────────────────────────────────
function getJobRequirements(role) {
  const map = {
    'data scientist': 'Python, ML, TensorFlow/PyTorch, SQL, Statistics, Data Visualization',
    'full stack developer': 'JavaScript, React/Vue, Node.js, Database, REST API, Git',
    'backend engineer': 'Java/Python/Node.js, Microservices, Docker, DB design',
    'ui/ux designer': 'Figma, Adobe XD, User Research, Prototyping, Design Systems',
    'frontend developer': 'JavaScript, React, CSS, HTML, Performance, Accessibility',
    'devops engineer': 'Linux, Docker, Kubernetes, CI/CD, AWS/Azure, Bash',
    'backend developer': 'Python/Node.js/Java, REST API, Database, Git',
  };
  const k = (role||'').toLowerCase();
  for (const [key, val] of Object.entries(map)) if (k.includes(key)) return val;
  return 'Relevant technical skills, communication, problem-solving';
}

function calculateBaseScore(skills, exp, role) {
  let score = 40;
  const skillList = (skills||'').toLowerCase().split(',').map(s => s.trim());
  const tech = ['python','javascript','java','react','node','sql','docker','aws','ml','tensorflow','git','kubernetes','mongodb','figma'];
  tech.forEach(t => { if (skillList.some(s => s.includes(t))) score += 3; });
  const e = parseInt(exp)||0;
  if (e >= 5) score += 18; else if (e >= 3) score += 12; else if (e >= 1) score += 6;
  const rl = (role||'').toLowerCase();
  if (rl.includes('data') && skillList.some(s => s.includes('python')||s.includes('ml'))) score += 8;
  if (rl.includes('full') && skillList.some(s => s.includes('react')||s.includes('node'))) score += 8;
  return Math.min(Math.round(score), 100);
}

function extractScore(text) {
  const m = text.match(/Score:\s*(\d{1,3})/i) || text.match(/(\d{1,3})\s*\/\s*100/);
  if (m) { const n = parseInt(m[1]); if (n >= 0 && n <= 100) return n; }
  return null;
}

function scoreToStatus(score) {
  if (score >= 80) return 'Selected';
  if (score >= 50) return 'Shortlisted';
  return 'Pending';
}

module.exports = { evaluateCandidate, scheduleInterview, getCandidates, getStats, getCandidateScoreChart };
