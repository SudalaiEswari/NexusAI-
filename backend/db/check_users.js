
const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'nexus.db'));
const users = db.prepare('SELECT id, name, email FROM users').all();
console.log(JSON.stringify(users, null, 2));
