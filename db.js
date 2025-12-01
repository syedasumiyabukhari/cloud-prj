const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite3');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at', dbPath);
    initializeDatabase();
  }
});

function initializeDatabase() {
  // Create users table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
    } else {
      console.log('Users table ready');
      seedData();
    }
  });
}

function seedData() {
  // Check if table is empty
  db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
    if (err) {
      console.error('Error checking users:', err.message);
      return;
    }
    
    if (row.count === 0) {
      console.log('Seeding sample users...');
      const sampleUsers = [
        ['Alice Johnson', 'alice@example.com'],
        ['Bob Smith', 'bob@example.com'],
        ['Charlie Davis', 'charlie@example.com']
      ];
      
      const stmt = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
      sampleUsers.forEach(user => {
        stmt.run(user, (err) => {
          if (err) console.error('Error inserting user:', err.message);
        });
      });
      stmt.finalize(() => {
        console.log('Sample users seeded');
      });
    }
  });
}

module.exports = db;
