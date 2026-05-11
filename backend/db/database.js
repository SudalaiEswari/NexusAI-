// db/database.js — SQLite schema with auth + all agents + file uploads

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname);
const DB_PATH = path.join(DB_DIR, 'nexus.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── USERS TABLE (Authentication) ──────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    email        TEXT    UNIQUE NOT NULL,
    password     TEXT    NOT NULL,
    role         TEXT    DEFAULT 'user',
    lang         TEXT    DEFAULT 'en',
    avatar       TEXT,
    is_active    INTEGER DEFAULT 1,
    last_login   TEXT,
    created_at   TEXT    DEFAULT (datetime('now'))
  );
`);

// ── REFRESH TOKENS ─────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    token      TEXT    NOT NULL,
    expires_at TEXT    NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// ── SALES ──────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS sales (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    product     TEXT    NOT NULL,
    region      TEXT    NOT NULL,
    amount      REAL    NOT NULL,
    quantity    INTEGER NOT NULL,
    sale_date   TEXT    NOT NULL,
    salesperson TEXT    NOT NULL
  );
`);

// ── CUSTOMERS ─────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    email      TEXT    NOT NULL,
    phone      TEXT,
    company    TEXT,
    plan       TEXT    DEFAULT 'Basic',
    joined_on  TEXT    NOT NULL
  );
`);

// ── TICKETS ──────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id   TEXT    UNIQUE NOT NULL,
    customer    TEXT    NOT NULL,
    email       TEXT,
    issue       TEXT    NOT NULL,
    status      TEXT    DEFAULT 'Open',
    priority    TEXT    DEFAULT 'Medium',
    agent_reply TEXT,
    created_at  TEXT    NOT NULL,
    resolved_at TEXT,
    user_id     INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// ── CANDIDATES ────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS candidates (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    email        TEXT    NOT NULL,
    phone        TEXT,
    skills       TEXT    NOT NULL,
    experience   INTEGER DEFAULT 0,
    education    TEXT,
    score        REAL    DEFAULT 0,
    status       TEXT    DEFAULT 'Pending',
    applied_role TEXT,
    resume_file  TEXT,
    applied_on   TEXT    NOT NULL,
    user_id      INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// ── INTERVIEWS ────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS interviews (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    candidate_id INTEGER NOT NULL,
    scheduled_at TEXT    NOT NULL,
    interviewer  TEXT    NOT NULL,
    mode         TEXT    DEFAULT 'Online',
    status       TEXT    DEFAULT 'Scheduled',
    notes        TEXT,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id)
  );
`);

// ── RESEARCH REPORTS ──────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS research_reports (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    topic        TEXT    NOT NULL,
    report       TEXT    NOT NULL,
    sources      TEXT,
    user_id      INTEGER,
    created_at   TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// ── NOTIFICATIONS ─────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER,
    type       TEXT    NOT NULL,
    title      TEXT    NOT NULL,
    message    TEXT    NOT NULL,
    is_read    INTEGER DEFAULT 0,
    created_at TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// ── SEED DATA ─────────────────────────────────────────────────
function seedIfEmpty(table, fn) {
  const row = db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get();
  if (row.c === 0) fn();
}

const bcrypt = require('bcryptjs');

seedIfEmpty('users', () => {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`)
    .run('Admin User', 'admin@nexusai.com', hash, 'admin');
  console.log('✅ Users seeded  →  admin@nexusai.com / admin123');
});

seedIfEmpty('sales', () => {
  const ins = db.prepare(`INSERT INTO sales (product,region,amount,quantity,sale_date,salesperson) VALUES (?,?,?,?,?,?)`);
  const rows = [
    ['Laptop Pro X1','North',85000,2,'2024-01-05','Arjun'],
    ['Wireless Mouse','South',1200,15,'2024-01-08','Priya'],
    ['Monitor 27"','East',22000,4,'2024-01-12','Ravi'],
    ['Laptop Pro X1','West',85000,3,'2024-01-15','Sneha'],
    ['Keyboard Pro','North',3500,20,'2024-01-20','Arjun'],
    ['Webcam HD','South',4500,8,'2024-02-01','Priya'],
    ['Laptop Pro X1','East',85000,5,'2024-02-10','Kiran'],
    ['Monitor 27"','North',22000,2,'2024-02-14','Arjun'],
    ['Wireless Mouse','West',1200,30,'2024-02-18','Sneha'],
    ['USB Hub 7-Port','South',2500,12,'2024-02-22','Priya'],
    ['Laptop Pro X1','North',85000,4,'2024-03-03','Ravi'],
    ['Keyboard Pro','East',3500,18,'2024-03-07','Kiran'],
    ['Webcam HD','West',4500,6,'2024-03-11','Sneha'],
    ['Monitor 27"','South',22000,3,'2024-03-15','Priya'],
    ['USB Hub 7-Port','North',2500,25,'2024-03-20','Arjun'],
    ['Laptop Pro X1','West',85000,2,'2024-04-02','Sneha'],
    ['Wireless Mouse','East',1200,40,'2024-04-08','Kiran'],
    ['Keyboard Pro','North',3500,22,'2024-04-12','Arjun'],
    ['Monitor 27"','West',22000,6,'2024-04-18','Sneha'],
    ['Webcam HD','East',4500,10,'2024-04-25','Kiran'],
  ];
  db.transaction(r => r.forEach(x => ins.run(...x)))(rows);
  console.log('✅ Sales data seeded');
});

seedIfEmpty('customers', () => {
  const ins = db.prepare(`INSERT INTO customers (name,email,phone,company,plan,joined_on) VALUES (?,?,?,?,?,?)`);
  const rows = [
    ['Arun Kumar','arun@techcorp.in','9876543210','TechCorp India','Pro','2023-06-01'],
    ['Meena Sharma','meena@startup.io','9123456780','StartupIO','Basic','2023-08-15'],
    ['Vikram Nair','vikram@bigbiz.com','9000011222','BigBiz Solutions','Enterprise','2023-03-20'],
    ['Divya Patel','divya@shopfast.in','9345678901','ShopFast','Pro','2024-01-10'],
    ['Rahul Singh','rahul@cloudsys.net','9567890123','CloudSys','Basic','2023-11-05'],
  ];
  db.transaction(r => r.forEach(x => ins.run(...x)))(rows);
  console.log('✅ Customers seeded');
});

seedIfEmpty('tickets', () => {
  const ins = db.prepare(`INSERT INTO tickets (ticket_id,customer,email,issue,status,priority,created_at) VALUES (?,?,?,?,?,?,?)`);
  const rows = [
    ['TKT-001','Arun Kumar','arun@techcorp.in','Cannot login to dashboard after password reset','Open','High','2024-04-01'],
    ['TKT-002','Meena Sharma','meena@startup.io','Invoice not generated for last month','Resolved','Medium','2024-03-28'],
    ['TKT-003','Vikram Nair','vikram@bigbiz.com','API rate limit exceeded unexpectedly','Open','High','2024-04-02'],
    ['TKT-004','Divya Patel','divya@shopfast.in','Slow loading on mobile browser','In Progress','Low','2024-03-30'],
    ['TKT-005','Rahul Singh','rahul@cloudsys.net','Need to upgrade plan to Pro','Open','Medium','2024-04-03'],
  ];
  db.transaction(r => r.forEach(x => ins.run(...x)))(rows);
  console.log('✅ Tickets seeded');
});

seedIfEmpty('candidates', () => {
  const ins = db.prepare(`INSERT INTO candidates (name,email,phone,skills,experience,education,score,status,applied_role,applied_on) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  const rows = [
    ['Ananya Krishnan','ananya@mail.com','9001122334','Python, Machine Learning, TensorFlow, SQL, Data Analysis',3,'B.Tech Computer Science',85,'Shortlisted','Data Scientist','2024-03-15'],
    ['Suresh Babu','suresh@mail.com','9112233445','JavaScript, React, Node.js, MongoDB, CSS',2,'BCA',78,'Shortlisted','Full Stack Developer','2024-03-18'],
    ['Pooja Verma','pooja@mail.com','9223344556','Java, Spring Boot, Microservices, Docker, Kubernetes',5,'M.Tech IT',91,'Selected','Backend Engineer','2024-03-12'],
  ];
  db.transaction(r => r.forEach(x => ins.run(...x)))(rows);
  console.log('✅ Candidates seeded');
});

console.log('✅ Database ready at', DB_PATH);
module.exports = db;
