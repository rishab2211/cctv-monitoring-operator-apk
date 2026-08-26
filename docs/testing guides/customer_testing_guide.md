# 🧪 Module 15: Customer Self-Service Panel — Postman Testing Guide

**Base URL:** `http://localhost:5000/api/v1/customer` *(singular — Logged-in Customer Panel)*  
*(Note: `/api/v1/customers` plural handles administrative user CRUD)*

---

## 🛠 Postman Environment Setup

Add these to your environment variables:

| Variable | Value / Source |
|----------|---------------|
| `customerToken` | Access token for logged-in Customer |
| `cameraId` | Valid Camera ID owned by this Customer |
| `familyUserId` | Valid User ID of family member to share with |
| `systemKey` | Set to your `SYSTEM_API_KEY` (e.g. `system_dev_secret_key`) |

---

## 📋 Testing Flow (Recommended Order)

```
1. Customer Registration & Login       → test /auth/register & /auth/login
2. Subscribe to Plan                   → test /customer/subscribe POST
3. Get Unified Customer Dashboard      → test /customer/dashboard GET
4. List Customer Cameras               → test /customer/cameras GET
5. Live Stream Connection URL          → test /customer/cameras/:id/live GET
6. Video Playback & Aliases            → test /customer/cameras/:id/playback GET
7. Share Camera with Family Member     → test /customer/cameras/:id/share POST
8. Revoke Camera Share                 → test /customer/cameras/:id/share/:userId DELETE
9. View Active Subscription            → test /customer/subscription GET
10. List Invoices / Payments           → test /customer/invoices GET
11. View In-App Notifications          → test /customer/notifications GET
12. View My Reported Incidents         → test /customer/reports GET
13. Get Customer Profile               → test /customer/profile GET
14. Update Customer Profile            → test /customer/profile PUT
15. Cancel Subscription                → test /customer/cancel-subscription POST
```

---

## 1. POST `/subscribe` — Subscribe to a Plan

> 🔒 `Customer`  
> ⚡ Role-enforced

```
POST {{baseUrl}}/subscribe
Authorization: Bearer {{customerToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "planName": "Premium",
  "durationMonths": 12
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Subscription created successfully",
  "data": {
    "subscription": {
      "_id": "66901sub123...",
      "customerId": "{{customerUserId}}",
      "planName": "Premium",
      "status": "active",
      "startDate": "2026-08-21T00:00:00.000Z",
      "endDate": "2027-08-21T00:00:00.000Z"
    },
    "invoice": {
      "_id": "66901inv123...",
      "amount": 11999,
      "status": "paid"
    }
  }
}
```

### 🛑 Edge Cases
- Subscribing when an active subscription already exists returns `400 Bad Request`.

---

## 2. GET `/dashboard` — Unified Customer Dashboard

Aggregates all critical data into a single payload for the mobile app home screen.

```
GET {{baseUrl}}/dashboard
Authorization: Bearer {{customerToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "customer": {
      "name": "Ramesh Kumar",
      "email": "ramesh@example.com",
      "phone": "9444444444",
      "franchiseContact": {
        "name": "Acme Security Franchise",
        "phone": "+91 9820012345"
      }
    },
    "subscription": {
      "planName": "Premium",
      "status": "active",
      "endDate": "2027-08-21T00:00:00.000Z"
    },
    "cameraStats": {
      "total": 4,
      "online": 3,
      "offline": 1,
      "maintenance": 0
    },
    "cameras": [ ... ],
    "recentIncidents": [ ... ],
    "activeSosAlerts": [ ... ]
  }
}
```

---

## 3. GET `/cameras` — List Owned & Shared Cameras

```
GET {{baseUrl}}/cameras
Authorization: Bearer {{customerToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "cameras": [
      {
        "_id": "{{cameraId}}",
        "name": "Front Gate Camera",
        "status": "online",
        "isOwner": true
      }
    ],
    "count": 1
  }
}
```

---

## 4. GET `/cameras/:id/live` — Live Stream Connection URL

> 🔒 Requires active subscription.

```
GET {{baseUrl}}/cameras/{{cameraId}}/live
Authorization: Bearer {{customerToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "streamToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "webrtcUrl": "http://localhost:9997/cam-fg-1004",
    "hlsUrl": "http://localhost:9997/cam-fg-1004/index.m3u8",
    "tokenExpiresIn": "24h"
  }
}
```

### 🛑 Negative Test (Subscription Gating)
- Calling without an active subscription returns `403 Forbidden: "Active subscription required to view camera streams"`.

---

## 5. GET `/cameras/:id/playback` — Video Playback & Query Aliases

> 🔒 Requires active subscription.

### Supports both query parameter conventions:
- `?start=2026-08-21T08:00:00Z&end=2026-08-21T10:00:00Z`
- `?startTime=2026-08-21T08:00:00Z&endTime=2026-08-21T10:00:00Z`

```
GET {{baseUrl}}/cameras/{{cameraId}}/playback?startTime=2026-08-21T08:00:00Z&endTime=2026-08-21T10:00:00Z
Authorization: Bearer {{customerToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "chunks": [
      {
        "_id": "6695rec123...",
        "startTime": "2026-08-21T09:00:00.000Z",
        "endTime": "2026-08-21T09:15:00.000Z",
        "url": "https://res.cloudinary.com/.../recording_1.mp4",
        "durationSeconds": 900
      }
    ],
    "count": 1
  }
}
```

---

## 6. POST `/cameras/:id/share` — Share Camera with Family

```
POST {{baseUrl}}/cameras/{{cameraId}}/share
Authorization: Bearer {{customerToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "email": "priya.kumar@example.com"
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Camera shared successfully",
  "data": {
    "camera": {
      "_id": "{{cameraId}}",
      "sharedWith": ["{{familyUserId}}"]
    }
  }
}
```

---

## 7. DELETE `/cameras/:id/share/:userId` — Revoke Camera Share

```
DELETE {{baseUrl}}/cameras/{{cameraId}}/share/{{familyUserId}}
Authorization: Bearer {{customerToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Camera access revoked successfully"
}
```

---

## 8. GET `/subscription` — Get Active Subscription

```
GET {{baseUrl}}/subscription
Authorization: Bearer {{customerToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "subscription": {
      "planName": "Premium",
      "status": "active",
      "startDate": "2026-08-21T00:00:00.000Z",
      "endDate": "2027-08-21T00:00:00.000Z"
    }
  }
}
```

---

## 9. GET `/invoices` (or `/payments`) — List Invoices

```
GET {{baseUrl}}/invoices?page=1&limit=10
Authorization: Bearer {{customerToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "invoices": [
      {
        "_id": "66901inv123...",
        "invoiceNumber": "INV-2026-0001",
        "amount": 11999,
        "currency": "INR",
        "status": "paid",
        "createdAt": "2026-08-21T00:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

---

## 10. GET `/notifications` — Customer In-App Notifications

```
GET {{baseUrl}}/notifications?page=1&limit=10
Authorization: Bearer {{customerToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "notifications": [ ... ],
    "total": 1
  }
}
```

---

## 11. GET `/reports` — My Reported Incidents

```
GET {{baseUrl}}/reports
Authorization: Bearer {{customerToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "incidents": [ ... ],
    "total": 1
  }
}
```

---

## 12. GET `/profile` — Get Customer Profile

```
GET {{baseUrl}}/profile
Authorization: Bearer {{customerToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "{{customerUserId}}",
      "name": "Ramesh Kumar",
      "email": "ramesh@example.com",
      "phone": "9444444444",
      "avatar": "https://res.cloudinary.com/.../avatar.jpg"
    }
  }
}
```

---

## 13. PUT `/profile` — Update Customer Profile

```
PUT {{baseUrl}}/profile
Authorization: Bearer {{customerToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Ramesh K. Sharma",
  "phone": "9444455555"
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "name": "Ramesh K. Sharma",
      "phone": "9444455555"
    }
  }
}
```

---

## 14. POST `/cancel-subscription` — Cancel Subscription

```
POST {{baseUrl}}/cancel-subscription
Authorization: Bearer {{customerToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Subscription cancelled. Access retained until period end.",
  "data": {
    "subscription": {
      "status": "canceled"
    }
  }
}
```
