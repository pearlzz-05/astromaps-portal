const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const tokenHeader = req.header('Authorization');

  if (!tokenHeader) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = tokenHeader.startsWith('Bearer ') ? tokenHeader.slice(7) : tokenHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'astromaps_super_secret_jwt_key_2026');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid or expired authentication token.' });
  }
};