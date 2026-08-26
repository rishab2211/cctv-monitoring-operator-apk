# 🧪 Module 18: Audit & Activity Logs — Postman Testing Guide

**Base URLs:**
- **Audit Logs:** `http://localhost:5000/api/v1/audit-logs` *(System & administrative mutations)*
- **Activity Logs:** `http://localhost:5000/api/v1/activity-logs` *(User actions, logins, streaming)*

---

## 🛠 Postman Environment Setup

Add these to your environment variables:

| Variable | Value / Source |
|----------|---------------|
| `adminToken` | Access token for Super Admin or System Admin |
| `auditLogId` | Set from `GET /audit-logs` response |
| `userId` | User ID to query specific user activity logs |
| `systemKey` | Set to your `SYSTEM_API_KEY` (e.g. `system_dev_secret_key`) |

---

## 👥 Role-Based Access & Scoping Matrix

| Role | Access | Notes |
|------|:---:|---|
| `super_admin` | ✅ Full | System-wide audit and activity logs |
| `admin` | ✅ Full | System-wide audit and activity logs |
| `franchise_admin` | ❌ Blocked | `403 Forbidden` (System audit is admin-only) |
| `franchise` | ❌ Blocked | `403 Forbidden` |
| `operator` | ❌ Blocked | `403 Forbidden` |
| `customer` | ❌ Blocked | `403 Forbidden` |
| `technician` | ❌ Blocked | `403 Forbidden` |

---

## 📋 Testing Flow (Recommended Order)

```
1. List System Audit Logs           → test /audit-logs GET
2. Get Audit Log Entry Details      → test /audit-logs/:id GET
3. List Global Activity Logs        → test /activity-logs GET
4. List Single User Activity Logs   → test /activity-logs/user/:userId GET
5. RBAC Negative Permission Checks  → verify 403 Forbidden for non-admins
```

---

# Part A: Audit Logs (`/api/v1/audit-logs`)

Audit logs record high-privilege operations: role assignments, camera decommissionings, configuration changes, user suspensions, and permission mutations.

## 1. GET `/audit-logs` — List Audit Logs

> 🔒 `Super Admin`, `Admin`  
> ⚡ Permission: `audit:read`

```
GET {{baseUrl}}/audit-logs?page=1&limit=20&action=USER_UPDATED
Authorization: Bearer {{adminToken}}
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `action` (string, optional — e.g. `ROLE_ASSIGNED`, `CAMERA_DELETED`, `USER_SUSPENDED`)

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "logs": [
      {
        "_id": "66901aud123...",
        "action": "ROLE_ASSIGNED",
        "actor": {
          "_id": "668admin123...",
          "name": "Super Admin",
          "email": "superadmin@cctvmonitor.com"
        },
        "resource": "users",
        "resourceId": "668op123...",
        "details": {
          "previousRole": "customer",
          "newRole": "operator"
        },
        "ipAddress": "127.0.0.1",
        "userAgent": "PostmanRuntime/7.39.0",
        "createdAt": "2026-08-21T23:45:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

**Tests tab:**
```javascript
const res = pm.response.json();
if (res.data.logs.length > 0) {
  pm.environment.set("auditLogId", res.data.logs[0]._id);
}
```

---

## 2. GET `/audit-logs/:id` — Get Audit Log Details

> 🔒 `Super Admin`, `Admin`  
> ⚡ Permission: `audit:read`

```
GET {{baseUrl}}/audit-logs/{{auditLogId}}
Authorization: Bearer {{adminToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "log": {
      "_id": "{{auditLogId}}",
      "action": "ROLE_ASSIGNED",
      "actor": {
        "_id": "668admin123...",
        "name": "Super Admin",
        "email": "superadmin@cctvmonitor.com"
      },
      "resource": "users",
      "resourceId": "668op123...",
      "details": {
        "previousRole": "customer",
        "newRole": "operator"
      },
      "ipAddress": "127.0.0.1",
      "userAgent": "PostmanRuntime/7.39.0",
      "createdAt": "2026-08-21T23:45:00.000Z"
    }
  }
}
```

---

# Part B: Activity Logs (`/api/v1/activity-logs`)

Activity logs track day-to-day user lifecycle and operational actions: logins, stream start/stop, alert resolution, password changes, etc.

## 3. GET `/activity-logs` — List System-Wide Activity Logs

> 🔒 `Super Admin`, `Admin`  
> ⚡ Permission: `audit:read`

```
GET {{baseUrl}}/activity-logs?page=1&limit=20&action=USER_LOGIN
Authorization: Bearer {{adminToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "logs": [
      {
        "_id": "66901act123...",
        "userId": {
          "_id": "668op123...",
          "name": "John Operator",
          "email": "johnop@cctvmonitor.com"
        },
        "action": "USER_LOGIN",
        "description": "User logged in successfully",
        "ipAddress": "192.168.1.100",
        "createdAt": "2026-08-21T23:50:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

---

## 4. GET `/activity-logs/user/:userId` — List Single User Activity Logs

> 🔒 `Super Admin`, `Admin`  
> ⚡ Permission: `audit:read`

```
GET {{baseUrl}}/activity-logs/user/{{userId}}?page=1&limit=20
Authorization: Bearer {{adminToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "logs": [
      {
        "_id": "66901act234...",
        "userId": "{{userId}}",
        "action": "STREAM_STARTED",
        "description": "Started live WebRTC stream session for camera Front Gate Camera",
        "createdAt": "2026-08-21T23:52:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

---

## 5. ❌ RBAC Negative Tests

| Scenario | Request | Token | Expected |
|----------|---------|-------|----------|
| Operator attempts to read audit logs | `GET /audit-logs` | `{{operatorToken}}` | `403` — "Permission denied. Required: audit:read" |
| Customer attempts to read activity logs | `GET /activity-logs` | `{{customerToken}}` | `403` — "Permission denied. Required: audit:read" |
| Franchise Admin attempts to read audit logs | `GET /audit-logs` | `{{franchiseAdminToken}}` | `403` — "Permission denied. Required: audit:read" |
