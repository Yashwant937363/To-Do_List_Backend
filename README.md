# To-Do List Backend API

A robust Node.js REST API backend for task management featuring user authentication with JWT, MongoDB persistence, and complete CRUD operations for notes. Designed to seamlessly integrate with modern frontend applications.

## Overview

This is a production-grade Express.js API server that provides secure authentication and task management endpoints. Users can register, authenticate, and manage their personal notes/tasks with full permission-based access control. The API implements industry-standard security practices including password hashing, JWT token validation, and input validation.

## Stack

- **Language:** JavaScript (Node.js)
- **Framework / Runtime:** Express.js 4.18.2
- **Database:** MongoDB with Mongoose 8.0.1 ORM
- **Authentication:** JWT (jsonwebtoken 9.0.2), bcryptjs 2.4.3
- **Validation:** express-validator 7.0.1
- **Middleware:** CORS 2.8.5, express.json()
- **Development:** Nodemon 3.0.1 for auto-restart
- **Environment**: dotenv 16.3.1 for config management

## Architecture

```
controller/              Business logic and request handlers
  user.js               User registration, login, profile endpoints
  notes.js              Note CRUD operations and business logic
middleware/             Express middleware for request processing
  fetchuser.js          JWT authentication middleware
models/                 MongoDB schema definitions
  User.js               User schema (username, email, password, timestamps)
  Note.js               Note schema (user ref, title, body, tag, timestamps)
routes/                 API route definitions
  auth.js               Auth routes: register, login, get user
  notes.js              Note routes: list, create, update, delete
database.js             MongoDB connection configuration
index.js                Express app initialization and server setup
```

**Request Flow:**

1. **Incoming Request** → Express middleware (CORS, JSON parser) → Route router
2. **Authentication** → Route checks `fetchuser` middleware → Validates JWT token from `auth-token` header
3. **Validation** → express-validator checks request body (email format, password strength, field presence)
4. **Business Logic** → Controller processes validated data → Interacts with MongoDB via Mongoose
5. **Response** → Controller sends JSON response with status codes (201 created, 200 success, 400/401 auth errors, 500 server errors)

## Database Schema

### User Model
```javascript
{
  _id: ObjectId (auto-generated),
  username: String (required),
  email: String (required, unique),
  password: String (required, bcrypt hashed),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

### Note Model
```javascript
{
  _id: ObjectId (auto-generated),
  user: ObjectId (ref to User, required),
  title: String (required),
  body: String (required),
  tag: String (default: "General"),
  createdAt: Date (auto),
  updatedAt: Date (auto),
  // toJSON transformer: converts _id to id, removes __v
}
```

## API Endpoints

### Authentication Routes (`/api/auth`)

#### POST `/api/auth` - Register New User
Create a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Validation Rules:**
- `username`: Required, minimum 3 characters
- `email`: Required, valid email format
- `password`: Required, minimum 8 characters

**Response (201 Created):**
```json
{
  "authtoken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors or duplicate email
- `500 Internal Server Error`: Database error

---

#### POST `/api/auth/login` - User Login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "authtoken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "john_doe",
  "msg": "Login Successful"
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Invalid email or password
- `500 Internal Server Error`: Server error

---

#### GET `/api/auth/` - Get Logged-In User Details
Fetch authenticated user profile information.

**Headers Required:**
```
auth-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "username": "john_doe",
  "email": "john@example.com",
  "createdAt": "2024-06-21T10:30:00.000Z",
  "updatedAt": "2024-06-21T10:30:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `500 Internal Server Error`: Database error

---

### Notes Routes (`/api/notes`)

#### GET `/api/notes/` - Fetch All Notes
Retrieve all notes for the authenticated user.

**Headers Required:**
```
auth-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
[
  {
    "id": "507f1f77bcf86cd799439012",
    "user": "507f1f77bcf86cd799439011",
    "title": "Buy groceries",
    "body": "Milk, bread, eggs, butter",
    "tag": "Shopping",
    "createdAt": "2024-06-21T11:00:00.000Z",
    "updatedAt": "2024-06-21T11:00:00.000Z"
  }
]
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token
- `500 Internal Server Error`: Database error

---

#### POST `/api/notes/` - Create New Note
Add a new note/task for the authenticated user.

**Headers Required:**
```
auth-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "title": "Buy groceries",
  "body": "Milk, bread, eggs, butter",
  "tag": "Shopping"
}
```

**Validation Rules:**
- `title`: Required, cannot be null
- `body`: Required, minimum 5 characters
- `tag`: Optional, defaults to "General"

**Response (200 OK):**
```json
{
  "note": {
    "id": "507f1f77bcf86cd799439012",
    "user": "507f1f77bcf86cd799439011",
    "title": "Buy groceries",
    "body": "Milk, bread, eggs, butter",
    "tag": "Shopping",
    "createdAt": "2024-06-21T11:00:00.000Z",
    "updatedAt": "2024-06-21T11:00:00.000Z"
  },
  "msg": "Note has been successfully created"
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Missing or invalid token
- `500 Internal Server Error`: Server error

---

#### PUT `/api/notes/:id` - Update Note
Modify an existing note by ID (user-owned only).

**Headers Required:**
```
auth-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Parameters:**
- `id`: Note's MongoDB ObjectId

**Request Body:**
```json
{
  "title": "Updated title",
  "body": "Updated description",
  "tag": "NewTag"
}
```

**Validation Rules:**
- `title`: Required, cannot be null
- `body`: Required, minimum 5 characters
- `tag`: Optional

**Response (200 OK):**
```json
{
  "note": {
    "id": "507f1f77bcf86cd799439012",
    "user": "507f1f77bcf86cd799439011",
    "title": "Updated title",
    "body": "Updated description",
    "tag": "NewTag",
    "createdAt": "2024-06-21T11:00:00.000Z",
    "updatedAt": "2024-06-21T12:30:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Invalid token or not note owner
- `404 Not Found`: Note doesn't exist
- `500 Internal Server Error`: Server error

---

#### DELETE `/api/notes/:id` - Delete Note
Remove a note by ID (user-owned only).

**Headers Required:**
```
auth-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Parameters:**
- `id`: Note's MongoDB ObjectId

**Response (200 OK):**
```json
{
  "msg": "Note has been successfully deleted"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid token or not note owner
- `404 Not Found`: Note doesn't exist
- `500 Internal Server Error`: Server error

---

## Security Features

### Authentication
- **JWT Tokens**: Secure stateless authentication with configurable expiration
- **Password Hashing**: bcryptjs with salt rounds for secure password storage
- **Token Header**: Uses custom `auth-token` header for token transmission

### Authorization
- **User Isolation**: Users can only access their own notes and profile
- **Ownership Validation**: Update/delete operations verify user ownership

### Input Validation
- **express-validator**: Server-side validation for all endpoints
- **Email Format**: RFC compliance checking
- **Password Requirements**: Minimum 8 characters enforced
- **Field Presence**: Required fields validated before processing

### CORS
- CORS enabled for cross-origin requests from frontend applications

## How to Run

### Prerequisites
- Node.js 14+ and npm
- MongoDB instance (local or cloud - Atlas)
- Environment variables configuration

### Installation & Setup

```bash
# Clone the repository
git clone https://github.com/Yashwant937363/To-Do_List_Backend.git
cd To-Do_List_Backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/todolist
PORT=5000
FRONTENDURL=http://localhost:3000
EOF

# Replace with your actual MongoDB connection string
```

### Running the Server

```bash
# Production mode
npm start
# Server runs at http://localhost:5000

# Development mode with auto-restart
npm run dev
# Uses Nodemon to auto-restart on file changes
```

### Verification

```bash
# Test the server
curl http://localhost:5000
# Expected response: "Hello World"

# Test an API endpoint
curl -X POST http://localhost:5000/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

## Environment Variables

```env
DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/databasename
PORT=5000                                    # Server port (defaults to 5000)
FRONTENDURL=http://localhost:3000          # Frontend URL for CORS (optional)
```

## Middleware

### fetchuser (Authentication Middleware)
Located in `middleware/fetchuser.js`

- Validates JWT token from `auth-token` header
- Extracts user ID and attaches to `req.user`
- Returns 401 error if token invalid or missing
- Used on all protected routes (notes CRUD, user details)

## Error Handling

The API uses standard HTTP status codes:
- `200`: Successful GET/PUT request
- `201`: Successful resource creation (POST)
- `400`: Bad request (validation errors)
- `401`: Unauthorized (invalid token or credentials)
- `404`: Resource not found
- `500`: Internal server error

All error responses include descriptive error messages and validation details.

## Development & Deployment

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm start
# Ensure .env is configured with production database and URLs
```

### Cloud Deployment (Example: Heroku)
```bash
heroku create your-app-name
heroku config:set DATABASE_URL=your_mongodb_uri
git push heroku main
```

## Try Asking

- How does the JWT token authentication flow work in the fetchuser middleware?
- What validation rules are applied when creating or updating notes?
- How are user notes isolated to ensure data privacy across users?

## License

ISC

---

**Repository**: [Yashwant937363/To-Do_List_Backend](https://github.com/Yashwant937363/To-Do_List_Backend)  
**Default Branch**: `main`
