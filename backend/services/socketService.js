// services/socketService.js — Real-time updates via Socket.io

let io = null;

// Map userId → socket.id for targeted notifications
const userSocketMap = new Map();

/**
 * init — Call this from server.js after creating http server
 */
function init(httpServer) {
  const { Server } = require('socket.io');
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Client sends their userId after login
    socket.on('register', (userId) => {
      if (userId) {
        userSocketMap.set(String(userId), socket.id);
        socket.join(`user_${userId}`);
        console.log(`[Socket] User ${userId} registered to socket ${socket.id}`);
        socket.emit('registered', { message: 'Real-time updates active' });
      }
    });

    socket.on('disconnect', () => {
      // Remove from map
      for (const [uid, sid] of userSocketMap.entries()) {
        if (sid === socket.id) { userSocketMap.delete(uid); break; }
      }
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

/** Emit event to a specific user */
function emitToUser(userId, event, data) {
  if (!io) return;
  io.to(`user_${userId}`).emit(event, data);
}

/** Emit event to ALL connected clients (broadcast) */
function emitToAll(event, data) {
  if (!io) return;
  io.emit(event, data);
}

// ── Pre-built real-time event senders ─────────────────────────

/** Notify when a new ticket is created */
function notifyTicketCreated(ticket, userId = null) {
  const payload = {
    type: 'ticket_created',
    title: '🎫 New Support Ticket',
    message: `Ticket ${ticket.ticket_id} created — Priority: ${ticket.priority}`,
    data: ticket,
    timestamp: new Date().toISOString()
  };
  if (userId) emitToUser(userId, 'notification', payload);
  emitToAll('ticket_update', payload); // All admins see ticket updates
}

/** Notify when a ticket status changes */
function notifyTicketUpdated(ticket) {
  emitToAll('ticket_update', {
    type: 'ticket_updated',
    title: '🔄 Ticket Updated',
    message: `Ticket ${ticket.ticket_id} → ${ticket.status}`,
    data: ticket,
    timestamp: new Date().toISOString()
  });
}

/** Notify when a candidate is evaluated */
function notifyNewCandidate(candidate) {
  emitToAll('candidate_update', {
    type: 'new_candidate',
    title: '👔 New Candidate Evaluated',
    message: `${candidate.name} scored ${candidate.score}/100 for ${candidate.role}`,
    data: candidate,
    timestamp: new Date().toISOString()
  });
}

/** Notify live dashboard stats update */
function emitStatsUpdate(stats) {
  emitToAll('stats_update', stats);
}

module.exports = {
  init,
  emitToUser,
  emitToAll,
  notifyTicketCreated,
  notifyTicketUpdated,
  notifyNewCandidate,
  emitStatsUpdate,
};
