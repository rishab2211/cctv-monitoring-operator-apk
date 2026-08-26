# 🧪 Module 2: User Management — Postman Testing Guide

**Base URL:** `http://localhost:5000/api/v1`

## Postman Setup

Before testing, set up a Postman Environment with these variables:

| Variable | Initial Value | Set After |
|----------|--------------|-----------|
| `baseUrl` | `http://localhost:5000/api/v1` | — |
| `accessToken` | *(empty)* | Login / Register |
| `userId` | *(empty)* | Create User |
| `customerId` | *(empty)* | Create Customer |
| `sessionId` | *(empty)* | Get Sessions |

**Auto-capture token** — Add this to the **Tests** tab of your Login request:
```javascript
const res = pm.response.json();
if (res.data?.tokens?.accessToken) {
    pm.environment.set("accessToken", res.data.tokens.accessToken);
}
```

**Authorization** — For all protected requests, set:
- Type: `Bearer Token`
- Token: `{{accessToken}}`
- *(Optional: For administrative actions without login, send header `x-system-key: <SYSTEM_API_KEY>`)*

---

## 📋 Testing Flow (Recommended Order)

```
1. Login as super_admin         → get accessToken
2. Create Admin                 → test /admins POST
2a. Create Franchise Admin      → test /franchise-admins POST
3. Create Operator              → test /operators POST
4. Create Technician            → test /technicians POST
5. Create Customer (Admin)      → test /customers POST
6. List All Users               → test /users GET with filters
7. Get User by ID               → test /users/:id GET
8. Update User                  → test /users/:id PUT
9. Toggle Status (deactivate)   → test /users/:id/status PATCH
10. Get User Activity           → test /users/:id/activity GET
11. Update Own Profile          → test /users/profile PUT
12. Upload Avatar (Cloudinary)  → test /users/profile/avatar PUT (multipart/form-data)
13. List Admins                 → test /admins GET
14. List Franchise Admins       → test /franchise-admins GET
15. List Operators              → test /operators GET
16. List Technicians            → test /technicians GET
17. List Customers (Admin)      → test /customers GET
18. Get Customer Details        → test /customers/:id GET
19. Delete User                 → test /users/:id DELETE (soft delete)
```

---

## 1. POST `/auth/login` *(prerequisite — get super_admin token)*

```
POST {{baseUrl}}/auth/login
Content-Type: application/json
```

**Body:**
```json
{
  "email": "admin@cctvmonitor.com",
  "password": "Admin@1234"
}
```

**Tests tab (auto-save token):**
```javascript
const res = pm.response.json();
pm.environment.set("accessToken", res.data.tokens.accessToken);
pm.environment.set("currentUserId", res.data.user._id);
```

---

## 2. POST `/admins` — Create Admin

> 🔒 `super_admin` only

```
POST {{baseUrl}}/admins
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "City Admin",
  "email": "cityadmin@cctvmonitor.com",
  "phone": "9111111111",
  "password": "Admin@5678",
  "role": "admin"
}
```

**Response `201`:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "User created successfully",
  "data": {
    "user": {
      "_id": "668abc...",
      "name": "City Admin",
      "email": "cityadmin@cctvmonitor.com",
      "phone": "9111111111",
      "role": "admin",
      "isActive": true,
      "isDeleted": false,
      "deletedAt": null,
      "avatar": null,
      "address": null,
      "createdAt": "2026-08-21T09:00:00.000Z",
      "updatedAt": "2026-08-21T09:00:00.000Z"
    }
  }
}
```

**Tests tab:**
```javascript
const res = pm.response.json();
pm.environment.set("adminId", res.data.user._id);
```

### ❌ Edge Cases

| Scenario | Body change | Expected |
|----------|-------------|----------|
| Duplicate email | Same email as existing user | `409` — "An account with this email already exists" |
| Duplicate phone | Same phone as existing user | `409` — "An account with this phone number already exists" |
| Weak password | `"password": "weak"` | `400` — password complexity errors |
| Missing name | Omit `name` field | `400` — "Required" |
| Invalid phone | `"phone": "1234567890"` | `400` — "valid 10-digit Indian phone number" |
| Called by non-super_admin | Use admin token | `403` — "Insufficient permissions" |

---

## 2a. POST `/franchise-admins` — Create Franchise Admin

> 🔒 `super_admin`, `admin`, `franchise`

```
POST {{baseUrl}}/franchise-admins
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Jane Franchise Admin",
  "email": "jane@franchisecctv.com",
  "phone": "9999999999",
  "password": "Admin@1234",
  "role": "franchise_admin"
}
```
*(If created by a `super_admin`, you can optionally pass `franchiseDetails: { franchiseRef: "franchise_id_here" }` to bind them to a specific franchise. If created by a `franchise` token, they are automatically bound to the creator's franchise).*

**Tests tab:**
```javascript
const res = pm.response.json();
pm.environment.set("franchiseAdminId", res.data.user._id);
```

---

## 3. POST `/operators` — Create Operator

> 🔒 `super_admin`, `admin`, `franchise`, `franchise_admin`

```
POST {{baseUrl}}/operators
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (minimal, if created by franchise_admin):**
```json
{
  "name": "John Operator",
  "email": "johnop@cctvmonitor.com",
  "phone": "9222222222",
  "password": "Operator@1234",
  "role": "operator"
}
```

**Body (if created by super_admin/admin):**
```json
{
  "name": "John Operator",
  "email": "johnop@cctvmonitor.com",
  "phone": "9222222222",
  "password": "Operator@1234",
  "role": "operator",
  "operatorDetails": {
    "shiftStart": "09:00",
    "shiftEnd": "21:00",
    "assignedFranchise": "669xyz456abc789012345678"
  }
}
```

> 💡 **Franchise Binding Validation:** If a global `super_admin` or `admin` creates an operator, they **must** explicitly pass `operatorDetails.assignedFranchise` in the body. If a `franchise_admin` creates the operator, the backend automatically extracts and injects the `franchiseId` from their token, making the field optional in the body.

**Tests tab:**
```javascript
const res = pm.response.json();
pm.environment.set("operatorId", res.data.user._id);
```

---

## 4. POST `/technicians` — Create Technician

> 🔒 `super_admin`, `admin`, `franchise`, `franchise_admin`

```
POST {{baseUrl}}/technicians
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Tech Sara",
  "email": "sara@cctvmonitor.com",
  "phone": "9333333333",
  "password": "Tech@1234",
  "role": "technician",
  "technicianDetails": {
    "skills": ["CCTV Installation", "Network Setup"],
    "certifications": ["CCTV Pro Cert 2024"],
    "assignedFranchise": "669xyz456abc789012345678"
  }
}
```

**Tests tab:**
```javascript
const res = pm.response.json();
pm.environment.set("technicianId", res.data.user._id);
```

---

## 5. POST `/customers` — Create Customer (Admin Route)

> 🔒 `super_admin`, `admin`, `franchise`, `franchise_admin`  
> *(Note: For customer self-registration, use `POST /api/v1/auth/register`)*

```
POST {{baseUrl}}/customers
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Ramesh Kumar",
  "email": "ramesh@example.com",
  "phone": "9444444444",
  "password": "Customer@1234",
  "role": "customer",
  "address": {
    "street": "12 Main Road",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "customerDetails": {
    "assignedFranchise": "669xyz456abc789012345678",
    "emergencyContact": {
      "name": "Priya Kumar",
      "phone": "9444444445",
      "relation": "Spouse"
    }
  }
}
```

**Tests tab:**
```javascript
const res = pm.response.json();
pm.environment.set("customerId", res.data.user._id);
```

---

## 6. GET `/users` — List All Users (with filters)

> 🔒 `super_admin`, `admin`

```
GET {{baseUrl}}/users?page=1&limit=10&role=operator&isActive=true&search=John
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "data": [
      {
        "_id": "668abc...",
        "name": "John Operator",
        "email": "johnop@cctvmonitor.com",
        "role": "operator",
        "isActive": true,
        "isDeleted": false,
        "createdAt": "2026-08-21T09:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

---

## 7. GET `/users/:id` — Get User by ID

> 🔒 `super_admin`, `admin`, `franchise`, `franchise_admin`

```
GET {{baseUrl}}/users/{{operatorId}}
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "user": {
      "_id": "668abc...",
      "name": "John Operator",
      "email": "johnop@cctvmonitor.com",
      "phone": "9222222222",
      "role": "operator",
      "isActive": true,
      "isDeleted": false,
      "operatorDetails": {
        "shiftStart": "09:00",
        "shiftEnd": "21:00",
        "isOnShift": false
      },
      "createdAt": "2026-08-21T09:00:00.000Z"
    }
  }
}
```

---

## 8. PUT `/users/:id` — Update User

> 🔒 `super_admin`, `admin`, `franchise`, `franchise_admin`

```
PUT {{baseUrl}}/users/{{operatorId}}
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "John Updated",
  "address": {
    "street": "45 New Street",
    "city": "Delhi",
    "state": "Delhi",
    "pincode": "110001"
  }
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User updated successfully",
  "data": {
    "user": { ... }
  }
}
```

---

## 9. PATCH `/users/:id/status` — Toggle Active Status

> 🔒 `super_admin`, `admin`, `franchise`, `franchise_admin`

### Deactivate User
```
PATCH {{baseUrl}}/users/{{operatorId}}/status
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "isActive": false,
  "reason": "Violated code of conduct"
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User deactivated successfully",
  "data": {
    "user": {
      "isActive": false,
      ...
    }
  }
}
```

---

## 10. GET `/users/:id/activity` — User Activity Log

> 🔒 `super_admin`, `admin`

```
GET {{baseUrl}}/users/{{operatorId}}/activity?page=1&limit=10
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "data": [
      {
        "_id": "668abc...",
        "userId": "668abc...",
        "action": "USER_CREATED",
        "description": "Account created by admin",
        "createdAt": "2026-08-21T09:00:00.000Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

## 11. PUT `/users/profile` — Update Own Profile

> 🔒 Any authenticated user

```
PUT {{baseUrl}}/users/profile
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Super Admin Updated",
  "phone": "9876543211",
  "address": {
    "street": "HQ Office, 1st Floor",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001"
  }
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile updated successfully",
  "data": {
    "user": { ... }
  }
}
```

---

## 12. PUT `/users/profile/avatar` — Upload Profile Avatar

> 🔒 Any authenticated user  
> **Content-Type:** `multipart/form-data` (file field: `avatar`)

```
PUT {{baseUrl}}/users/profile/avatar
Authorization: Bearer {{accessToken}}
```

**Form-Data:**
- `avatar`: [Select image file: `.jpg`, `.jpeg`, `.png`, `.webp`]

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Avatar updated successfully",
  "data": {
    "user": {
      "_id": "668abc...",
      "name": "Super Admin Updated",
      "email": "admin@cctvmonitor.com",
      "avatar": "https://res.cloudinary.com/cloud-name/image/upload/c_fill,h_300,w_300/v1234567890/cctv_avatars/668abc.jpg",
      "updatedAt": "2026-08-21T09:15:00.000Z"
    }
  }
}
```

> 🖼️ **Cloudinary CDN Integration:** Automatically transforms and crops the image to a square 300×300 thumbnail. If Cloudinary credentials are unset, the system gracefully saves the file to local disk (`/uploads`) and serves the relative path.

---

## 13. Role User List Endpoints

### 13a. GET `/admins` — List Admins
> 🔒 `super_admin` only
```
GET {{baseUrl}}/admins?page=1&limit=10
Authorization: Bearer {{accessToken}}
```

### 13b. GET `/franchise-admins` — List Franchise Admins
> 🔒 `super_admin`, `admin`, `franchise`
```
GET {{baseUrl}}/franchise-admins?page=1&limit=10
Authorization: Bearer {{accessToken}}
```

### 13c. GET `/operators` — List Operators
> 🔒 `super_admin`, `admin`, `franchise`, `franchise_admin`
```
GET {{baseUrl}}/operators?isActive=true
Authorization: Bearer {{accessToken}}
```

### 13d. GET `/technicians` — List Technicians
> 🔒 `super_admin`, `admin`, `franchise`, `franchise_admin`
```
GET {{baseUrl}}/technicians?search=Sara
Authorization: Bearer {{accessToken}}
```

### 13e. GET `/customers` — List Customers (Admin Route)
> 🔒 `super_admin`, `admin`, `franchise`, `franchise_admin`
```
GET {{baseUrl}}/customers?sortBy=name&sortOrder=asc
Authorization: Bearer {{accessToken}}
```

### 13f. GET `/customers/:id` — Get Customer Details
> 🔒 `super_admin`, `admin`, `franchise`, `franchise_admin`, `operator`
```
GET {{baseUrl}}/customers/{{customerId}}
Authorization: Bearer {{accessToken}}
```

---

## 14. DELETE `/users/:id` — Soft Delete User

> 🔒 `super_admin` only

```
DELETE {{baseUrl}}/users/{{operatorId}}
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User deleted successfully",
  "data": null
}
```

**Side effects:**
- Sets `isDeleted: true`, `deletedAt: <now>`, `isActive: false`
- All refresh tokens and active device sessions are revoked immediately
- User can no longer log in and is excluded from all user lists

---

## HTTP Status Code Reference

| Code | When |
|------|------|
| `200` | Successful read/update/delete |
| `201` | Successful user creation |
| `400` | Validation failure (invalid types, missing fields, format errors) |
| `401` | Missing/expired/invalid JWT |
| `403` | Wrong role, deactivated account, unauthorized operation |
| `404` | User not found or soft-deleted |
| `409` | Duplicate email or phone |
| `429` | Rate limit exceeded |
