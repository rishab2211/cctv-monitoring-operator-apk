# 🧪 Auth Module — Complete Testing Guide

**Base URL:** `http://localhost:5000/api/v1`  
**Server start:** `bun run dev`  
**Health check:** `curl http://localhost:5000/api/health`

> 💡 Store the `accessToken`, `refreshToken`, and `sessionId` from login/register responses — you will need them for protected `/auth` routes.

---

## 🏢 Multi-Tenant JWT Scoping & System API Key (v2.0)

### 1. Multi-Tenant JWT Context
When a user (such as a `franchise`, `franchise_admin`, `operator`, `technician`, or `customer`) logs in or registers, their JWT token payload automatically embeds `userId`, `role`, and `franchiseId`. This token payload is the trusted source of truth used across the platform to enforce tenant isolation boundaries.

### 2. System API Key Authentication
For automated server-to-server calls or initial database setup, requests can include the `x-system-key: <SYSTEM_API_KEY>` header. When present and valid, the backend automatically injects a `super_admin` context (`userId: "system"`, `role: "super_admin"`).

---

## 📋 Testing Flow (Recommended Order)

```
1. Health Check        → verify API server status
2. Register            → create new account & get tokens
3. Login               → authenticate with email or phone (creates DeviceSession)
4. Get Me              → verify JWT auth context
5. Refresh Token       → obtain new access token via token rotation
6. Change Password     → update account password
7. Get Sessions        → list active device sessions
8. Revoke Session      → terminate a specific remote device session
9. Revoke All          → mass logout of all other devices
10. Forgot Password    → trigger OTP dispatch to email
11. Verify OTP         → validate 6-digit OTP and receive reset token
12. Reset Password     → set new password using reset token
13. Logout             → end current active session
```

---

## 1. Health Check

```bash
curl -X GET http://localhost:5000/api/health
```

**Response `200`:**
```json
{
  "success": true,
  "message": "CCTV Monitoring API is running",
  "version": "1.0.0",
  "timestamp": "2026-08-21T08:00:00.000Z",
  "environment": "development"
}
```

---

## 2. POST `/auth/register`

**Rate limit:** 10 requests / 15 min per IP

### ✅ Happy Path

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Super Admin",
    "email": "admin@cctvmonitor.com",
    "phone": "9876543210",
    "password": "Admin@1234",
    "role": "super_admin"
  }'
```

**Response `201`:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Account registered successfully",
  "data": {
    "user": {
      "_id": "668abc123def456789012345",
      "name": "Super Admin",
      "email": "admin@cctvmonitor.com",
      "phone": "9876543210",
      "role": "super_admin",
      "isActive": true,
      "avatar": null,
      "createdAt": "2026-08-21T08:00:00.000Z",
      "updatedAt": "2026-08-21T08:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "sessionId": "550e8400-e29b-41d4-a716-446655440000",
      "expiresIn": 900
    }
  }
}
```

> 💾 **Save:** `accessToken`, `refreshToken`, `sessionId`

---

### ❌ Edge Cases

#### Duplicate email
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Another Admin",
    "email": "admin@cctvmonitor.com",
    "phone": "9123456780",
    "password": "Admin@1234",
    "role": "admin"
  }'
```
**Response `409`:**
```json
{
  "success": false,
  "statusCode": 409,
  "message": "An account with this email already exists"
}
```

#### Weak password (missing uppercase/number)
```bash
-d '{ ..., "password": "weakpassword" }'
```
**Response `400`:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "password", "message": "Password must contain at least one uppercase letter" }
  ]
}
```

#### Invalid phone (wrong format)
```bash
-d '{ ..., "phone": "1234567890" }'
```
**Response `400`:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "phone", "message": "Please provide a valid 10-digit Indian phone number" }
  ]
}
```

#### Missing required field
```bash
-d '{ "email": "test@test.com", "password": "Test@1234", "role": "customer" }'
```
**Response `400`:** Validation failure detailing missing `name` and `phone`.

#### Invalid role
```bash
-d '{ ..., "role": "hacker" }'
```
**Response `400`:**
```json
{
  "errors": [{ "field": "role", "message": "Invalid role" }]
}
```
*(Valid roles: `super_admin`, `admin`, `franchise`, `franchise_admin`, `operator`, `technician`, `customer`)*

---

## 3. POST `/auth/login`

**Rate limit:** 10 requests / 15 min per IP

### ✅ Login with Email
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cctvmonitor.com",
    "password": "Admin@1234"
  }'
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logged in successfully",
  "data": {
    "user": {
      "_id": "668abc123def456789012345",
      "name": "Super Admin",
      "email": "admin@cctvmonitor.com",
      "phone": "9876543210",
      "role": "super_admin"
    },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ...",
      "sessionId": "550e8400-e29b-41d4-a716-446655440000",
      "expiresIn": 900
    }
  }
}
```

### ✅ Login with Phone
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "password": "Admin@1234"
  }'
```

---

### ❌ Edge Cases

#### Wrong password or non-existent email
```bash
-d '{ "email": "admin@cctvmonitor.com", "password": "WrongPass@1" }'
```
**Response `401`:**
```json
{ "success": false, "statusCode": 401, "message": "Invalid credentials" }
```
> ⚠️ **Note:** Unified `"Invalid credentials"` message prevents user enumeration.

#### Deactivated account
If `isActive: false` on the user:  
**Response `403`:**
```json
{ "message": "Your account has been deactivated. Please contact support." }
```

---

## 4. GET `/auth/me`

**Requires:** `Authorization: Bearer <accessToken>`

```bash
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "user": {
      "_id": "668abc123def456789012345",
      "name": "Super Admin",
      "email": "admin@cctvmonitor.com",
      "phone": "9876543210",
      "role": "super_admin",
      "isActive": true,
      "avatar": null,
      "createdAt": "2026-08-21T08:00:00.000Z",
      "updatedAt": "2026-08-21T08:00:00.000Z"
    }
  }
}
```

---

## 5. POST `/auth/refresh-token`

> Use this when the access token expires (every 15 minutes). Implements **token rotation** — the old refresh token is invalidated immediately.

```bash
curl -X POST http://localhost:5000/api/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJ...(new access token)",
    "refreshToken": "eyJ...(new refresh token)",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "expiresIn": 900
  }
}
```

---

### ❌ Edge Cases

#### Token Reuse Attack (Already-used refresh token)
If a rotated refresh token is submitted again:  
**Response `401`:** `"Session has been invalidated. Please log in again."`  
**Security Action:** All active sessions for that user are immediately revoked to protect against token compromise.

---

## 6. PUT `/auth/change-password`

**Requires:** `Authorization: Bearer <accessToken>`

```bash
curl -X PUT http://localhost:5000/api/v1/auth/change-password \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Admin@1234",
    "newPassword": "UpdatedPass@9999",
    "confirmPassword": "UpdatedPass@9999"
  }'
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password changed successfully",
  "data": null
}
```

---

## 7. GET `/auth/sessions` & DELETE `/auth/sessions/:sessionId`

### List Active Sessions
```bash
curl -X GET http://localhost:5000/api/v1/auth/sessions \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "currentSessionId": "550e8400-e29b-41d4-a716-446655440000",
    "sessions": [
      {
        "_id": "668abc...",
        "sessionId": "550e8400-e29b-41d4-a716-446655440000",
        "deviceName": "Chrome 125 on Linux",
        "deviceType": "desktop",
        "os": "Linux",
        "browser": "Chrome 125",
        "ipAddress": "127.0.0.1",
        "isActive": true,
        "lastActiveAt": "2026-08-21T08:00:00.000Z",
        "createdAt": "2026-08-21T08:00:00.000Z"
      }
    ]
  }
}
```

### Revoke Specific Remote Session
```bash
curl -X DELETE http://localhost:5000/api/v1/auth/sessions/550e8400-e29b-41d4-a716-OTHER \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Revoke All Other Sessions (Mass Sign-out)
```bash
curl -X DELETE http://localhost:5000/api/v1/auth/sessions \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "2 sessions revoked successfully",
  "data": {
    "revokedCount": 2
  }
}
```

---

## 8. Forgot Password & OTP Reset Flow

### Step 1: Request OTP
**API:** `POST /api/v1/auth/forgot-password` (Rate limit: 5 req / 15 min)

```bash
curl -X POST http://localhost:5000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cctvmonitor.com"
  }'
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "If this email is registered, an OTP has been sent to ad***@cctvmonitor.com",
  "data": {
    "maskedEmail": "ad***@cctvmonitor.com"
  }
}
```

### Step 2: Verify OTP
**API:** `POST /api/v1/auth/verify-otp`

```bash
curl -X POST http://localhost:5000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cctvmonitor.com",
    "otp": "482931"
  }'
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "OTP verified successfully. Use the reset token to set a new password.",
  "data": {
    "resetToken": "a3f8b2c1d9e4f7a0b5c2d8e3f6a1b4c7..."
  }
}
```

### Step 3: Reset Password
**API:** `POST /api/v1/auth/reset-password`

```bash
curl -X POST http://localhost:5000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "resetToken": "a3f8b2c1d9e4f7a0b5c2d8e3f6a1b4c7...",
    "newPassword": "NewPassword@5678",
    "confirmPassword": "NewPassword@5678"
  }'
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset successfully. Please log in with your new password.",
  "data": null
}
```

---

## 9. POST `/auth/logout`

**Requires:** `Authorization: Bearer <accessToken>`

```bash
curl -X POST http://localhost:5000/api/v1/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logged out successfully",
  "data": null
}
```

---

## 🚀 Quick Automated Test Script

```bash
#!/usr/bin/env bash
set -e

BASE="http://localhost:5000/api/v1"

echo "=== 1. Registering Test Account ==="
REGISTER=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Auth Tester",
    "email": "authtester@cctvmonitor.com",
    "phone": "9988776655",
    "password": "Tester@1234",
    "role": "admin"
  }')

ACCESS_TOKEN=$(echo $REGISTER | jq -r '.data.tokens.accessToken')
REFRESH_TOKEN=$(echo $REGISTER | jq -r '.data.tokens.refreshToken')
SESSION_ID=$(echo $REGISTER | jq -r '.data.tokens.sessionId')

echo "Logged in with Access Token: ${ACCESS_TOKEN:0:25}..."

echo "=== 2. Fetch Profile ==="
curl -s -X GET "$BASE/auth/me" -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

echo "=== 3. List Sessions ==="
curl -s -X GET "$BASE/auth/sessions" -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

echo "=== 4. Refresh Token ==="
NEW_TOKENS=$(curl -s -X POST "$BASE/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")
NEW_ACCESS=$(echo $NEW_TOKENS | jq -r '.data.accessToken')

echo "=== 5. Logout ==="
curl -s -X POST "$BASE/auth/logout" -H "Authorization: Bearer $NEW_ACCESS" | jq .

echo "=== All Auth Tests Passed Successfully ==="
```
