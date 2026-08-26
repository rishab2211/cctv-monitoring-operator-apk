# 🧪 Module 6: Recording Module — Postman Testing Guide

**Base URL:** `http://localhost:5000/api/v1`

---

## Environment Setup

Add these to your Postman environment:

| Variable | Value / Source |
|----------|---------------|
| `cameraId` | Set from `GET /cameras` |
| `recordingId` | Set from `POST /recordings` or `GET /recordings` |
| `systemKey` | Set to your `SYSTEM_API_KEY` (e.g. `system_dev_secret_key`) |

**Authorization:**
- `Bearer {{accessToken}}` on protected endpoints.
- `X-System-Key: {{systemKey}}` for chunk ingestion and system-level operations.

---

## 📋 Testing Flow (Recommended Order)

```
1. Set Camera Schedule (POST /recordings/schedule)
2. Update Camera Schedule by ID (PUT /recordings/:cameraId/schedule)
3. Get Camera Schedule (GET /recordings/:cameraId/schedule)
4. Delete Camera Schedule (DELETE /recordings/:cameraId/schedule)
5. Set Global Retention Policy (PUT /recordings/retention)
6. Log Recording Chunk (POST /recordings with X-System-Key)
7. Get Recording Timeline (GET /recordings/:cameraId/timeline)
8. Get Playback URLs & Aliases (GET /recordings/:cameraId/playback)
9. List All Recordings (GET /recordings)
10. Get Recording Details (GET /recordings/:id)
11. Generate Download Link (POST /recordings/:id/download)
12. Get Storage Stats (GET /recordings/storage)
13. Delete Recording (DELETE /recordings/:id)
```

---

## 1. POST `/recordings/schedule` — Set Camera Schedule (Body-based)

> 🔒 `Admin`, `Franchise Admin`  
> ⚡ Permission: `cameras:configure`

```
POST {{baseUrl}}/recordings/schedule
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "cameraId": "{{cameraId}}",
  "rules": [
    {
      "daysOfWeek": [1, 2, 3, 4, 5],
      "startTime": "09:00",
      "endTime": "18:00",
      "type": "continuous"
    },
    {
      "daysOfWeek": [0, 6],
      "startTime": "00:00",
      "endTime": "23:59",
      "type": "motion"
    }
  ]
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Schedule updated successfully",
  "data": {
    "cameraId": "{{cameraId}}",
    "rules": [ ... ]
  }
}
```

---

## 2. PUT `/recordings/:cameraId/schedule` — Update Camera Schedule (RESTful)

> 🔒 `Admin`, `Franchise Admin`  
> ⚡ Permission: `cameras:configure`

```
PUT {{baseUrl}}/recordings/{{cameraId}}/schedule
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "rules": [
    {
      "daysOfWeek": [1, 2, 3, 4, 5],
      "startTime": "08:00",
      "endTime": "20:00",
      "type": "continuous"
    }
  ]
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Schedule updated successfully",
  "data": {
    "cameraId": "{{cameraId}}",
    "rules": [ ... ]
  }
}
```

---

## 3. GET `/recordings/:cameraId/schedule` — Get Camera Schedule

> 🔒 `Admin`, `Franchise Admin`, `Operator`, `Customer`  
> ⚡ Permission: `recordings:read`

```
GET {{baseUrl}}/recordings/{{cameraId}}/schedule
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "cameraId": "{{cameraId}}",
    "rules": [ ... ]
  }
}
```

---

## 4. DELETE `/recordings/:cameraId/schedule` — Delete Camera Schedule

> 🔒 `Admin`, `Franchise Admin`  
> ⚡ Permission: `cameras:configure`

```
DELETE {{baseUrl}}/recordings/{{cameraId}}/schedule
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Recording schedule deleted successfully",
  "data": null
}
```

---

## 5. PUT `/recordings/retention` — Set Global Retention Policy

> 🔒 `Admin`  
> ⚡ Permission: `recordings:manage`

```
PUT {{baseUrl}}/recordings/retention
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "days": 30
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Retention policy updated",
  "data": {
    "key": "recording_retention_days",
    "value": 30
  }
}
```

---

## 6. POST `/recordings` — Log Recording Chunk (Internal / System Worker)

> 🔒 **System Token** (`X-System-Key`)  
> Used by background recording workers/FFmpeg transcoders to index chunk segments.

```
POST {{baseUrl}}/recordings
X-System-Key: {{systemKey}}
Content-Type: application/json
```

**Body:**
```json
{
  "cameraId": "{{cameraId}}",
  "startTime": "2026-08-21T09:00:00Z",
  "endTime": "2026-08-21T09:15:00Z",
  "type": "continuous",
  "status": "completed",
  "url": "https://res.cloudinary.com/demo/video/upload/v1/cctv/cam1_chunk1.mp4",
  "sizeBytes": 25000000,
  "durationSeconds": 900
}
```

**Response `201`:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Recording chunk logged",
  "data": {
    "_id": "6695xyz...",
    "cameraId": "{{cameraId}}",
    "url": "https://res.cloudinary.com/.../cam1_chunk1.mp4",
    "status": "completed"
  }
}
```

**Tests tab:**
```javascript
const res = pm.response.json();
pm.environment.set("recordingId", res.data._id);
```

---

## 7. GET `/recordings/:cameraId/timeline` — Get Recording Timeline

> 🔒 `Admin`, `Franchise Admin`, `Operator`, `Customer`  
> ⚡ Permission: `recordings:read`

```
GET {{baseUrl}}/recordings/{{cameraId}}/timeline?date=2026-08-21
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
        "startTime": "2026-08-21T09:00:00.000Z",
        "endTime": "2026-08-21T09:15:00.000Z",
        "durationSeconds": 900,
        "type": "continuous",
        "url": "https://res.cloudinary.com/.../cam1_chunk1.mp4"
      }
    ],
    "count": 1
  }
}
```

---

## 8. GET `/recordings/:cameraId/playback` — Get Playback URLs

> 🔒 `Admin`, `Franchise Admin`, `Operator`, `Customer`  
> ⚡ Permission: `recordings:read`

### Supports both query parameter conventions:
- **Standard:** `?start=2026-08-21T08:00:00Z&end=2026-08-21T10:00:00Z`
- **Alias:** `?startTime=2026-08-21T08:00:00Z&endTime=2026-08-21T10:00:00Z`

```
GET {{baseUrl}}/recordings/{{cameraId}}/playback?start=2026-08-21T08:00:00Z&end=2026-08-21T10:00:00Z
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "chunks": [
      {
        "_id": "6695xyz...",
        "startTime": "2026-08-21T09:00:00.000Z",
        "endTime": "2026-08-21T09:15:00.000Z",
        "url": "https://res.cloudinary.com/.../cam1_chunk1.mp4",
        "type": "continuous"
      }
    ],
    "count": 1
  }
}
```

---

## 9. GET `/recordings` — List All Recordings (Filtered/Paginated)

> 🔒 `Admin`, `Franchise Admin`, `Operator`, `Customer`  
> ⚡ Permission: `recordings:read`

```
GET {{baseUrl}}/recordings?page=1&limit=10&cameraId={{cameraId}}&status=completed
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "recordings": [ ... ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

## 10. GET `/recordings/:id` — Get Recording Details

> 🔒 `Admin`, `Franchise Admin`, `Operator`, `Customer`  
> ⚡ Permission: `recordings:read`

```
GET {{baseUrl}}/recordings/{{recordingId}}
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "recording": {
      "_id": "{{recordingId}}",
      "cameraId": "{{cameraId}}",
      "startTime": "2026-08-21T09:00:00.000Z",
      "endTime": "2026-08-21T09:15:00.000Z",
      "durationSeconds": 900,
      "sizeBytes": 25000000,
      "url": "https://res.cloudinary.com/.../cam1_chunk1.mp4",
      "status": "completed",
      "type": "continuous"
    }
  }
}
```

---

## 11. POST `/recordings/:id/download` — Generate Download Link

> 🔒 `Admin`, `Franchise Admin`, `Customer (Camera Owner)`  
> ⚡ Permission: `recordings:download`

```
POST {{baseUrl}}/recordings/{{recordingId}}/download
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Download link generated",
  "data": {
    "downloadUrl": "https://res.cloudinary.com/.../cam1_chunk1.mp4?fl_attachment=recording_20260821.mp4",
    "expiresAt": "2026-08-21T10:00:00.000Z"
  }
}
```

---

## 12. GET `/recordings/storage` — Get Storage Stats

> 🔒 `Admin`  
> ⚡ Permission: `recordings:manage`

```
GET {{baseUrl}}/recordings/storage
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "totalBytes": 25000000,
    "totalGb": "0.02",
    "chunkCount": 1
  }
}
```

---

## 13. DELETE `/recordings/:id` — Delete Recording

> 🔒 `Admin`, `Franchise Admin`  
> ⚡ Permission: `recordings:delete`

```
DELETE {{baseUrl}}/recordings/{{recordingId}}
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Recording deleted"
}
```
