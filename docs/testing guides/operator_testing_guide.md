# 🧪 Module 14: Operator Module — Postman Testing Guide

**Administrative Base URL:** `http://localhost:5000/api/v1/operators` *(plural — Admin/Management)*  
**Self-Service Panel Base URL:** `http://localhost:5000/api/v1/operator` *(singular — Logged-in Operator)*  
**WebSocket URL:** `ws://localhost:5000`

---

## 🛠 Postman Environment Setup

Add these to your environment variables:

| Variable | Value / Source |
|----------|---------------|
| `operatorUserId` | User ID with role `operator` |
| `operatorToken` | Access token for logged-in Operator |
| `adminToken` | Access token for Super Admin or Franchise Admin |
| `camera1Id` | Valid Camera ID |
| `camera2Id` | Valid Camera ID |
| `systemKey` | Set to your `SYSTEM_API_KEY` (e.g. `system_dev_secret_key`) |

---

## 📋 Testing Flow (Recommended Order)

### Part A: Administrative Operations (`/api/v1/operators`)
```
1. Operator Clock In                   → test /operators/clock-in POST
2. List Historical Shifts              → test /operators/shifts GET
3. Bulk Assign Cameras to Operator     → test /operators/:id/cameras POST
4. Get Operator Performance Metrics    → test /operators/:id/performance GET
5. Operator Clock Out & Handover Notes → test /operators/clock-out POST
```

### Part B: Self-Service Operator Panel (`/api/v1/operator`)
```
6. Operator Panel Dashboard Summary    → test /operator/dashboard GET
7. My Assigned Cameras List            → test /operator/cameras GET
8. Pending Unacknowledged Alerts       → test /operator/alerts/pending GET
9. Active In-Progress Alerts           → test /operator/alerts/active GET
10. Recent Talkback Calls              → test /operator/calls GET
11. Shift Start (Panel Endpoint)       → test /operator/shift/start PATCH
12. Shift Status (Active vs Off-Shift) → test /operator/shift/status GET
13. Operator Activity Timeline         → test /operator/timeline GET
14. Operator Performance Report        → test /operator/reports GET
15. Shift End (Panel Handover)         → test /operator/shift/end PATCH
```

---

# Part A: Administrative & Shared Routes (`/api/v1/operators`)

## 1. POST `/operators/clock-in` — Operator Clock In

> 🔒 `Operator`  
> ⚡ Role-enforced

```
POST {{baseUrl}}/operators/clock-in
Authorization: Bearer {{operatorToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Shift started successfully",
  "data": {
    "shift": {
      "_id": "66901shift123...",
      "operatorId": "{{operatorUserId}}",
      "startTime": "2026-08-21T22:00:00.000Z",
      "status": "active"
    }
  }
}
```

### 🛑 Edge Cases
| Scenario | Expected |
|----------|----------|
| Clocking in while already on active shift | `400` — "You already have an active shift" |
| Non-operator attempting clock in | `403` — Insufficient role permissions |

---

## 2. GET `/operators/shifts` — List Historical Shifts

> 🔒 `Admin`, `Franchise Admin`, `Operator`  
> ⚡ Permission: `users:read`

```
GET {{baseUrl}}/operators/shifts?page=1&limit=10
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "shifts": [ ... ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

### 👥 Multi-Tenant Scoping:
- **Operators:** Only see their own shifts.
- **Franchise Admins:** See shifts for all operators under their franchise.
- **Admins:** Global platform visibility.

---

## 3. POST `/operators/:id/cameras` — Bulk Assign Cameras

> 🔒 `Super Admin`, `Admin`, `Franchise Admin`  
> ⚡ Permission: `cameras:assign`

```
POST {{baseUrl}}/operators/{{operatorUserId}}/cameras
Authorization: Bearer {{adminToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "cameraIds": [
    "{{camera1Id}}",
    "{{camera2Id}}"
  ]
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cameras assigned successfully",
  "data": {
    "operatorId": "{{operatorUserId}}",
    "assignedCameras": [
      "{{camera1Id}}",
      "{{camera2Id}}"
    ]
  }
}
```

**Side Effects:**
- Push notification dispatched to the operator notifying them of new camera assignments.

---

## 4. GET `/operators/:id/performance` — Get Operator Performance

> 🔒 `Admin`, `Franchise Admin`, `Operator (Self)`  
> ⚡ Permission: `users:read`

```
GET {{baseUrl}}/operators/{{operatorUserId}}/performance
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "operator": {
      "name": "John Operator",
      "isOnShift": true,
      "assignedCamerasCount": 2
    },
    "performance": {
      "totalShifts": 12,
      "totalIncidentsResolved": 8,
      "totalSosAcknowledged": 3
    }
  }
}
```

---

## 5. POST `/operators/clock-out` — Clock Out & Handover

> 🔒 `Operator`  
> ⚡ Role-enforced

```
POST {{baseUrl}}/operators/clock-out
Authorization: Bearer {{operatorToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "handoverNotes": "Rear gate camera was occasionally losing signal. Guard alerted to keep visual monitoring."
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Shift ended successfully",
  "data": {
    "shift": {
      "_id": "66901shift123...",
      "endTime": "2026-08-21T22:45:00.000Z",
      "durationMs": 2700000,
      "handoverNotes": "Rear gate camera was occasionally losing signal. Guard alerted to keep visual monitoring.",
      "incidentsResolved": 1,
      "sosAcknowledged": 0
    }
  }
}
```

**Side Effects:**
- A `shift_handover` event is broadcast to the `operator` room on Socket.IO.

---

# Part B: Self-Service Operator Panel (`/api/v1/operator`)

## 6. GET `/operator/dashboard` — Panel Dashboard Summary

```
GET {{baseUrl}}/operator/dashboard
Authorization: Bearer {{operatorToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "operator": {
      "_id": "{{operatorUserId}}",
      "name": "John Operator"
    },
    "shift": {
      "shiftId": "66901shift123...",
      "startTime": "2026-08-21T22:00:00.000Z",
      "durationMs": 3600000
    },
    "stats": {
      "assignedCameras": 4,
      "openIncidents": 2,
      "activeSos": 1
    }
  }
}
```

---

## 7. GET `/operator/cameras` — My Assigned Cameras

```
GET {{baseUrl}}/operator/cameras
Authorization: Bearer {{operatorToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "cameras": [ ... ],
    "count": 4
  }
}
```

---

## 8. GET `/operator/alerts/pending` — Pending Unacknowledged Alerts

```
GET {{baseUrl}}/operator/alerts/pending
Authorization: Bearer {{operatorToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "alerts": [ ... ],
    "count": 2
  }
}
```

---

## 9. GET `/operator/alerts/active` — Active In-Progress Alerts

```
GET {{baseUrl}}/operator/alerts/active
Authorization: Bearer {{operatorToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "alerts": [ ... ],
    "count": 1
  }
}
```

---

## 10. GET `/operator/calls` — Recent Talkback Sessions

```
GET {{baseUrl}}/operator/calls
Authorization: Bearer {{operatorToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "calls": [ ... ],
    "count": 3
  }
}
```

---

## 11. PATCH `/operator/shift/start` — Shift Start (Panel)

```
PATCH {{baseUrl}}/operator/shift/start
Authorization: Bearer {{operatorToken}}
```

**Response `200`:** Same as `/operators/clock-in`.

---

## 12. GET `/operator/shift/status` — Live Shift Status

```
GET {{baseUrl}}/operator/shift/status
Authorization: Bearer {{operatorToken}}
```

**Response `200` (On Shift):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "isOnShift": true,
    "currentShift": {
      "_id": "66901shift123...",
      "startTime": "2026-08-21T22:00:00.000Z"
    },
    "durationMs": 3600000
  }
}
```

---

## 13. GET `/operator/timeline` — Operator Activity Timeline

```
GET {{baseUrl}}/operator/timeline
Authorization: Bearer {{operatorToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "events": [ ... ],
    "count": 25
  }
}
```

---

## 14. GET `/operator/reports` — Operator Performance Report

```
GET {{baseUrl}}/operator/reports
Authorization: Bearer {{operatorToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "operatorName": "John Operator",
    "generatedAt": "2026-08-21T23:00:00.000Z",
    "summary": {
      "totalShifts": 14,
      "totalIncidentsResolved": 9,
      "totalSosAcknowledged": 4,
      "avgIncidentsPerShift": 0.64
    },
    "shifts": [ ... ]
  }
}
```

---

## 15. PATCH `/operator/shift/end` — Shift End (Panel)

```
PATCH {{baseUrl}}/operator/shift/end
Authorization: Bearer {{operatorToken}}
Content-Type: application/json
```

**Body (Optional):**
```json
{
  "handoverNotes": "All camera views clear. No pending incidents."
}
```

**Response `200`:** Same as `/operators/clock-out`.
