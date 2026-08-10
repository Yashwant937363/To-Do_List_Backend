# To-Do List Backend API

A production-ready REST API backend for a to-do list application, built with **Node.js**, **Express 5**, and **TypeScript**. It provides secure user authentication (JWT + bcrypt) and full CRUD operations for user-specific notes, backed by a **PostgreSQL** database.

---

## Features

- 🔐 **JWT-based Authentication** — Stateless authentication using `Authorization: Bearer <token>` headers.
- 🔑 **Password Hashing** — Passwords encrypted with `bcrypt` (10 salt rounds) before storage.
- 📝 **Notes CRUD** — Create, read, update, and delete notes, scoped to the authenticated user.
- 🛡️ **Input Validation** — Request body and route parameters validated with **Zod** schemas.
- 🗄️ **PostgreSQL Persistence** — Database access via `pg` connection pooling.
- 🌐 **CORS Enabled** — Allows cross-origin requests from frontend applications.
- 🏗️ **TypeScript** — Strict type checking, compiled to `dist/` for production.
- ✅ **Health Check** — Simple `/status` endpoint for uptime/liveness monitoring.

---

## Tech Stack

| Layer           | Technology                            |
| --------------- | ------------------------------------- |
| **Language**    | TypeScript (strict mode)              |
| **Runtime**     | Node.js (ESM, `"type": "module"`)     |
| **Framework**   | Express 5.2                           |
| **Database**    | PostgreSQL                            |
| **DB Driver**   | `pg` (node-postgres, connection pool) |
| **Validation**  | Zod 4                                 |
| **Auth**        | `jsonwebtoken` (JWT), `bcrypt`        |
| **Config**      | `dotenv`                              |
| **CORS**        | `cors`                                |
| **Build**       | `tsc` → `dist/`                       |
| **Dev Tooling** | `tsx watch` (hot-reload development)  |

---

## Project Structure

```
src/
├── index.ts                    # Express app bootstrap & server startup
├── config/
│   ├── env.ts                  # Environment variable parsing & defaults
│   └── database.ts             # PostgreSQL connection pool (pg.Pool)
├── controllers/
│   ├── auth-controller.ts      # Request handlers: register, login, token login
│   └── notes-controller.ts     # Request handlers: CRUD operations for notes
├── errors/
│   ├── DublicateEmailError.ts  # 409 — email already registered (PG unique violation 23505)
│   ├── InternalServerError.ts  # 500 — unexpected server error
│   ├── NoteNotFound.ts         # 404 — note doesn't exist / no notes found
│   └── UserNotExistError.ts    # 404 — user doesn't exist
├── middleware/
│   ├── authUser.ts             # JWT verification → attaches payload to res.locals
│   ├── validateBody.ts         # Zod schema validation for request bodies
│   └── validateParms.ts        # Zod schema validation for route parameters
├── routes/
│   ├── auth-router.ts          # /api/auth routes
│   └── note-router.ts          # /api/notes routes (all protected)
├── schemas/
│   ├── auth-schema.ts          # Register/Login Zod schemas, JWT payload type
│   ├── base-schema.ts          # Base response / error interfaces
│   ├── note-schema.ts          # Note entity interface
│   ├── notes-schema.ts         # Note body/params Zod schemas, response types
│   └── user-schema.ts          # User entity interface
└── service/
    ├── bcrypt-service.ts       # Hash generation & password comparison
    ├── jwt-service.ts          # Token sign & verify helpers
    ├── note-service.ts         # DB queries for note operations
    └── user-service.ts         # DB queries for user operations
```

### Request Flow

1. **Incoming Request** → Global middleware (`express.json()`, `cors`) → route router.
2. **Validation** → `validateBody` / `validateParms` middleware validates the request with Zod; a `400` response is returned on failure.
3. **Authentication** → `authUser` middleware verifies the JWT from the `Authorization: Bearer <token>` header; attaches `{ id }` to `res.locals`; a `401` response is returned for missing/invalid tokens.
4. **Business Logic** → Controller calls the service layer, which executes parameterized SQL queries against PostgreSQL.
5. **Response** → JSON response with an appropriate HTTP status code (`200`, `201`, `400`, `401`, `404`, `409`, `500`).

---

## Getting Started

### Prerequisites

- **Node.js** (v18+ recommended, ESM support required)
- **npm**
- **PostgreSQL** (local instance or cloud-hosted)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Yashwant937363/To-Do_List_Backend.git
cd To-Do_List_Backend

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
```

### Environment Variables

Configure the following variables in your `.env` file:

| Variable         | Default | Description                               |
| ---------------- | ------- | ----------------------------------------- |
| `PORT`           | `5000`  | Port the server listens on                |
| `DB_HOST`        | —       | PostgreSQL host                           |
| `DB_PORT`        | —       | PostgreSQL port (e.g., `5432`)            |
| `DB_USER`        | —       | PostgreSQL username                       |
| `DB_PASSWORD`    | —       | PostgreSQL password                       |
| `DB_NAME`        | —       | PostgreSQL database name                  |
| `JWT_SECRET_KEY` | —       | Secret key used to sign/verify JWT tokens |

Example `.env`:

```env
PORT=5000
DB_HOST=localhost
DB_NAME=todo
DB_PASSWORD=mysecretpassword
DB_PORT=5432
DB_USER=postgres
JWT_SECRET_KEY=your-super-secret-key
```

### Database Setup

The application expects a PostgreSQL database with two tables:

**`users`**

| Column     | Type   | Constraints            |
| ---------- | ------ | ---------------------- |
| `id`       | serial | Primary Key            |
| `username` | text   | NOT NULL               |
| `email`    | text   | NOT NULL, UNIQUE       |
| `password` | text   | NOT NULL (bcrypt hash) |

**`notes`**

| Column    | Type    | Constraints               |
| --------- | ------- | ------------------------- |
| `id`      | serial  | Primary Key               |
| `title`   | text    | NOT NULL                  |
| `body`    | text    | NOT NULL                  |
| `tag`     | text    | NOT NULL                  |
| `user_id` | integer | Foreign Key → `users(id)` |

> The `users.email` unique constraint drives the `409 Conflict` response via the PostgreSQL error code `23505` (unique_violation).

---

## Running the Server

```bash
# Development mode (hot-reload with tsx watch)
npm run dev

# Production build (compiles TypeScript → dist/)
npm run build

# Production start (runs compiled output)
npm start
```

The server starts at `http://localhost:5000`.

**Quick health check:**

```bash
curl http://localhost:5000/status
# → live
```

---

## API Endpoints

All endpoints accept and return **JSON**.

### Health Check

#### `GET /status`

Returns a plain-text liveness response.

**Response `200 OK`:**

```
live
```

---

### Authentication (`/api/auth`)

#### `POST /api/auth/register` — Register a new user

Creates a user account and returns a JWT token.

**Request Body:**

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Validation Rules (Zod):**

| Field      | Rule                         |
| ---------- | ---------------------------- |
| `username` | Required, min length 1       |
| `email`    | Required, valid email format |
| `password` | Required, min length 8       |

**Response `201 Created`:**

```json
{
  "message": "user created",
  "data": {
    "authtoken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

- `400` — Invalid request body
- `409` — Email already exists (`"Email Already Exists"`)

---

#### `POST /api/auth/login` — Log in a user

Authenticates the user and returns a JWT token.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Validation Rules (Zod):**

| Field      | Rule                         |
| ---------- | ---------------------------- |
| `email`    | Required, valid email format |
| `password` | Required, min length 8       |

**Response `200 OK`:**

```json
{
  "message": "User logged in",
  "data": {
    "authtoken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "username": "john_doe"
  }
}
```

**Error Responses:**

- `400` — Invalid request body
- `401` — Invalid credentials (`"Unauthorized"`)

---

#### `GET /api/auth/` — Get logged-in user by token

Verifies the provided JWT and returns user details along with a fresh token.

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response `200 OK`:**

```json
{
  "message": "User logged in",
  "data": {
    "email": "john@example.com",
    "username": "john_doe",
    "authtoken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

- `401` — Missing or invalid token (`"unauthorized"`)

---

### Notes (`/api/notes`)

> **All note endpoints require authentication.** Include the `Authorization: Bearer <token>` header. Failure to provide a valid token returns `401`.

#### `GET /api/notes/all` — Fetch all notes for the user

Retrieves every note belonging to the authenticated user.

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response `201 Created`:**

```json
{
  "message": "fetched all notes",
  "data": [
    {
      "id": 1,
      "title": "Buy groceries",
      "body": "Milk, bread, eggs, butter",
      "tag": "Shopping",
      "user_id": 1
    }
  ]
}
```

**Error Responses:**

- `401` — Missing or invalid token
- `404` — No notes found (`"Note Not Found"`)

---

#### `POST /api/notes/` — Create a new note

Creates a note owned by the authenticated user.

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
  "title": "Buy groceries",
  "body": "Milk, bread, eggs, butter",
  "tag": "Shopping"
}
```

**Validation Rules (Zod):**

| Field   | Rule                            |
| ------- | ------------------------------- |
| `title` | Required, min 1 / max 256 chars |
| `body`  | Required, min length 1          |
| `tag`   | Required, min 1 / max 100 chars |

**Response `201 Created`:**

```json
{
  "message": "note created",
  "data": {
    "note": {
      "id": 1,
      "title": "Buy groceries",
      "body": "Milk, bread, eggs, butter",
      "tag": "Shopping",
      "user_id": 1
    }
  }
}
```

**Error Responses:**

- `400` — Invalid request body
- `401` — Missing or invalid token

---

#### `PATCH /api/notes/:id` — Update a note

Updates an existing note. Only the owner of the note can update it.

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Path Parameters:**

- `id` — numeric note ID (validated by Zod)

**Request Body:**

```json
{
  "title": "Updated title",
  "body": "Updated description",
  "tag": "Work"
}
```

**Validation Rules (Zod):**

| Field   | Rule                            |
| ------- | ------------------------------- |
| `title` | Required, min 1 / max 256 chars |
| `body`  | Required, min length 1          |
| `tag`   | Required, min 1 / max 100 chars |

**Response `200 OK`:**

```json
{
  "message": "note updated",
  "data": {
    "note": {
      "id": 1,
      "title": "Updated title",
      "body": "Updated description",
      "tag": "Work",
      "user_id": 1
    }
  }
}
```

**Error Responses:**

- `400` — Invalid request body or invalid `id` parameter
- `401` — Missing or invalid token
- `404` — Note not found / not owned by the user (`"Note Not Found"`)

---

#### `DELETE /api/notes/:id` — Delete a note

Deletes an existing note. Only the owner of the note can delete it.

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Path Parameters:**

- `id` — numeric note ID (validated by Zod)

**Response `200 OK`:**

```json
{
  "message": "note deleted",
  "data": {
    "note": {
      "id": 1,
      "title": "Buy groceries",
      "body": "Milk, bread, eggs, butter",
      "tag": "Shopping",
      "user_id": 1
    }
  }
}
```

**Error Responses:**

- `400` — Invalid `id` parameter
- `401` — Missing or invalid token
- `404` — Note not found / not owned by the user (`"Note Not Found"`)

---

## Authentication & Authorization

### How it works

1. On **register** or **login**, the server generates a JWT signed with `JWT_SECRET_KEY` containing the user's `id` as the payload.
2. The client must send this token in every protected request:

   ```
   Authorization: Bearer <token>
   ```

3. The `authUser` middleware (`src/middleware/authUser.ts`) extracts the token from the `Authorization` header, verifies it with `jwt.verify`, and attaches the decoded payload (`{ id }`) to `res.locals`.
4. Controllers use `res.locals.id` to scope all note queries to the authenticated user, ensuring **data isolation** — users can only read, update, or delete their own notes.

### Security measures

- **Password hashing:** `bcrypt` with 10 salt rounds (`src/service/bcrypt-service.ts`).
- **JWT signing/verification:** `jsonwebtoken` using the configured `JWT_SECRET_KEY` (`src/service/jwt-service.ts`).
- **SQL injection protection:** All database queries use parameterized statements (`$1, $2, ...`).
- **Input validation:** Zod schemas reject malformed bodies and path parameters with `400` responses.
- **User isolation:** Every note query includes `WHERE user_id = $n`, preventing cross-user access.

---

## Error Handling

Custom error classes are used throughout the service layer and mapped to HTTP responses in the controllers:

| Error Class           | HTTP Status | Message                 | Trigger                                           |
| --------------------- | ----------- | ----------------------- | ------------------------------------------------- |
| `DublicateEmailError` | `409`       | `Email Already Exists`  | PostgreSQL unique violation (`23505`) on register |
| `InternalServerError` | `500`       | `Internal Server Error` | Unexpected database/service failure               |
| `NoteNotFound`        | `404`       | `Note Not Found`        | No notes found / note not owned by user           |
| `UserNotExist`        | `404`       | `User Not Found`        | User lookup by email or id fails                  |

### Standard HTTP Status Codes

| Status | Meaning                                     |
| ------ | ------------------------------------------- |
| `200`  | Successful GET/PATCH/DELETE requests        |
| `201`  | Successful POST requests (resource created) |
| `400`  | Validation failure (request body or params) |
| `401`  | Missing/invalid JWT or invalid credentials  |
| `404`  | Resource not found                          |
| `409`  | Duplicate email on registration             |
| `500`  | Internal server error                       |

Validation errors from Zod follow this shape:

```json
{
  "message": "Invalid Request body",
  "errors": ["String must contain at least 8 character(s)"]
}
```

---

## Scripts

| Command         | Description                                     |
| --------------- | ----------------------------------------------- |
| `npm run dev`   | Starts the server with `tsx watch` (hot reload) |
| `npm run build` | Compiles TypeScript to `dist/` via `tsc`        |
| `npm start`     | Runs the compiled server (`node dist/index.js`) |

---

## Deployment

This repository contains no containerization or CI/CD configuration; deployment follows a standard Node.js build-and-run model.

### Manual Deployment

```bash
# 1. Install production dependencies
npm install --omit=dev

# 2. Compile TypeScript to JavaScript
npm run build

# 3. Set environment variables (must be configured on the host)
export PORT=5000
export DB_HOST=<postgres-host>
export DB_PORT=5432
export DB_USER=<db-user>
export DB_PASSWORD=<db-password>
export DB_NAME=<db-name>
export JWT_SECRET_KEY=<strong-secret>

# 4. Start the server
npm start
```

### Platform-Specific Notes

- **Linux VM / VPS:** Use a process manager such as `pm2` (`pm2 start dist/index.js`) to keep the server running.
- **Docker:** Provide a base image with Node.js, run `npm ci`, `npm run build`, set `.env` variables, and expose `PORT` (default `5000`).
- **PaaS (Heroku, Render, Railway, etc.):** Set the environment variables in the platform dashboard, then use the build command `npm run build` and start command `npm start`.

> **Important:** Use a strong, unique `JWT_SECRET_KEY` in production. Never commit the real `.env` file — it is ignored via `.gitignore`.

---

## License

ISC
