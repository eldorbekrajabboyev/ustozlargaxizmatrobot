const { createClient } = require('@libsql/client');

let db = null;

async function initDatabase() {
  db = createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:local.db',
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  });

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id INTEGER UNIQUE NOT NULL,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT (datetime('now', '+5 hours'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT (datetime('now', '+5 hours'))
    )
  `);

  await db.execute(`
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
      receipt_uploaded_at DATETIME,
      ready_at DATETIME,
      created_at DATETIME DEFAULT (datetime('now', '+5 hours')),
      updated_at DATETIME DEFAULT (datetime('now', '+5 hours')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (service_id) REFERENCES services(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS order_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      image_path TEXT NOT NULL,
      created_at DATETIME DEFAULT (datetime('now', '+5 hours')),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS payment_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_number TEXT NOT NULL,
      card_holder TEXT NOT NULL,
      bank_name TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT (datetime('now', '+5 hours'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT (datetime('now', '+5 hours'))
    )
  `);

  // Seed default data
  const serviceCount = await db.execute('SELECT COUNT(*) as count FROM services');
  if (serviceCount.rows[0].count === 0) {
    await db.execute("INSERT INTO services (name, description, price) VALUES (?, ?, ?)",
      ["Metodik Qo'llanma", "Batafsil metodik qo'llanma hujjati", 250000]);
    await db.execute("INSERT INTO services (name, description, price) VALUES (?, ?, ?)",
      ["Metodik Tavsiya", "Metodik tavsiya hujjati", 200000]);
  }

  const cardCount = await db.execute('SELECT COUNT(*) as count FROM payment_cards');
  if (cardCount.rows[0].count === 0) {
    await db.execute("INSERT INTO payment_cards (card_number, card_holder, bank_name) VALUES (?, ?, ?)",
      ["8600 1234 5678 9012", "Rajabboyev Eldorbek", "Ipak Yo'li Bank"]);
  }

  const settingsCount = await db.execute('SELECT COUNT(*) as count FROM settings');
  if (settingsCount.rows[0].count === 0) {
    await db.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
      ["admin_chat_id", ""]);
    await db.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
      ["bot_token", ""]);
    await db.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
      ["payment_instructions", "Kartaga pul o'tkazing va chekni yuklang."]);
    await db.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
      ["min_prep_time_hours", "6"]);
    await db.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
      ["channels", ""]);
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
      text TEXT NOT NULL,
      author_name TEXT,
      region TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT (datetime('now', '+5 hours')),
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Add columns if not exists
  try { await db.execute("ALTER TABLE orders ADD COLUMN receipt_uploaded_at DATETIME"); } catch (e) {}
  try { await db.execute("ALTER TABLE orders ADD COLUMN ready_at DATETIME"); } catch (e) {}
  try { await db.execute("ALTER TABLE orders ADD COLUMN school_type TEXT"); } catch (e) {}
  try { await db.execute("ALTER TABLE orders ADD COLUMN language_surcharge INTEGER DEFAULT 0"); } catch (e) {}
  try { await db.execute("ALTER TABLE orders ADD COLUMN geographic_level TEXT DEFAULT 'maktab'"); } catch (e) {}
  try { await db.execute("ALTER TABLE orders ADD COLUMN geographic_surcharge INTEGER DEFAULT 0"); } catch (e) {}

  console.log('📦 Database initialized (Turso)');
  return db;
}

function sanitizeParams(params) {
  return params.map(p => p === undefined ? null : p);
}

async function queryAll(sql, params = []) {
  const sanitized = sanitizeParams(params);
  const result = await db.execute({ sql, args: sanitized });
  return result.rows;
}

async function queryOne(sql, params = []) {
  const results = await queryAll(sql, params);
  return results.length > 0 ? results[0] : undefined;
}

async function run(sql, params = []) {
  const sanitized = sanitizeParams(params);
  const result = await db.execute({ sql, args: sanitized });
  return {
    lastInsertRowid: Number(result.lastInsertRowid) || 0,
    changes: result.rowsAffected
  };
}

module.exports = {
  initDatabase,
  queryAll,
  queryOne,
  run,
  getDb: () => db,
};
