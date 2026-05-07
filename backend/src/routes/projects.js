const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { requireProjectMember, requireProjectAdmin } = require('../middleware/rbac');

// All project routes require authentication
router.use(authenticate);

// ─── GET /api/projects   ────
// List all projects the current user is a member of
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         p.id, p.name, p.description, p.owner_id, p.created_at,
         pm.role AS my_role,
         u.name AS owner_name,
         COUNT(DISTINCT pm2.user_id) AS member_count,
         COUNT(DISTINCT t.id)        AS task_count,
         COUNT(DISTINCT CASE WHEN t.status != 'done' AND t.due_date < NOW() THEN t.id END) AS overdue_count
       FROM projects p
       JOIN project_members pm  ON pm.project_id = p.id AND pm.user_id = $1
       JOIN users u             ON u.id = p.owner_id
       LEFT JOIN project_members pm2 ON pm2.project_id = p.id
       LEFT JOIN tasks t        ON t.project_id = p.id
       GROUP BY p.id, pm.role, u.name
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json({ projects: rows });
  } catch (err) {
    console.error('List projects error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/projects   ───
// Create a new project — creator becomes admin automatically
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { name, description } = req.body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `INSERT INTO projects (name, description, owner_id)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [name, description || null, req.user.id]
      );

      const project = rows[0];

      // Auto-add creator as admin
      await client.query(
        `INSERT INTO project_members (project_id, user_id, role)
         VALUES ($1, $2, 'admin')`,
        [project.id, req.user.id]
      );

      await client.query('COMMIT');
      res.status(201).json({ project: { ...project, my_role: 'admin' } });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Create project error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      client.release();
    }
  }
);

// ─── GET /api/projects/:projectId ────────────────────────────────────────────
router.get('/:projectId', requireProjectMember, async (req, res) => {
  const { projectId } = req.params;

  try {
    const projectRes = await pool.query(
      `SELECT p.*, u.name AS owner_name
       FROM projects p
       JOIN users u ON u.id = p.owner_id
       WHERE p.id = $1`,
      [projectId]
    );

    if (projectRes.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const membersRes = await pool.query(
      `SELECT pm.user_id, pm.role, pm.joined_at, u.name, u.email
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1
       ORDER BY pm.role DESC, u.name`,
      [projectId]
    );

    res.json({
      project: { ...projectRes.rows[0], my_role: req.memberRole },
      members: membersRes.rows,
    });
  } catch (err) {
    console.error('Get project error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /api/projects/:projectId ────────────────────────────────────────────
// Only admins can update project details
router.put(
  '/:projectId',
  requireProjectMember,
  requireProjectAdmin,
  [
    body('name').optional().trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { name, description } = req.body;
    const { projectId } = req.params;

    try {
      const { rows } = await pool.query(
        `UPDATE projects
         SET name = COALESCE($1, name),
             description = COALESCE($2, description)
         WHERE id = $3
         RETURNING *`,
        [name || null, description !== undefined ? description : null, projectId]
      );
      res.json({ project: rows[0] });
    } catch (err) {
      console.error('Update project error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ─── DELETE /api/projects/:projectId ─────────────────────────────────────────
// Only the project owner can delete it
router.delete('/:projectId', requireProjectMember, requireProjectAdmin, async (req, res) => {
  const { projectId } = req.params;

  try {
    // Verify requester is the owner (not just admin)
    const { rows } = await pool.query('SELECT owner_id FROM projects WHERE id = $1', [projectId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    if (rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the project owner can delete it' });
    }

    await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Delete project error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/projects/:projectId/members ────────────────────────────────────
// Admin adds a member by email
router.post(
  '/:projectId/members',
  requireProjectMember,
  requireProjectAdmin,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('role')
      .optional()
      .isIn(['admin', 'member'])
      .withMessage('Role must be admin or member'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { email, role = 'member' } = req.body;
    const { projectId } = req.params;

    try {
      const userRes = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: 'No user found with that email' });
      }

      const targetUser = userRes.rows[0];

      const existing = await pool.query(
        'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, targetUser.id]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'User is already a member of this project' });
      }

      await pool.query(
        `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)`,
        [projectId, targetUser.id, role]
      );

      res.status(201).json({
        message: 'Member added successfully',
        member: { ...targetUser, role, joined_at: new Date() },
      });
    } catch (err) {
      console.error('Add member error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ─── PUT /api/projects/:projectId/members/:userId ─────────────────────────────
// Admin changes a member's role
router.put(
  '/:projectId/members/:userId',
  requireProjectMember,
  requireProjectAdmin,
  [body('role').isIn(['admin', 'member']).withMessage('Role must be admin or member')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { projectId, userId } = req.params;
    const { role } = req.body;

    try {
      // Cannot demote the owner
      const projectRes = await pool.query('SELECT owner_id FROM projects WHERE id = $1', [projectId]);
      if (projectRes.rows[0].owner_id === parseInt(userId) && role !== 'admin') {
        return res.status(403).json({ error: 'Cannot change role of the project owner' });
      }

      const { rows } = await pool.query(
        `UPDATE project_members SET role = $1
         WHERE project_id = $2 AND user_id = $3
         RETURNING *`,
        [role, projectId, userId]
      );

      if (rows.length === 0) return res.status(404).json({ error: 'Member not found' });
      res.json({ message: 'Role updated', member: rows[0] });
    } catch (err) {
      console.error('Update role error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ─── DELETE /api/projects/:projectId/members/:userId ──────────────────────────
// Admin removes a member (or user removes themselves)
router.delete('/:projectId/members/:userId', requireProjectMember, async (req, res) => {
  const { projectId, userId } = req.params;
  const isSelf = req.user.id === parseInt(userId);
  const isAdmin = req.memberRole === 'admin';

  if (!isSelf && !isAdmin) {
    return res.status(403).json({ error: 'Only admins can remove other members' });
  }

  try {
    // Cannot remove owner
    const { rows: pRows } = await pool.query('SELECT owner_id FROM projects WHERE id = $1', [projectId]);
    if (pRows[0].owner_id === parseInt(userId)) {
      return res.status(403).json({ error: 'Cannot remove the project owner' });
    }

    await pool.query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    console.error('Remove member error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
