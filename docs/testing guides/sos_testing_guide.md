# 🧪 Module 10: SOS Emergency Response — Postman & WebSocket Testing Guide

**Base URL:** `http://localhost:5000/api/v1`  
**WebSocket URL:** `ws://localhost:5000`

---

## 🛠 Postman Environment Setup

Add these to your environment variables:

| Variable | Value / Source |
|----------|---------------|
| `cameraId` | Valid Camera ID from your database |
| `sosId` | Set from `POST /sos` response |
| `systemKey` | Set to your `SYSTEM_API_KEY` (e.g. `system_dev_secret_key`) |

**Authorization:** `Bearer {{accessToken}}` on all protected REST endpoints and WebSockets.

---

## 📋 Testing Flow (Recommended Order)

```
1. Trigger SOS Alert (Customer/Mobile)   → test /sos POST
2. List All SOS Alerts (Filtered)       → test /sos GET
3. Get Active SOS Alerts                → test /sos/active GET
4. Get SOS Alert Details                → test /sos/:id GET
5. Acknowledge SOS Alert (Operator)     → test /sos/:id/acknowledge POST
6. Add Operator Notes to SOS Alert      → test /sos/:id/notes POST
7. Get SOS Audit Timeline               → test /sos/:id/timeline GET
8. Resolve SOS Alert (Operator)         → test /sos/:id/resolve POST
9. Real-Time WebSocket Events           → verify sos_triggered, sos_acknowledged, sos_resolved
```

---

## 1. POST `/sos` — Trigger SOS Alert

> 🔒 `Customer`, `Operator`, `Admin`  
> ⚡ Permission: `sos:trigger`

```
POST {{baseUrl}}/sos
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body (Optional):**
```json
{
  "cameraId": "{{cameraId}}",
  "location": "Main Entrance Gate — 19.0760, 72.8777"
}
```

**Response `201`:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "SOS alert triggered successfully",
  "data": {
    "sos": {
      "_id": "66901sos123...",
      "triggeredBy": "668abc...",
      "cameraId": "{{cameraId}}",
      "location": "Main Entrance Gate — 19.0760, 72.8777",
      "status": "active",
      "notes": [],
      "createdAt": "2026-08-21T19:00:00.000Z"
    }
  }
}
```

**Tests tab:**
```javascript
const res = pm.response.json();
pm.environment.set("sosId", res.data.sos._id);
```

**Side Effects:**
- A `sos_triggered` event is broadcast globally on Socket.IO to all operators and admins.
- FCM Push Notifications are dispatched to assigned franchise operators.

### 🛑 Edge Cases & Validations
- Triggering without a body `{}` succeeds and sets `status: "active"`, storing the caller's `triggeredBy`.
- Invalid `cameraId` format returns `400 Bad Request`.
- Non-existent `cameraId` returns `404 Not Found`.

---

## 2. GET `/sos` — List SOS Alerts (Filtered & Paginated)

> 🔒 `Admin`, `Franchise Admin`, `Operator`, `Customer`  
> ⚡ Permission: `sos:read`

```
GET {{baseUrl}}/sos?page=1&limit=10&status=active
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

### 👥 Multi-Tenant Scoping:
- **Customer:** Auto-filtered to alerts triggered by their own user ID (`triggeredBy === user._id`).
- **Operator:** Auto-filtered to cameras assigned to them (`cameraId: { $in: assignedCameras }`).
- **Franchise Admin:** Scoped to all alerts within their franchise territory.
- **Admin / Super Admin:** Unrestricted global view.

---

## 3. GET `/sos/active` — Get Active SOS Alerts

> 🔒 `Admin`, `Franchise Admin`, `Operator`, `Customer`  
> ⚡ Permission: `sos:read`

```
GET {{baseUrl}}/sos/active
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

## 4. GET `/sos/:id` — Get SOS Details

> 🔒 `Admin`, `Franchise Admin`, `Operator`, `Customer`  
> ⚡ Permission: `sos:read`

```
GET {{baseUrl}}/sos/{{sosId}}
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "sos": {
      "_id": "{{sosId}}",
      "triggeredBy": {
        "_id": "668abc...",
        "name": "Ramesh Kumar",
        "phone": "9444444444"
      },
      "cameraId": {
        "_id": "{{cameraId}}",
        "name": "Front Gate Camera"
      },
      "location": "Main Entrance Gate",
      "status": "active",
      "notes": [ ... ],
      "createdAt": "2026-08-21T19:00:00.000Z"
    }
  }
}
```

---

## 5. POST `/sos/:id/acknowledge` — Acknowledge SOS Alert

> 🔒 `Admin`, `Franchise Admin`, `Operator`  
> ⚡ Permission: `alerts:resolve`

```
POST {{baseUrl}}/sos/{{sosId}}/acknowledge
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "SOS alert acknowledged successfully",
  "data": {
    "sos": {
      "_id": "{{sosId}}",
      "status": "acknowledged",
      "acknowledgedBy": "668op123...",
      "acknowledgedAt": "2026-08-21T19:02:00.000Z"
    }
  }
}
```

**Side Effects:**
- Emits `sos_acknowledged` event globally on Socket.IO.

### 🛑 Edge Cases
- Acknowledging an alert that is already `acknowledged` or `resolved` returns `400 Bad Request`.
- Customer calling acknowledge returns `403 Forbidden`.

---

## 6. POST `/sos/:id/notes` — Add Note to SOS Alert

> 🔒 `Admin`, `Franchise Admin`, `Operator`  
> ⚡ Permission: `alerts:resolve`

```
POST {{baseUrl}}/sos/{{sosId}}/notes
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "text": "Operator visually confirmed emergency. Police and security dispatched to site."
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Note added to SOS alert",
  "data": {
    "sos": {
      "_id": "{{sosId}}",
      "notes": [
        {
          "text": "Operator visually confirmed emergency. Police and security dispatched to site.",
          "author": "668op123...",
          "createdAt": "2026-08-21T19:03:00.000Z"
        }
      ]
    }
  }
}
```

---

## 7. GET `/sos/:id/timeline` — Get SOS Audit Timeline

> 🔒 `Admin`, `Franchise Admin`, `Operator`, `Customer (own SOS only)`  
> ⚡ Permission: `sos:read`

```
GET {{baseUrl}}/sos/{{sosId}}/timeline
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "timeline": [
      {
        "action": "SOS_TRIGGERED",
        "description": "SOS alert triggered by customer",
        "createdAt": "2026-08-21T19:00:00.000Z"
      },
      {
        "action": "SOS_ACKNOWLEDGED",
        "description": "SOS acknowledged by John Operator",
        "createdAt": "2026-08-21T19:02:00.000Z"
      }
    ]
  }
}
```

---

## 8. POST `/sos/:id/resolve` — Resolve SOS Alert

> 🔒 `Admin`, `Franchise Admin`, `Operator`  
> ⚡ Permission: `alerts:resolve`

```
POST {{baseUrl}}/sos/{{sosId}}/resolve
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "resolutionNotes": "Emergency resolved. Premises secured and verified by on-site team."
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "SOS alert resolved successfully",
  "data": {
    "sos": {
      "_id": "{{sosId}}",
      "status": "resolved",
      "resolvedBy": "668op123...",
      "resolvedAt": "2026-08-21T19:15:00.000Z",
      "resolutionNotes": "Emergency resolved. Premises secured and verified by on-site team."
    }
  }
}
```

**Side Effects:**
- Emits `sos_resolved` event globally on Socket.IO.

### 🛑 Edge Cases
- Missing `resolutionNotes` returns `400 Bad Request` (Zod validation failure).
- Resolving an already resolved alert returns `400 Bad Request`.

---

## 🌐 9. Real-Time Socket.IO Testing Matrix

1. **Connection:** Connect with `Authorization: Bearer {{accessToken}}`.
2. **Global Event Broadcasts:**
   * `sos_triggered` — Broadcast globally to all connected operators and admins upon panic trigger.
   * `sos_acknowledged` — Broadcast globally when an operator acknowledges.
   * `sos_resolved` — Broadcast globally when an operator completes resolution.
