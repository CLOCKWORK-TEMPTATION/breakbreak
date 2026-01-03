# API Documentation - Break Break

Base URL: `http://localhost:3000/api`

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Auth Endpoints

### 1. Scan QR Code and Login

**POST** `/auth/scan-qr`

Scan a QR code to authenticate and receive a JWT token.

**Request Body:**
```json
{
  "qr_token": "project-id:timestamp:signature",
  "device_hash": "unique-device-identifier"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "role": "CREW",
    "projectId": "project-uuid"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired QR code
- `400 Bad Request` - Invalid request body

---

### 2. Verify Token

**POST** `/auth/verify`

Verify if a JWT token is valid.

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "valid": true,
  "payload": {
    "sub": "user-uuid",
    "projectId": "project-uuid",
    "role": "CREW",
    "iat": 1234567890,
    "exp": 1234654290
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid token

---

### 3. Generate QR Code (Protected)

**GET** `/auth/generate-qr/:projectId`

Generate a QR code for a project. Requires authentication.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "token": "project-id:timestamp:signature",
  "expires_in": "5 minutes"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid JWT
- `404 Not Found` - Project not found

---

## Project Endpoints

### 1. Create Project (DIRECTOR Only)

**POST** `/projects`

Create a new project.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "name": "My Film Project",
  "budget_config": {
    "total": 100000,
    "currency": "USD"
  },
  "active_location": {
    "type": "Point",
    "coordinates": [-73.935242, 40.730610]
  }
}
```

**Response (201):**
```json
{
  "id": "project-uuid",
  "name": "My Film Project",
  "budget_config": {
    "total": 100000,
    "currency": "USD"
  },
  "active_location": {
    "type": "Point",
    "coordinates": [-73.935242, 40.730610]
  },
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid JWT
- `403 Forbidden` - User is not a DIRECTOR
- `400 Bad Request` - Invalid request body

---

### 2. List All Projects

**GET** `/projects`

Get a list of all projects.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
[
  {
    "id": "project-uuid",
    "name": "My Film Project",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "_count": {
      "users": 5
    }
  }
]
```

---

### 3. Get Project Details

**GET** `/projects/:id`

Get details of a specific project.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "id": "project-uuid",
  "name": "My Film Project",
  "budget_config": {
    "total": 100000,
    "currency": "USD"
  },
  "active_location": {
    "type": "Point",
    "coordinates": [-73.935242, 40.730610]
  },
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z",
  "users": [
    {
      "id": "user-uuid",
      "role": "DIRECTOR",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid JWT
- `404 Not Found` - Project not found

---

### 4. Update Project (DIRECTOR Only)

**PATCH** `/projects/:id`

Update a project's details.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "budget_config": {
    "total": 150000,
    "currency": "USD"
  }
}
```

**Response (200):**
```json
{
  "id": "project-uuid",
  "name": "Updated Project Name",
  "budget_config": {
    "total": 150000,
    "currency": "USD"
  },
  "active_location": {
    "type": "Point",
    "coordinates": [-73.935242, 40.730610]
  },
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T10:00:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid JWT
- `403 Forbidden` - User is not a DIRECTOR
- `404 Not Found` - Project not found
- `400 Bad Request` - Invalid request body

---

### 5. Generate Project QR Code (DIRECTOR Only)

**POST** `/projects/:id/generate-qr`

Generate a QR code for crew members to join the project.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "token": "project-id:timestamp:signature",
  "expires_in": "5 minutes"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid JWT
- `403 Forbidden` - User is not a DIRECTOR
- `404 Not Found` - Project not found

---

## Data Models

### User Roles

```typescript
enum Role {
  DIRECTOR  // Can create projects, generate QR codes
  CREW      // Default role for team members
  RUNNER    // Production assistants
}
```

### Project Model

```typescript
{
  id: string;                    // UUID
  name: string;                  // Project name
  active_location?: object;      // Current filming location (GeoJSON Point)
  access_token_secret: string;   // Secret for QR signing (not exposed in API)
  budget_config?: object;        // Budget configuration
  created_at: Date;
  updated_at: Date;
  users: User[];                 // Project team members
}
```

### User Model

```typescript
{
  id: string;          // UUID
  project_id: string;  // Reference to project
  role: Role;          // User's role
  user_hash: string;   // Unique device+project hash
  created_at: Date;
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

---

## Authentication Flow

1. **Director creates a project** via `POST /projects`
2. **Director generates QR code** via `POST /projects/:id/generate-qr`
3. **Crew member scans QR code** using mobile device camera
4. **Frontend sends QR token** to `POST /auth/scan-qr` with device hash
5. **Backend verifies QR token** and creates/finds user
6. **Backend issues JWT** with user info and project ID
7. **Crew member uses JWT** for all subsequent API requests

---

## Security Features

- **QR Token Expiration**: QR codes expire after 5 minutes
- **HMAC Signature**: QR tokens are signed with project secret
- **Device Fingerprinting**: Each device gets a unique hash
- **JWT Expiration**: Sessions expire after 24 hours
- **Role-Based Access**: Endpoints protected by role guards
- **Input Validation**: All inputs validated with class-validator
- **CORS Protection**: Only allowed origins can access API
- **Helmet Security**: HTTP security headers enabled

---

## Rate Limiting

Not implemented in Sprint 1. Recommended for production:
- QR generation: 10 requests per minute
- Login attempts: 5 attempts per 15 minutes
- API requests: 100 requests per minute per user

---

## Testing with cURL

### Create a Project (as DIRECTOR)
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Test Project",
    "budget_config": {"total": 50000}
  }'
```

### Generate QR Code
```bash
curl -X POST http://localhost:3000/api/projects/PROJECT_ID/generate-qr \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Scan QR Code (Login)
```bash
curl -X POST http://localhost:3000/api/auth/scan-qr \
  -H "Content-Type: application/json" \
  -d '{
    "qr_token": "project-id:timestamp:signature",
    "device_hash": "abc123def456"
  }'
```
