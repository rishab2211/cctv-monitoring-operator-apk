# 🧪 Module 7: Alert Engine — Postman & WebSocket Testing Guide

**REST Base URL:** `http://localhost:5000/api/v1`  
**WebSocket URL:** `ws://localhost:5000`

---

## Environment Setup

Add these to your Postman environment:

| Variable | Value / Source |
|----------|---------------|
| `cameraId` | Set from `GET /cameras` |
| `alertId` | Set from `POST /alerts` or `GET /alerts` |
| `systemKey` | Set to your `SYSTEM_API_KEY` (e.g. `system_dev_secret_key`) |

**Authorization:** `Bearer {{accessToken}}` on all REST endpoints and WebSockets.  
*(Optional: send header `X-System-Key: {{systemKey}}` for system context)*

---

## 📋 Testing Flow (Recommended Order)

```
1. Create Manual Alert                → test /alerts POST
2. List All Alerts (with filters)     → test /alerts GET
3. Get Pending Alerts                 → test /alerts/pending GET
4. Get Alert Details                  → test /alerts/:id GET
5. Acknowledge Alert                  → test /alerts/:id/acknowledge PATCH
6. Escalate Alert                     → test /alerts/:id/escalate PATCH
7. Resolve Alert                      → test /alerts/:id/resolve PATCH
8. Verify Alert (True/False Alarm)    → test /alerts/:id/verify POST
9. Get Camera Alert History           → test /alerts/:cameraId/history GET
10. Configure Camera Alert Rules      → test /alerts/rules PUT
11. Get Camera Alert Rules            → test /alerts/rules/:cameraId GET
12. Get Global Alert Stats            → test /alerts/stats GET
13. WebSocket Realtime & Room Tests   → test Socket.IO events (join_camera, new_alert)
```

---

## 1. POST `/alerts` — Create Alert (Manual / AI Trigger)

> 🔒 `Admin`, `Franchise Admin`, `Operator`, `Customer`  
> ⚡ Permission: `alerts:write`

```
POST {{baseUrl}}/alerts
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "cameraId": "{{cameraId}}",
  "type": "motion",
  "priority": "high",
  "description": "Suspicious movement near the back perimeter gate"
}
```

**Response `201`:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Alert created successfully",
  "data": {
    "alert": {
      "_id": "66901xyz...",
      "cameraId": "{{cameraId}}",
      "type": "motion",
      "priority": "high",
      "status": "new",
      "description": "Suspicious movement near the back perimeter gate",
      "isVerified": false,
      "createdAt": "2026-08-21T18:00:00.000Z"
    }
  }
}
```

**Tests tab:**
```javascript
const res = pm.response.json();
pm.environment.set("alertId", res.data.alert._id);
```

### ❌ Edge Cases
| Scenario | Expected |
|----------|----------|
| Invalid Camera ID format | `400` — Zod validation error |
| Operator creating alert for non-assigned camera | `403` — "You do not have access to this camera" |
| Invalid alert type enum (`"alien"`) | `400` — Validation failure |

---

## 2. GET `/alerts` — List All Alerts (Filtered & Paginated)

> 🔒 `Admin`, `Franchise Admin`, `Operator`, `Customer`  
> ⚡ Permission: `alerts:read`

```
GET {{baseUrl}}/alerts?page=1&limit=10&status=new&priority=high&type=motion
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "alerts": [ ... ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

## 3. GET `/alerts/pending` — List Pending Alerts

> 🔒 `Admin`, `Franchise Admin`, `Operator`, `Customer`  
> ⚡ Permission: `alerts:read`

Returns all `new` and `acknowledged` alerts scoped to the caller's assigned cameras / franchise.

```
GET {{baseUrl}}/alerts/pending
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "alerts": [ ... ]
  }
}
```

---

## 4. GET `/alerts/:id` — Get Alert Details

> 🔒 `Admin`, `Franchise Admin`, `Operator`, `Customer`  
> ⚡ Permission: `alerts:read`

```
GET {{baseUrl}}/alerts/{{alertId}}
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "alert": {
      "_id": "{{alertId}}",
      "cameraId": {
        "_id": "{{cameraId}}",
        "name": "Front Gate Camera",
        "serialNumber": "CAM-FG-1004"
      },
      "type": "motion",
      "priority": "high",
      "status": "new",
      "description": "Suspicious movement near the back perimeter gate",
      "isVerified": false,
      "createdAt": "2026-08-21T18:00:00.000Z"
    }
  }
}
```

---

## 5. PATCH `/alerts/:id/acknowledge` — Acknowledge Alert

> 🔒 `Admin`, `Franchise Admin`, `Operator`  
> ⚡ Permission: `alerts:write`

```
PATCH {{baseUrl}}/alerts/{{alertId}}/acknowledge
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Alert acknowledged successfully",
  "data": {
    "alert": {
      "_id": "{{alertId}}",
      "status": "acknowledged",
      "assignedTo": "668abc..."
    }
  }
}
```

---

## 6. PATCH `/alerts/:id/escalate` — Escalate Alert

> 🔒 `Admin`, `Franchise Admin`, `Operator`  
> ⚡ Permission: `alerts:write`

```
PATCH {{baseUrl}}/alerts/{{alertId}}/escalate
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Alert escalated successfully",
  "data": {
    "alert": {
      "_id": "{{alertId}}",
      "status": "escalated"
    }
  }
}
```

---

## 7. PATCH `/alerts/:id/resolve` — Resolve Alert

> 🔒 `Admin`, `Franchise Admin`, `Operator`  
> ⚡ Permission: `alerts:resolve`

```
PATCH {{baseUrl}}/alerts/{{alertId}}/resolve
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "resolutionNotes": "Checked camera feed, it was just a stray dog. False alarm.",
  "isVerified": false
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Alert resolved successfully",
  "data": {
    "alert": {
      "_id": "{{alertId}}",
      "status": "resolved",
      "resolutionNotes": "Checked camera feed, it was just a stray dog. False alarm.",
      "resolvedAt": "2026-08-21T18:15:00.000Z"
    }
  }
}
```

---

## 8. POST `/alerts/:id/verify` — Verify Alert (True / False Alarm)

> 🔒 `Admin`, `Franchise Admin`, `Operator`  
> ⚡ Permission: `alerts:write`

```
POST {{baseUrl}}/alerts/{{alertId}}/verify
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "isVerified": true,
  "notes": "Verified visually, unauthorized individual confirmed on premises."
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Alert verification status updated",
  "data": {
    "alert": {
      "_id": "{{alertId}}",
      "isVerified": true
    }
  }
}
```

---

## 9. GET `/alerts/:cameraId/history` — Get Camera Alert History

> 🔒 `Admin`, `Franchise Admin`, `Operator`, `Customer`  
> ⚡ Permission: `alerts:read`

```
GET {{baseUrl}}/alerts/{{cameraId}}/history?page=1&limit=10
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "alerts": [ ... ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

---

## 10. PUT `/alerts/rules` — Configure Camera Alert Rules

> 🔒 `Admin`, `Franchise Admin`  
> ⚡ Permission: `cameras:configure`

```
PUT {{baseUrl}}/alerts/rules
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "cameraId": "{{cameraId}}",
  "rules": {
    "motionSensitivity": "high",
    "alertThreshold": 5,
    "timeWindow": "22:00-06:00"
  }
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Alert rules updated successfully",
  "data": {
    "rules": {
      "motionSensitivity": "high",
      "alertThreshold": 5,
      "timeWindow": "22:00-06:00"
    }
  }
}
```

---

## 11. GET `/alerts/rules/:cameraId` — Get Camera Alert Rules

> 🔒 `Admin`, `Franchise Admin`, `Operator`, `Customer`  
> ⚡ Permission: `alerts:read`, `cameras:read`

```
GET {{baseUrl}}/alerts/rules/{{cameraId}}
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "rules": {
      "motionSensitivity": "high",
      "alertThreshold": 5,
      "timeWindow": "22:00-06:00"
    }
  }
}
```

---

## 12. GET `/alerts/stats` — Get Global Alert Stats

> 🔒 `Admin`  
> ⚡ Permission: `alerts:read`

```
GET {{baseUrl}}/alerts/stats
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "total": 42,
    "pending": 5,
    "acknowledged": 2,
    "resolved": 35
  }
}
```

---

## 🌐 WebSocket & Real-Time Testing (Socket.IO)

### 1. Connection & Handshake Auth
- **URL:** `ws://localhost:5000`
- **Handshake Header:** `Authorization: Bearer {{accessToken}}`
- Missing or invalid tokens will receive immediate `Authentication error` and disconnect.

### 2. Room Scoping
- **Join Camera Room:** Emit event `join_camera` with data `"{{cameraId}}"`.
- **Targeted Broadcast:** When an alert is created for `{{cameraId}}`, only clients joined to `camera_{{cameraId}}` will receive the `new_alert` event.
