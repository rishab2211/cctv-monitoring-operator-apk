# 🧪 Module 8: Audio Talkback — Postman & WebRTC Testing Guide

**REST Base URL:** `http://localhost:5000/api/v1`  
**WebRTC Audio Ingestion:** WHIP protocol via MediaMTX (port 8889)

---

## 🛠 Environment Setup

| Variable | Value / Source |
|----------|---------------|
| `cameraId` | Must be a valid Camera ID in your database. |
| `systemKey` | Set to your `SYSTEM_API_KEY` (e.g. `system_dev_secret_key`) |

**Important Prerequisite:**  
By default, the `talkbackEnabled` setting on new cameras is `false`. Before running these tests, update your target camera so that `settings.talkbackEnabled: true`.

---

## 📋 Testing Flow (Recommended Order)

```
1. Capabilities Check               → test /talkback/:cameraId/capabilities GET
2. Start Session (WHIP Ingestion)   → test /talkback/:cameraId/start POST
3. Session Status (Busy/Free)       → test /talkback/:cameraId/status GET
4. List Active Sessions (Admin)     → test /talkback/active GET
5. Stop Session                     → test /talkback/:cameraId/stop POST
6. Historical Call Logs             → test /talkback/logs GET
7. Operator Panel Alias             → test /operator/calls GET
8. WebRTC WHIP Publishing Test      → test audio streaming to MediaMTX WHIP URL
```

---

## 1. GET `/talkback/:cameraId/capabilities` — Capabilities Check

> 🔒 `Admin`, `Franchise Admin`, `Operator`  
> ⚡ Permission: `talkback:use`

```
GET {{baseUrl}}/talkback/{{cameraId}}/capabilities
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "audioOut": true,
    "codec": "opus",
    "sampleRate": 48000,
    "channels": 1
  }
}
```

### ❌ Edge Cases
| Scenario | Expected |
|----------|----------|
| Operator NOT assigned to camera | `403` — "You do not have access to this camera" |
| Non-existent cameraId | `404` — "Camera not found" |

---

## 2. POST `/talkback/:cameraId/start` — Start Session (WHIP Ingestion)

> 🔒 `Admin`, `Franchise Admin`, `Operator`  
> ⚡ Permission: `talkback:use`

```
POST {{baseUrl}}/talkback/{{cameraId}}/start
Authorization: Bearer {{accessToken}}
```

**Response `201` (New Session Created):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Talkback session started",
  "data": {
    "session": {
      "_id": "66901abc...",
      "cameraId": "{{cameraId}}",
      "operatorId": "668abc...",
      "status": "active",
      "startedAt": "2026-08-21T18:30:00.000Z"
    },
    "whipUrl": "http://localhost:8889/camera_{{cameraId}}_talkback/whip"
  }
}
```

> 📡 **WebSocket Side Effect:** Emits `talkback_started` event to the `camera_{{cameraId}}` room, alerting other operators that talkback is now busy.

### 🛑 Concurrency & Idempotency Validations
- **Talkback Disabled on Camera:** Call `/start` on a camera with `settings.talkbackEnabled: false` → `400 Bad Request` ("Talkback is not enabled for this camera").
- **Concurrency Conflict:** When a second Operator calls `/start` on the same camera while active → `409 Conflict` ("Camera is already in an active talkback session with another operator").
- **Idempotency:** When the *same* Operator calls `/start` again → `200 OK` (returns the existing active session and `whipUrl`).

---

## 3. GET `/talkback/:cameraId/status` — Get Session Status

> 🔒 `Admin`, `Franchise Admin`, `Operator`  
> ⚡ Permission: `talkback:use`

```
GET {{baseUrl}}/talkback/{{cameraId}}/status
Authorization: Bearer {{accessToken}}
```

**Response `200` (When Active):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "isActive": true,
    "session": {
      "_id": "66901abc...",
      "operatorId": "668abc...",
      "startedAt": "2026-08-21T18:30:00.000Z"
    }
  }
}
```

**Response `200` (When Free):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "isActive": false,
    "session": null
  }
}
```

---

## 4. GET `/talkback/active` — List All Active Talkback Sessions

> 🔒 `Admin`, `Franchise Admin`  
> ⚡ Permission: `talkback:use`

```
GET {{baseUrl}}/talkback/active
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "sessions": [
      {
        "_id": "66901abc...",
        "cameraId": {
          "_id": "{{cameraId}}",
          "name": "Front Gate Camera"
        },
        "operatorId": {
          "_id": "668abc...",
          "name": "John Operator"
        },
        "status": "active",
        "startedAt": "2026-08-21T18:30:00.000Z"
      }
    ],
    "count": 1
  }
}
```

---

## 5. POST `/talkback/:cameraId/stop` — Stop Session

> 🔒 Session Owner, `Admin`, `Franchise Admin`  
> ⚡ Permission: `talkback:use`

```
POST {{baseUrl}}/talkback/{{cameraId}}/stop
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Talkback session ended",
  "data": {
    "session": {
      "_id": "66901abc...",
      "status": "completed",
      "endedAt": "2026-08-21T18:32:15.000Z",
      "durationSeconds": 135
    }
  }
}
```

> 📡 **WebSocket Side Effect:** Emits `talkback_stopped` event to the `camera_{{cameraId}}` room, re-enabling talkback buttons.

### 🛑 Edge Cases
| Scenario | Expected |
|----------|----------|
| No active session for this operator | `404` — "No active talkback session found for you on this camera" |
| Different operator trying to stop another's session | `404` — "No active talkback session found for you on this camera" |

---

## 6. GET `/talkback/logs` — Historical Call Logs

> 🔒 `Admin`, `Franchise Admin`, `Operator`  
> ⚡ Permission: `talkback:use`

```
GET {{baseUrl}}/talkback/logs?page=1&limit=10
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "logs": [
      {
        "_id": "66901abc...",
        "cameraId": "{{cameraId}}",
        "operatorId": "668abc...",
        "status": "completed",
        "startedAt": "2026-08-21T18:30:00.000Z",
        "endedAt": "2026-08-21T18:32:15.000Z",
        "durationSeconds": 135
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

---

## 7. GET `/operator/calls` — Operator Self-Service Call Log

> 🔒 `Operator`  
> Convenient operator-panel wrapper returning all sessions on assigned cameras.

```
GET {{baseUrl}}/operator/calls?page=1&limit=10
Authorization: Bearer {{accessToken}}
```

**Response `200`:** Same log structure as `/talkback/logs`.

---

## 🌐 8. WebRTC WHIP Ingestion Test (MediaMTX)

Because the system is designed to work in production, it integrates natively with MediaMTX via the **WHIP protocol**.

1. Ensure **MediaMTX** is running (port 8889 for WebRTC).
2. Grab the `whipUrl` returned from the `POST /start` endpoint (`http://<HOST>:8889/camera_<id>_talkback/whip`).
3. Test using a WebRTC broadcast tool like OBS Studio (v30.0+) or React Native WebRTC (`react-native-webrtc`):
   - *In OBS Studio:* Settings ➡️ Stream ➡️ Service: `WHIP` ➡️ Server: *Paste `whipUrl`*.
4. Start Streaming audio. MediaMTX ingests the WebRTC audio track and bridges it to the camera's audio output.
