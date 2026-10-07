const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: '../.env' });

const astroRoutes = require('./routes/astroRoutes');
const authRoutes = require('./routes/authRoutes');
const targetRoutes = require('./routes/targetRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Static Files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Endpoints
app.use('/api/astro', astroRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/targets', targetRoutes);

// Wildcard Fallback
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Astromaps Server & Auth Portal live on http://localhost:${PORT}`);
});