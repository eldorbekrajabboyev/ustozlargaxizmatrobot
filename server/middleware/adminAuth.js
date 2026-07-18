function adminAuth(req, res, next) {
  const key = req.headers['x-admin-key'];
  const expected = process.env.ADMIN_API_KEY;

  if (!expected) {
    return res.status(500).json({ error: 'ADMIN_API_KEY sozlanmagan' });
  }

  if (!key || key !== expected) {
    return res.status(401).json({ error: 'Ruxsatsiz kirish. Admin kalit kiritilmagan yoki noto\'g\'ri.' });
  }

  next();
}

module.exports = adminAuth;
