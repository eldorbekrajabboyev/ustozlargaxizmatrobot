require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { initDatabase, queryAll, queryOne, run } = require('./database');

const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });

function nowUZ() {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Tashkent' });
}

function toISODate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return dateStr;
  if (dateStr.includes('T')) return dateStr;
  return dateStr.replace(' ', 'T') + '+05:00';
}

function fixOrderDates(order) {
  if (!order) return order;
  for (const key of ['created_at', 'receipt_uploaded_at', 'ready_at', 'updated_at']) {
    if (order[key]) order[key] = toISODate(order[key]);
  }
  return order;
}

async function deleteOrderImages(orderId) {
  const images = await queryAll('SELECT image_path FROM order_images WHERE order_id = ?', [orderId]);
  for (const img of images) {
    const filePath = path.join(__dirname, '..', img.image_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  await run('DELETE FROM order_images WHERE order_id = ?', [orderId]);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Simple in-memory cache
const cache = new Map();
function cached(key, ttlMs, fn) {
  return async (...args) => {
    const now = Date.now();
    const entry = cache.get(key);
    if (entry && now - entry.ts < ttlMs) return entry.data;
    const data = await fn(...args);
    cache.set(key, { data, ts: now });
    return data;
  };
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const fs = require('fs');
const uploadsDir = path.join(__dirname, '..', 'uploads');
['receipts', 'documents', 'images'].forEach(dir => {
  const fullPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.uploadType || 'images';
    cb(null, path.join(uploadsDir, type));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext || mime);
  }
});

function setUploadType(type) {
  return (req, res, next) => { req.uploadType = type; next(); };
}

// ==================== API ROUTES ====================

app.get('/api/users', async (req, res) => {
  try {
    const users = await queryAll('SELECT * FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/users/:telegram_id', async (req, res) => {
  try {
    const user = await queryOne('SELECT * FROM users WHERE telegram_id = ?', [parseInt(req.params.telegram_id)]);
    if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users', async (req, res) => {
  try {
    const { telegram_id, username, first_name, last_name } = req.body;
    const existing = await queryOne('SELECT * FROM users WHERE telegram_id = ?', [telegram_id]);
    if (existing) {
      await run('UPDATE users SET username = ?, first_name = ?, last_name = ? WHERE telegram_id = ?',
        [username, first_name, last_name, telegram_id]);
      return res.json(await queryOne('SELECT * FROM users WHERE telegram_id = ?', [telegram_id]));
    }
    const result = await run('INSERT INTO users (telegram_id, username, first_name, last_name) VALUES (?, ?, ?, ?)',
      [telegram_id, username, first_name, last_name]);
    res.json(await queryOne('SELECT * FROM users WHERE id = ?', [result.lastInsertRowid]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/services', async (req, res) => {
  try {
    const services = await queryAll('SELECT * FROM services ORDER BY id ASC');
    res.json(services);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/services', async (req, res) => {
  try {
    const { name, description, price } = req.body;
    const result = await run('INSERT INTO services (name, description, price) VALUES (?, ?, ?)',
      [name, description, price]);
    res.json(await queryOne('SELECT * FROM services WHERE id = ?', [result.lastInsertRowid]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/services/:id', async (req, res) => {
  try {
    const { name, description, price, is_active } = req.body;
    await run('UPDATE services SET name = ?, description = ?, price = ?, is_active = ? WHERE id = ?',
      [name, description, price, is_active, req.params.id]);
    res.json(await queryOne('SELECT * FROM services WHERE id = ?', [req.params.id]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/services/:id', async (req, res) => {
  try {
    await run('DELETE FROM services WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/cards', async (req, res) => {
  try {
    const cards = await queryAll('SELECT * FROM payment_cards ORDER BY id ASC');
    res.json(cards);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/cards', async (req, res) => {
  try {
    const { card_number, card_holder, bank_name } = req.body;
    const result = await run('INSERT INTO payment_cards (card_number, card_holder, bank_name) VALUES (?, ?, ?)',
      [card_number, card_holder, bank_name]);
    res.json(await queryOne('SELECT * FROM payment_cards WHERE id = ?', [result.lastInsertRowid]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/cards/:id', async (req, res) => {
  try {
    const { card_number, card_holder, bank_name, is_active } = req.body;
    await run('UPDATE payment_cards SET card_number = ?, card_holder = ?, bank_name = ?, is_active = ? WHERE id = ?',
      [card_number, card_holder, bank_name, is_active, req.params.id]);
    res.json(await queryOne('SELECT * FROM payment_cards WHERE id = ?', [req.params.id]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/cards/:id', async (req, res) => {
  try {
    await run('DELETE FROM payment_cards WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/orders', async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search, region, subject, date_from, date_to } = req.query;
    const conditions = [];
    const params = [];
    if (status) { conditions.push('o.status = ?'); params.push(status); }
    if (region) { conditions.push("o.address LIKE ?"); params.push(region + ',%'); }
    if (subject) { conditions.push('o.subject = ?'); params.push(subject); }
    if (date_from) { conditions.push('o.created_at >= ?'); params.push(date_from); }
    if (date_to) { conditions.push('o.created_at <= ?'); params.push(date_to + ' 23:59:59'); }
    if (search) {
      conditions.push("(o.full_name LIKE ? OR o.order_code LIKE ? OR u.username LIKE ?)");
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const query = `
      SELECT o.*, u.username, u.first_name, u.last_name, u.telegram_id,
             s.name as service_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN services s ON o.service_id = s.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    const orders = await queryAll(query, params);
    for (const order of orders) {
      order.images = await queryAll('SELECT * FROM order_images WHERE order_id = ?', [order.id]);
    }
    orders.forEach(fixOrderDates);
    const countResult = await queryOne(`SELECT COUNT(*) as count FROM orders o LEFT JOIN users u ON o.user_id = u.id ${whereClause}`, params.slice(0, params.length - 2));
    const total = countResult ? countResult.count : 0;
    res.json({ orders, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await queryOne(`
      SELECT o.*, u.username, u.first_name, u.last_name, u.telegram_id, u.phone,
             s.name as service_name, s.description as service_description
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN services s ON o.service_id = s.id
      WHERE o.id = ?
    `, [parseInt(req.params.id)]);
    if (!order) return res.status(404).json({ error: 'Buyurtma topilmadi' });
    order.images = await queryAll('SELECT * FROM order_images WHERE order_id = ?', [order.id]);
    res.json(fixOrderDates(order));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { user_id, service_id, full_name, address, school, subject, grade, topic } = req.body;
    const service = await queryOne('SELECT * FROM services WHERE id = ?', [service_id]);
    if (!service) return res.status(400).json({ error: 'Xizmat topilmadi' });
    const orderCode = `MK-${Date.now().toString(36).toUpperCase()}`;
    const result = await run(`
      INSERT INTO orders (order_code, user_id, service_id, full_name, address, school, subject, grade, topic, total_price, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [orderCode, user_id, service_id, full_name, address, school, subject, grade, topic, service.price, nowUZ()]);
    const order = await queryOne('SELECT * FROM orders WHERE id = ?', [result.lastInsertRowid]);
    res.json(fixOrderDates(order));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const { status, admin_note } = req.body;
    const updates = [`updated_at = '${nowUZ()}'`];
    const params = [];
    if (status) { updates.push('status = ?'); params.push(status); }
    if (status === 'ready') { updates.push(`ready_at = '${nowUZ()}'`); }
    if (admin_note !== undefined) { updates.push('admin_note = ?'); params.push(admin_note); }
    params.push(parseInt(req.params.id));
    await run(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, params);
    const order = await queryOne(`
      SELECT o.*, u.username, u.first_name, u.last_name, u.telegram_id,
             s.name as service_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN services s ON o.service_id = s.id
      WHERE o.id = ?
    `, [parseInt(req.params.id)]);
    order.images = await queryAll('SELECT * FROM order_images WHERE order_id = ?', [order.id]);
    res.json(fixOrderDates(order));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/orders/:id/receipt', setUploadType('receipts'), upload.single('receipt'), async (req, res) => {
  try {
    await run(`UPDATE orders SET payment_receipt = ?, status = ?, receipt_uploaded_at = '${nowUZ()}' WHERE id = ?`,
      [`/uploads/receipts/${req.file.filename}`, 'pending_confirmation', parseInt(req.params.id)]);
    res.json({ success: true, path: `/uploads/receipts/${req.file.filename}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/orders/:id/images', setUploadType('images'), upload.array('images', 5), async (req, res) => {
  try {
    const images = [];
    for (const file of req.files) {
      const result = await run('INSERT INTO order_images (order_id, image_path) VALUES (?, ?)',
        [parseInt(req.params.id), `/uploads/images/${file.filename}`]);
      images.push({ id: result.lastInsertRowid, image_path: `/uploads/images/${file.filename}` });
    }
    res.json(images);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/orders/:id/document', setUploadType('documents'), upload.single('document'), async (req, res) => {
  try {
    await run('UPDATE orders SET document_file = ?, status = ? WHERE id = ?',
      [`/uploads/documents/${req.file.filename}`, 'ready', parseInt(req.params.id)]);
    res.json({ success: true, path: `/uploads/documents/${req.file.filename}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/orders/:id/confirm-payment', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await queryOne(`
      SELECT o.*, u.telegram_id, u.first_name
      FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = ?
    `, [orderId]);
    if (!order) return res.status(404).json({ error: 'Buyurtma topilmadi' });
    await run('UPDATE orders SET status = ? WHERE id = ?', ['in_progress', orderId]);
    const queueResult = await queryOne(
      `SELECT COUNT(*) as position FROM orders WHERE status = 'in_progress' AND created_at <= ?`,
      [order.created_at]
    );
    const queuePosition = queueResult ? queueResult.position : 1;
    const bot = require('./bot').getBotInstance();
    if (bot && order.telegram_id) {
      bot.sendMessage(order.telegram_id,
        `✅ *To'lovingiz tasdiqlandi!*\n\n📋 Buyurtma: #${order.order_code}\n🔢 Sizning navbatingiz: *${queuePosition}*\n\nHujjat tayyor bo'lgach sizga xabar beriladi.`,
        { parse_mode: 'Markdown' }
      ).catch(err => console.error('Failed to send notification:', err.message));
    }
    res.json({ success: true, queuePosition });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/orders/:id/reject-payment', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { reason } = req.body;
    const order = await queryOne(`
      SELECT o.*, u.telegram_id, u.first_name
      FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = ?
    `, [orderId]);
    await deleteOrderImages(orderId);
    await run('UPDATE orders SET status = ?, admin_note = ? WHERE id = ?',
      ['rejected', reason || null, orderId]);
    const bot = require('./bot').getBotInstance();
    if (bot && order && order.telegram_id) {
      const reasonText = reason ? `\nSababi: ${reason}` : '';
      bot.sendMessage(order.telegram_id,
        `❌ *Buyurtmangiz rad etildi!*\n\n📋 Buyurtma: #${order.order_code}${reasonText}\n\nIltimos, buyurtmani qaytadan yarating.`,
        { parse_mode: 'Markdown' }
      ).catch(err => console.error('Failed to send rejection notification:', err.message));
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/orders/:id/auto-cancel', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await queryOne('SELECT status FROM orders WHERE id = ?', [orderId]);
    if (!order) return res.status(404).json({ error: 'Buyurtma topilmadi' });
    if (order.status !== 'pending_payment') {
      return res.json({ success: true, alreadyHandled: true });
    }
    await deleteOrderImages(orderId);
    await run("UPDATE orders SET status = 'rejected', admin_note = 'Avtomatik bekor qilindi: 4 daqiqada chek yuklanmadi' WHERE id = ?", [orderId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/orders/:id/send', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await queryOne(`
      SELECT o.*, u.telegram_id FROM orders o
      LEFT JOIN users u ON o.user_id = u.id WHERE o.id = ?
    `, [orderId]);
    await run('UPDATE orders SET status = ? WHERE id = ?', ['sent', orderId]);
    const bot = require('./bot').getBotInstance();
    if (bot && order && order.telegram_id) {
      const message = `📤 *Buyurtma tayyor va yuborildi!*\n\n📋 Buyurtma: #${order.order_code}`;
      if (order.document_file) {
        const filePath = path.join(__dirname, '..', order.document_file);
        if (fs.existsSync(filePath)) {
          bot.sendMessage(order.telegram_id, message, { parse_mode: 'Markdown' })
            .then(() => bot.sendDocument(order.telegram_id, filePath, { caption: `📄 ${order.service_name || 'Hujjat'}` }))
            .catch(err => console.error('Failed to send document:', err.message));
        } else {
          bot.sendMessage(order.telegram_id, message + '\n\n📥 Hujjatni bot orqali yuklab oling.', { parse_mode: 'Markdown' })
            .catch(err => console.error('Failed to send notification:', err.message));
        }
      } else {
        bot.sendMessage(order.telegram_id, message, { parse_mode: 'Markdown' })
          .catch(err => console.error('Failed to send notification:', err.message));
      }
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/stats', async (req, res) => {
  try {
    const totalOrders = (await queryOne('SELECT COUNT(*) as count FROM orders'))?.count || 0;
    const pendingPayment = (await queryOne("SELECT COUNT(*) as count FROM orders WHERE status = 'pending_payment'"))?.count || 0;
    const pendingConfirmation = (await queryOne("SELECT COUNT(*) as count FROM orders WHERE status = 'pending_confirmation'"))?.count || 0;
    const inProgress = (await queryOne("SELECT COUNT(*) as count FROM orders WHERE status = 'in_progress'"))?.count || 0;
    const ready = (await queryOne("SELECT COUNT(*) as count FROM orders WHERE status = 'ready'"))?.count || 0;
    const sent = (await queryOne("SELECT COUNT(*) as count FROM orders WHERE status = 'sent'"))?.count || 0;
    const totalUsers = (await queryOne('SELECT COUNT(*) as count FROM users'))?.count || 0;
    const totalRevenueResult = await queryOne("SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE status IN ('in_progress', 'ready', 'sent')");
    const totalRevenue = totalRevenueResult ? totalRevenueResult.total : 0;
    let subjectStats = [], gradeStats = [], regionStats = [], recentOrders = [];
    try { subjectStats = await queryAll("SELECT subject, COUNT(*) as count FROM orders GROUP BY subject ORDER BY count DESC LIMIT 10"); } catch (e) {}
    try { gradeStats = await queryAll("SELECT grade, COUNT(*) as count FROM orders GROUP BY grade ORDER BY count DESC"); } catch (e) {}
    try { regionStats = await queryAll("SELECT address as region, COUNT(*) as count FROM orders GROUP BY region ORDER BY count DESC LIMIT 20"); } catch (e) {}
    try { recentOrders = await queryAll("SELECT o.id, o.order_code, o.full_name, o.status, o.total_price, o.created_at, s.name as service_name FROM orders o LEFT JOIN services s ON o.service_id = s.id ORDER BY o.created_at DESC LIMIT 10"); recentOrders.forEach(fixOrderDates); } catch (e) {}

    // Daily chart data (last 14 days)
    let dailyChart = [];
    try {
      dailyChart = await queryAll(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM orders WHERE created_at >= datetime('now', '-14 days')
        GROUP BY DATE(created_at) ORDER BY date
      `);
    } catch (e) {}

    // Weekly chart data (last 8 weeks)
    let weeklyChart = [];
    try {
      weeklyChart = await queryAll(`
        SELECT strftime('%Y-W%W', created_at) as week, COUNT(*) as count
        FROM orders WHERE created_at >= datetime('now', '-56 days')
        GROUP BY week ORDER BY week
      `);
    } catch (e) {}

    res.json({ totalOrders, pendingPayment, pendingConfirmation, inProgress, ready, sent, totalUsers, totalRevenue, subjectStats, gradeStats, regionStats, recentOrders, dailyChart, weeklyChart });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await queryAll('SELECT * FROM settings');
    const obj = {};
    settings.forEach(s => obj[s.key] = s.value);
    res.json(obj);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/settings', async (req, res) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await run(`UPDATE settings SET value = ?, updated_at = '${nowUZ()}' WHERE key = ?`, [value, key]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/settings/channels', async (req, res) => {
  try {
    const row = await queryOne("SELECT value FROM settings WHERE key = 'channels'");
    if (!row || !row.value) return res.json([]);
    const parts = row.value.split('|').filter(c => c.trim());
    const channels = [];
    for (let i = 0; i < parts.length; i += 3) {
      channels.push({ name: parts[i], link: parts[i + 1] || '', updated_at: parts[i + 2] || '' });
    }
    res.json(channels);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/settings/channels', async (req, res) => {
  try {
    const { name, link } = req.body;
    if (!name || !link) return res.status(400).json({ error: 'Nomi va link kiritilishi shart' });
    const row = await queryOne("SELECT value FROM settings WHERE key = 'channels'");
    let channels = [];
    if (row && row.value) {
      const parts = row.value.split('|').filter(c => c.trim());
      for (let i = 0; i < parts.length; i += 3) {
        channels.push({ name: parts[i], link: parts[i + 1] || '', updated_at: parts[i + 2] || '' });
      }
    }
    if (channels.length >= 5) return res.status(400).json({ error: 'Maksimal 5 ta kanal qo\'shish mumkin' });
    channels.push({ name, link, updated_at: nowUZ() });
    const value = channels.map(c => `|${c.name}|${c.link}|${c.updated_at}`).join('') + '|';
    await run("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)", ['channels', value, nowUZ()]);
    res.json({ success: true, channels });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/settings/channels/:index', async (req, res) => {
  try {
    const idx = parseInt(req.params.index);
    const row = await queryOne("SELECT value FROM settings WHERE key = 'channels'");
    if (!row || !row.value) return res.status(404).json({ error: 'Kanallar topilmadi' });
    const parts = row.value.split('|').filter(c => c.trim());
    const channels = [];
    for (let i = 0; i < parts.length; i += 3) {
      channels.push({ name: parts[i], link: parts[i + 1] || '', updated_at: parts[i + 2] || '' });
    }
    if (idx < 0 || idx >= channels.length) return res.status(400).json({ error: 'Noto\'g\'ri index' });
    channels.splice(idx, 1);
    const value = channels.length > 0 ? channels.map(c => `|${c.name}|${c.link}|${c.updated_at}`).join('') + '|' : '';
    await run("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)", ['channels', value, nowUZ()]);
    res.json({ success: true, channels });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/user/orders/:telegram_id', async (req, res) => {
  try {
    const user = await queryOne('SELECT id FROM users WHERE telegram_id = ?', [parseInt(req.params.telegram_id)]);
    if (!user) return res.json([]);
    const orders = await queryAll(`
      SELECT o.*, s.name as service_name FROM orders o
      LEFT JOIN services s ON o.service_id = s.id
      WHERE o.user_id = ? ORDER BY o.created_at DESC
    `, [user.id]);
    res.json(orders.map(fixOrderDates));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/user/active-cards', async (req, res) => {
  try {
    const cards = await queryAll('SELECT * FROM payment_cards WHERE is_active = 1');
    res.json(cards);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Broadcast message to all users
app.post('/api/broadcast', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'Xabar bo\'sh bo\'lmasligi kerak' });
    const users = await queryAll('SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL');
    const bot = require('./bot').getBotInstance();
    let sent = 0, failed = 0;
    if (bot) {
      for (const user of users) {
        try {
          await bot.sendMessage(user.telegram_id, message, { parse_mode: 'Markdown' });
          sent++;
        } catch (e) { failed++; }
      }
    }
    res.json({ success: true, total: users.length, sent, failed });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get unique filter options for orders (extract region from address)
app.get('/api/filters', async (req, res) => {
  try {
    const regions = await queryAll("SELECT DISTINCT SUBSTR(address, 1, INSTR(address, ',') - 1) as region FROM orders WHERE address IS NOT NULL AND address != '' AND INSTR(address, ',') > 0 ORDER BY region");
    const subjects = await queryAll("SELECT DISTINCT subject FROM orders WHERE subject IS NOT NULL AND subject != '' ORDER BY subject");
    res.json({ regions: regions.map(r => r.region), subjects: subjects.map(s => s.subject) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Serve built frontend files
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
const adminBuildPath = path.join(__dirname, '..', 'admin', 'dist');

if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
}
if (fs.existsSync(adminBuildPath)) {
  app.use('/admin', express.static(adminBuildPath));
}

app.get('*', (req, res) => {
  if (req.path.startsWith('/admin')) {
    const adminIndex = path.join(adminBuildPath, 'index.html');
    if (fs.existsSync(adminIndex)) return res.sendFile(adminIndex);
  }
  const clientIndex = path.join(clientBuildPath, 'index.html');
  if (fs.existsSync(clientIndex)) return res.sendFile(clientIndex);
  res.status(404).json({ error: 'Not found' });
});

Sentry.setupExpressErrorHandler(app);
process.on('uncaughtException', (err) => console.error('Uncaught exception:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));

async function start() {
  await initDatabase();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
  });
  if (process.env.BOT_TOKEN) {
    try {
      const { startBot } = require('./bot');
      await startBot(app);
      console.log('🤖 Bot started');
    } catch (err) {
      console.error('⚠️ Bot failed to start:', err.message);
    }
  } else {
    console.log('⚠️ BOT_TOKEN not set, bot not started');
  }
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
