# 🧪 Module 3: Role & Permission Management — Postman Testing Guide

**Base URL:** `http://localhost:5000/api/v1`  
**All endpoints require `super_admin` token** (except user role assignment which also accepts `admin`)

---

## Postman Setup

Add these to your existing environment:

| Variable | Set After |
|----------|-----------|
| `roleId` | Create Role / List Roles |
| `customRoleId` | Create Role |
| `permissionId` | Create Permission |

**Authorization (all requests):**
- Type: `Bearer Token` → `{{accessToken}}`
- *(Optional: send header `x-system-key: <SYSTEM_API_KEY>` for direct super_admin context)*

---

## ✅ Step 0 — Verify Seed Ran on Server Startup

When you start `bun run dev`, check the terminal for:

```
🌱 Seeding permissions and roles...
✅ Seed complete — 33 permissions inserted, 0 updated, 7 roles inserted
```

If you restart without wiping the DB, you'll see:
```
✅ Seed complete — 0 permissions inserted, 33 updated, 0 roles inserted
```

This confirms the seeder is idempotent ✅

---

## 📋 Testing Flow (Recommended Order)

```
1. List Permissions          → verify 33 system permissions seeded
2. List Roles                → verify 7 system roles seeded
3. Get Single Role by ID     → test /roles/:id GET
4. Get Role Permissions      → inspect permissions of a role
5. Create Custom Role        → new role with subset of permissions
6. Update Role Metadata      → change displayName / description
7. Update Role Permissions   → add/replace permissions on custom role
8. Assign Role to User       → change user role (e.g. operator to franchise)
9. Remove Role from User     → revert user back to customer
10. Create Custom Permission  → add a new resource:action
11. Delete Custom Role       → cleanup custom role
12. Try to delete system role → expect 403 Forbidden
```

---

## 1. GET `/permissions` — List All Permissions

> 🔒 `super_admin` only

```
GET {{baseUrl}}/permissions
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "grouped": {
      "alerts": [
        { "name": "alerts:read",    "action": "read",    "description": "View alerts and alert history", "isSystem": true },
        { "name": "alerts:resolve", "action": "resolve", "description": "Mark alerts as resolved",       "isSystem": true },
        { "name": "alerts:write",   "action": "write",   "description": "Create and acknowledge alerts", "isSystem": true }
      ],
      "cameras": [
        { "name": "cameras:assign",    "action": "assign",    "description": "Assign cameras to customers or operators", "isSystem": true },
        { "name": "cameras:configure", "action": "configure", "description": "Change camera recording/motion/AI settings", "isSystem": true },
        { "name": "cameras:delete",    "action": "delete",    "description": "Decommission cameras",       "isSystem": true },
        { "name": "cameras:read",      "action": "read",      "description": "View camera list and details", "isSystem": true },
        { "name": "cameras:restart",   "action": "restart",   "description": "Remotely restart cameras",  "isSystem": true },
        { "name": "cameras:write",     "action": "write",     "description": "Add and update cameras",    "isSystem": true }
      ],
      "..."
    },
    "totalCount": 33
  }
}
```

**What to verify:**
- `totalCount` = `33` ✅
- All resources present: `alerts`, `audit`, `cameras`, `franchises`, `incidents`, `installations`, `notifications`, `payments`, `recordings`, `settings`, `sos`, `streams`, `talkback`, `users`
- Each permission has `isSystem: true`

---

## 2. GET `/roles` — List All Roles

> 🔒 `super_admin` only

```
GET {{baseUrl}}/roles
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "roles": [
      {
        "_id": "668abc123def456789012345",
        "name": "super_admin",
        "displayName": "Super Administrator",
        "description": "Full system access — unrestricted",
        "isSystem": true,
        "permissions": ["users:read", "users:write", "...33 total"],
        "permissionCount": 33
      },
      {
        "_id": "668def123abc456789012346",
        "name": "admin",
        "displayName": "System Administrator",
        "isSystem": true,
        "permissionCount": 30
      },
      { "name": "franchise_admin", "isSystem": true, "permissionCount": 24 },
      { "name": "franchise", "isSystem": true, "permissionCount": 12 },
      { "name": "operator",  "isSystem": true, "permissionCount": 10 },
      { "name": "customer",  "isSystem": true, "permissionCount": 6  },
      { "name": "technician","isSystem": true, "permissionCount": 4  }
    ],
    "count": 7
  }
}
```

**Tests tab (save IDs):**
```javascript
const res = pm.response.json();
const adminRole = res.data.roles.find(r => r.name === "admin");
pm.environment.set("adminRoleId", adminRole._id);
const custRole = res.data.roles.find(r => r.name === "customer");
pm.environment.set("customerRoleId", custRole._id);
```

---

## 3. GET `/roles/:id` — Get Single Role by ID

> 🔒 `super_admin` only

```
GET {{baseUrl}}/roles/{{adminRoleId}}
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Role retrieved successfully",
  "data": {
    "role": {
      "_id": "668def123abc456789012346",
      "name": "admin",
      "displayName": "System Administrator",
      "description": "Administrative access to platform operations",
      "isSystem": true,
      "permissions": [
        "alerts:read",
        "alerts:write",
        "alerts:resolve",
        "cameras:read",
        "cameras:write",
        "..."
      ],
      "createdAt": "2026-08-21T08:00:00.000Z",
      "updatedAt": "2026-08-21T08:00:00.000Z"
    }
  }
}
```

---

## 4. GET `/roles/:id/permissions` — Get Role Permissions

> 🔒 `super_admin` only

```
GET {{baseUrl}}/roles/{{adminRoleId}}/permissions
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "role": {
      "_id": "668def123abc456789012346",
      "name": "admin",
      "displayName": "System Administrator",
      "isSystem": true
    },
    "permissions": {
      "alerts": [
        { "name": "alerts:read", "action": "read", "description": "View alerts and alert history" },
        { "name": "alerts:resolve", "action": "resolve", "description": "Mark alerts as resolved" },
        { "name": "alerts:write", "action": "write", "description": "Create and acknowledge alerts" }
      ],
      "cameras": [ "..." ],
      "users": [ "..." ]
    },
    "totalCount": 30
  }
}
```

---

## 5. POST `/roles` — Create Custom Role

> 🔒 `super_admin` only

```
POST {{baseUrl}}/roles
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "viewer",
  "displayName": "Read-Only Viewer",
  "description": "Can view cameras, alerts, and recordings but cannot modify anything",
  "permissions": [
    "cameras:read",
    "alerts:read",
    "recordings:read",
    "streams:view",
    "notifications:read"
  ]
}
```

**Response `201`:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Role created successfully",
  "data": {
    "role": {
      "_id": "668xyz123abc456789012347",
      "name": "viewer",
      "displayName": "Read-Only Viewer",
      "description": "Can view cameras, alerts, and recordings but cannot modify anything",
      "isSystem": false,
      "permissions": ["cameras:read", "alerts:read", "recordings:read", "streams:view", "notifications:read"],
      "createdAt": "2026-08-21T12:00:00.000Z"
    }
  }
}
```

**Tests tab:**
```javascript
const res = pm.response.json();
pm.environment.set("customRoleId", res.data.role._id);
```

---

## 6. PUT `/roles/:id` — Update Role Metadata

> 🔒 `super_admin` only

```
PUT {{baseUrl}}/roles/{{customRoleId}}
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "displayName": "Read-Only Viewer (Updated)",
  "description": "View-only access to monitoring dashboards"
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Role updated successfully",
  "data": {
    "role": {
      "name": "viewer",
      "displayName": "Read-Only Viewer (Updated)",
      "description": "View-only access to monitoring dashboards",
      "isSystem": false
    }
  }
}
```

---

## 7. PUT `/roles/:id/permissions` — Update Role Permissions

> 🔒 `super_admin` only

### Replace Mode (`replace: true`)
```
PUT {{baseUrl}}/roles/{{customRoleId}}/permissions
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "permissions": [
    "cameras:read",
    "alerts:read",
    "alerts:write",
    "recordings:read",
    "streams:view",
    "notifications:read",
    "incidents:read"
  ],
  "replace": true
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Role permissions updated (7 total)",
  "data": {
    "role": {
      "name": "viewer",
      "permissions": ["cameras:read", "alerts:read", "alerts:write", "recordings:read", "streams:view", "notifications:read", "incidents:read"]
    }
  }
}
```

### Merge Mode (`replace: false`)
```json
{
  "permissions": ["franchises:read"],
  "replace": false
}
```

---

## 8. POST `/users/:id/roles` — Assign Role to User

> 🔒 `super_admin`, `admin`

```
POST {{baseUrl}}/users/{{operatorId}}/roles
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "role": "franchise"
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Role changed from \"operator\" to \"franchise\" successfully",
  "data": {
    "userId": "668abc...",
    "previousRole": "operator",
    "newRole": "franchise"
  }
}
```

---

## 9. DELETE `/users/:id/roles/:roleId` — Remove Role from User

> 🔒 `super_admin`, `admin`

Reverts user back to `customer`.

```
DELETE {{baseUrl}}/users/{{operatorId}}/roles/{{franchiseRoleId}}
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Role \"franchise\" removed. User reverted to \"customer\".",
  "data": {
    "userId": "668abc...",
    "previousRole": "franchise",
    "newRole": "customer"
  }
}
```

---

## 10. POST `/permissions` — Create Custom Permission

> 🔒 `super_admin` only

```
POST {{baseUrl}}/permissions
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "reports:export",
  "resource": "reports",
  "action": "export",
  "description": "Export analytics data as CSV or PDF"
}
```

**Response `201`:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Permission created successfully",
  "data": {
    "permission": {
      "_id": "668ppp123abc456789012348",
      "name": "reports:export",
      "resource": "reports",
      "action": "export",
      "description": "Export analytics data as CSV or PDF",
      "isSystem": false,
      "createdAt": "2026-08-21T12:00:00.000Z"
    }
  }
}
```

---

## 11. DELETE `/roles/:id` — Delete Custom Role

> 🔒 `super_admin` only

```
DELETE {{baseUrl}}/roles/{{customRoleId}}
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Role deleted successfully",
  "data": null
}
```

### ❌ Edge Cases

| Scenario | Expected |
|----------|----------|
| Delete a **system role** (e.g. `admin`) | `403` — "System role \"admin\" cannot be deleted. Only custom roles can be deleted." |
| Delete a role with **active users** | `400` — "Cannot delete role \"viewer\" — 2 user(s) are currently assigned to it. Reassign them first." |
| Non-existent role ID | `404` — "Role not found" |

---

## 12. All 33 System Permissions Reference

| Resource | Permissions |
|----------|-------------|
| `users` | `read`, `write`, `delete`, `manage_roles` |
| `cameras` | `read`, `write`, `delete`, `assign`, `restart`, `configure` |
| `streams` | `view` |
| `recordings` | `read`, `download`, `delete` |
| `alerts` | `read`, `write`, `resolve` |
| `sos` | `trigger`, `read` |
| `incidents` | `read`, `write` |
| `franchises` | `read`, `write` |
| `installations` | `read`, `write` |
| `analytics` | `read` |
| `audit` | `read` |
| `settings` | `read`, `write` |
| `payments` | `read`, `write` |
| `notifications` | `read` |
| `talkback` | `use` |

---

## 13. Default Role Permission Matrix (7 System Roles)

| Role | # Permissions | Highlight / Responsibilities |
|------|:---:|---|
| `super_admin` | 33 | Complete, unrestricted system-wide access |
| `admin` | 30 | Full administrative operations except `sos:trigger`, `talkback:use`, `settings:write` |
| `franchise_admin` | 24 | Complete franchise-level management (cameras, operators, technicians, incidents, jobs) |
| `franchise` | 12 | Territory franchise ownership, invoices, and high-level monitoring |
| `operator` | 10 | Live camera monitoring, alert triage, incident response, talkback |
| `customer` | 6 | Customer self-service panel, owned/shared live views & playback, SOS trigger |
| `technician` | 4 | Physical camera setup, field maintenance, installation jobs |
