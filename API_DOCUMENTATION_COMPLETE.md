# API Documentation - Break Break (Complete)

Base URL: `http://localhost:3000/api`

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Table of Contents
1. [Auth Endpoints](#auth-endpoints)
2. [Project Endpoints](#project-endpoints)
3. [Geo Endpoints](#geo-endpoints)
4. [Vendor Endpoints](#vendor-endpoints)
5. [Order Endpoints](#order-endpoints)
6. [WebSocket Events](#websocket-events)

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

---

### 2. Verify Token

**POST** `/auth/verify`

Verify if a JWT token is valid.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "valid": true,
  "user": {
    "id": "user-uuid",
    "role": "CREW",
    "projectId": "project-uuid"
  }
}
```

---

### 3. Generate QR Code

**GET** `/auth/generate-qr/:projectId`

Generate a QR code for a project (DIRECTOR only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "qr_token": "project-id:timestamp:signature",
  "qr_image": "data:image/png;base64,iVBORw0KGgo...",
  "expires_at": "2026-01-03T07:00:00Z"
}
```

---

## Project Endpoints

### 1. Create Project

**POST** `/projects`

Create a new project (DIRECTOR only).

**Request Body:**
```json
{
  "name": "Film Production Alpha",
  "budget_config": {
    "daily_limit": 5000,
    "per_person_limit": 50
  }
}
```

**Response (201):**
```json
{
  "id": "project-uuid",
  "name": "Film Production Alpha",
  "active_location": null,
  "access_token_secret": "generated-secret",
  "budget_config": {
    "daily_limit": 5000,
    "per_person_limit": 50
  },
  "created_at": "2026-01-03T06:00:00Z"
}
```

---

### 2. List Projects

**GET** `/projects`

Get all projects.

**Response (200):**
```json
[
  {
    "id": "project-uuid",
    "name": "Film Production Alpha",
    "active_location": { "lat": 24.7136, "lng": 46.6753 },
    "created_at": "2026-01-03T06:00:00Z"
  }
]
```

---

### 3. Get Project Details

**GET** `/projects/:id`

Get details of a specific project.

**Response (200):**
```json
{
  "id": "project-uuid",
  "name": "Film Production Alpha",
  "active_location": { "lat": 24.7136, "lng": 46.6753 },
  "budget_config": {
    "daily_limit": 5000
  },
  "created_at": "2026-01-03T06:00:00Z"
}
```

---

### 4. Update Project

**PATCH** `/projects/:id`

Update project details (DIRECTOR only).

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "budget_config": {
    "daily_limit": 6000
  }
}
```

---

## Geo Endpoints

### 1. Set Project Location

**POST** `/geo/project/:projectId/location`

Set the active location for a project (DIRECTOR only).

**Request Body:**
```json
{
  "lat": 24.7136,
  "lng": 46.6753
}
```

**Response (200):**
```json
{
  "id": "project-uuid",
  "name": "Film Production Alpha",
  "active_location": { "lat": 24.7136, "lng": 46.6753 },
  "updated_at": "2026-01-03T07:00:00Z"
}
```

---

### 2. Get Nearby Vendors

**GET** `/geo/vendors/nearby`

Find vendors within a radius from a center point.

**Query Parameters:**
- `lat` (required): Latitude
- `lng` (required): Longitude
- `radius` (optional): Radius in meters (default: 3000)

**Example:**
```
GET /geo/vendors/nearby?lat=24.7136&lng=46.6753&radius=3000
```

**Response (200):**
```json
[
  {
    "id": "vendor-uuid",
    "name": "Desert Food Truck",
    "fixed_location": { "lat": 24.7140, "lng": 46.6760 },
    "is_mobile": true,
    "distance": 89.5
  }
]
```

---

### 3. Create Daily Session

**POST** `/geo/session`

Create a daily filming session with a center point (DIRECTOR only).

**Request Body:**
```json
{
  "projectId": "project-uuid",
  "lat": 24.7136,
  "lng": 46.6753
}
```

**Response (201):**
```json
{
  "id": "session-uuid",
  "project_id": "project-uuid",
  "center_point": { "lat": 24.7136, "lng": 46.6753 },
  "status": "OPEN",
  "created_at": "2026-01-03T06:00:00Z"
}
```

---

### 4. Get Session Vendors

**GET** `/geo/session/:sessionId/vendors`

Get vendors within range of a session's center point.

**Query Parameters:**
- `radius` (optional): Radius in meters (default: 3000)

**Response (200):**
```json
[
  {
    "id": "vendor-uuid",
    "name": "Desert Food Truck",
    "distance": 89.5
  }
]
```

---

## Vendor Endpoints

### 1. Create Vendor

**POST** `/vendors`

Create a new vendor (DIRECTOR only).

**Request Body:**
```json
{
  "name": "Desert Food Truck",
  "lat": 24.7140,
  "lng": 46.6760,
  "is_mobile": true
}
```

**Response (201):**
```json
{
  "id": "vendor-uuid",
  "name": "Desert Food Truck",
  "fixed_location": { "lat": 24.7140, "lng": 46.6760 },
  "is_mobile": true,
  "created_at": "2026-01-03T06:00:00Z"
}
```

---

### 2. List Vendors

**GET** `/vendors`

Get all vendors with their menu items.

**Response (200):**
```json
[
  {
    "id": "vendor-uuid",
    "name": "Desert Food Truck",
    "fixed_location": { "lat": 24.7140, "lng": 46.6760 },
    "is_mobile": true,
    "menu_items": [
      {
        "id": "item-uuid",
        "name": "Shawarma Wrap",
        "price": "25.00",
        "available": true
      }
    ]
  }
]
```

---

### 3. Get Vendor Details

**GET** `/vendors/:id`

Get details of a specific vendor.

**Response (200):**
```json
{
  "id": "vendor-uuid",
  "name": "Desert Food Truck",
  "fixed_location": { "lat": 24.7140, "lng": 46.6760 },
  "is_mobile": true,
  "menu_items": [...]
}
```

---

### 4. Get Vendor Menu

**GET** `/vendors/:id/menu`

Get menu items for a vendor. **CREW role will not see prices.**

**Response (200) - DIRECTOR/RUNNER:**
```json
[
  {
    "id": "item-uuid",
    "name": "Shawarma Wrap",
    "description": "Chicken shawarma with garlic sauce",
    "price": "25.00",
    "available": true
  }
]
```

**Response (200) - CREW:**
```json
[
  {
    "id": "item-uuid",
    "name": "Shawarma Wrap",
    "description": "Chicken shawarma with garlic sauce",
    "available": true
  }
]
```

---

### 5. Add Menu Item

**POST** `/vendors/:id/menu`

Add a menu item to a vendor (DIRECTOR only).

**Request Body:**
```json
{
  "name": "Falafel Plate",
  "description": "Fresh falafel with tahini",
  "price": 20.00,
  "available": true
}
```

**Response (201):**
```json
{
  "id": "item-uuid",
  "vendor_id": "vendor-uuid",
  "name": "Falafel Plate",
  "description": "Fresh falafel with tahini",
  "price": "20.00",
  "available": true
}
```

---

### 6. Update Vendor

**PATCH** `/vendors/:id`

Update vendor details (DIRECTOR only).

**Request Body:**
```json
{
  "name": "Updated Vendor Name",
  "lat": 24.7150,
  "lng": 46.6770
}
```

---

### 7. Delete Vendor

**DELETE** `/vendors/:id`

Delete a vendor (DIRECTOR only).

**Response (200):**
```json
{
  "message": "Vendor deleted successfully"
}
```

---

## Order Endpoints

### 1. Create Order

**POST** `/orders`

Create a new order (CREW or DIRECTOR).

**Request Body:**
```json
{
  "sessionId": "session-uuid",
  "userHash": "user-device-hash",
  "items": [
    {
      "menuItemId": "item-uuid",
      "quantity": 2
    }
  ]
}
```

**Response (201):**
```json
{
  "id": "order-uuid",
  "session_id": "session-uuid",
  "user_hash": "user-device-hash",
  "items": [
    {
      "menuItemId": "item-uuid",
      "quantity": 2,
      "name": "Shawarma Wrap",
      "price": "25.00"
    }
  ],
  "cost_internal": "50.00",
  "status": "pending",
  "created_at": "2026-01-03T07:00:00Z"
}
```

---

### 2. List All Orders

**GET** `/orders`

Get all orders (DIRECTOR or RUNNER).

**Response (200):**
```json
[
  {
    "id": "order-uuid",
    "session_id": "session-uuid",
    "user_hash": "user-hash",
    "items": [...],
    "cost_internal": "50.00",
    "status": "pending",
    "created_at": "2026-01-03T07:00:00Z"
  }
]
```

---

### 3. Get Session Orders

**GET** `/orders/session/:sessionId`

Get all orders for a specific session (DIRECTOR or RUNNER).

**Response (200):**
```json
[
  {
    "id": "order-uuid",
    "user_hash": "user-hash",
    "items": [...],
    "status": "pending"
  }
]
```

---

### 4. Get My Orders

**GET** `/orders/my-orders`

Get orders for the current user (CREW).

**Response (200):**
```json
[
  {
    "id": "order-uuid",
    "session_id": "session-uuid",
    "items": [...],
    "status": "pending",
    "created_at": "2026-01-03T07:00:00Z"
  }
]
```

---

### 5. Get Order Details

**GET** `/orders/:id`

Get details of a specific order.

**Response (200):**
```json
{
  "id": "order-uuid",
  "session_id": "session-uuid",
  "user_hash": "user-hash",
  "items": [...],
  "cost_internal": "50.00",
  "status": "pending",
  "session": {
    "id": "session-uuid",
    "center_point": { "lat": 24.7136, "lng": 46.6753 }
  }
}
```

---

### 6. Update Order Status

**PATCH** `/orders/:id/status`

Update the status of an order (DIRECTOR or RUNNER).

**Request Body:**
```json
{
  "status": "in-progress"
}
```

**Response (200):**
```json
{
  "id": "order-uuid",
  "status": "in-progress",
  "updated_at": "2026-01-03T07:30:00Z"
}
```

---

### 7. Batch Orders by Vendor

**POST** `/orders/session/:sessionId/batch`

Group pending orders by vendor for efficient delivery (DIRECTOR or RUNNER).

**Response (200):**
```json
[
  {
    "vendorId": "vendor-uuid",
    "vendorName": "Desert Food Truck",
    "orders": [
      {
        "orderId": "order-uuid-1",
        "userHash": "user-hash-1",
        "items": [...]
      }
    ],
    "totalItems": 5
  }
]
```

---

### 8. Lock Session

**POST** `/orders/session/:sessionId/lock`

Lock a session to prevent new orders (DIRECTOR only).

**Response (200):**
```json
{
  "id": "session-uuid",
  "status": "LOCKED",
  "updated_at": "2026-01-03T07:45:00Z"
}
```

---

## WebSocket Events

Base URL: `ws://localhost:3000` (Socket.IO)

### Client → Server Events

#### 1. runner:register
Register a runner for task assignments.

**Payload:**
```json
{
  "runnerId": "runner-unique-id"
}
```

---

#### 2. runner:location
Broadcast runner's current location.

**Payload:**
```json
{
  "runnerId": "runner-unique-id",
  "lat": 24.7136,
  "lng": 46.6753,
  "timestamp": 1704268800000
}
```

---

#### 3. director:subscribe
Subscribe to updates for a specific session.

**Payload:**
```json
{
  "sessionId": "session-uuid"
}
```

**Response:**
```json
{
  "locations": [
    {
      "runnerId": "runner-id",
      "lat": 24.7136,
      "lng": 46.6753,
      "timestamp": 1704268800000
    }
  ]
}
```

---

#### 4. order:status
Update order status.

**Payload:**
```json
{
  "orderId": "order-uuid",
  "status": "in-progress"
}
```

---

### Server → Client Events

#### 1. location:update
Broadcast when a runner's location updates.

**Payload:**
```json
{
  "runnerId": "runner-id",
  "lat": 24.7136,
  "lng": 46.6753,
  "timestamp": 1704268800000
}
```

---

#### 2. order:update
Broadcast when an order status changes.

**Payload:**
```json
{
  "orderId": "order-uuid",
  "status": "completed",
  "timestamp": 1704268800000
}
```

---

#### 3. task:new
Send a new task to a specific runner.

**Payload:**
```json
{
  "id": "task-uuid",
  "vendorName": "Desert Food Truck",
  "items": 5,
  "status": "pending"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["Validation error messages"],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## Role-Based Access Control

- **DIRECTOR**: Full access to all endpoints
- **CREW**: Can view menus (without prices), create orders, view own orders
- **RUNNER**: Can view orders, update order status, batch orders, track location

---

**Last Updated:** January 3, 2026  
**API Version:** 1.0.0
