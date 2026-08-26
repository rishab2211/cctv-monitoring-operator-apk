# 🧪 Module 19: Support Tickets — Postman Testing Guide

**Base URL:** `http://localhost:5000/api/v1/tickets`

---

## 🛠 Postman Environment Setup

Add these to your environment variables:

| Variable | Value / Source |
|----------|---------------|
| `ticketId` | Set after Create Ticket (`POST /tickets`) |
| `assignedAgentId` | User ID of Operator or Admin assigned to ticket |
| `systemKey` | Set to your `SYSTEM_API_KEY` (e.g. `system_dev_secret_key`) |

---

## 📋 Testing Flow (Recommended Order)

```
1. Create Support Ticket (Customer/Operator)   → test /tickets POST
2. List Support Tickets (Multi-Tenant Scoped)  → test /tickets GET
3. Get Ticket Details (with nested comments)   → test /tickets/:id GET
4. Assign Ticket to Support Agent (Admin)      → test /tickets/:id/assign PATCH
5. Update Ticket Priority / Details            → test /tickets/:id PUT
6. Add Comment / Message to Thread             → test /tickets/:id/comments POST
7. Update Ticket Status (in_progress/resolved) → test /tickets/:id/status PATCH
8. Close Ticket                                → test /tickets/:id/close PATCH
9. Customer Reopen on Comment (Edge Case)      → test /tickets/:id/comments POST (re-opens)
```

---

## 1. POST `/` — Create Support Ticket

> 🔒 `Customer`, `Operator`, `Technician`, `Franchise Admin`, `Admin`

```
POST {{baseUrl}}
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Front Gate Camera live stream failing to connect",
  "description": "The camera indicates offline status on the mobile app since 08:00 AM. Rebooted the local router but stream still fails.",
  "category": "technical",
  "priority": "high"
}
```

**Response `201`:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Ticket created successfully",
  "data": {
    "ticket": {
      "_id": "66901tkt123...",
      "ticketNumber": "TKT-2026-0001",
      "title": "Front Gate Camera live stream failing to connect",
      "description": "The camera indicates offline status on the mobile app since 08:00 AM. Rebooted the local router but stream still fails.",
      "category": "technical",
      "priority": "high",
      "status": "open",
      "createdBy": "668cust123...",
      "assignedTo": null,
      "comments": [],
      "createdAt": "2026-08-22T00:00:00.000Z"
    }
  }
}
```

**Tests tab:**
```javascript
const res = pm.response.json();
pm.environment.set("ticketId", res.data.ticket._id);
```

---

## 2. GET `/` — List Tickets (Multi-Tenant Scoped)

> 🔒 `Customer`, `Operator`, `Technician`, `Franchise Admin`, `Admin`

```
GET {{baseUrl}}?page=1&limit=10&status=open&priority=high
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "tickets": [ ... ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

### 👥 Multi-Tenant Scoping:
- **Customers / Operators / Technicians:** See only tickets they created (`createdBy === user._id`).
- **Franchise Admins:** See all tickets filed by users registered within their franchise territory.
- **Admins:** Full system-wide visibility.

---

## 3. GET `/:id` — Get Ticket Details

> 🔒 Ticket Creator, Assigned Agent, `Admin`

```
GET {{baseUrl}}/{{ticketId}}
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "ticket": {
      "_id": "{{ticketId}}",
      "ticketNumber": "TKT-2026-0001",
      "title": "Front Gate Camera live stream failing to connect",
      "description": "The camera indicates offline status on the mobile app since 08:00 AM.",
      "category": "technical",
      "priority": "high",
      "status": "open",
      "createdBy": {
        "_id": "668cust123...",
        "name": "Ramesh Kumar",
        "email": "ramesh@example.com"
      },
      "assignedTo": null,
      "comments": [ ... ],
      "createdAt": "2026-08-22T00:00:00.000Z"
    }
  }
}
```

---

## 4. PATCH `/:id/assign` — Assign Ticket to Support Agent

> 🔒 `Super Admin`, `Admin`, `Franchise Admin`

```
PATCH {{baseUrl}}/{{ticketId}}/assign
Authorization: Bearer {{adminToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "assignedTo": "{{assignedAgentId}}"
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Ticket assigned successfully",
  "data": {
    "ticket": {
      "_id": "{{ticketId}}",
      "assignedTo": "{{assignedAgentId}}",
      "status": "in_progress"
    }
  }
}
```

---

## 5. PUT `/:id` — Update Ticket Priority / Details

> 🔒 `Admin`, `Franchise Admin`

```
PUT {{baseUrl}}/{{ticketId}}
Authorization: Bearer {{adminToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "priority": "critical",
  "category": "technical"
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Ticket updated successfully",
  "data": {
    "ticket": {
      "_id": "{{ticketId}}",
      "priority": "critical"
    }
  }
}
```

---

## 6. POST `/:id/comments` — Add Comment / Reply to Thread

> 🔒 Ticket Creator, Assigned Agent, `Admin`

```
POST {{baseUrl}}/{{ticketId}}/comments
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "text": "Technician dispatched to inspect on-site PoE switch and cable connections."
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Comment added successfully",
  "data": {
    "ticket": {
      "_id": "{{ticketId}}",
      "comments": [
        {
          "author": "668admin123...",
          "text": "Technician dispatched to inspect on-site PoE switch and cable connections.",
          "createdAt": "2026-08-22T00:15:00.000Z"
        }
      ]
    }
  }
}
```

> 💡 **Auto-Reopen Mechanic:** If a customer adds a comment to a `closed` or `resolved` ticket, the backend automatically transitions `status` back to `in_progress`.

---

## 7. PATCH `/:id/status` — Update Ticket Status

> 🔒 `Admin`, `Franchise Admin`, `Assigned Agent`

```
PATCH {{baseUrl}}/{{ticketId}}/status
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "status": "resolved"
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Ticket status updated",
  "data": {
    "ticket": {
      "_id": "{{ticketId}}",
      "status": "resolved"
    }
  }
}
```

---

## 8. PATCH `/:id/close` — Close Ticket

> 🔒 `Admin`, `Franchise Admin`, `Ticket Creator`

```
PATCH {{baseUrl}}/{{ticketId}}/close
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Ticket closed successfully",
  "data": {
    "ticket": {
      "_id": "{{ticketId}}",
      "status": "closed",
      "closedAt": "2026-08-22T00:30:00.000Z"
    }
  }
}
```
