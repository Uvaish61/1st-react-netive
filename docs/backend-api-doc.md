# Backend API Documentation (Dummy JSON Store)

This backend uses a local JSON file as storage:
- Data file: `backend/src/data/store.json`
- No database is required.
- Every CRUD operation reads/writes this JSON file.

## Base URL
- Local: `http://localhost:5000`

## Authentication
Protected endpoints require this header:
- `Authorization: Bearer <token>`

## 1) Health Check
### Endpoint
- `GET /health`

### Request Body
- None

### Success Response
Status: `200 OK`
```json
{
  "status": "ok"
}
```

## 2) Signup
### Endpoint
- `POST /api/auth/signup`

### Request Body
```json
{
  "username": "owais",
  "email": "owais@example.com",
  "password": "123456"
}
```

### Success Response
Status: `201 Created`
```json
{
  "token": "<jwt_token>",
  "user": {
    "id": "user-1710000000000-ab12cd34",
    "username": "owais",
    "email": "owais@example.com",
    "createdAt": "2026-03-27T10:00:00.000Z",
    "updatedAt": "2026-03-27T10:00:00.000Z"
  }
}
```

### Error Responses
Status: `400 Bad Request`
```json
{
  "message": "username, email and password are required"
}
```

Status: `400 Bad Request`
```json
{
  "message": "User already exists with this email/username"
}
```

Status: `500 Internal Server Error`
```json
{
  "message": "Server error"
}
```

## 3) Login
### Endpoint
- `POST /api/auth/login`

### Request Body
```json
{
  "email": "owais@example.com",
  "password": "123456"
}
```

### Success Response
Status: `200 OK`
```json
{
  "token": "<jwt_token>",
  "user": {
    "id": "user-1710000000000-ab12cd34",
    "username": "owais",
    "email": "owais@example.com",
    "createdAt": "2026-03-27T10:00:00.000Z",
    "updatedAt": "2026-03-27T10:00:00.000Z"
  }
}
```

### Error Responses
Status: `400 Bad Request`
```json
{
  "message": "email and password are required"
}
```

Status: `401 Unauthorized`
```json
{
  "message": "Invalid credentials"
}
```

Status: `500 Internal Server Error`
```json
{
  "message": "Server error"
}
```

## 4) Get All Tasks (Protected)
### Endpoint
- `GET /api/tasks`

### Headers
- `Authorization: Bearer <token>`

### Request Body
- None

### Success Response
Status: `200 OK`
```json
[
  {
    "id": "task-1710000000100-xy12z789",
    "title": "Finish API",
    "description": "Write docs",
    "completed": false,
    "userId": "user-1710000000000-ab12cd34",
    "createdAt": "2026-03-27T10:01:00.000Z",
    "updatedAt": "2026-03-27T10:01:00.000Z"
  }
]
```

### Error Responses
Status: `401 Unauthorized`
```json
{
  "message": "Access denied. No token provided."
}
```

Status: `401 Unauthorized`
```json
{
  "message": "Invalid token."
}
```

Status: `500 Internal Server Error`
```json
{
  "message": "Error fetching tasks"
}
```

## 5) Create Task (Protected)
### Endpoint
- `POST /api/tasks`

### Headers
- `Authorization: Bearer <token>`

### Request Body
```json
{
  "title": "Finish API",
  "description": "Write docs",
  "completed": false
}
```

### Success Response
Status: `201 Created`
```json
{
  "id": "task-1710000000100-xy12z789",
  "title": "Finish API",
  "description": "Write docs",
  "completed": false,
  "userId": "user-1710000000000-ab12cd34",
  "createdAt": "2026-03-27T10:01:00.000Z",
  "updatedAt": "2026-03-27T10:01:00.000Z"
}
```

### Error Responses
Status: `400 Bad Request`
```json
{
  "message": "title is required"
}
```

Status: `401 Unauthorized`
```json
{
  "message": "Access denied. No token provided."
}
```

Status: `500 Internal Server Error`
```json
{
  "message": "Error adding task"
}
```

## 6) Update Task (Protected)
### Endpoint
- `PUT /api/tasks/:id`

### Headers
- `Authorization: Bearer <token>`

### Request Body
(Any or all fields)
```json
{
  "title": "Finish API v2",
  "description": "Updated details",
  "completed": true
}
```

### Success Response
Status: `200 OK`
```json
{
  "id": "task-1710000000100-xy12z789",
  "title": "Finish API v2",
  "description": "Updated details",
  "completed": true,
  "userId": "user-1710000000000-ab12cd34",
  "createdAt": "2026-03-27T10:01:00.000Z",
  "updatedAt": "2026-03-27T10:03:00.000Z"
}
```

### Error Responses
Status: `404 Not Found`
```json
{
  "message": "Task not found"
}
```

Status: `401 Unauthorized`
```json
{
  "message": "Invalid token."
}
```

Status: `500 Internal Server Error`
```json
{
  "message": "Error updating task"
}
```

## 7) Delete Task (Protected)
### Endpoint
- `DELETE /api/tasks/:id`

### Headers
- `Authorization: Bearer <token>`

### Request Body
- None

### Success Response
Status: `204 No Content`
(Empty body)

### Error Responses
Status: `404 Not Found`
```json
{
  "message": "Task not found"
}
```

Status: `401 Unauthorized`
```json
{
  "message": "Invalid token."
}
```

Status: `500 Internal Server Error`
```json
{
  "message": "Error deleting task"
}
```

## Notes
- Task IDs and user IDs are generated automatically.
- Data persists in `store.json` file between server restarts.
- Deleting/editing a task only works for the logged-in user who owns that task.
