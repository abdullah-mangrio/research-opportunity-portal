const express = require('express');
const pool = require('../db');

const router = express.Router();

const TEXT_FIELDS = {
  title: 255,
  description: 5000,
  research_area: 255,
  faculty_name: 255,
  department: 255,
  required_skills: 1000
};
const STATUSES = ['Open', 'Closed'];

// Validates body. partial=true (PUT) only checks fields that are present.
function validate(body, partial) {
  const errors = [];
  const data = {};
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['Request body must be a JSON object'], data };
  }

  for (const [f, max] of Object.entries(TEXT_FIELDS)) {
    const v = body[f];
    if (v === undefined) {
      if (!partial) errors.push(`${f} is required`);
    } else if (typeof v !== 'string' || !v.trim()) {
      errors.push(`${f} must be a non-empty string`);
    } else if (v.trim().length > max) {
      errors.push(`${f} must be at most ${max} characters`);
    } else {
      data[f] = v.trim();
    }
  }

  const p = body.available_positions;
  if (p === undefined) {
    if (!partial) errors.push('available_positions is required');
  } else if (!/^\d+$/.test(String(p)) || Number(p) < 1 || Number(p) > 1000) {
    errors.push('available_positions must be a whole number between 1 and 1000');
  } else {
    data.available_positions = Number(p);
  }

  const d = body.application_deadline;
  if (d === undefined) {
    if (!partial) errors.push('application_deadline is required');
  } else if (
    typeof d !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(d) ||
    new Date(d + 'T00:00:00Z').toISOString().slice(0, 10) !== d
  ) {
    errors.push('application_deadline must be a valid date in YYYY-MM-DD format');
  } else {
    data.application_deadline = d;
  }

  const s = body.status;
  if (s === undefined) {
    if (!partial) data.status = 'Open';
  } else if (!STATUSES.includes(s)) {
    errors.push("status must be either 'Open' or 'Closed'");
  } else {
    data.status = s;
  }

  return { errors, data };
}

function validId(id) {
  return /^\d+$/.test(id) && Number(id) > 0 && Number.isSafeInteger(Number(id));
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM opportunities WHERE id = ?', [id]);
  return rows[0];
}

// 1. Create
router.post('/', async (req, res, next) => {
  try {
    const { errors, data } = validate(req.body, false);
    if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
    const [result] = await pool.query('INSERT INTO opportunities SET ?', [data]);
    res.status(201).json(await findById(result.insertId));
  } catch (err) { next(err); }
});

// 2. Retrieve all
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM opportunities ORDER BY id DESC');
    res.status(200).json(rows);
  } catch (err) { next(err); }
});

// 3. Retrieve one
router.get('/:id', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'ID must be a positive integer' });
    const row = await findById(req.params.id);
    if (!row) return res.status(404).json({ error: `Opportunity with ID ${req.params.id} not found` });
    res.status(200).json(row);
  } catch (err) { next(err); }
});

// 4. Update (send only the fields you want to change)
router.put('/:id', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'ID must be a positive integer' });
    if (!(await findById(req.params.id))) {
      return res.status(404).json({ error: `Opportunity with ID ${req.params.id} not found` });
    }
    const { errors, data } = validate(req.body, true);
    if (!errors.length && Object.keys(data).length === 0) errors.push('No valid fields provided to update');
    if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
    await pool.query('UPDATE opportunities SET ? WHERE id = ?', [data, req.params.id]);
    res.status(200).json(await findById(req.params.id));
  } catch (err) { next(err); }
});

// 5. Delete
router.delete('/:id', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ error: 'ID must be a positive integer' });
    const [result] = await pool.query('DELETE FROM opportunities WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: `Opportunity with ID ${req.params.id} not found` });
    }
    res.status(200).json({ message: `Opportunity ${req.params.id} deleted successfully` });
  } catch (err) { next(err); }
});

module.exports = router;
