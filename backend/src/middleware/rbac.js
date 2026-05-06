const pool = require('../config/db');

/**
 * Checks the caller's role in a project.
 * Expects req.params.projectId to be present.
 * Attaches req.memberRole = 'admin' | 'member' to the request.
 */
const requireProjectMember = async (req, res, next) => {
  const projectId = req.params.projectId || req.body.project_id;

  if (!projectId) {
    return res.status(400).json({ error: 'Project ID required' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT role FROM project_members
       WHERE project_id = $1 AND user_id = $2`,
      [projectId, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this project' });
    }

    req.memberRole = rows[0].role;
    next();
  } catch (err) {
    console.error('RBAC error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Only allows admins of the project to proceed.
 * Must be used AFTER requireProjectMember.
 */
const requireProjectAdmin = (req, res, next) => {
  if (req.memberRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required for this action' });
  }
  next();
};

module.exports = { requireProjectMember, requireProjectAdmin };
