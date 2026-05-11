const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

// Password Policy
// Requirements: min 6 letters, min 3 numbers, min 2 special characters (min 11 chars total)
const PASSWORD_POLICY = {
  minLength: 11,
  minLetters: 6,
  minNumbers: 3,
  minSpecial: 2,
};

/**
 * Checks whether a plaintext password meets the current policy.
 * Returns true if compliant, false otherwise.
 */
const meetsPasswordPolicy = (password) => {
  if (!password || password.length < PASSWORD_POLICY.minLength) return false;
  const letters  = (password.match(/[a-zA-Z]/g)    || []).length;
  const numbers  = (password.match(/[0-9]/g)        || []).length;
  const specials = (password.match(/[^a-zA-Z0-9]/g) || []).length;
  return letters >= PASSWORD_POLICY.minLetters &&
         numbers >= PASSWORD_POLICY.minNumbers &&
         specials >= PASSWORD_POLICY.minSpecial;
};

// Helpers
const generateAccessToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );

const generateRefreshToken = (user) =>
  jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  );

// POST /api/auth/signup
router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      // Minimum total length (6 letters + 3 digits + 2 specials = 11 chars minimum)
      .isLength({ min: PASSWORD_POLICY.minLength })
      .withMessage(
        `Password must be at least ${PASSWORD_POLICY.minLength} characters`
      )
      // At least 6 letters
      .matches(/(?:.*[a-zA-Z]){6}/)
      .withMessage(`Password must contain at least ${PASSWORD_POLICY.minLetters} letters`)
      // At least 3 numbers
      .matches(/(?:.*[0-9]){3}/)
      .withMessage(`Password must contain at least ${PASSWORD_POLICY.minNumbers} numbers`)
      // At least 2 special characters
      .matches(/(?:.*[^a-zA-Z0-9]){2}/)
      .withMessage(
        `Password must contain at least ${PASSWORD_POLICY.minSpecial} special characters`
      ),
    body('role')
      .optional()
      .isIn(['admin', 'member'])
      .withMessage('Role must be admin or member'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { name, email, password, role = 'member' } = req.body;

    try {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const { rows } = await pool.query(
        `INSERT INTO users (name, email, password, role, password_policy_compliant)
         VALUES ($1, $2, $3, $4, TRUE)
         RETURNING id, name, email, role, created_at`,
        [name, email, passwordHash, role]
      );

      const user = rows[0];
      const accessToken  = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await pool.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
        [user.id, refreshToken, refreshExpiry]
      );

      res.status(201).json({ accessToken, refreshToken, user });
    } catch (err) {
      console.error('Signup error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ─── POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const { rows } = await pool.query(
        'SELECT id, name, email, password, role FROM users WHERE email = $1',
        [email]
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const user = rows[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const accessToken  = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await pool.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
        [user.id, refreshToken, refreshExpiry]
      );

      const { password: _, ...safeUser } = user;

      // Legacy password warning 
      // We cannot check the hashed password against the policy, so we check the
      // plaintext the user just submitted.  If it does not meet the new policy
      // we surface a warning in the response so the client can prompt an update.
      const passwordWarning = !meetsPasswordPolicy(password)
        ? {
            code: 'WEAK_PASSWORD',
            message:
              'Your password does not meet our updated security policy. ' +
              'Please update it to include at least 6 letters, 3 numbers, ' +
              'and 2 special characters.',
            updateUrl: '/api/auth/update-password',  // ← point clients here
          }
        : null;
      // ────────────────────────────────────────────────────────────────────────

      res.json({
        accessToken,
        refreshToken,
        user: safeUser,
        ...(passwordWarning && { passwordWarning }), // only present when non-compliant
      });
    } catch (err) {
      console.error('Login error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ─── POST /api/auth/update-password
// Allows authenticated users (including legacy accounts) to set a new
// policy-compliant password.
router.post(
  '/update-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: PASSWORD_POLICY.minLength })
      .withMessage(`Password must be at least ${PASSWORD_POLICY.minLength} characters`)
      .matches(/(?:.*[a-zA-Z]){6}/)
      .withMessage(`Password must contain at least ${PASSWORD_POLICY.minLetters} letters`)
      .matches(/(?:.*[0-9]){3}/)
      .withMessage(`Password must contain at least ${PASSWORD_POLICY.minNumbers} numbers`)
      .matches(/(?:.*[^a-zA-Z0-9]){2}/)
      .withMessage(
        `Password must contain at least ${PASSWORD_POLICY.minSpecial} special characters`
      ),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    try {
      const { rows } = await pool.query(
        'SELECT id, password FROM users WHERE id = $1',
        [req.user.id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const newHash = await bcrypt.hash(newPassword, 12);

      await pool.query(
        `UPDATE users
         SET password = $1, password_policy_compliant = TRUE, updated_at = NOW()
         WHERE id = $2`,
        [newHash, req.user.id]
      );

      // Invalidate all existing refresh tokens so other sessions must re-login
      await pool.query(
        'DELETE FROM refresh_tokens WHERE user_id = $1',
        [req.user.id]
      );

      res.json({
        message:
          'Password updated successfully. Please log in again on all your devices.',
      });
    } catch (err) {
      console.error('Update-password error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ─── POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT rt.*, u.id as uid, u.name, u.email, u.role
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token = $1 AND rt.expires_at > NOW()`,
      [refreshToken]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = {
      id:    rows[0].uid,
      name:  rows[0].name,
      email: rows[0].email,
      role:  rows[0].role,
    };
    const newAccessToken  = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.id, newRefreshToken, refreshExpiry]
    );

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error('Refresh error:', err.message);
    res.status(401).json({ error: 'Token refresh failed' });
  }
});

// ─── POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  const { refreshToken } = req.body;

  try {
    if (refreshToken) {
      await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    } else {
      await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.user.id]);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;