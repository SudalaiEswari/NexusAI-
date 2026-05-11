
const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'nexus.db'));
const result = db.prepare('DELETE FROM users WHERE email = ?').run('user@nexusai.com');
console.log(`Deleted ${result.changes} user(s).`);
