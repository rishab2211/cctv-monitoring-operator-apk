# 🧪 Module 4: Camera Management — Postman Testing Guide

**Base URL:** `http://localhost:5000/api/v1`

---

## Postman Environment Setup

Add these to your environment variables:

| Variable | Set After |
|----------|-----------|
| `cameraId` | Create Camera |
| `customerId` | Create Customer |
| `operatorId` | Create Operator |
| `franchiseId` | Create Franchise |
| `systemKey` | Set to your `SYSTEM_API_KEY` (e.g. `system_dev_secret_key`) |

**Authorization (standard endpoints):**
- Type: `Bearer Token` → `{{accessToken}}`

**System Authorization (status & heartbeat pings):**
- In Postman headers, add:
  - Key: `X-System-Key`
  - Value: `{{systemKey}}`
- When `X-System-Key` is present, the backend automatically injects a `super_admin` context (`userId: "system"`, `role: "super_admin"`).

---

## 📋 Testing Flow (Recommended Order)

```
1. Create Camera (as Admin)               → test /cameras POST
2. List Cameras (with filters & search)   → test /cameras GET
3. Get Camera Details                     → test /cameras/:id GET
4. Update Camera Configuration            → test /cameras/:id PUT
5. Assign Camera (to Customer/Operators)  → test /cameras/:id/assign POST
6. Transfer Ownership                     → test /cameras/:id/transfer POST
7. Update Connection Status               → test /cameras/:id/status PATCH
8. Ping Heartbeat (Hardware/System Key)   → test /cameras/:id/heartbeat POST
9. Fetch Camera Health Metrics            → test /cameras/:id/health GET
10. Remote Camera Restart                 → test /cameras/:id/restart POST
11. Toggle Recording Settings             → test /cameras/:id/recording PATCH
12. Toggle Motion Detection               → test /cameras/:id/motion PATCH
13. Toggle AI Features                    → test /cameras/:id/ai PATCH
14. QR Scan Configuration (Technician)    → test /cameras/:id/qr-scan POST
15. Read Configuration Properties         → test /cameras/:id/config GET
16. List Customer-Scoped Cameras          → test /cameras/customer/:customerId GET
17. List Operator-Scoped Cameras          → test /cameras/operator/:operatorId GET
18. Soft-Delete Camera (Decommission)     → test /cameras/:id DELETE
```

---

## 1. POST `/cameras` — Create Camera

> 🔒 `super_admin`, `admin`, `franchise_admin`, `technician`

```
POST {{baseUrl}}/cameras
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Front Gate Camera",
  "serialNumber": "CAM-FG-1004",
  "rtspUrl": "rtsp://admin:pass123@192.168.1.104:554/stream1",
  "location": {
    "street": "123 Security Blvd",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "latitude": 19.0760,
    "longitude": 72.8777
  },
  "settings": {
    "recordingEnabled": false,
    "motionDetectionEnabled": true,
    "aiFeaturesEnabled": false,
    "recordingRetentionDays": 7
  }
}
```

**Response `201`:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Camera registered successfully",
  "data": {
    "camera": {
      "_id": "66901abc...",
      "name": "Front Gate Camera",
      "serialNumber": "CAM-FG-1004",
      "rtspUrl": "rtsp://admin:pass123@192.168.1.104:554/stream1",
      "status": "offline",
      "customerId": null,
      "operatorIds": [],
      "franchiseId": null,
      "location": {
        "street": "123 Security Blvd",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001",
        "latitude": 19.076,
        "longitude": 72.8777
      },
      "health": {
        "cpuUsage": 0,
        "memoryUsage": 0,
        "temperature": 0,
        "storageUsage": 0,
        "lastPing": null
      },
      "settings": {
        "recordingEnabled": false,
        "motionDetectionEnabled": true,
        "aiFeaturesEnabled": false,
        "recordingRetentionDays": 7
      },
      "isDeleted": false,
      "deletedAt": null,
      "createdAt": "2026-08-21T16:00:00.000Z",
      "updatedAt": "2026-08-21T16:00:00.000Z"
    }
  }
}
```

**Tests tab:**
```javascript
const res = pm.response.json();
pm.environment.set("cameraId", res.data.camera._id);
```

### ❌ Edge Cases

| Scenario | Body change | Expected |
|----------|-------------|----------|
| Duplicate Serial Number | Same serialNumber as CAM-FG-1004 | `409` — "A camera with serial number 'CAM-FG-1004' already exists" |
| Invalid RTSP URL | `"rtspUrl": "not_a_url"` | `400` — "Must be a valid RTSP/HTTP URL" |
| Latitude out of bounds | `"latitude": 100` | `400` — "Number must be less than or equal to 90" |
| Longitude out of bounds | `"longitude": -200` | `400` — "Number must be greater than or equal to -180" |

---

## 2. GET `/cameras` — List Cameras (Multi-Tenant Scoped)

```
GET {{baseUrl}}/cameras?page=1&limit=10&status=online&search=Gate
Authorization: Bearer {{accessToken}}
```

### 👥 Access filters testing:
1. **As Super Admin / Admin**: Returns all active cameras across the platform.
2. **As Franchise / Franchise Admin**: Returns only cameras assigned to customers in their franchise territory or directly owned by the franchise.
3. **As Operator**: Returns only cameras where this operator is in the `operatorIds` array.
4. **As Customer**: Returns only cameras where `customerId` matches this user or where shared via `sharedWith`.

---

## 3. GET `/cameras/:id` — Get Camera Details

```
GET {{baseUrl}}/cameras/{{cameraId}}
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "camera": {
      "_id": "66901abc...",
      "name": "Front Gate Camera",
      "serialNumber": "CAM-FG-1004",
      "status": "online",
      "location": { ... },
      "health": { ... },
      "settings": { ... }
    }
  }
}
```

---

## 4. PUT `/cameras/:id` — Update Camera

> 🔒 `super_admin`, `admin`, `franchise_admin`, `technician`

```
PUT {{baseUrl}}/cameras/{{cameraId}}
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Front Gate HD Camera",
  "settings": {
    "recordingRetentionDays": 14
  }
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Camera updated successfully",
  "data": {
    "camera": {
      "_id": "66901abc...",
      "name": "Front Gate HD Camera",
      "settings": {
        "recordingRetentionDays": 14
      }
    }
  }
}
```

---

## 5. POST `/cameras/:id/assign` — Assign Camera

> 🔒 `super_admin`, `admin`, `franchise_admin`

```
POST {{baseUrl}}/cameras/{{cameraId}}/assign
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "customerId": "{{customerId}}",
  "operatorIds": ["{{operatorId}}"],
  "franchiseId": "{{franchiseId}}"
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Camera assignments updated successfully",
  "data": {
    "camera": {
      "customerId": "668abc...",
      "operatorIds": ["668def..."],
      "franchiseId": "668ghi..."
    }
  }
}
```

---

## 6. POST `/cameras/:id/transfer` — Transfer Camera

> 🔒 `super_admin`, `admin`, `franchise_admin`

```
POST {{baseUrl}}/cameras/{{cameraId}}/transfer
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "customerId": "{{anotherCustomerId}}"
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Camera ownership transferred successfully"
}
```

---

## 7. PATCH `/cameras/:id/status` — Update Connection Status

> 🔒 `super_admin`, `admin`, `franchise_admin`, `technician`

```
PATCH {{baseUrl}}/cameras/{{cameraId}}/status
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "status": "maintenance"
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Camera status updated successfully",
  "data": {
    "camera": {
      "_id": "66901abc...",
      "status": "maintenance"
    }
  }
}
```

---

## 8. POST `/cameras/:id/heartbeat` — Heartbeat Ping

> 🔒 `System / Hardware` (Send `X-System-Key` header)

```
POST {{baseUrl}}/cameras/{{cameraId}}/heartbeat
X-System-Key: {{systemKey}}
Content-Type: application/json
```

**Body:**
```json
{
  "cpuUsage": 12.5,
  "memoryUsage": 45.2,
  "temperature": 42.0,
  "storageUsage": 18.9
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Heartbeat received successfully",
  "data": {
    "camera": {
      "status": "online",
      "health": {
        "cpuUsage": 12.5,
        "memoryUsage": 45.2,
        "temperature": 42.0,
        "storageUsage": 18.9,
        "lastPing": "2026-08-21T16:05:00.000Z"
      }
    }
  }
}
```

---

## 9. GET `/cameras/:id/health` — Fetch Performance Logs & Status

```
GET {{baseUrl}}/cameras/{{cameraId}}/health
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "camera": {
      "_id": "66901abc...",
      "status": "online",
      "health": {
        "cpuUsage": 12.5,
        "memoryUsage": 45.2,
        "temperature": 42.0,
        "storageUsage": 18.9,
        "lastPing": "2026-08-21T16:05:00.000Z"
      }
    }
  }
}
```

---

## 10. POST `/cameras/:id/restart` — Remote Camera Restart

> 🔒 `super_admin`, `admin`, `operator`

```
POST {{baseUrl}}/cameras/{{cameraId}}/restart
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Restart command sent successfully"
}
```

---

## 11. PATCH `/cameras/:id/recording` — Toggle Recording

> 🔒 `super_admin`, `admin`, `customer`

```
PATCH {{baseUrl}}/cameras/{{cameraId}}/recording
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "enabled": true
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Recording enabled successfully"
}
```

---

## 12. PATCH `/cameras/:id/motion` — Toggle Motion Detection

> 🔒 `super_admin`, `admin`, `customer`

```
PATCH {{baseUrl}}/cameras/{{cameraId}}/motion
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "enabled": true
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Motion detection enabled successfully"
}
```

---

## 13. PATCH `/cameras/:id/ai` — Toggle AI Features

> 🔒 `super_admin`, `admin`, `franchise_admin`

```
PATCH {{baseUrl}}/cameras/{{cameraId}}/ai
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "enabled": true
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "AI features enabled successfully"
}
```

### ❌ Edge Cases
| Scenario | Expected |
|----------|----------|
| Customer attempts to toggle AI | `403` — "Customers cannot configure AI features on cameras" |

---

## 14. POST `/cameras/:id/qr-scan` — QR Scan Setup Trigger

> 🔒 `super_admin`, `admin`, `technician`

```
POST {{baseUrl}}/cameras/{{cameraId}}/qr-scan
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "QR scan configuration initiated",
  "data": {
    "serialNumber": "CAM-FG-1004",
    "pairingStatus": "ready"
  }
}
```

---

## 15. GET `/cameras/:id/config` — Read Configuration Properties

> 🔒 `super_admin`, `admin`, `franchise_admin`, `technician`

```
GET {{baseUrl}}/cameras/{{cameraId}}/config
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "config": {
      "serialNumber": "CAM-FG-1004",
      "rtspUrl": "rtsp://admin:pass123@192.168.1.104:554/stream1",
      "settings": { ... },
      "location": { ... },
      "status": "online"
    }
  }
}
```

---

## 16. GET `/cameras/customer/:customerId` — List Customer-Scoped Cameras

> 🔒 `super_admin`, `admin`, `franchise_admin`, `operator`

```
GET {{baseUrl}}/cameras/customer/{{customerId}}
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "cameras": [ ... ]
  }
}
```

---

## 17. GET `/cameras/operator/:operatorId` — List Operator-Scoped Cameras

> 🔒 `super_admin`, `admin`, `franchise_admin`

```
GET {{baseUrl}}/cameras/operator/{{operatorId}}
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "cameras": [ ... ]
  }
}
```

---

## 18. DELETE `/cameras/:id` — Soft-Delete Camera (Decommission)

> 🔒 `super_admin`, `admin`, `franchise_admin`

```
DELETE {{baseUrl}}/cameras/{{cameraId}}
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Camera decommissioned successfully"
}
```

**Side effects:**
- Sets `isDeleted: true`, `deletedAt: <now>`, and status to `offline`.
- Excluded from all general camera search lists.
- Direct detail queries return `404 Not Found`.
