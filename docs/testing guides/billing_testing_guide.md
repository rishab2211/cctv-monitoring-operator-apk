# 🧪 Module 16: Billing, Payments & Subscriptions — Postman Testing Guide

**Base URLs:**
- Plans: `http://localhost:5000/api/v1/plans`
- Subscriptions: `http://localhost:5000/api/v1/subscriptions`
- Payments: `http://localhost:5000/api/v1/payments`
- Invoices: `http://localhost:5000/api/v1/invoices`

---

## 🛠 Postman Environment Setup

Add these to your environment variables:

| Variable | Value / Source |
|----------|---------------|
| `planId` | Set after Create Plan (`POST /plans`) |
| `subscriptionId` | Set after Create Subscription (`POST /subscriptions`) |
| `orderId` | Set after Create Payment Order (`POST /payments/create-order`) |
| `paymentId` | Set after Verify Payment / List Payments |
| `invoiceId` | Set after Create Subscription / List Invoices |
| `systemKey` | Set to your `SYSTEM_API_KEY` (e.g. `system_dev_secret_key`) |

---

## 📋 Testing Flow (Recommended Order)

```
Part A: Subscription Plans (/plans)
1. Create Plan (Admin)                  → test /plans POST
2. List Active Plans (Public/Customer)  → test /plans GET
3. Update Plan (Admin)                  → test /plans/:id PUT
4. Delete Plan (Admin)                  → test /plans/:id DELETE

Part B: Subscriptions (/subscriptions)
5. Create Subscription                  → test /subscriptions POST
6. List Subscriptions                   → test /subscriptions GET
7. Get Subscription Details             → test /subscriptions/:id GET
8. Renew Subscription                   → test /subscriptions/:id/renew PATCH
9. Cancel Subscription                  → test /subscriptions/:id/cancel PATCH

Part C: Razorpay Payments (/payments)
10. Create Razorpay Payment Order       → test /payments/create-order POST
11. Verify Payment (Webhook)            → test /payments/verify POST
12. List Payments                       → test /payments GET
13. Get Payment Details                 → test /payments/:id GET
14. Refund Payment (Admin)              → test /payments/:id/refund POST

Part D: Billing Invoices (/invoices)
15. List Invoices                       → test /invoices GET
16. Get Invoice Details                 → test /invoices/:id GET
17. Download Invoice PDF                → test /invoices/:id/download GET
```

---

# Part A: Subscription Plans (`/api/v1/plans`)

## 1. POST `/plans` — Create Plan

> 🔒 `Super Admin`, `Admin`  
> ⚡ Permission: `payments:write`

```
POST {{baseUrl}}/plans
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Pro 4-Camera Monitoring",
  "description": "24/7 AI-assisted monitoring and operator dispatch for up to 4 cameras.",
  "price": 2999,
  "durationMonths": 1,
  "cameraLimit": 4,
  "features": [
    "24/7 Live Monitoring",
    "AI Motion & Vehicle Detection",
    "Emergency SOS Dispatch",
    "7-Day Cloud Video Retention"
  ],
  "isActive": true
}
```

**Response `201`:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Plan created successfully",
  "data": {
    "plan": {
      "_id": "66901plan123...",
      "name": "Pro 4-Camera Monitoring",
      "price": 2999,
      "durationMonths": 1,
      "cameraLimit": 4,
      "isActive": true,
      "createdAt": "2026-08-21T23:00:00.000Z"
    }
  }
}
```

**Tests tab:**
```javascript
const res = pm.response.json();
pm.environment.set("planId", res.data.plan._id);
```

---

## 2. GET `/plans` — List Plans

> 🔒 Public (unauthenticated) or Authenticated

```
GET {{baseUrl}}/plans
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "plans": [ ... ],
    "count": 3
  }
}
```

---

## 3. PUT `/plans/:id` — Update Plan

> 🔒 `Super Admin`, `Admin`  
> ⚡ Permission: `payments:write`

```
PUT {{baseUrl}}/plans/{{planId}}
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "price": 3499,
  "description": "Updated 24/7 AI-assisted monitoring for up to 4 cameras."
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Plan updated successfully",
  "data": {
    "plan": {
      "_id": "{{planId}}",
      "price": 3499
    }
  }
}
```

---

## 4. DELETE `/plans/:id` — Delete Plan

> 🔒 `Super Admin`, `Admin`  
> ⚡ Permission: `payments:write`

```
DELETE {{baseUrl}}/plans/{{planId}}
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Plan deleted successfully"
}
```

---

# Part B: Subscriptions (`/api/v1/subscriptions`)

## 5. POST `/subscriptions` — Create Subscription

> 🔒 `Customer`, `Franchise Admin`, `Admin`

```
POST {{baseUrl}}/subscriptions
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "planId": "{{planId}}"
}
```

**Response `201`:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Subscription created successfully",
  "data": {
    "subscription": {
      "_id": "66901sub123...",
      "customerId": "{{userId}}",
      "planId": "{{planId}}",
      "status": "pending_payment",
      "startDate": "2026-08-21T00:00:00.000Z",
      "endDate": "2026-09-21T00:00:00.000Z"
    },
    "invoice": {
      "_id": "66901inv123...",
      "amount": 3499,
      "status": "pending"
    }
  }
}
```

**Tests tab:**
```javascript
const res = pm.response.json();
pm.environment.set("subscriptionId", res.data.subscription._id);
pm.environment.set("invoiceId", res.data.invoice._id);
```

---

## 6. GET `/subscriptions` — List Subscriptions

> 🔒 `Customer`, `Franchise Admin`, `Admin`

```
GET {{baseUrl}}/subscriptions?page=1&limit=10&status=active
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "subscriptions": [ ... ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

---

## 7. GET `/subscriptions/:id` — Get Subscription Details

> 🔒 `Customer`, `Franchise Admin`, `Admin`

```
GET {{baseUrl}}/subscriptions/{{subscriptionId}}
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "subscription": {
      "_id": "{{subscriptionId}}",
      "plan": { ... },
      "status": "active",
      "startDate": "2026-08-21T00:00:00.000Z",
      "endDate": "2026-09-21T00:00:00.000Z"
    }
  }
}
```

---

## 8. PATCH `/subscriptions/:id/renew` — Renew Subscription

> 🔒 `Customer`, `Franchise Admin`, `Admin`

```
PATCH {{baseUrl}}/subscriptions/{{subscriptionId}}/renew
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Subscription renewed successfully",
  "data": {
    "subscription": {
      "_id": "{{subscriptionId}}",
      "endDate": "2026-10-21T00:00:00.000Z"
    },
    "invoice": {
      "_id": "66901inv234...",
      "amount": 3499,
      "status": "pending"
    }
  }
}
```

---

## 9. PATCH `/subscriptions/:id/cancel` — Cancel Subscription

> 🔒 `Customer`, `Franchise Admin`, `Admin`

```
PATCH {{baseUrl}}/subscriptions/{{subscriptionId}}/cancel
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Subscription cancelled",
  "data": {
    "subscription": {
      "_id": "{{subscriptionId}}",
      "status": "canceled"
    }
  }
}
```

---

# Part C: Razorpay Payments (`/api/v1/payments`)

## 10. POST `/payments/create-order` — Create Razorpay Payment Order

> 🔒 `Customer`, `Franchise Admin`, `Admin`

```
POST {{baseUrl}}/payments/create-order
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "subscriptionId": "{{subscriptionId}}"
}
```

**Response `201`:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Payment order created",
  "data": {
    "orderId": "order_MUM12345678",
    "amount": 349900,
    "currency": "INR",
    "paymentId": "66901pay123...",
    "razorpayKeyId": "rzp_test_mockKey123"
  }
}
```

**Tests tab:**
```javascript
const res = pm.response.json();
pm.environment.set("orderId", res.data.orderId);
pm.environment.set("paymentId", res.data.paymentId);
```

---

## 11. POST `/payments/verify` — Verify Payment Webhook / Client Callback

> 🔒 Public (Signature verified with `RAZORPAY_KEY_SECRET`)

```
POST {{baseUrl}}/payments/verify
Content-Type: application/json
```

**Body:**
```json
{
  "razorpay_order_id": "{{orderId}}",
  "razorpay_payment_id": "pay_mockTest987654",
  "razorpay_signature": "mock_valid_hmac_sha256_signature"
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Payment verified and processed successfully",
  "data": {
    "payment": {
      "status": "paid"
    },
    "subscription": {
      "status": "active"
    }
  }
}
```

---

## 12. GET `/payments` — List Payments

> 🔒 `Customer`, `Franchise Admin`, `Admin`

```
GET {{baseUrl}}/payments?page=1&limit=10
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "payments": [ ... ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

---

## 13. GET `/payments/:id` — Get Payment Details

> 🔒 `Customer`, `Franchise Admin`, `Admin`

```
GET {{baseUrl}}/payments/{{paymentId}}
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "payment": {
      "_id": "{{paymentId}}",
      "orderId": "{{orderId}}",
      "amount": 3499,
      "status": "paid",
      "paymentMethod": "razorpay_upi"
    }
  }
}
```

---

## 14. POST `/payments/:id/refund` — Refund Payment

> 🔒 `Super Admin`, `Admin`  
> ⚡ Permission: `payments:write`

```
POST {{baseUrl}}/payments/{{paymentId}}/refund
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

**Body:**
```json
{
  "reason": "Customer cancellation within 7-day trial period."
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Payment refunded successfully",
  "data": {
    "payment": {
      "_id": "{{paymentId}}",
      "status": "refunded",
      "refundReason": "Customer cancellation within 7-day trial period."
    }
  }
}
```

---

# Part D: Billing Invoices (`/api/v1/invoices`)

## 15. GET `/invoices` — List Invoices

> 🔒 `Customer`, `Franchise Admin`, `Admin`

```
GET {{baseUrl}}/invoices?page=1&limit=10&status=paid
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "invoices": [ ... ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

---

## 16. GET `/invoices/:id` — Get Invoice Details

> 🔒 `Customer`, `Franchise Admin`, `Admin`

```
GET {{baseUrl}}/invoices/{{invoiceId}}
Authorization: Bearer {{accessToken}}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "invoice": {
      "_id": "{{invoiceId}}",
      "invoiceNumber": "INV-2026-0001",
      "amount": 3499,
      "status": "paid",
      "dueDate": "2026-08-28T00:00:00.000Z"
    }
  }
}
```

---

## 17. GET `/invoices/:id/download` — Download Invoice PDF

> 🔒 `Customer`, `Franchise Admin`, `Admin`

```
GET {{baseUrl}}/invoices/{{invoiceId}}/download
Authorization: Bearer {{accessToken}}
```

**Response `200`:** Returns PDF binary file download attachment (`Content-Type: application/pdf` or download url).
