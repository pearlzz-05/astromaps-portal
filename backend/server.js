const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const pool = require('./config/db');
const astroRoutes = require('./routes/astroRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api/astro', astroRoutes);

// General route test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Astromaps API is live' });
});

app.listen(PORT, () => {
  console.log(`🚀 Astromaps Server running on port ${PORT}`);
});