# 🧪 Module 11: Incident Management — Postman Testing Guide

**Base URL:** `http://localhost:5000/api/v1/incidents`  
**WebSocket URL:** `ws://localhost:5000`

---

## 🛠 Postman Environment Setup

Add these to your environment variables:

| Variable | Value / Source |
|----------|---------------|
| `cameraId` | Valid Camera ID from your database |
| `incidentId` | Set from `POST /incidents` response |
| `operatorUserId` | Valid Operator User ID |
| `systemKey` | Set to your `SYSTEM_API_KEY` (e.g. `system_dev_secret_key`) |

**Authorization:** `Bearer {{accessToken}}` on all protected endpoints.

---

## 📋 Testing Flow (Recommended Order)

```
1. Report Incident (with Multer upload)   → test /incidents POST
2. List Incidents (Filtered & Paginated)  → test /incidents GET
3. Get Incident Details                   → test /incidents/:id GET
4. Assign Incident to Operator            → test /incidents/:id/assign PATCH
5. Update Incident Status                 → test /incidents/:id/status PATCH
6. Add Note to Incident                   → test /incidents/:id/notes POST
7. Upload Evidence Media (Multer)         → test /incidents/:id/media POST
8. Verify Incident (Formal confirmation)  → test /incidents/:id/verify POST
9. Get Incident Timeline (Audit trail)    → test /incidents/:id/timeline GET
10. Generate Incident Report (JSON/PDF)   → test /incidents/:id/report GET
11. Close Incident (with resolutionNotes) → test /incidents/:id/close PATCH
```

---

## 1. POST `/` — Report an Incident (with Multer File Upload)

> 🔒 `Admin`, `Franchise Admin`, `Operator`, `Customer`  
> ⚡ Permission: `incidents:write`

Uses `multipart/form-data` to support up to 5 initial evidence files (photos/videos).

```
POST {{baseUrl}}
Authorization: Bearer {{accessToken}}
Content-Type: multipart/form-data
```

**Form-Data Body:**
- `title` (text): `"Suspicious Activity at Back Door"`
- `description` (text): `"Individual attempting to open secured rear entrance at 02:15 AM."`
- `type` (text): `"theft"` *(or `vandalism`, `safety`, `maintenance`, `other`)*
- `severity` (text): `"high"` *(or `low`, `medium`, `critical`)*
- `cameraId` (text): `"{{cameraId}}"`
- `attachments` (file): *Select up to 5 image/video files (max 10MB each)*

**Response `201`:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Incident reported successfully",
  "data": {
    "incident": {
      "_id": "66901inc123...",
      "title": "Suspicious Activity at Back Door",
      "status": "open",
      "severity": "high",
      "type": "theft",
      "reportedBy": "668cust123...",
      "cameraId": "{{cameraId}}",
      "attachments": [
        "https://res.cloudinary.com/.../incident_attachment_1.jpg"
      ],
      "createdAt": "2026-08-21T19:00:00.000Z"
    }
  }
}
```

**Tests tab:**
```javascript
const res = pm.response.json();
pm.environment.set("incidentId", res.data.incident._id);
```

**Side Effects:**
- If severity is `high` or `critical`, operators receive push notifications and a WebSocket `new_incident` event.

---

## 2. GET `/` — List Incidents (Multi-Tenant Scoped)

> 🔒 `Admin`, `Franchise Admin`, `Operator`, `Customer`  
> ⚡ Permission: `incidents:read`

```
GET {{baseUrl}}?page=1&limit=10&status=open&severity=high
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "incidents": [ ... ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

### 👥 Multi-Tenant Scoping:
- **Customers:** Only see incidents where `reportedBy` matches their own User ID.
- **Operators:** Only see incidents assigned to them OR incidents on cameras they are assigned to monitor.
- **Franchise Admins:** Scoped to all incidents within their franchise territory.
- **Admins:** Unrestricted system-wide visibility.

---

## 3. GET `/:id` — Get Incident Details

> 🔒 `Admin`, `Franchise Admin`, `Operator`, `Customer`  
> ⚡ Permission: `incidents:read`

```
GET {{baseUrl}}/{{incidentId}}
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "incident": {
      "_id": "{{incidentId}}",
      "title": "Suspicious Activity at Back Door",
      "description": "Individual attempting to open secured rear entrance at 02:15 AM.",
      "status": "open",
      "severity": "high",
      "type": "theft",
      "cameraId": {
        "_id": "{{cameraId}}",
        "name": "Front Gate Camera"
      },
      "reportedBy": {
        "_id": "668cust123...",
        "name": "Ramesh Kumar"
      },
      "assignedTo": null,
      "attachments": [ ... ],
      "notes": [ ... ],
      "isVerified": false,
      "createdAt": "2026-08-21T19:00:00.000Z"
    }
  }
}
```

---

## 4. PATCH `/:id/assign` — Assign Incident to Operator

> 🔒 `Admin`, `Franchise Admin`  
> ⚡ Permission: `incidents:write`

```
PATCH {{baseUrl}}/{{incidentId}}/assign
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "assignedTo": "{{operatorUserId}}"
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Incident assigned successfully",
  "data": {
    "incident": {
      "_id": "{{incidentId}}",
      "assignedTo": "{{operatorUserId}}",
      "status": "investigating"
    }
  }
}
```

**Side Effects:**
- The assigned Operator receives an `incident_assigned` WebSocket event and an instant push notification.

---

## 5. PATCH `/:id/status` — Update Incident Status

> 🔒 `Admin`, `Franchise Admin`, `Operator`  
> ⚡ Permission: `incidents:write`

```
PATCH {{baseUrl}}/{{incidentId}}/status
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "status": "resolved",
  "resolutionNotes": "Reviewed high-definition recording. Authorized technician verified on site."
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Incident status updated successfully",
  "data": {
    "incident": {
      "_id": "{{incidentId}}",
      "status": "resolved",
      "resolutionNotes": "Reviewed high-definition recording. Authorized technician verified on site."
    }
  }
}
```

---

## 6. POST `/:id/notes` — Add Note to Incident

> 🔒 `Admin`, `Franchise Admin`, `Operator`  
> ⚡ Permission: `incidents:write`

```
POST {{baseUrl}}/{{incidentId}}/notes
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "text": "Dispatched security patrol unit to inspect perimeter."
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Note added to incident",
  "data": {
    "incident": {
      "_id": "{{incidentId}}",
      "notes": [
        {
          "text": "Dispatched security patrol unit to inspect perimeter.",
          "author": "668op123...",
          "createdAt": "2026-08-21T19:10:00.000Z"
        }
      ]
    }
  }
}
```

---

## 7. POST `/:id/media` — Upload Additional Evidence Media

> 🔒 `Admin`, `Franchise Admin`, `Operator`  
> ⚡ Permission: `incidents:write`

```
POST {{baseUrl}}/{{incidentId}}/media
Authorization: Bearer {{accessToken}}
Content-Type: multipart/form-data
```

**Form-Data Body:**
- `media` (file): *Select up to 10 photos or video recordings*

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Media uploaded successfully",
  "data": {
    "attachments": [
      "https://res.cloudinary.com/.../incident_evidence_2.mp4"
    ]
  }
}
```

---

## 8. POST `/:id/verify` — Formally Verify Incident

> 🔒 `Admin`, `Franchise Admin`, `Operator`  
> ⚡ Permission: `incidents:write`

```
POST {{baseUrl}}/{{incidentId}}/verify
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "notes": "Confirmed breach attempt by reviewing camera 1 & 2 synchronised recordings."
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Incident verification updated",
  "data": {
    "incident": {
      "_id": "{{incidentId}}",
      "isVerified": true
    }
  }
}
```

---

## 9. GET `/:id/timeline` — Get Incident Activity Timeline

> 🔒 `Admin`, `Franchise Admin`, `Operator`, `Customer`  
> ⚡ Permission: `incidents:read`

```
GET {{baseUrl}}/{{incidentId}}/timeline
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
        "action": "INCIDENT_REPORTED",
        "description": "Incident reported by Ramesh Kumar",
        "createdAt": "2026-08-21T19:00:00.000Z"
      },
      {
        "action": "INCIDENT_ASSIGNED",
        "description": "Assigned to John Operator",
        "createdAt": "2026-08-21T19:05:00.000Z"
      }
    ]
  }
}
```

---

## 10. GET `/:id/report` — Generate Incident Report

> 🔒 `Admin`, `Franchise Admin`, `Operator`  
> ⚡ Permission: `incidents:read`

```
GET {{baseUrl}}/{{incidentId}}/report
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "generatedAt": "2026-08-21T19:30:00.000Z",
    "incident": { ... },
    "timeline": [ ... ],
    "summary": {
      "totalNotes": 2,
      "totalAttachments": 2,
      "isVerified": true,
      "severity": "high",
      "status": "resolved"
    }
  }
}
```

---

## 11. PATCH `/:id/close` — Close Incident

> 🔒 `Admin`, `Franchise Admin`, `Operator`  
> ⚡ Permission: `incidents:write`

```
PATCH {{baseUrl}}/{{incidentId}}/close
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "resolutionNotes": "Final case closed after police report and property owner sign-off."
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Incident closed successfully",
  "data": {
    "incident": {
      "_id": "{{incidentId}}",
      "status": "closed",
      "closedAt": "2026-08-21T19:35:00.000Z",
      "resolutionNotes": "Final case closed after police report and property owner sign-off."
    }
  }
}
```
