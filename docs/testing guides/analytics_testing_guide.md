# 🧪 Module 17: Analytics & Reports — Postman Testing Guide

**Base URL:** `http://localhost:5000/api/v1/analytics`

---

## 🛠 Postman Environment Setup

Add these to your environment variables:

| Variable | Value / Source |
|----------|---------------|
| `adminToken` | Access token for Super Admin or Franchise Admin |
| `customerToken` | Access token for Customer *(for negative 403 test)* |
| `operatorToken` | Access token for Operator *(for negative 403 test)* |
| `systemKey` | Set to your `SYSTEM_API_KEY` (e.g. `system_dev_secret_key`) |

---

## 👥 Role-Based Access & Scoping Matrix

| Role | Access | Scoping |
|------|:---:|---|
| `super_admin` | ✅ Full | System-wide global metrics |
| `admin` | ✅ Full | System-wide global metrics |
| `franchise_admin` | ✅ Scoped | Territory / franchise-scoped data |
| `franchise` | ✅ Scoped | Territory / franchise-scoped data |
| `operator` | ❌ Blocked | `403 Forbidden: Permission denied` |
| `customer` | ❌ Blocked | `403 Forbidden: Permission denied` |
| `technician` | ❌ Blocked | `403 Forbidden: Permission denied` |

---

## 📋 Testing Flow (Recommended Order)

```
1. Main Dashboard Summary Analytics     → test /dashboard GET
2. Alert Analytics & Severity Matrix    → test /alerts GET
3. Camera Status Distribution           → test /cameras GET
4. Operator Performance & Rankings      → test /operators GET
5. Revenue Analytics & Monthly Trends   → test /revenue GET
6. Subscription Growth & Plan Breakdown → test /subscriptions GET
7. Incident Resolution Statistics       → test /incidents GET
8. Franchise Performance Comparison     → test /franchises GET
9. RBAC Permission Guard Checks         → verify 403 for Customer/Operator
```

---

## 1. GET `/dashboard` — Main Dashboard Summary Analytics

> 🔒 `Admin`, `Franchise Admin`, `Franchise`  
> ⚡ Permission: `analytics:read`

```
GET {{baseUrl}}/dashboard
Authorization: Bearer {{adminToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "totalUsers": 128,
    "totalCameras": 42,
    "activeIncidents": 3,
    "totalRevenue": 145000,
    "generatedAt": "2026-08-21T23:30:00.000Z"
  }
}
```

---

## 2. GET `/alerts` — Alert Analytics & Breakdown

> 🔒 `Admin`, `Franchise Admin`, `Franchise`  
> ⚡ Permission: `analytics:read`

```
GET {{baseUrl}}/alerts
Authorization: Bearer {{adminToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "byStatus": {
      "new": 5,
      "acknowledged": 2,
      "escalated": 1,
      "resolved": 84
    },
    "byPriority": {
      "low": 20,
      "medium": 45,
      "high": 24,
      "critical": 3
    },
    "byType": {
      "motion": 52,
      "intrusion": 18,
      "line_crossing": 12,
      "tamper": 10
    },
    "total": 92
  }
}
```

---

## 3. GET `/cameras` — Camera Status Distribution

> 🔒 `Admin`, `Franchise Admin`, `Franchise`  
> ⚡ Permission: `analytics:read`

```
GET {{baseUrl}}/cameras
Authorization: Bearer {{adminToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "total": 42,
    "online": 38,
    "offline": 3,
    "maintenance": 1,
    "uptimePercentage": "90.48%"
  }
}
```

---

## 4. GET `/operators` — Operator Performance & Rankings

> 🔒 `Admin`, `Franchise Admin`, `Franchise`  
> ⚡ Permission: `analytics:read`

```
GET {{baseUrl}}/operators
Authorization: Bearer {{adminToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "operators": [
      {
        "operatorId": "668op123...",
        "name": "John Operator",
        "shiftsCount": 22,
        "totalDurationMs": 285120000,
        "incidentsResolved": 14,
        "sosAcknowledged": 4,
        "avgResolutionMinutes": 8.5
      }
    ],
    "count": 1
  }
}
```

---

## 5. GET `/revenue` — Revenue Analytics & Monthly Trends

> 🔒 `Admin`, `Franchise Admin`, `Franchise`  
> ⚡ Permission: `analytics:read`

```
GET {{baseUrl}}/revenue
Authorization: Bearer {{adminToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "monthly": [
      { "month": "2026-06", "revenue": 45000 },
      { "month": "2026-07", "revenue": 48000 },
      { "month": "2026-08", "revenue": 52000 }
    ],
    "totalRevenue": 145000,
    "currency": "INR"
  }
}
```

---

## 6. GET `/subscriptions` — Subscription Growth & Plan Breakdown

> 🔒 `Admin`, `Franchise Admin`, `Franchise`  
> ⚡ Permission: `analytics:read`

```
GET {{baseUrl}}/subscriptions
Authorization: Bearer {{adminToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "byPlan": [
      { "planName": "Basic 2-Camera", "activeCount": 18 },
      { "planName": "Pro 4-Camera", "activeCount": 24 },
      { "planName": "Enterprise 8-Camera", "activeCount": 6 }
    ],
    "byStatus": {
      "active": 48,
      "pending_payment": 2,
      "canceled": 4,
      "expired": 3
    },
    "totalActive": 48
  }
}
```

---

## 7. GET `/incidents` — Incident Resolution Statistics

> 🔒 `Admin`, `Franchise Admin`, `Franchise`  
> ⚡ Permission: `analytics:read`

```
GET {{baseUrl}}/incidents
Authorization: Bearer {{adminToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "byType": {
      "theft": 4,
      "vandalism": 2,
      "safety": 6,
      "maintenance": 12,
      "other": 3
    },
    "byStatus": {
      "open": 1,
      "investigating": 2,
      "resolved": 18,
      "closed": 6
    },
    "bySeverity": {
      "low": 10,
      "medium": 12,
      "high": 4,
      "critical": 1
    },
    "total": 27
  }
}
```

---

## 8. GET `/franchises` — Franchise Performance Comparison

> 🔒 `Admin`, `Franchise Admin`, `Franchise`  
> ⚡ Permission: `analytics:read`

```
GET {{baseUrl}}/franchises
Authorization: Bearer {{adminToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "franchises": [
      {
        "franchiseId": "66901fran123...",
        "name": "Acme Security — Mumbai West",
        "customerCount": 28,
        "cameraCount": 84,
        "monthlyRevenue": 84000
      }
    ],
    "count": 1
  }
}
```

---

## 9. ❌ RBAC Negative Tests

| Scenario | Request | Token | Expected |
|----------|---------|-------|----------|
| Customer attempts to access `/analytics/dashboard` | `GET /analytics/dashboard` | `{{customerToken}}` | `403` — "Permission denied. Required: analytics:read" |
| Operator attempts to access `/analytics/revenue` | `GET /analytics/revenue` | `{{operatorToken}}` | `403` — "Permission denied. Required: analytics:read" |
| Unauthenticated request | `GET /analytics/dashboard` | None | `401` — "Access token required" |
