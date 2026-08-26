# 🧪 Module 9: Notification Module — Postman & FCM Testing Guide

**REST Base URL:** `http://localhost:5000/api/v1/notifications`

This document outlines how to test the real Firebase Cloud Messaging (FCM) integration, Notification Preferences, and In-App notification lifecycles.

---

## 🛠 Firebase (FCM) Environment Setup

Because we are NOT using mock data, the system relies on Google's `firebase-admin` SDK to push real notifications. 

To enable real push notifications in Development/Production:
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Go to Project Settings -> Service Accounts -> Generate New Private Key.
3. Take the downloaded JSON file, encode it to base64, and add it to your `.env` file:
   ```env
   FIREBASE_SERVICE_ACCOUNT_BASE64="eyJwcm9qZWN0X2lkIjoi..."
   ```
4. Restart the server. You should see `✅ Firebase Admin SDK initialized successfully` in the logs.
*(If you do not do this, the system gracefully falls back and simply logs a warning that push notifications are skipped, but in-app notifications will still work!).*

---

## 📋 1. Device Registration (FCM Tokens)

### ✅ Happy Path
> 🔒 `Any Authenticated User`
```
POST {{baseUrl}}/register-device
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "token": "fcm_device_token_from_frontend_sdk",
  "deviceType": "android"
}
```
**Expected:** `200 OK`. Token is saved.

### 🛑 Edge Cases
- **Duplicate Registration:** Send the exact same token again.
  - *Expected:* Upserts safely without creating duplicate database rows.
- **Missing Token:** Send `{ "deviceType": "web" }`.
  - *Expected:* `400 Bad Request` (Zod error).

---

## 📋 2. Preferences Management

Users can opt in or out of specific notification channels.

### ✅ View Preferences
```
GET {{baseUrl}}/preferences
Authorization: Bearer {{accessToken}}
```
**Expected:** `200 OK`
```json
{
  "alerts": { "push": true, "inApp": true, "email": false },
  "system": { "push": false, "inApp": true, "email": true }
}
```

### ✅ Update Preferences
```
PUT {{baseUrl}}/preferences
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "alerts": {
    "push": false
  }
}
```
**Expected:** `200 OK`. Safely updates ONLY `alerts.push` without overwriting the rest of the object.

---

## 📋 3. In-App Notifications (Lifecycle)

To generate a notification, trigger a manual alert from Module 7 (`POST /api/v1/alerts`). 
Because Module 7 calls `sendPushNotification` (which we wired up to our new Notification Engine), this will automatically create a Notification record for the user!

### ✅ List Notifications
```
GET {{baseUrl}}?page=1&limit=10&isRead=false
Authorization: Bearer {{accessToken}}
```
**Expected:** Returns paginated list of unread notifications.

### ✅ Get Notification Detail
```
GET {{baseUrl}}/{{notificationId}}
Authorization: Bearer {{accessToken}}
```
**Expected:** `200 OK`. Returns the single notification object for the authenticated user.

### ✅ Mark as Read
```
PATCH {{baseUrl}}/{{notificationId}}/read
Authorization: Bearer {{accessToken}}
```
**Expected:** `200 OK`. `isRead` becomes true.

### ✅ Mark All As Read
```
PATCH {{baseUrl}}/read-all
Authorization: Bearer {{accessToken}}
```
**Expected:** `200 OK`. Updates all unread notifications for that specific user.

### ✅ Delete Notification
```
DELETE {{baseUrl}}/{{notificationId}}
Authorization: Bearer {{accessToken}}
```
**Expected:** `200 OK`. The notification is removed.

### 🛑 Edge Cases for Lifecycle
- **Cross-User Access:** Attempt to read (`GET {{baseUrl}}/{{notificationId}}`) or delete (`DELETE {{baseUrl}}/{{notificationId}}`) using a different user's token.
  - *Expected:* `404 Not Found` (Ensures users can only access/manage their own notifications).

---

## 🌐 4. WebSocket Dashboard Integration

The Notification Service also emits real-time in-app notifications globally to the specific user's dashboard!
1. Connect via WebSocket with your JWT token.
2. Listen for the event: `notification:{{your_user_id}}` (e.g., `notification:64b8f8...`).
3. Trigger an alert. You will see the in-app notification popup arrive instantly over the socket!
