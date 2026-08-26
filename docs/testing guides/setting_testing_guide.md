# 🧪 Module 20: System Settings — Postman Testing Guide

**Base URL:** `http://localhost:5000/api/v1/settings`

---

## 🛠 Postman Environment Setup

Add these to your environment variables:

| Variable | Value / Source |
|----------|---------------|
| `superAdminToken` | Access token for Super Admin *(Required for PUT updates)* |
| `adminToken` | Access token for System Admin *(Permitted for GET read)* |
| `operatorToken` | Access token for Operator *(For negative 403 test)* |
| `systemKey` | Set to your `SYSTEM_API_KEY` (e.g. `system_dev_secret_key`) |

---

## 👥 Role & Permission Hierarchy

| Endpoint / Operation | Permission Required | Allowed Roles |
|----------------------|:---:|---|
| Read Settings (`GET`) | `settings:read` | `super_admin`, `admin` |
| Mutate Settings (`PUT`) | `settings:write` | `super_admin` only |
| Non-admin Access | — | `403 Forbidden: Permission denied` |

---

## 📋 Testing Flow (Recommended Order)

```
1. Get Global Platform Settings           → test / GET
2. Update Global Platform Settings        → test / PUT (Super Admin)
3. Get System Notification Settings       → test /notifications GET
4. Update System Notification Settings    → test /notifications PUT (Super Admin)
5. Get System Recording Settings          → test /recording GET
6. Update System Recording Settings       → test /recording PUT (Super Admin)
7. RBAC Negative Tests                    → verify 403 for Admin on PUT and Operator on GET
```

---

## 1. GET `/` — Get Global System Settings

> 🔒 `Super Admin`, `Admin`  
> ⚡ Permission: `settings:read`

```
GET {{baseUrl}}
Authorization: Bearer {{adminToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "settings": {
      "maintenanceMode": false,
      "defaultLanguage": "en",
      "timezone": "Asia/Kolkata",
      "maxLoginAttempts": 5,
      "sessionTimeoutMinutes": 1440,
      "updatedAt": "2026-08-21T12:00:00.000Z"
    }
  }
}
```

---

## 2. PUT `/` — Update Global System Settings

> 🔒 `Super Admin` only  
> ⚡ Permission: `settings:write`

```
PUT {{baseUrl}}
Authorization: Bearer {{superAdminToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "maintenanceMode": false,
  "defaultLanguage": "en",
  "timezone": "Asia/Kolkata",
  "maxLoginAttempts": 5,
  "sessionTimeoutMinutes": 1440
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "System settings updated successfully",
  "data": {
    "settings": {
      "maintenanceMode": false,
      "defaultLanguage": "en",
      "timezone": "Asia/Kolkata",
      "maxLoginAttempts": 5,
      "sessionTimeoutMinutes": 1440,
      "updatedAt": "2026-08-22T01:00:00.000Z"
    }
  }
}
```

---

## 3. GET `/notifications` — Get Notification Settings

> 🔒 `Super Admin`, `Admin`  
> ⚡ Permission: `settings:read`

```
GET {{baseUrl}}/notifications
Authorization: Bearer {{adminToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "settings": {
      "emailEnabled": true,
      "smsEnabled": false,
      "pushEnabled": true,
      "alertThresholds": {
        "critical": "immediate",
        "high": "immediate",
        "warning": "batched_hourly"
      }
    }
  }
}
```

---

## 4. PUT `/notifications` — Update Notification Settings

> 🔒 `Super Admin` only  
> ⚡ Permission: `settings:write`

```
PUT {{baseUrl}}/notifications
Authorization: Bearer {{superAdminToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "emailEnabled": true,
  "smsEnabled": true,
  "pushEnabled": true,
  "alertThresholds": {
    "critical": "immediate",
    "high": "immediate",
    "warning": "batched_hourly"
  }
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Notification settings updated successfully",
  "data": {
    "settings": {
      "emailEnabled": true,
      "smsEnabled": true,
      "pushEnabled": true,
      "alertThresholds": {
        "critical": "immediate",
        "high": "immediate",
        "warning": "batched_hourly"
      }
    }
  }
}
```

---

## 5. GET `/recording` — Get Recording Retention Settings

> 🔒 `Super Admin`, `Admin`  
> ⚡ Permission: `settings:read`

```
GET {{baseUrl}}/recording
Authorization: Bearer {{adminToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "settings": {
      "defaultRetentionDays": 30,
      "maxRetentionDays": 90,
      "defaultQuality": "1080p",
      "enableMotionOnlyRecording": true
    }
  }
}
```

---

## 6. PUT `/recording` — Update Recording Retention Settings

> 🔒 `Super Admin` only  
> ⚡ Permission: `settings:write`

```
PUT {{baseUrl}}/recording
Authorization: Bearer {{superAdminToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "defaultRetentionDays": 30,
  "maxRetentionDays": 180,
  "defaultQuality": "1080p",
  "enableMotionOnlyRecording": true
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Recording settings updated successfully",
  "data": {
    "settings": {
      "defaultRetentionDays": 30,
      "maxRetentionDays": 180,
      "defaultQuality": "1080p",
      "enableMotionOnlyRecording": true
    }
  }
}
```

---

## 7. ❌ RBAC Negative Tests

| Scenario | Request | Token | Expected |
|----------|---------|-------|----------|
| System Admin (non-super) attempts to mutate global settings | `PUT /settings` | `{{adminToken}}` | `403` — "Permission denied. Required: settings:write" |
| Operator attempts to read recording settings | `GET /settings/recording` | `{{operatorToken}}` | `403` — "Permission denied. Required: settings:read" |
| Customer attempts to read notification settings | `GET /settings/notifications` | `{{customerToken}}` | `403` — "Permission denied. Required: settings:read" |
| Unauthenticated request | `GET /settings` | None | `401` — "Access token required" |
