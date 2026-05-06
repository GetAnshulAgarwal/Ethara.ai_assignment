const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// ─── GET /api/users/search?q=email_or_name ───────────────────────────────────
// Search users by email or name (for adding members to projects)
router.get('/search', async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, name, email
       FROM users
       WHERE (LOWER(email) LIKE LOWER($1) OR LOWER(name) LIKE LOWER($1))
         AND id != $2
       LIMIT 10`,
      [`%${q.trim()}%`, req.user.id]
    );

    res.json({ users: rows });
  } catch (err) {
    console.error('User search error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
