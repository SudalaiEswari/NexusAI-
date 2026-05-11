// agents/supportAgent.js — Support with email + socket notifications

const db = require('../db/database');
const { callAI } = require('../services/aiService');
const { sendTicketCreatedEmail, sendTicketResolvedEmail } = require('../services/emailService');
const socket = require('../services/socketService');
const { v4: uuidv4 } = require('uuid');

const SUPPORT_PROMPT = `You are a professional, empathetic Customer Support Agent for TechBiz Solutions.
Provide a helpful, specific response (max 200 words). Reference customer data when available.
Format: greeting → solution steps → reassurance → sign-off.
Plans: Basic (email only), Pro (email+chat), Enterprise (24/7 priority).`;

async function handleSupportQuery(customerName, issue, customerEmail = '', lang = 'en', userId = null) {
  // Look up customer
  const customer = customerName
    ? db.prepare(`SELECT * FROM customers WHERE LOWER(name) LIKE LOWER(?) LIMIT 1`).get(`%${customerName}%`)
    : null;

  const prevTickets = customerName
    ? db.prepare(`SELECT ticket_id, issue, status FROM tickets WHERE LOWER(customer) LIKE LOWER(?) ORDER BY created_at DESC LIMIT 3`).all(`%${customerName}%`)
    : [];

  const context = `
Customer: ${customerName || 'Anonymous'}
${customer ? `Details: ${JSON.stringify(customer)}` : 'New customer (not in DB)'}
${prevTickets.length ? `Previous tickets: ${JSON.stringify(prevTickets)}` : 'No previous tickets'}
Current issue: ${issue}`;

  const response = await callAI(SUPPORT_PROMPT, context, lang);

  // Create ticket
  const ticketId   = 'TKT-' + uuidv4().substring(0, 6).toUpperCase();
  const priority   = detectPriority(issue);
  const today      = new Date().toISOString().split('T')[0];
  const emailToUse = customerEmail || customer?.email || '';

  db.prepare(`INSERT INTO tickets (ticket_id,customer,email,issue,status,priority,agent_reply,created_at,user_id)
    VALUES (?,?,?,?,'Open',?,?,?,?)`
  ).run(ticketId, customerName || 'Anonymous', emailToUse, issue, priority, response, today, userId);

  const ticket = { ticket_id: ticketId, id: ticketId, priority, issue };

  // Send email notification (non-blocking)
  if (emailToUse) {
    sendTicketCreatedEmail(ticket, emailToUse).catch(console.error);
  }

  // Real-time socket notification
  socket.notifyTicketCreated(ticket, userId);

  return {
    success: true,
    customerFound: !!customer,
    customerInfo: customer,
    response,
    ticket: { id: ticketId, status: 'Open', priority, createdAt: today, emailSent: !!emailToUse },
    previousTickets: prevTickets,
  };
}

function getTickets(status = null) {
  const sql = status
    ? `SELECT * FROM tickets WHERE status=? ORDER BY created_at DESC`
    : `SELECT * FROM tickets ORDER BY created_at DESC`;
  return status ? db.prepare(sql).all(status) : db.prepare(sql).all();
}

async function updateTicketStatus(ticketId, status) {
  const resolved = status === 'Resolved' ? new Date().toISOString().split('T')[0] : null;
  db.prepare(`UPDATE tickets SET status=?, resolved_at=? WHERE ticket_id=?`).run(status, resolved, ticketId);

  const ticket = db.prepare(`SELECT * FROM tickets WHERE ticket_id=?`).get(ticketId);

  // Send email if resolved and email exists
  if (status === 'Resolved' && ticket?.email) {
    sendTicketResolvedEmail(ticket, ticket.email).catch(console.error);
  }

  // Real-time update
  socket.notifyTicketUpdated(ticket || { ticket_id: ticketId, status });

  return { success: true, ticketId, newStatus: status };
}

function getStats() {
  return {
    total:       db.prepare(`SELECT COUNT(*) as c FROM tickets`).get().c,
    open:        db.prepare(`SELECT COUNT(*) as c FROM tickets WHERE status='Open'`).get().c,
    inProgress:  db.prepare(`SELECT COUNT(*) as c FROM tickets WHERE status='In Progress'`).get().c,
    resolved:    db.prepare(`SELECT COUNT(*) as c FROM tickets WHERE status='Resolved'`).get().c,
    highPriority:db.prepare(`SELECT COUNT(*) as c FROM tickets WHERE priority='High' AND status!='Resolved'`).get().c,
  };
}

// Ticket status breakdown for chart
function getTicketChartData() {
  const stats = getStats();
  return {
    type: 'doughnut',
    labels: ['Open', 'In Progress', 'Resolved'],
    datasets: [{
      data: [stats.open, stats.inProgress, stats.resolved],
      backgroundColor: ['#00d4ff', '#f59e0b', '#22c55e'],
      borderColor: ['#00d4ff', '#f59e0b', '#22c55e'],
      borderWidth: 2,
    }]
  };
}

function detectPriority(issue) {
  const l = issue.toLowerCase();
  if (l.match(/urgent|critical|down|cannot login|not working|server/)) return 'High';
  if (l.match(/slow|error|failed|issue|problem/)) return 'Medium';
  return 'Low';
}

module.exports = { handleSupportQuery, getTickets, updateTicketStatus, getStats, getTicketChartData };
