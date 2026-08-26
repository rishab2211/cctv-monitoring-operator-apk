# 🧪 Module 13: Technician / Installation Module — Postman Testing Guide

**Base URL:** `http://localhost:5000/api/v1/installations` *(Legacy alias: `/api/v1/jobs`)*

---

## 🛠 Postman Environment Setup

Add these to your environment variables:

| Variable | Value / Source |
|----------|---------------|
| `installationId` | Set after Create Job (`POST /installations`) |
| `technicianUserId` | User ID with role `technician` |
| `newTechnicianUserId` | Alternate User ID with role `technician` |
| `franchiseId` | Valid Franchise ID |
| `systemKey` | Set to your `SYSTEM_API_KEY` (e.g. `system_dev_secret_key`) |

**Authorization:** `Bearer {{accessToken}}` on all protected endpoints.

---

## 📋 Testing Flow (Recommended Order)

```
1. Create Installation Job (Admin/Franchise)    → test / POST
2. List Jobs (Paginated & Multi-Tenant Scoped)  → test / GET
3. Get Assigned Jobs (Technician Shortcut)      → test /assigned GET
4. Get Job Details                              → test /:id GET
5. Update Job Status & Progress Notes           → test /:id PUT
6. Reassign Job to Another Technician           → test /:id/reassign PUT
7. Submit On-Site Checklist                     → test /:id/checklist POST
8. Upload Proof-of-Work Photos (Multer)         → test /:id/photos POST
9. Upload Customer Digital Signature (Multer)   → test /:id/signature POST
10. Mark Installation Complete                  → test /:id/complete PATCH
11. Get Job Completion Report (JSON/PDF)        → test /:id/report GET
12. Get Technician Schedule                     → test /technicians/:id/schedule GET
13. Update Technician Live GPS Location         → test /technicians/:id/gps POST
```

---

## 1. POST `/` — Create an Installation Job

> 🔒 `Super Admin`, `Admin`, `Franchise Admin`  
> ⚡ Permission: `installations:write`

```
POST {{baseUrl}}
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "title": "4-Camera Smart CCTV Installation",
  "description": "Install 4 HD IP cameras, configure NVR and verify live streaming feeds.",
  "type": "installation",
  "assignedTechnician": "{{technicianUserId}}",
  "franchiseId": "{{franchiseId}}",
  "scheduledAt": "2026-08-25T10:00:00.000Z",
  "location": {
    "street": "45 Palm Avenue",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400050"
  }
}
```

**Response `201`:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Job created successfully",
  "data": {
    "job": {
      "_id": "66901job123...",
      "title": "4-Camera Smart CCTV Installation",
      "type": "installation",
      "status": "scheduled",
      "assignedTechnician": "{{technicianUserId}}",
      "franchiseId": "{{franchiseId}}",
      "scheduledAt": "2026-08-25T10:00:00.000Z",
      "checklist": [],
      "attachments": [],
      "createdAt": "2026-08-21T21:00:00.000Z"
    }
  }
}
```

**Tests tab:**
```javascript
const res = pm.response.json();
pm.environment.set("installationId", res.data.job._id);
```

**Side Effects:**
- Push notification dispatched to the assigned technician's device.

---

## 2. GET `/` — List Jobs (Multi-Tenant Scoped)

> 🔒 `Admin`, `Franchise`, `Franchise Admin`, `Technician`  
> ⚡ Permission: `installations:read`

```
GET {{baseUrl}}?page=1&limit=10&status=scheduled
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "jobs": [ ... ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

### 👥 Multi-Tenant Scoping:
- **Technicians:** See only jobs assigned to their own user ID.
- **Franchise Admins:** See all jobs created within their franchise territory.
- **Admins:** See all jobs platform-wide.

---

## 3. GET `/assigned` — Get Assigned Jobs (Technician Shortcut)

> 🔒 `Technician`  
> ⚡ Permission: `installations:read`

Returns upcoming and active jobs assigned specifically to the authenticated technician, ordered by `scheduledAt`.

```
GET {{baseUrl}}/assigned
Authorization: Bearer {{technicianAccessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "jobs": [ ... ]
  }
}
```

---

## 4. GET `/:id` — Get Full Job Details

> 🔒 `Admin`, `Franchise`, `Franchise Admin`, `Technician`  
> ⚡ Permission: `installations:read`

```
GET {{baseUrl}}/{{installationId}}
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "job": {
      "_id": "{{installationId}}",
      "title": "4-Camera Smart CCTV Installation",
      "description": "Install 4 HD IP cameras, configure NVR and verify live streaming feeds.",
      "status": "scheduled",
      "assignedTechnician": {
        "_id": "{{technicianUserId}}",
        "name": "Suresh Technician",
        "phone": "9811122233"
      },
      "checklist": [ ... ],
      "attachments": [ ... ],
      "createdAt": "2026-08-21T21:00:00.000Z"
    }
  }
}
```

---

## 5. PUT `/:id` — Update Job Status & Progress Notes

> 🔒 `Admin`, `Franchise Admin`, `Technician`  
> ⚡ Permission: `installations:write`

Supports multipart upload if appending initial photos during status transition.

```
PUT {{baseUrl}}/{{installationId}}
Authorization: Bearer {{accessToken}}
Content-Type: multipart/form-data
```

**Form-Data Body:**
- `status` (text): `"in_progress"`
- `notes` (text): `"Arrived on site. Commencing cable routing and camera mounting."`
- `attachments` (file, optional): *Select up to 5 photos*

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Job status updated",
  "data": {
    "job": {
      "_id": "{{installationId}}",
      "status": "in_progress"
    }
  }
}
```

---

## 6. PUT `/:id/reassign` — Reassign Job

> 🔒 `Super Admin`, `Admin`, `Franchise Admin`  
> ⚡ Permission: `installations:write`

```
PUT {{baseUrl}}/{{installationId}}/reassign
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "assignedTechnician": "{{newTechnicianUserId}}"
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Job reassigned successfully",
  "data": {
    "job": {
      "_id": "{{installationId}}",
      "assignedTechnician": "{{newTechnicianUserId}}"
    }
  }
}
```

**Side Effects:**
- Push notification sent to `{{newTechnicianUserId}}`.

---

## 7. POST `/:id/checklist` — Submit On-Site Checklist

> 🔒 `Admin`, `Franchise Admin`, `Technician`  
> ⚡ Permission: `installations:write`

```
POST {{baseUrl}}/{{installationId}}/checklist
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "items": [
    { "item": "Power supply & PoE switch connected", "checked": true },
    { "item": "All 4 camera angles calibrated", "checked": true },
    { "item": "RTSP feed tested on mobile app", "checked": true }
  ]
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Checklist submitted successfully",
  "data": {
    "job": {
      "_id": "{{installationId}}",
      "checklist": [
        { "item": "Power supply & PoE switch connected", "checked": true },
        { "item": "All 4 camera angles calibrated", "checked": true },
        { "item": "RTSP feed tested on mobile app", "checked": true }
      ]
    }
  }
}
```

---

## 8. POST `/:id/photos` — Upload Proof-of-Work Photos

> 🔒 `Admin`, `Franchise Admin`, `Technician`  
> ⚡ Permission: `installations:write`

```
POST {{baseUrl}}/{{installationId}}/photos
Authorization: Bearer {{accessToken}}
Content-Type: multipart/form-data
```

**Form-Data Body:**
- `photos` (file): *Select up to 10 photos of mounted cameras and tidy wiring*

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Photos uploaded successfully",
  "data": {
    "attachments": [
      "https://res.cloudinary.com/.../proof_photo_1.jpg",
      "https://res.cloudinary.com/.../proof_photo_2.jpg"
    ]
  }
}
```

---

## 9. POST `/:id/signature` — Upload Customer Digital Signature

> 🔒 `Admin`, `Franchise Admin`, `Technician`  
> ⚡ Permission: `installations:write`

```
POST {{baseUrl}}/{{installationId}}/signature
Authorization: Bearer {{accessToken}}
Content-Type: multipart/form-data
```

**Form-Data Body:**
- `signature` (file): *Select 1 signature image (PNG/JPG)*

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Customer signature uploaded",
  "data": {
    "customerSignature": "https://res.cloudinary.com/.../customer_signature_1.png"
  }
}
```

---

## 10. PATCH `/:id/complete` — Mark Installation Complete

> 🔒 `Admin`, `Franchise Admin`, `Technician`  
> ⚡ Permission: `installations:write`

```
PATCH {{baseUrl}}/{{installationId}}/complete
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "notes": "All 4 cameras installed, angled, verified, and customer training completed."
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Job marked as completed",
  "data": {
    "job": {
      "_id": "{{installationId}}",
      "status": "completed",
      "completedAt": "2026-08-21T21:45:00.000Z"
    }
  }
}
```

**Side Effects:**
- Franchise owner notified of completed job.

---

## 11. GET `/:id/report` — Get Job Completion Report

> 🔒 `Admin`, `Franchise`, `Franchise Admin`, `Technician`  
> ⚡ Permission: `installations:read`

```
GET {{baseUrl}}/{{installationId}}/report
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "generatedAt": "2026-08-21T21:50:00.000Z",
    "job": { ... },
    "summary": {
      "totalPhotos": 2,
      "checklistTotal": 3,
      "checklistCompleted": 3,
      "hasSignature": true,
      "status": "completed"
    }
  }
}
```

---

## 12. GET `/technicians/:id/schedule` — Get Technician Schedule

> 🔒 `Admin`, `Franchise`, `Franchise Admin`, `Technician`  
> ⚡ Permission: `installations:read`

```
GET {{baseUrl}}/technicians/{{technicianUserId}}/schedule
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "schedule": [ ... ]
  }
}
```

### 🛑 Edge Cases
- A technician attempting to view another technician's schedule returns `403 Forbidden`.

---

## 13. POST `/technicians/:id/gps` — Update Technician Live GPS Location

> 🔒 `Technician`  
> ⚡ Permission: `installations:write`

```
POST {{baseUrl}}/technicians/{{technicianUserId}}/gps
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "lat": 19.0760,
  "lng": 72.8777
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "GPS location updated",
  "data": {
    "gpsLocation": {
      "lat": 19.0760,
      "lng": 72.8777,
      "updatedAt": "2026-08-21T21:55:00.000Z"
    }
  }
}
```
