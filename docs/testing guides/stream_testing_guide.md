# 🧪 Module 5: Streaming — Postman Testing Guide

**Base URL:** `http://localhost:5000/api/v1`

---

## Environment Setup

Add these to your Postman environment:

| Variable | Value / Source |
|----------|---------------|
| `cameraId` | Set from `GET /cameras` |
| `streamToken` | Set from `POST /streams/start` or `GET /streams/:cameraId/token` response |
| `streamSessionId` | Set from `POST /streams/start` response |
| `webrtcUrl` | Set from `POST /streams/start` response |
| `systemKey` | Set to your `SYSTEM_API_KEY` (e.g. `system_dev_secret_key`) |

**Authorization:** `Bearer {{accessToken}}` on all protected endpoints.  
*(MediaMTX Webhook uses `X-Mediamtx-Secret` header).*

---

## 🔧 Before You Start — Dev Without MediaMTX

You do **NOT** need MediaMTX running to test the backend endpoints.  
When MediaMTX is unreachable, the server logs a warning and continues gracefully:

```
[MediaMTX] Unreachable — POST /config/paths/add/cam-fg-1004: fetch failed
```

The API responses **still return 200** with connection URLs — they just will not stream live video frames until MediaMTX is running.

---

## 🏢 Multi-Tenant & Subscription Rules (v2.0)

1. **Operators:** Can view and stream cameras assigned to them (`operatorIds`).
2. **Customers:** Can view and stream cameras they own or cameras shared with them (`sharedWith`), **provided they have an active subscription** (`Subscription.status === "active"`). Customers with `past_due` or `canceled` subscriptions receive `403 Forbidden: "Active subscription required to view camera streams"`.
3. **Franchise Admins & Admins:** Can view and stream cameras within their assigned franchise / global jurisdiction.

---

## 📋 Testing Flow (Recommended Order)

```
1. Start Stream (as Operator/Customer)   → test /streams/start POST
2. Get Stream Token (fresh token)        → test /streams/:cameraId/token GET
3. Get Stream Status                     → test /streams/:cameraId/status GET
4. List Active Streams (Admin/Operator)  → test /streams/active GET
5. WebRTC Offer Relay (WHEP)             → test /streams/:cameraId/webrtc/offer POST
6. WebRTC Answer Relay (Signaling)       → test /streams/:cameraId/webrtc/answer POST
7. Get ICE Candidates (WHEP Info)        → test /streams/:cameraId/ice-candidates GET
8. Stop Stream                           → test /streams/stop POST
9. Test MediaMTX Auth Webhook            → test /streams/auth POST
```

---

## 1. POST `/streams/start` — Start Stream Session

> 🔒 `Operator`, `Customer`, `Admin`, `Franchise Admin`  
> ⚡ Permission: `streams:view`

```
POST {{baseUrl}}/streams/start
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "cameraId": "{{cameraId}}"
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Stream session started",
  "data": {
    "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "streamToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "pathName": "cam-fg-1004",
    "webrtcUrl": "http://localhost:9997/cam-fg-1004",
    "hlsUrl": "http://localhost:9997/cam-fg-1004/index.m3u8",
    "tokenExpiresIn": "24h"
  }
}
```

**Tests tab (save to environment):**
```javascript
const res = pm.response.json();
pm.environment.set("streamToken", res.data.streamToken);
pm.environment.set("streamSessionId", res.data.sessionId);
pm.environment.set("webrtcUrl", res.data.webrtcUrl);
pm.environment.set("streamPathName", res.data.pathName);
```

### ❌ Edge Cases

| Scenario | Expected |
|----------|----------|
| Customer without active subscription | `403` — "Active subscription required to view camera streams" |
| Operator NOT assigned to camera | `403` — "You are not assigned to monitor this camera" |
| Customer who does not own/share camera | `403` — "You do not own this camera" |
| Non-existent cameraId | `404` — "Camera not found" |
| Deleted/decommissioned camera | `404` — "Camera not found" |

---

## 2. GET `/streams/:cameraId/token` — Get Fresh Stream Token

> 🔒 `Operator`, `Customer`, `Admin`, `Franchise Admin`  
> ⚡ Permission: `streams:view`

Issues a fresh 24h stream token without creating duplicate `StreamSession` records.

```
GET {{baseUrl}}/streams/{{cameraId}}/token
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "streamToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "pathName": "cam-fg-1004",
    "webrtcUrl": "http://localhost:9997/cam-fg-1004",
    "tokenExpiresIn": "24h"
  }
}
```

---

## 3. GET `/streams/:cameraId/status` — Get Stream Status

> 🔒 `Operator`, `Customer`, `Admin`, `Franchise Admin`  
> ⚡ Permission: `streams:view`

```
GET {{baseUrl}}/streams/{{cameraId}}/status
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "cameraId": "66901abc...",
    "pathName": "cam-fg-1004",
    "isLive": true,
    "activeViewers": 2,
    "mediamtxStatus": {
      "name": "cam-fg-1004",
      "ready": true,
      "readers": 2
    }
  }
}
```

---

## 4. GET `/streams/active` — List Active Sessions

> 🔒 `Admin` (all sessions) / `Franchise Admin` (franchise sessions) / `Operator` & `Customer` (own sessions)  
> ⚡ Permission: `streams:view`

```
GET {{baseUrl}}/streams/active
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
        "_id": "66901xyz...",
        "sessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "cameraId": {
          "_id": "66901abc...",
          "name": "Front Gate Camera",
          "serialNumber": "CAM-FG-1004"
        },
        "userId": {
          "_id": "6a525abc...",
          "name": "John Operator",
          "role": "operator"
        },
        "startedAt": "2026-08-21T17:00:00.000Z",
        "isActive": true
      }
    ],
    "count": 1
  }
}
```

---

## 5. POST `/streams/:cameraId/webrtc/offer` — WebRTC Offer Relay (WHEP)

> 🔒 `Operator`, `Customer`, `Admin`, `Franchise Admin`  
> ⚡ Permission: `streams:view`

Relays a WebRTC SDP offer to MediaMTX using the **WHEP protocol** and returns the SDP answer.

```
POST {{baseUrl}}/streams/{{cameraId}}/webrtc/offer
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "sdp": "v=0\r\no=- 8857152017949720529 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\n...",
  "type": "offer"
}
```

**Response `200` (MediaMTX running):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "type": "answer",
    "sdp": "v=0\r\no=- 12345678 2 IN IP4 ...",
    "sessionUrl": "http://localhost:9997/cam-fg-1004/whep/session/abc123"
  }
}
```

---

## 6. POST `/streams/:cameraId/webrtc/answer` — WebRTC Answer Relay

> 🔒 `Admin`, `Operator`, `System`

```
POST {{baseUrl}}/streams/{{cameraId}}/webrtc/answer
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "sdp": "v=0\r\no=- 12345678 2 IN IP4 127.0.0.1\r\n...",
  "type": "answer"
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "WebRTC answer relayed successfully"
}
```

---

## 7. GET `/streams/:cameraId/ice-candidates` — Get ICE Candidates Info

> 🔒 `Operator`, `Customer`, `Admin`, `Franchise Admin`  
> ⚡ Permission: `streams:view`

```
GET {{baseUrl}}/streams/{{cameraId}}/ice-candidates
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "pathName": "cam-fg-1004",
    "webrtcUrl": "http://localhost:9997/cam-fg-1004",
    "whepUrl": "http://localhost:9997/cam-fg-1004/whep",
    "message": "Use WHEP protocol to connect. ICE candidates are exchanged via the WHEP signaling flow."
  }
}
```

---

## 8. POST `/streams/stop` — Stop Stream Session

> 🔒 Session owner, `Admin`, `Franchise Admin`  
> ⚡ Permission: `streams:view`

```
POST {{baseUrl}}/streams/stop
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "cameraId": "{{cameraId}}",
  "sessionId": "{{streamSessionId}}"
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Stream session stopped",
  "data": {
    "sessionId": "{{streamSessionId}}",
    "endedAt": "2026-08-21T17:45:00.000Z",
    "remainingActiveSessions": 0
  }
}
```

---

## 9. POST `/streams/auth` — MediaMTX Auth Webhook

> 🔒 Protected by `X-Mediamtx-Secret` header

MediaMTX invokes this webhook before allowing client connections to a stream path.

```
POST {{baseUrl}}/streams/auth
Content-Type: application/json
X-Mediamtx-Secret: {{systemKey}}
```

**Body:**
```json
{
  "user": "{{streamToken}}",
  "password": "",
  "ip": "127.0.0.1",
  "action": "read",
  "path": "cam-fg-1004",
  "protocol": "webrtc",
  "id": "session-id-xyz",
  "query": "token={{streamToken}}"
}
```

**Response `200`:**
```json
{
  "allow": true
}
```
