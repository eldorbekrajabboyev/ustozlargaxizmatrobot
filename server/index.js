require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { initDatabase, queryAll, queryOne, run, saveDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Ensure uploads directory exists
const fs = require('fs');
const uploadsDir = path.join(__dirname, '..', 'uploads');
['receipts', 'documents', 'images'].forEach(dir => {
  const fullPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Configure multer for file uploads
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext || mime) {
      cb(null, true);
    } else {
      cb(new Error('Fayl formati noto\'g\'ri'));
    }
  }
});

// ==================== API ROUTES ====================

// --- Users ---
app.get('/api/users', (req, res) => {
  const users = queryAll('SELECT * FROM users ORDER BY created_at DESC');
  res.json(users);
});

app.get('/api/users/:telegram_id', (req, res) => {
  const user = queryOne('SELECT * FROM users WHERE telegram_id = ?', [parseInt(req.params.telegram_id)]);
  if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  res.json(user);
});

app.post('/api/users', (req, res) => {
  const { telegram_id, username, first_name, last_name } = req.body;
  try {
    const existing = queryOne('SELECT * FROM users WHERE telegram_id = ?', [telegram_id]);
    if (existing) {
      run('UPDATE users SET username = ?, first_name = ?, last_name = ? WHERE telegram_id = ?',
        [username, first_name, last_name, telegram_id]);
      return res.json(queryOne('SELECT * FROM users WHERE telegram_id = ?', [telegram_id]));
    }
    const result = run('INSERT INTO users (telegram_id, username, first_name, last_name) VALUES (?, ?, ?, ?)',
      [telegram_id, username, first_name, last_name]);
    res.json(queryOne('SELECT * FROM users WHERE id = ?', [result.lastInsertRowid]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Services ---
app.get('/api/services', (req, res) => {
  const services = queryAll('SELECT * FROM services ORDER BY id ASC');
  res.json(services);
});

app.post('/api/services', (req, res) => {
  const { name, description, price } = req.body;
  try {
    const result = run('INSERT INTO services (name, description, price) VALUES (?, ?, ?)',
      [name, description, price]);
    res.json(queryOne('SELECT * FROM services WHERE id = ?', [result.lastInsertRowid]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/services/:id', (req, res) => {
  const { name, description, price, is_active } = req.body;
  try {
    run('UPDATE services SET name = ?, description = ?, price = ?, is_active = ? WHERE id = ?',
      [name, description, price, is_active, req.params.id]);
    res.json(queryOne('SELECT * FROM services WHERE id = ?', [req.params.id]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/services/:id', (req, res) => {
  run('DELETE FROM services WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// --- Payment Cards ---
app.get('/api/cards', (req, res) => {
  const cards = queryAll('SELECT * FROM payment_cards ORDER BY id ASC');
  res.json(cards);
});

app.post('/api/cards', (req, res) => {
  const { card_number, card_holder, bank_name } = req.body;
  try {
    const result = run('INSERT INTO payment_cards (card_number, card_holder, bank_name) VALUES (?, ?, ?)',
      [card_number, card_holder, bank_name]);
    res.json(queryOne('SELECT * FROM payment_cards WHERE id = ?', [result.lastInsertRowid]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/cards/:id', (req, res) => {
  const { card_number, card_holder, bank_name, is_active } = req.body;
  try {
    run('UPDATE payment_cards SET card_number = ?, card_holder = ?, bank_name = ?, is_active = ? WHERE id = ?',
      [card_number, card_holder, bank_name, is_active, req.params.id]);
    res.json(queryOne('SELECT * FROM payment_cards WHERE id = ?', [req.params.id]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/cards/:id', (req, res) => {
  run('DELETE FROM payment_cards WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// --- Orders ---
app.get('/api/orders', (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  let whereClause = '';
  const params = [];
  if (status) {
    whereClause = 'WHERE o.status = ?';
    params.push(status);
  }

  let query = `
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

  const orders = queryAll(query, params);

  // Get images for each order
  orders.forEach(order => {
    order.images = queryAll('SELECT * FROM order_images WHERE order_id = ?', [order.id]);
  });

  let countQuery = `SELECT COUNT(*) as count FROM orders o ${whereClause}`;
  const countParams = status ? [status] : [];
  const totalResult = queryOne(countQuery, countParams);
  const total = totalResult ? totalResult.count : 0;

  res.json({ orders, total, page: parseInt(page), limit: parseInt(limit) });
});

app.get('/api/orders/:id', (req, res) => {
  const order = queryOne(`
    SELECT o.*, u.username, u.first_name, u.last_name, u.telegram_id, u.phone,
           s.name as service_name, s.description as service_description
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN services s ON o.service_id = s.id
    WHERE o.id = ?
  `, [parseInt(req.params.id)]);
  if (!order) return res.status(404).json({ error: 'Buyurtma topilmadi' });
  order.images = queryAll('SELECT * FROM order_images WHERE order_id = ?', [order.id]);
  res.json(order);
});

app.post('/api/orders', (req, res) => {
  const { user_id, service_id, full_name, address, school, subject, grade, topic } = req.body;
  try {
    const service = queryOne('SELECT * FROM services WHERE id = ?', [service_id]);
    if (!service) return res.status(400).json({ error: 'Xizmat topilmadi' });

    const orderCode = `MK-${Date.now().toString(36).toUpperCase()}`;

    const result = run(`
      INSERT INTO orders (order_code, user_id, service_id, full_name, address, school, subject, grade, topic, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [orderCode, user_id, service_id, full_name, address, school, subject, grade, topic, service.price]);

    const order = queryOne('SELECT * FROM orders WHERE id = ?', [result.lastInsertRowid]);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/orders/:id', (req, res) => {
  const { status, admin_note } = req.body;
  try {
    const updates = ['updated_at = CURRENT_TIMESTAMP'];
    const params = [];
    if (status) { updates.push('status = ?'); params.push(status); }
    if (admin_note !== undefined) { updates.push('admin_note = ?'); params.push(admin_note); }
    params.push(parseInt(req.params.id));
    run(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, params);
    const order = queryOne(`
      SELECT o.*, u.username, u.first_name, u.last_name, u.telegram_id,
             s.name as service_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN services s ON o.service_id = s.id
      WHERE o.id = ?
    `, [parseInt(req.params.id)]);
    order.images = queryAll('SELECT * FROM order_images WHERE order_id = ?', [order.id]);
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload payment receipt
app.post('/api/orders/:id/receipt', upload.single('receipt'), (req, res) => {
  try {
    run('UPDATE orders SET payment_receipt = ?, status = ? WHERE id = ?',
      [`/uploads/receipts/${req.file.filename}`, 'pending_confirmation', parseInt(req.params.id)]);
    res.json({ success: true, path: `/uploads/receipts/${req.file.filename}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload order images (up to 5)
app.post('/api/orders/:id/images', upload.array('images', 5), (req, res) => {
  try {
    const images = [];
    req.files.forEach(file => {
      const result = run('INSERT INTO order_images (order_id, image_path) VALUES (?, ?)',
        [parseInt(req.params.id), `/uploads/images/${file.filename}`]);
      images.push({ id: result.lastInsertRowid, image_path: `/uploads/images/${file.filename}` });
    });
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload document (admin)
app.post('/api/orders/:id/document', upload.single('document'), (req, res) => {
  try {
    run('UPDATE orders SET document_file = ?, status = ? WHERE id = ?',
      [`/uploads/documents/${req.file.filename}`, 'ready', parseInt(req.params.id)]);
    res.json({ success: true, path: `/uploads/documents/${req.file.filename}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Confirm payment
app.put('/api/orders/:id/confirm-payment', (req, res) => {
  try {
    run('UPDATE orders SET status = ? WHERE id = ?', ['in_progress', parseInt(req.params.id)]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject payment
app.put('/api/orders/:id/reject-payment', (req, res) => {
  try {
    run('UPDATE orders SET status = ?, payment_receipt = NULL WHERE id = ?',
      ['pending_payment', parseInt(req.params.id)]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark as sent
app.put('/api/orders/:id/send', (req, res) => {
  try {
    run('UPDATE orders SET status = ? WHERE id = ?', ['sent', parseInt(req.params.id)]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Statistics ---
app.get('/api/stats', (req, res) => {
  const totalOrders = queryOne('SELECT COUNT(*) as count FROM orders').count;
  const pendingPayment = queryOne("SELECT COUNT(*) as count FROM orders WHERE status = 'pending_payment'").count;
  const pendingConfirmation = queryOne("SELECT COUNT(*) as count FROM orders WHERE status = 'pending_confirmation'").count;
  const inProgress = queryOne("SELECT COUNT(*) as count FROM orders WHERE status = 'in_progress'").count;
  const ready = queryOne("SELECT COUNT(*) as count FROM orders WHERE status = 'ready'").count;
  const sent = queryOne("SELECT COUNT(*) as count FROM orders WHERE status = 'sent'").count;
  const totalUsers = queryOne('SELECT COUNT(*) as count FROM users').count;
  const totalRevenueResult = queryOne("SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE status IN ('in_progress', 'ready', 'sent')");
  const totalRevenue = totalRevenueResult ? totalRevenueResult.total : 0;

  const subjectStats = queryAll(`
    SELECT subject, COUNT(*) as count FROM orders GROUP BY subject ORDER BY count DESC LIMIT 10
  `);

  const recentOrders = queryAll(`
    SELECT o.id, o.order_code, o.full_name, o.status, o.total_price, o.created_at,
           s.name as service_name
    FROM orders o
    LEFT JOIN services s ON o.service_id = s.id
    ORDER BY o.created_at DESC LIMIT 10
  `);

  res.json({
    totalOrders, pendingPayment, pendingConfirmation, inProgress, ready, sent,
    totalUsers, totalRevenue, subjectStats, recentOrders
  });
});

// --- Settings ---
app.get('/api/settings', (req, res) => {
  const settings = queryAll('SELECT * FROM settings');
  const obj = {};
  settings.forEach(s => obj[s.key] = s.value);
  res.json(obj);
});

app.put('/api/settings', (req, res) => {
  try {
    Object.entries(req.body).forEach(([key, value]) => {
      run('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?', [value, key]);
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Dashboard stats for MiniApp ---
app.get('/api/user/orders/:telegram_id', (req, res) => {
  const user = queryOne('SELECT id FROM users WHERE telegram_id = ?', [parseInt(req.params.telegram_id)]);
  if (!user) return res.json([]);
  const orders = queryAll(`
    SELECT o.*, s.name as service_name
    FROM orders o
    LEFT JOIN services s ON o.service_id = s.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `, [user.id]);
  res.json(orders);
});

app.get('/api/user/active-cards', (req, res) => {
  const cards = queryAll('SELECT * FROM payment_cards WHERE is_active = 1');
  res.json(cards);
});

// Serve built frontend files (production)
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
const adminBuildPath = path.join(__dirname, '..', 'admin', 'dist');

if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
}
if (fs.existsSync(adminBuildPath)) {
  app.use('/admin', express.static(adminBuildPath));
}

// SPA fallback for client
app.get('*', (req, res) => {
  if (req.path.startsWith('/admin')) {
    const adminIndex = path.join(adminBuildPath, 'index.html');
    if (fs.existsSync(adminIndex)) {
      return res.sendFile(adminIndex);
    }
  }
  const clientIndex = path.join(clientBuildPath, 'index.html');
  if (fs.existsSync(clientIndex)) {
    return res.sendFile(clientIndex);
  }
  res.status(404).json({ error: 'Not found' });
});

// Start server
async function start() {
  await initDatabase();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
  });

  // Start bot if BOT_TOKEN is provided
  if (process.env.BOT_TOKEN) {
    try {
      const { startBot } = require('./bot');
      await startBot();
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
