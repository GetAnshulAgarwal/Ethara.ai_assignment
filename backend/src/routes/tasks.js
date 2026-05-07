const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { requireProjectMember, requireProjectAdmin } = require('../middleware/rbac');

router.use(authenticate);

//GET /api/tasks/dashboard 
// Personal dashboard: tasks assigned to the current user across all projects
router.get('/dashboard', async (req, res) => {
  try {
    const { rows: summary } = await pool.query(
      `SELECT
         COUNT(*)                                              AS total,
         COUNT(*) FILTER (WHERE status = 'todo')              AS todo,
         COUNT(*) FILTER (WHERE status = 'in_progress')       AS in_progress,
         COUNT(*) FILTER (WHERE status = 'done')              AS done,
         COUNT(*) FILTER (
           WHERE status != 'done' AND due_date < CURRENT_DATE
         )                                                     AS overdue
       FROM tasks
       WHERE assigned_to = $1`,
      [req.user.id]
    );

    const { rows: tasks } = await pool.query(
      `SELECT
         t.id, t.title, t.status, t.priority, t.due_date, t.created_at,
         p.id AS project_id, p.name AS project_name,
         u.name AS assigned_to_name
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.assigned_to = $1
       ORDER BY
         CASE WHEN t.status != 'done' AND t.due_date < CURRENT_DATE THEN 0 ELSE 1 END,
         t.due_date ASC NULLS LAST,
         CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END
       LIMIT 50`,
      [req.user.id]
    );

    res.json({ summary: summary[0], tasks });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//GET /api/tasks/project/:projectId 
// All tasks in a project — filterable by status, assignee, priority
router.get(
  '/project/:projectId',
  requireProjectMember,
  [
    query('status').optional().isIn(['todo', 'in_progress', 'done']),
    query('priority').optional().isIn(['low', 'medium', 'high']),
    query('assigned_to').optional().isInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { projectId } = req.params;
    const { status, priority, assigned_to } = req.query;

    try {
      let queryStr = `
        SELECT
          t.id, t.title, t.description, t.status, t.priority,
          t.due_date, t.created_at, t.updated_at,
          t.created_by, t.assigned_to,
          cb.name AS created_by_name,
          au.name AS assigned_to_name
        FROM tasks t
        LEFT JOIN users cb ON cb.id = t.created_by
        LEFT JOIN users au ON au.id = t.assigned_to
        WHERE t.project_id = $1
      `;
      const params = [projectId];
      let idx = 2;

      if (status) { queryStr += ` AND t.status = $${idx++}`; params.push(status); }
      if (priority) { queryStr += ` AND t.priority = $${idx++}`; params.push(priority); }
      if (assigned_to) { queryStr += ` AND t.assigned_to = $${idx++}`; params.push(assigned_to); }

      queryStr += `
        ORDER BY
          CASE WHEN t.status != 'done' AND t.due_date < CURRENT_DATE THEN 0 ELSE 1 END,
          CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
          t.created_at DESC
      `;

      const { rows } = await pool.query(queryStr, params);

      // Status summary for this project
      const { rows: counts } = await pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'todo')        AS todo,
           COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
           COUNT(*) FILTER (WHERE status = 'done')        AS done,
           COUNT(*) FILTER (WHERE status != 'done' AND due_date < CURRENT_DATE) AS overdue
         FROM tasks WHERE project_id = $1`,
        [projectId]
      );

      res.json({ tasks: rows, summary: counts[0] });
    } catch (err) {
      console.error('Get tasks error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/tasks/project/:projectId 
// Any project member can create a task; only admins can assign to others
router.post(
  '/project/:projectId',
  requireProjectMember,
  [
    body('title').trim().notEmpty().withMessage('Task title is required').isLength({ max: 300 }),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('assigned_to').optional().isInt().withMessage('assigned_to must be a user ID'),
    body('status')
      .optional()
      .isIn(['todo', 'in_progress', 'done'])
      .withMessage('Invalid status'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Invalid priority'),
    body('due_date').optional().isISO8601().withMessage('due_date must be a valid date'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { projectId } = req.params;
    const { title, description, assigned_to, status, priority, due_date } = req.body;

    try {
      // Verify assigned_to is a project member (if provided)
      if (assigned_to) {
        const memberCheck = await pool.query(
          'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
          [projectId, assigned_to]
        );
        if (memberCheck.rows.length === 0) {
          return res.status(400).json({ error: 'Assigned user is not a member of this project' });
        }
      }

      const { rows } = await pool.query(
        `INSERT INTO tasks (title, description, project_id, created_by, assigned_to, status, priority, due_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          title,
          description || null,
          projectId,
          req.user.id,
          assigned_to || null,
          status || 'todo',
          priority || 'medium',
          due_date || null,
        ]
      );

      res.status(201).json({ task: rows[0] });
    } catch (err) {
      console.error('Create task error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

//  GET /api/tasks/:taskId   
router.get('/:taskId', async (req, res) => {
  const { taskId } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT
         t.*,
         cb.name AS created_by_name,
         au.name AS assigned_to_name,
         p.name  AS project_name
       FROM tasks t
       LEFT JOIN users cb ON cb.id = t.created_by
       LEFT JOIN users au ON au.id = t.assigned_to
       LEFT JOIN projects p ON p.id = t.project_id
       WHERE t.id = $1`,
      [taskId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });

    // Verify caller is a project member
    const memberCheck = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [rows[0].project_id, req.user.id]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ task: rows[0], my_role: memberCheck.rows[0].role });
  } catch (err) {
    console.error('Get task error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tasks/:taskId   
// Members can update status of their own tasks; admins can update anything
router.put(
  '/:taskId',
  [
    body('title').optional().trim().notEmpty().isLength({ max: 300 }),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('assigned_to').optional({ nullable: true }).isInt(),
    body('status').optional().isIn(['todo', 'in_progress', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('due_date').optional({ nullable: true }).isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { taskId } = req.params;

    try {
      const taskRes = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
      if (taskRes.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

      const task = taskRes.rows[0];

      // Check membership
      const memberRes = await pool.query(
        'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
        [task.project_id, req.user.id]
      );
      if (memberRes.rows.length === 0) return res.status(403).json({ error: 'Access denied' });

      const isAdmin = memberRes.rows[0].role === 'admin';
      const isAssignee = task.assigned_to === req.user.id;
      const isCreator = task.created_by === req.user.id;

      // Members can only update status of tasks assigned to or created by them
      if (!isAdmin && !isAssignee && !isCreator) {
        return res.status(403).json({ error: 'You can only update tasks assigned to you' });
      }

      const { title, description, assigned_to, status, priority, due_date } = req.body;

      // Non-admins cannot reassign tasks
      if (!isAdmin && assigned_to !== undefined) {
        return res.status(403).json({ error: 'Only admins can reassign tasks' });
      }

      const { rows } = await pool.query(
        `UPDATE tasks SET
           title       = COALESCE($1, title),
           description = COALESCE($2, description),
           assigned_to = CASE WHEN $3::integer IS NOT NULL THEN $3 ELSE assigned_to END,
           status      = COALESCE($4, status),
           priority    = COALESCE($5, priority),
           due_date    = CASE WHEN $6::date IS NOT NULL THEN $6 ELSE due_date END
         WHERE id = $7
         RETURNING *`,
        [
          title || null,
          description !== undefined ? description : null,
          assigned_to !== undefined ? assigned_to : null,
          status || null,
          priority || null,
          due_date !== undefined ? due_date : null,
          taskId,
        ]
      );

      res.json({ task: rows[0] });
    } catch (err) {
      console.error('Update task error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /api/tasks/:taskId 
// Admins or task creator can delete
router.delete('/:taskId', async (req, res) => {
  const { taskId } = req.params;

  try {
    const taskRes = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (taskRes.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

    const task = taskRes.rows[0];

    const memberRes = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [task.project_id, req.user.id]
    );
    if (memberRes.rows.length === 0) return res.status(403).json({ error: 'Access denied' });

    const isAdmin = memberRes.rows[0].role === 'admin';
    const isCreator = task.created_by === req.user.id;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ error: 'Only admins or task creator can delete this task' });
    }

    await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
