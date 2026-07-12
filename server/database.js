const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'metodikish.db');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    try {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
      // Test if DB is valid
      db.exec('SELECT 1');
      console.log('📦 Loaded existing database');
    } catch (e) {
      console.error('⚠️ Database corrupted, creating new one:', e.message);
      try { fs.unlinkSync(DB_PATH); } catch (_) {}
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id INTEGER UNIQUE NOT NULL,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_code TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      full_name TEXT NOT NULL,
      address TEXT NOT NULL,
      school TEXT NOT NULL,
      subject TEXT NOT NULL,
      grade TEXT NOT NULL,
      topic TEXT,
      status TEXT DEFAULT 'pending_payment',
      total_price INTEGER NOT NULL,
      payment_receipt TEXT,
      document_file TEXT,
      admin_note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (service_id) REFERENCES services(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS order_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      image_path TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS payment_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_number TEXT NOT NULL,
      card_holder TEXT NOT NULL,
      bank_name TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default data
  const serviceCount = db.exec('SELECT COUNT(*) as count FROM services')[0]?.values[0][0] || 0;
  if (serviceCount === 0) {
    db.run("INSERT INTO services (name, description, price) VALUES (?, ?, ?)",
      ["Metodik Qo'llanma", "Batafsil metodik qo'llanma hujjati", 250000]);
    db.run("INSERT INTO services (name, description, price) VALUES (?, ?, ?)",
      ["Metodik Tavsiya", "Metodik tavsiya hujjati", 200000]);
  }

  const cardCount = db.exec('SELECT COUNT(*) as count FROM payment_cards')[0]?.values[0][0] || 0;
  if (cardCount === 0) {
    db.run("INSERT INTO payment_cards (card_number, card_holder, bank_name) VALUES (?, ?, ?)",
      ["8600 1234 5678 9012", "Rajabboyev Eldorbek", "Ipak Yo'li Bank"]);
  }

  const settingsCount = db.exec('SELECT COUNT(*) as count FROM settings')[0]?.values[0][0] || 0;
  if (settingsCount === 0) {
    const stmt = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
    stmt.run(["admin_chat_id", ""]);
    stmt.run(["bot_token", ""]);
    stmt.run(["payment_instructions", "Kartaga pul o'tkazing va chekni yuklang."]);
    stmt.run(["min_prep_time_hours", "6"]);
    stmt.free();
  }

  saveDatabase();
  console.log('📦 Database initialized');
  return db;
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Auto-save every 30 seconds
setInterval(saveDatabase, 30000);

// Helper: sanitize params - replace undefined with null
function sanitizeParams(params) {
  return params.map(p => p === undefined ? null : p);
}

// Helper: run query and return results as array of objects
function queryAll(sql, params = []) {
  const sanitized = sanitizeParams(params);
  const stmt = db.prepare(sql);
  if (sanitized.length > 0) stmt.bind(sanitized);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// Helper: run query and return first result
function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : undefined;
}

// Helper: run statement
function run(sql, params = []) {
  const sanitized = sanitizeParams(params);
  db.run(sql, sanitized);
  // Capture modified rows BEFORE any other SQL statement resets the counter
  const changes = db.getRowsModified();
  saveDatabase();
  // Get last insert rowid using exec
  let lastId = 0;
  try {
    const result = db.exec('SELECT last_insert_rowid() as id');
    if (result.length > 0 && result[0].values.length > 0) {
      lastId = result[0].values[0][0];
    }
  } catch (e) {
    console.error('Error getting last_insert_rowid:', e);
  }
  return { lastInsertRowid: lastId, changes };
}

module.exports = {
  initDatabase,
  saveDatabase,
  queryAll,
  queryOne,
  run,
  getDb: () => db,
};
