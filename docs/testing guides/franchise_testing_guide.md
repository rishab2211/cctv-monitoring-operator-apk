# 🧪 Module 12: Franchise Management — Postman Testing Guide

**Base URL:** `http://localhost:5000/api/v1/franchises`

---

## 🛠 Postman Environment Setup

Add these to your environment variables:

| Variable | Value / Source |
|----------|---------------|
| `franchiseId` | Set after Create Franchise (`POST /franchises`) |
| `franchiseOwnerId` | User ID of a user with role `franchise` |
| `leadId` | Set after Create Lead (`POST /franchises/:id/leads`) |
| `userId` | User ID of a Customer or Operator to assign |
| `systemKey` | Set to your `SYSTEM_API_KEY` (e.g. `system_dev_secret_key`) |

> **Multi-Tenant Security Scoping (v2.0):**  
> All franchise-scoped routes automatically enforce territorial isolation. A `franchise` owner or `franchise_admin` cannot view or mutate another franchise's data; attempts will return `403 Forbidden` or `404 Not Found`.

---

## 📋 Testing Flow (Recommended Order)

```
1. Create Franchise (as Admin)            → test / POST
2. List All Franchises (as Admin)         → test / GET
3. View Franchise Details                 → test /:id GET
4. Set Territory Boundaries (Admin)       → test /:id/territory PUT
5. Get Territory Configuration            → test /:id/territory GET
6. Assign User to Franchise (Admin)       → test /:id/users/:userId POST
7. Get Franchise Customers                → test /:id/customers GET
8. Create Franchise Sales Lead (CRM)      → test /:id/leads POST
9. List Franchise CRM Leads               → test /:id/leads GET
10. Update Franchise Sales Lead           → test /:id/leads/:leadId PUT
11. Commission Earnings Report            → test /:id/commission GET
12. Royalty Payable Report                → test /:id/royalty GET
13. Sales Summary Report                  → test /:id/sales GET
14. Suspend/Update Franchise Status       → test /:id PUT
```

---

## 1. POST `/` — Create Franchise

> 🔒 `Super Admin`, `Admin`  
> ⚡ Permission: `franchises:write`

```
POST {{baseUrl}}
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Acme Security Franchise — Mumbai West",
  "franchiseCode": "ACME-MUM-01",
  "ownerId": "{{franchiseOwnerId}}",
  "contactEmail": "hello@acmesecurity.com",
  "contactPhone": "9820012345"
}
```

**Response `201`:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Franchise created successfully",
  "data": {
    "franchise": {
      "_id": "66901fran123...",
      "name": "Acme Security Franchise — Mumbai West",
      "franchiseCode": "ACME-MUM-01",
      "ownerId": "{{franchiseOwnerId}}",
      "status": "active",
      "leads": [],
      "createdAt": "2026-08-21T20:00:00.000Z"
    }
  }
}
```

**Tests tab:**
```javascript
const res = pm.response.json();
pm.environment.set("franchiseId", res.data.franchise._id);
```

### 🛑 Edge Cases
| Scenario | Expected |
|----------|----------|
| `ownerId` does not have `franchise` role | `400` — "User must have the franchise role" |
| Duplicate `franchiseCode` | `409` — "Franchise code already exists" |
| Non-admin attempting creation | `403` — Insufficient permissions |

---

## 2. GET `/` — List Franchises

> 🔒 `Super Admin`, `Admin`  
> ⚡ Permission: `franchises:read`

```
GET {{baseUrl}}
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "franchises": [
      {
        "_id": "{{franchiseId}}",
        "name": "Acme Security Franchise — Mumbai West",
        "franchiseCode": "ACME-MUM-01",
        "status": "active",
        "cameraCount": 14,
        "customerCount": 6,
        "operatorCount": 2
      }
    ],
    "count": 1
  }
}
```

---

## 3. GET `/:id` — View Franchise Details

> 🔒 `Admin`, `Franchise`, `Franchise Admin`  
> ⚡ Permission: `franchises:read`

```
GET {{baseUrl}}/{{franchiseId}}
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "franchise": {
      "_id": "{{franchiseId}}",
      "name": "Acme Security Franchise — Mumbai West",
      "franchiseCode": "ACME-MUM-01",
      "owner": {
        "_id": "{{franchiseOwnerId}}",
        "name": "Ramesh Franchise Owner",
        "email": "hello@acmesecurity.com"
      },
      "territory": {
        "city": "Mumbai",
        "state": "Maharashtra",
        "zone": "West"
      },
      "status": "active"
    }
  }
}
```

---

## 4. PUT `/:id/territory` — Set Territory Boundaries

> 🔒 `Super Admin`, `Admin`  
> ⚡ Permission: `franchises:write`

```
PUT {{baseUrl}}/{{franchiseId}}/territory
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "city": "Mumbai",
  "state": "Maharashtra",
  "zone": "West",
  "description": "Western suburbs from Bandra to Borivali."
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Territory updated successfully",
  "data": {
    "territory": {
      "city": "Mumbai",
      "state": "Maharashtra",
      "zone": "West",
      "description": "Western suburbs from Bandra to Borivali."
    }
  }
}
```

---

## 5. GET `/:id/territory` — Get Territory Configuration

> 🔒 `Admin`, `Franchise`, `Franchise Admin`  
> ⚡ Permission: `franchises:read`

```
GET {{baseUrl}}/{{franchiseId}}/territory
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "territory": {
      "city": "Mumbai",
      "state": "Maharashtra",
      "zone": "West",
      "description": "Western suburbs from Bandra to Borivali."
    }
  }
}
```

---

## 6. POST `/:id/users/:userId` — Assign User to Franchise

> 🔒 `Super Admin`, `Admin`  
> ⚡ Permission: `franchises:write`

Places a `customer` or `operator` under this franchise's jurisdiction.

```
POST {{baseUrl}}/{{franchiseId}}/users/{{userId}}
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User assigned to franchise successfully"
}
```

### 🛑 Edge Cases
- Assigning an admin or another franchise owner returns `400 Bad Request`.

---

## 7. GET `/:id/customers` — Get Franchise Customers

> 🔒 `Admin`, `Franchise`, `Franchise Admin`  
> ⚡ Permission: `franchises:read`

```
GET {{baseUrl}}/{{franchiseId}}/customers
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "customers": [
      {
        "_id": "668cust...",
        "name": "Ramesh Kumar",
        "email": "ramesh@example.com",
        "cameraCount": 4
      }
    ],
    "count": 1
  }
}
```

---

## 8. POST `/:id/leads` — Create Franchise Lead (CRM)

> 🔒 `Admin`, `Franchise`, `Franchise Admin`  
> ⚡ Permission: `franchises:write`

```
POST {{baseUrl}}/{{franchiseId}}/leads
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Priya Sharma",
  "phone": "9876543210",
  "email": "priya@example.com",
  "status": "new",
  "notes": "Interested in 4-camera smart monitoring bundle."
}
```

**Response `201`:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Lead created successfully",
  "data": {
    "lead": {
      "_id": "66901lead123...",
      "name": "Priya Sharma",
      "phone": "9876543210",
      "status": "new",
      "notes": "Interested in 4-camera smart monitoring bundle.",
      "createdAt": "2026-08-21T20:15:00.000Z"
    }
  }
}
```

**Tests tab:**
```javascript
const res = pm.response.json();
pm.environment.set("leadId", res.data.lead._id);
```

---

## 9. GET `/:id/leads` — List Franchise CRM Leads

> 🔒 `Admin`, `Franchise`, `Franchise Admin`  
> ⚡ Permission: `franchises:read`

```
GET {{baseUrl}}/{{franchiseId}}/leads
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "leads": [ ... ],
    "count": 1
  }
}
```

---

## 10. PUT `/:id/leads/:leadId` — Update Franchise Sales Lead

> 🔒 `Admin`, `Franchise`, `Franchise Admin`  
> ⚡ Permission: `franchises:write`

```
PUT {{baseUrl}}/{{franchiseId}}/leads/{{leadId}}
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "status": "converted",
  "notes": "Customer onboarded. Installation scheduled."
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lead updated successfully",
  "data": {
    "lead": {
      "_id": "{{leadId}}",
      "status": "converted",
      "notes": "Customer onboarded. Installation scheduled."
    }
  }
}
```

---

## 11. GET `/:id/commission` — Commission Earnings Report

> 🔒 `Admin`, `Franchise`, `Franchise Admin`  
> ⚡ Permission: `franchises:read`

```
GET {{baseUrl}}/{{franchiseId}}/commission
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "franchiseName": "Acme Security Franchise — Mumbai West",
    "period": "2026-08",
    "customerCount": 6,
    "monthlyRevenue": 12000,
    "commissionRate": "15%",
    "commissionEarned": 1800
  }
}
```

---

## 12. GET `/:id/royalty` — Royalty Payable Report

> 🔒 `Admin`, `Franchise`, `Franchise Admin`  
> ⚡ Permission: `franchises:read`

```
GET {{baseUrl}}/{{franchiseId}}/royalty
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "franchiseName": "Acme Security Franchise — Mumbai West",
    "period": "2026-08",
    "grossRevenue": 12000,
    "royaltyRate": "5%",
    "royaltyDue": 600
  }
}
```

---

## 13. GET `/:id/sales` — Sales Summary Report

> 🔒 `Admin`, `Franchise`, `Franchise Admin`  
> ⚡ Permission: `franchises:read`

```
GET {{baseUrl}}/{{franchiseId}}/sales
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "totalCustomers": 6,
    "activeCustomers": 6,
    "newThisMonth": 2,
    "convertedLeads": 3,
    "totalLeads": 5
  }
}
```

---

## 14. PUT `/:id` — Suspend / Update Franchise Status

> 🔒 `Super Admin`, `Admin`  
> ⚡ Permission: `franchises:write`

```
PUT {{baseUrl}}/{{franchiseId}}
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "status": "suspended"
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Franchise updated successfully"
}
```

### 🛑 Suspension Login Enforcement:
1. Attempting login as Franchise Owner returns `403 Forbidden: "Your franchise account is suspended"`.
2. Attempting login as an Operator assigned to this Franchise returns `403 Forbidden: "Your assigned franchise is suspended"`.
