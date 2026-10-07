const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Get User's Saved Targets
router.get('/', auth, async (req, res) => {
  try {
    const targets = await pool.query(
      'SELECT id, catalog_id, object_name, notes, saved_at FROM saved_targets WHERE user_id = $1 ORDER BY saved_at DESC',
      [req.user.id]
    );
    res.json(targets.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save a Target
router.post('/save', auth, async (req, res) => {
  const { catalog_id, object_name, notes } = req.body;
  try {
    const newTarget = await pool.query(
      `INSERT INTO saved_targets (user_id, catalog_id, object_name, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, catalog_id) DO UPDATE SET notes = EXCLUDED.notes
       RETURNING *`,
      [req.user.id, catalog_id, object_name, notes || '']
    );
    res.json(newTarget.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove a Saved Target
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM saved_targets WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Target removed successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;