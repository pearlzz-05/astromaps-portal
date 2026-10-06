const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { calculateLST } = require('../services/astroEngine');

// Endpoint: Sidereal Time Calculation
router.get('/sidereal-time', (req, res) => {
  const longitude = parseFloat(req.query.longitude) || 0.0;
  const siderealData = calculateLST(new Date(), longitude);
  res.json(siderealData);
});

// Endpoint: Catalog Search
router.get('/catalog/search', async (req, res) => {
  const { query } = req.query;
  try {
    const result = await pool.query(
      `SELECT catalog_id, object_name, ra, dec, type 
       FROM celestial_objects 
       WHERE LOWER(object_name) LIKE LOWER($1) OR LOWER(catalog_id) LIKE LOWER($1)`,
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;