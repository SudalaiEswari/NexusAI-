// routes/agentRoutes.js — All 4 agent routes combined

const express = require('express');
const router  = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');

// ── Agents ──────────────────────────────────────────────────
const analyst    = require('../agents/analystAgent');
const support    = require('../agents/supportAgent');
const recruitment= require('../agents/recruitmentAgent');
const research   = require('../agents/researchAgent');
const { upload } = require('../services/fileService');
const pdfService = require('../services/pdfService');
const db = require('../db/database');

// ════════════════════════════════════════════════════════════
// ANALYST ROUTES  /api/analyst/*
// ════════════════════════════════════════════════════════════

router.post('/analyst/query', protect, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question?.trim()) return res.status(400).json({ error: 'Question required' });
    const result = await analyst.analyzeQuery(question, req.user.lang || 'en');
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/analyst/stats', protect, (req, res) => {
  try { res.json(analyst.getStats()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/analyst/charts', protect, (req, res) => {
  try {
    res.json({
      revenueByProduct: analyst.getRevenueByProductChart(),
      salesByRegion:    analyst.getSalesByRegionChart(),
      monthlySales:     analyst.getMonthlySalesChart(),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/analyst/export-pdf', protect, async (req, res) => {
  try {
    const { question, sql, results, insights } = req.body;
    if (!question) return res.status(400).json({ error: 'Question required for PDF export' });
    
    const buffer = await pdfService.generateAnalystPDF({ question, sql, results, insights });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=NexusAI_Analysis_Report.pdf');
    res.send(buffer);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════
// SUPPORT ROUTES  /api/support/*
// ════════════════════════════════════════════════════════════

router.post('/support/query', protect, async (req, res) => {
  try {
    const { customerName, issue, customerEmail } = req.body;
    if (!issue?.trim()) return res.status(400).json({ error: 'Issue description required' });
    const result = await support.handleSupportQuery(
      customerName, issue, customerEmail, req.user.lang || 'en', req.user.id
    );
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/support/tickets', protect, (req, res) => {
  try {
    const tickets = support.getTickets(req.query.status || null);
    res.json({ success: true, tickets, count: tickets.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/support/tickets/:ticketId', protect, async (req, res) => {
  try {
    const valid = ['Open', 'In Progress', 'Resolved'];
    if (!valid.includes(req.body.status)) return res.status(400).json({ error: `Status must be: ${valid.join(', ')}` });
    const result = await support.updateTicketStatus(req.params.ticketId, req.body.status);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/support/stats', protect, (req, res) => {
  try { res.json(support.getStats()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/support/chart', protect, (req, res) => {
  try { res.json(support.getTicketChartData()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════
// RECRUITMENT ROUTES  /api/recruitment/*
// ════════════════════════════════════════════════════════════

// Evaluate candidate — with optional file upload
router.post('/recruitment/evaluate',
  protect,
  upload.single('resumeFile'),
  async (req, res) => {
    try {
      const { name, email, phone, skills, experience, education, appliedRole } = req.body;
      if (!name || !appliedRole) return res.status(400).json({ error: 'Name and applied role are required' });

      const resumeFilePath = req.file ? req.file.path : null;
      const result = await recruitment.evaluateCandidate(
        { name, email, phone, skills, experience, education, appliedRole, resumeFilePath },
        req.user.lang || 'en',
        req.user.id
      );
      res.json(result);
    } catch (e) { res.status(500).json({ error: e.message }); }
  }
);

router.post('/recruitment/schedule', protect, async (req, res) => {
  try {
    const { candidateId, scheduledAt, interviewer, mode } = req.body;
    if (!candidateId || !scheduledAt || !interviewer) return res.status(400).json({ error: 'candidateId, scheduledAt, interviewer required' });
    const result = await recruitment.scheduleInterview(candidateId, scheduledAt, interviewer, mode);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/recruitment/candidates', protect, (req, res) => {
  try {
    const candidates = recruitment.getCandidates(req.query.role, req.query.status);
    res.json({ success: true, candidates, count: candidates.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/recruitment/stats', protect, (req, res) => {
  try { res.json(recruitment.getStats()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/recruitment/chart', protect, (req, res) => {
  try { res.json(recruitment.getCandidateScoreChart()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/recruitment/export-pdf/:id', protect, async (req, res) => {
  try {
    const candidate = db.prepare(`SELECT * FROM candidates WHERE id=?`).get(req.params.id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    
    const evaluation = candidate.evaluation || 'No detailed evaluation recorded.';
    const buffer = await pdfService.generateCandidatePDF(candidate, evaluation);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Evaluation_${candidate.name.replace(/\s+/g, '_')}.pdf`);
    res.send(buffer);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════
// RESEARCH ROUTES  /api/research/*
// ════════════════════════════════════════════════════════════

router.post('/research/query', protect, async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic?.trim()) return res.status(400).json({ error: 'Research topic required' });
    const result = await research.conductResearch(topic, req.user.lang || 'en', req.user.id);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/research/reports', protect, (req, res) => {
  try {
    const reports = research.getSavedReports(req.user.id);
    res.json({ success: true, reports });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/research/reports/:id', protect, (req, res) => {
  try {
    const report = research.getReportById(req.params.id, req.user.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json({ success: true, report });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Health check ───────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({
    status: '✅ Running',
    agents: ['Analyst','Support','Recruitment','Research'],
    features: ['Auth','Email','Search','FileUpload','Sockets','Charts','i18n','CloudReady'],
    aiProvider: process.env.AI_PROVIDER || 'claude',
    searchProvider: process.env.TAVILY_API_KEY && process.env.TAVILY_API_KEY !== 'your_tavily_api_key_here' ? 'Tavily' : 'Mock',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
