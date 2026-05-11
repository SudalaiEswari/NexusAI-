// services/emailService.js — Nodemailer email sender

const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

/** Get or create email transporter (lazy init) */
function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
    console.log('⚠️  Email not configured. Emails will be logged to console only.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter;
}

/**
 * sendEmail — Send an email
 * @param {object} opts - { to, subject, html, text, icalEvent }
 */
async function sendEmail({ to, subject, html, text, icalEvent }) {
  const t = getTransporter();
 
  if (!t) {
    // Log to console if email not configured
    console.log('\n📧 [EMAIL MOCK] ─────────────────────');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:    ${text || html?.replace(/<[^>]+>/g, ' ')}`);
    if (icalEvent) console.log(`[ICS CALENDAR ATTACHED]`);
    console.log('─────────────────────────────────────\n');
    return { success: true, mock: true };
  }
 
  const info = await t.sendMail({
    from: process.env.EMAIL_FROM || `NEXUS AI <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text: text || html?.replace(/<[^>]+>/g, ' '),
    icalEvent
  });

  console.log(`✅ Email sent to ${to}: ${info.messageId}`);
  return { success: true, messageId: info.messageId };
}

// ── Pre-built email templates ──────────────────────────────────

async function sendTicketCreatedEmail(ticket, customerEmail) {
  return sendEmail({
    to: customerEmail,
    subject: `🎫 Support Ticket ${ticket.id} Created — NEXUS AI`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#00d4ff">Support Ticket Created</h2>
        <p>Your support request has been received.</p>
        <table style="width:100%;border-collapse:collapse;margin:1rem 0">
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Ticket ID</td>
              <td style="padding:8px;border:1px solid #ddd">${ticket.id}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Priority</td>
              <td style="padding:8px;border:1px solid #ddd">${ticket.priority}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Status</td>
              <td style="padding:8px;border:1px solid #ddd">Open</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Issue</td>
              <td style="padding:8px;border:1px solid #ddd">${ticket.issue}</td></tr>
        </table>
        <p>Our team will respond within 24 hours.</p>
        <p style="color:#888;font-size:12px">— NEXUS AI Support Team</p>
      </div>
    `
  });
}

function generateICS(candidate, interview) {
  const date = new Date(interview.scheduledAt);
  const end = new Date(date.getTime() + 60 * 60 * 1000); // +1 hour

  const format = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const startStr = format(date);
  const endStr = format(end);

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//NexusAI//InterviewScheduler//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${candidate.id}_${Date.now()}@nexusai.com
DTSTAMP:${format(new Date())}
DTSTART:${startStr}
DTEND:${endStr}
SUMMARY:Interview: ${candidate.name} (${candidate.applied_role})
DESCRIPTION:Interview for candidate ${candidate.name}\\nRole: ${candidate.applied_role}\\nInterviewer: ${interview.interviewer}\\nMode: ${interview.mode}
LOCATION:${interview.mode}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Reminder
END:VALARM
END:VEVENT
END:VCALENDAR`;
}

async function sendInterviewScheduledEmail(candidate, interview) {
  const icsContent = generateICS(candidate, interview);

  return sendEmail({
    to: candidate.email,
    subject: `📅 Interview Scheduled — ${candidate.applied_role} at NEXUS AI`,
    icalEvent: {
      filename: 'interview_invite.ics',
      method: 'REQUEST',
      content: icsContent
    },
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#a855f7">Interview Scheduled!</h2>
        <p>Congratulations ${candidate.name}! Your interview has been scheduled.</p>
        <table style="width:100%;border-collapse:collapse;margin:1rem 0">
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Role</td>
              <td style="padding:8px;border:1px solid #ddd">${candidate.applied_role}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Date & Time</td>
              <td style="padding:8px;border:1px solid #ddd">${interview.scheduledAt}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Interviewer</td>
              <td style="padding:8px;border:1px solid #ddd">${interview.interviewer}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Mode</td>
              <td style="padding:8px;border:1px solid #ddd">${interview.mode}</td></tr>
        </table>
        <p>Please be ready 5 minutes before the scheduled time.</p>
        <p><strong>Heads Up:</strong> A calendar invite has been attached to this email! 📅</p>
        <p style="color:#888;font-size:12px">— NEXUS AI Recruitment Team</p>
      </div>
    `
  });
}

async function sendTicketResolvedEmail(ticket, customerEmail) {
  return sendEmail({
    to: customerEmail,
    subject: `✅ Ticket ${ticket.ticket_id} Resolved — NEXUS AI`,
    html: `
      <div style="font-family:sans-serif;max-width:600px">
        <h2 style="color:#22c55e">Your Issue Has Been Resolved!</h2>
        <p>Ticket <strong>${ticket.ticket_id}</strong> has been marked as resolved.</p>
        <p>If the issue persists, please open a new support ticket.</p>
        <p style="color:#888;font-size:12px">— NEXUS AI Support Team</p>
      </div>
    `
  });
}

module.exports = {
  sendEmail,
  sendTicketCreatedEmail,
  sendInterviewScheduledEmail,
  sendTicketResolvedEmail
};
