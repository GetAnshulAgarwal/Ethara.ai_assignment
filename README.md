# TeamTask — Full-Stack Team Task Manager

A production-ready web application for team collaboration with role-based access control.

## 🚀 Live Demo
> Deploy URL goes here (Railway)

## ✨ Features

- **Authentication** — Signup/Login with JWT access + refresh token rotation
- **Project Management** — Create projects, manage teams with Admin/Member roles
- **Task Tracking** — Create, assign, and track tasks with status (todo / in_progress / done) and priority (low / medium / high)
- **Dashboard** — Personal task overview with overdue detection
- **RBAC** — Admins can manage members and all tasks; Members can only update their own tasks' status
- **Security** — Helmet, CORS, rate limiting, input validation, bcrypt password hashing

---

## 🗂️ Project Structure

```
team-task-manager/
├── backend/
│   └── src/
│       ├── config/
│       │   ├── db.js           # PostgreSQL pool
│       │   └── migrate.js      # Schema migrations
│       ├── middleware/
│       │   ├── auth.js         # JWT verification
│       │   └── rbac.js         # Role-based access
│       ├── routes/
│       │   ├── auth.js         # Signup, Login, Refresh, Logout, Me
│       │   ├── projects.js     # CRUD + member management
│       │   ├── tasks.js        # CRUD + dashboard + filters
│       │   └── users.js        # User search
│       └── server.js           # Express app entry
├── frontend/
│   └── index.html              # Single-page application
├── railway.toml
└── README.md
```

---

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd team-task-manager

# 2. Install backend dependencies
cd backend
npm install

# 3. Set environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT secrets

# 4. Run database migrations
npm run db:migrate

# 5. Start the server
npm run dev
```

Open http://localhost:5000 in your browser.

---

## 🗄️ Database Schema

```
users
  id, name, email (unique), password (bcrypt), created_at, updated_at

projects
  id, name, description, owner_id → users(id), created_at, updated_at

project_members          ← junction table with role
  id, project_id, user_id, role (admin|member), joined_at
  UNIQUE(project_id, user_id)

tasks
  id, title, description, project_id, created_by, assigned_to,
  status (todo|in_progress|done), priority (low|medium|high),
  due_date, created_at, updated_at

refresh_tokens
  id, user_id, token (unique), expires_at, created_at
```

**Key relationships:**
- When a project is created, the creator is auto-added as `admin` in `project_members`
- Deleting a project cascades to `project_members` and `tasks`
- Deleting a user cascades to their projects; tasks have `SET NULL` for soft handling

---

## 🔐 Role-Based Access Control

| Action | Admin | Member |
|--------|-------|--------|
| Create task | ✅ | ✅ |
| Update own task status | ✅ | ✅ |
| Assign/reassign tasks | ✅ | ❌ |
| Update any task | ✅ | ❌ |
| Delete any task | ✅ | ❌ (own only) |
| Add/remove members | ✅ | ❌ |
| Change member roles | ✅ | ❌ |
| Delete project | Owner only | ❌ |

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout (revoke token) |
| GET  | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/api/projects` | ✅ | Any member |
| POST | `/api/projects` | ✅ | Any user |
| GET | `/api/projects/:id` | ✅ | Member |
| PUT | `/api/projects/:id` | ✅ | Admin |
| DELETE | `/api/projects/:id` | ✅ | Owner |
| POST | `/api/projects/:id/members` | ✅ | Admin |
| PUT | `/api/projects/:id/members/:uid` | ✅ | Admin |
| DELETE | `/api/projects/:id/members/:uid` | ✅ | Admin/Self |

### Tasks
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/api/tasks/dashboard` | ✅ | Current user |
| GET | `/api/tasks/project/:id` | ✅ | Member |
| POST | `/api/tasks/project/:id` | ✅ | Member |
| GET | `/api/tasks/:id` | ✅ | Member |
| PUT | `/api/tasks/:id` | ✅ | Assignee/Creator/Admin |
| DELETE | `/api/tasks/:id` | ✅ | Creator/Admin |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/search?q=` | Search users by name/email |

---

## 🚂 Deploy to Railway

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add a **PostgreSQL** plugin to the project
4. Set environment variables in the Railway dashboard:

```
NODE_ENV=production
JWT_SECRET=<strong-random-string-32+chars>
JWT_REFRESH_SECRET=<different-strong-random-string>
DATABASE_URL=<auto-provided-by-railway-postgres-plugin>
FRONTEND_URL=<your-railway-app-url>
```

5. After first deploy, run migrations via Railway CLI or console:
```bash
railway run npm run db:migrate
```

---

## 📹 Demo Video
> 2-5 minute walkthrough covering: signup, project creation, adding members, task management, RBAC demo

---

## 🔒 Security Measures
- Passwords hashed with bcrypt (cost factor 12)
- JWT access tokens expire in 15 minutes
- Refresh token rotation on every use
- Rate limiting: 20 req/15min on auth routes, 200/15min on API
- Helmet.js for HTTP security headers
- Input validation with express-validator on all endpoints
- SQL injection prevention via parameterized queries
