# Task Manager Backend (Auth + Full Task CRUD)

This project includes a working backend API with:
- Signup and login
- JWT authentication
- Add task
- Get all tasks
- Update task
- Delete task
- User ownership protection (users can only access their own tasks)
- Dummy JSON storage (no database)

## Backend Stack
- Node.js + Express + TypeScript
- JWT + bcryptjs
- Docker / Docker Compose

## API Base URL
- Local or container: `http://localhost:5000`
- Health check: `GET /health`

## Auth Endpoints
### `POST /api/auth/signup`
Body:
```json
{
  "username": "owais",
  "email": "owais@example.com",
  "password": "123456"
}
```

Response:
```json
{
  "token": "...jwt...",
  "user": {
    "id": "...",
    "username": "owais",
    "email": "owais@example.com"
  }
}
```

### `POST /api/auth/login`
Body:
```json
{
  "email": "owais@example.com",
  "password": "123456"
}
```

Response:
```json
{
  "token": "...jwt...",
  "user": {
    "id": "...",
    "username": "owais",
    "email": "owais@example.com"
  }
}
```

## Task Endpoints (Protected)
Pass token in header:
`Authorization: Bearer <token>`

### `GET /api/tasks`
Returns all tasks of logged-in user.

### `POST /api/tasks`
Body:
```json
{
  "title": "Finish backend",
  "description": "Implement update and delete",
  "completed": false
}
```

### `PUT /api/tasks/:id`
Body (example):
```json
{
  "title": "Finish backend v2",
  "completed": true
}
```

### `DELETE /api/tasks/:id`
Response: `204 No Content`

## Run with Docker (No local Node setup needed)
From project root:
```bash
docker-compose up --build
```

Services:
- Backend: `http://localhost:5000`

## Environment Variables (backend)
Create `backend/.env`:
```env
PORT=5000
JWT_SECRET=change_this_secret
```

## Deploy without running locally
You can deploy backend to any cloud service that supports Docker.

### Option 1: Render (recommended)
1. Push this repo to GitHub.
2. On Render, create a new Web Service from repo.
3. Root directory: `backend`
4. Runtime: Docker
5. Add env vars:
   - `JWT_SECRET`
   - `PORT=5000`
6. Deploy.

You can also use the blueprint file at `render.yaml` after replacing the repo URL.

### Option 2: Railway
1. Create project from GitHub repo.
2. Set service root to `backend`.
3. Deploy with Dockerfile.
4. Add env vars (`JWT_SECRET`, `PORT`).

## Notes
- Storage file used by API: `backend/src/data/store.json`
- Use a strong JWT secret.
- Add rate-limiting and request validation for public deployment.

## API Testing
- Import Postman collection: `docs/postman/task-manager-api.postman_collection.json`
- Run in this order:
  1. Signup
  2. Login (auto-saves token)
  3. Create Task (auto-saves taskId)
  4. Get Tasks / Update Task / Delete Task

## Full API Docs
- See `docs/backend-api-doc.md` for complete endpoint request and response specs.
