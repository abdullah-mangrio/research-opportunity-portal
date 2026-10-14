require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const opportunities = require('./routes/opportunities');

const app = express();
app.use(cors());
app.use(express.json());

// REST API
app.use('/api/opportunities', opportunities);
app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found' }));

// Frontend (served from the same server, so no CORS/config needed)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Malformed JSON -> 400, everything else -> 500
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);
  try {
    await pool.query('SELECT 1');
    console.log('Database connected');
  } catch (e) {
    console.error('Database connection FAILED:', e.message);
  }
});
