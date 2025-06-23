import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.join('db', 'chat.db');
fs.mkdirSync('db', { recursive: true });
const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chatId TEXT,
  role   TEXT,      -- 'user' | 'assistant'
  content TEXT,
  ts     DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

export function saveMessage(chatId, role, content) {
  db.prepare('INSERT INTO messages (chatId, role, content) VALUES (?, ?, ?)')
    .run(chatId, role, content);
}

export function getLastMessages(chatId, limit = 10) {
  return db.prepare(`
    SELECT role, content
    FROM messages
    WHERE chatId = ?
    ORDER BY id DESC
    LIMIT ?
  `).all(chatId, limit).reverse();
}