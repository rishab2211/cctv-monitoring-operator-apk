# Product Requirements Document
# CCTV Operator Mobile App — React Native

**Version:** 1.2 *(Audit-corrected — all 15 findings resolved & synchronized with v2.0 Multi-Tenant Backend)*  
**Date:** August 2026  
**Author:** Antigravity AI  
**Project:** CCTV Monitoring Platform — Operator Mobile Client  

---

## 1. Executive Summary

The **Operator Mobile App** is a dedicated React Native application for field operators of the CCTV Monitoring Platform. It gives operators a purpose-built mobile interface to manage their shifts, monitor assigned cameras in real time, handle alerts, resolve incidents, respond to SOS events, and use two-way talkback — all from their smartphone.

The app communicates exclusively with the existing backend REST API (prefixed `/api/v1/`) and maintains a persistent Socket.IO connection for real-time event delivery. It is **operator-role exclusive**: only users whose JWT payload contains `role: "operator"` can log in and use this app.

---

## 2. Problem Statement

Operators currently have no dedicated mobile interface. They must use a web-based dashboard, which is not optimized for field conditions (small screens, spotty connectivity, urgency-driven workflows). Critical issues:

- Operators miss SOS alerts when away from their desktop
- No quick Clock In/Out from the field
- Talkback sessions cannot be initiated on-the-go
- Incident reporting requires access to a desktop browser
- Push notifications for alerts are not available outside the web session

---

## 3. Goals & Success Metrics

| Goal | Metric |
|---|---|
| Reduce alert response time | Alert acknowledged within 60 seconds of push notification |
| Streamline shift management | Clock-in/Clock-out in < 3 taps |
| Enable field incident reporting | Operator can file an incident report from phone in < 2 minutes |
| Real-time SOS response | SOS acknowledged from push notification in < 30 seconds |
| Improve operator productivity | ≥ 90% of daily operator tasks completable from mobile |

---

## 4. User Persona

**Primary User:** CCTV Monitoring Operator  
**Role in System:** `role: "operator"`  
- Assigned to a specific Franchise (`operatorDetails.assignedFranchise`)
- Monitors a defined set of cameras (`operatorDetails.assignedCameras`)
- Works scheduled shifts (clock-in / clock-out)
- Responds to alerts, SOS events, and incidents
- Can initiate talkback on talkback-enabled cameras
- Reports and manages incidents assigned to them

**NOT in scope for this app:** Admins, Franchise users, Customers, Technicians. Those roles have separate interfaces.

---

## 5. Architecture & Technology Stack

### 5.1 Frontend (Mobile App)
| Concern | Choice |
|---|---|
| Framework | React Native (**bare workflow only** — Expo excluded; `react-native-webrtc` requires native linking) |
| Navigation | React Navigation v7 (Stack + Bottom Tabs + Drawer) |
| State Management | Redux Toolkit + RTK Query |
| Realtime | Socket.IO Client (`socket.io-client` v4) |
| Video Streaming | WebRTC (`react-native-webrtc`) |
| Push Notifications | Firebase Cloud Messaging (FCM) via `@react-native-firebase/messaging` |
| UI Library | React Native Paper + custom design system |
| Forms | React Hook Form + Zod |
| Secure Storage | `react-native-keychain` (JWT tokens) |
| Offline Support | Redux Persist + React Query cache |
| Camera access (Talkback mic) | `react-native-permissions` |
| Maps (Camera location) | `react-native-maps` |
| Charts (Reports) | `react-native-gifted-charts` or `Victory Native` |

### 5.2 Backend Integration
All API calls target the existing Node.js backend. The base URL is configurable via environment variable. Authentication uses:
- **Access Token** (short-lived JWT, 15m) — sent as `Authorization: Bearer <token>` header
- **Refresh Token** (long-lived JWT, 30d) — stored securely in Keychain, used to obtain new access tokens transparently

**Sub-router mount conventions:**
- `/api/v1/operator/...` (singular) — self-service panel (dashboard, cameras, alerts, shift start/end, reports, timeline)
- `/api/v1/operators/...` (plural) — administrative management & historical shifts list
- `/api/v1/users/profile/avatar` — profile avatar image upload (Cloudinary CDN)

### 5.3 Realtime (Socket.IO)
The app establishes one persistent Socket.IO connection after login, authenticated with the access token. It:
- Automatically joins the franchise room (`franchise_<franchiseId>`) **only if `franchiseId` is present in the JWT** — an operator without an assigned franchise will have no `franchiseId` in their token, so skip this join and log a warning. Do not attempt to join `franchise_undefined`.
- Joins camera rooms (`camera_<cameraId>`) for each assigned camera after fetching the camera list
- Listens for **global** events: `shift_handover`, `sos_triggered`, user-specific notifications (`notification:<userId>`)

---

## 6. Authentication Module

### 6.1 Login Screen
**API:** `POST /api/v1/auth/login`  
**Fields:**
- Email (required)
- Password (required, masked)
- "Remember Me" toggle (controls refresh token persistence)

**Behaviour:**
- On success: store `accessToken` + `refreshToken` in Keychain; decode JWT to confirm `role === "operator"` — reject and show error if role mismatch
- On failure: display specific error (invalid credentials, account deactivated)
- Rate-limited by backend (authLimiter) — handle 429 gracefully with countdown timer

### 6.2 Forgot Password / OTP Reset Flow
**APIs:**
1. `POST /api/v1/auth/forgot-password` — sends OTP to email
2. `POST /api/v1/auth/verify-otp` — verifies OTP
3. `POST /api/v1/auth/reset-password` — sets new password

**Screens:** ForgotPassword → OTPVerification (6-digit input, 60s resend timer) → ResetPassword

### 6.3 Token Refresh (Transparent)
**API:** `POST /api/v1/auth/refresh-token`  
An Axios interceptor intercepts any 401 response, silently calls the refresh endpoint using the stored refresh token, updates stored tokens, and retries the original request. If refresh fails → log out.

### 6.4 Session Management
**API:** `GET /api/v1/auth/sessions`  
Operators can view and revoke active device sessions from a Profile settings screen.

### 6.5 Logout
**API:** `POST /api/v1/auth/logout`  
Clears tokens from Keychain, disconnects Socket.IO, resets Redux store, navigates to Login.

### 6.6 Change Password
**API:** `PUT /api/v1/auth/change-password`  
Available from the Profile/Settings screen. Requires current password + new password + confirmation.

---

## 7. App Structure & Navigation

```
App
├── Auth Stack (unauthenticated)
│   ├── LoginScreen
│   ├── ForgotPasswordScreen
│   ├── OTPVerificationScreen
│   └── ResetPasswordScreen
│
└── Main Stack (authenticated, role=operator)
    ├── Bottom Tab Navigator  ← ALWAYS 5 tabs, SOS tab is always present
    │   ├── Tab: Dashboard (Home)
    │   ├── Tab: Cameras
    │   ├── Tab: Alerts  (badge = pending alert count)
    │   ├── Tab: SOS     (badge = active SOS count, shown in red; badge hidden when 0)
    │   └── Tab: Profile
    │   ← Incidents moved to Dashboard quick actions / drawer to keep tab bar clean
    │
    ├── Modal: SOS Detail
    ├── Modal: Alert Detail
    ├── Modal: Clock Out (with handover notes)
    ├── Screen: Camera Live View (Full-screen WebRTC)
    ├── Screen: Recording Playback
    ├── Screen: Incident List
    ├── Screen: Incident Detail
    ├── Screen: Incident Report
    ├── Screen: Timeline
    ├── Screen: Reports / Analytics
    └── Screen: Notification Center
```

> [!IMPORTANT]
> **URL Scheme (Deep Linking):** Register `operator` as the app URL scheme in both `AndroidManifest.xml` (`android:scheme="operator"`) and iOS `Info.plist` (`CFBundleURLSchemes`). Use React Native's `Linking` module to handle deep links on app open and when app is already running. When the app is **terminated**, the initial URL must be read from `Linking.getInitialURL()` in the root component and routed before the main screen renders.

---

## 8. Feature Modules (Detailed)

---

### 8.1 Module 1 — Dashboard (Home Screen)

**API:** `GET /api/v1/operator/dashboard`

**Purpose:** Give the operator an instant at-a-glance command centre when they open the app.

**UI Components:**

#### Shift Status Banner
- Displayed prominently at the top of the screen
- **If ON shift:** Shows green pill "ON SHIFT", shift start time, live duration counter (ticking up in real time)
- **If OFF shift:** Shows grey pill "OFF SHIFT", last shift end time
- **CTA button:** "Clock In" or "Clock Out"

#### Stats Row (3 cards)
| Card | Data | Scope | Source |
|---|---|---|---|
| 📷 Cameras | `stats.assignedCameras` count | This operator's assigned cameras only | dashboard API |
| ⚠️ My Open Incidents | `stats.openIncidents` count | **Operator-scoped** — only incidents where `assignedTo === this operator` | dashboard API |
| 🆘 Active SOS | `stats.activeSos` count — shown in red if > 0 | **Franchise-scoped** — all active/acknowledged SOS in this franchise | dashboard API |

> [!NOTE]
> These two stats have intentionally different scopes: **Incidents** are personal (only yours), **SOS** is franchise-wide (everyone's emergency). UI labels must reflect this — use "My Open Incidents" and "Franchise Active SOS" to avoid confusion.

Tapping each card navigates to the relevant list screen.

#### Quick Actions Grid
- 🎯 **View Cameras** → Camera List
- 🔔 **Pending Alerts** → Alert List (pending tab)
- 🆘 **Active SOS** → SOS List
- 📋 **Report Incident** → Create Incident
- 📊 **My Reports** → Reports Screen
- 📰 **Activity Timeline** → Timeline Screen

#### Shift Handover Banner (Realtime)
Listens to Socket.IO event `shift_handover`. When another operator clocks out with handover notes, a dismissable banner appears with the outgoing operator's name and their notes.

**Refresh:** Pull-to-refresh + auto-polling every 60 seconds while app is in foreground.

---

### 8.2 Module 2 — Shift Management

#### 2a. Clock In
**API:** `PATCH /api/v1/operator/shift/start` *(operatorPanel route — self-service)*

> [!IMPORTANT]
> **Route distinction:** The backend has **two** clock-in endpoints:
> - `PATCH /api/v1/operator/shift/start` — **operatorPanel.routes.ts** (use this one)
> - `POST /api/v1/operators/clock-in` — **operator.routes.ts** (admin-facing, do NOT use from mobile)
>
> The mobile app must always call the `/api/v1/operator/...` (singular, no 's') routes.

**Flow:**
1. Operator taps "Clock In" on dashboard or shift status bar
2. Confirmation modal: "Start your shift now?" with current time shown
3. On confirm → API call → success toast → shift status banner updates to "ON SHIFT"
4. App joins Socket.IO camera rooms for all assigned cameras automatically

**Error handling:**
- "Already clocked in" — prevent duplicate clock-in, show informative error
- Network error — retry with exponential backoff (3 attempts)

#### 2b. Clock Out
**API:** `PATCH /api/v1/operator/shift/end` *(operatorPanel route — self-service; NOT `POST /api/v1/operators/clock-out`)*

**Body:** `{ handoverNotes?: string }` (validated by `clockOutSchema`)

**Flow:**
1. Operator taps "Clock Out"
2. Full-screen bottom sheet modal appears:
   - Header: "End Your Shift"
   - Shift summary preview (duration, incidents resolved this shift, SOS acknowledged)
   - Multiline text input: "Handover Notes (optional)" — passed to Socket.IO broadcast for next operator
   - "End Shift" red button
3. On confirm → API call → success → navigate back to dashboard (OFF SHIFT state)

**Behaviour Notes:**
- If operator has open incidents, show a warning: "You have X open incidents. Are you sure?"
- Handover notes are broadcast via Socket.IO `shift_handover` event to all connected operators

#### 2c. Shift Status
**API:** `GET /api/v1/operator/shift/status`

Used to hydrate the app state on launch and after background resume. Returns:
- `isOnShift: boolean`
- `currentShift: { _id, startTime }` (if on shift)
- `durationMs` (computed: `Date.now() - startTime`)
- `lastShift` info (if off shift)

#### 2d. Shift History
**API:** `GET /api/v1/operators/shifts?page=1&limit=20`

Accessible from Profile → "My Shift History".  
Displays paginated list of past shifts with:
- Date range
- Duration
- Incidents resolved
- SOS acknowledged
- Handover notes (expandable)

---

### 8.3 Module 3 — Camera Management

#### 3a. Camera List Screen
**API:** `GET /api/v1/operator/cameras`

Displays all cameras assigned to the operator. Each card shows:
- Camera name + serial number
- Location (city, street)
- Status badge: `online` (green) / `offline` (red) / `maintenance` (amber)
- Talkback indicator if `settings.talkbackEnabled === true`
- Quick action buttons: [Watch Live] [Talkback] [View Recordings]

**Filters:** Status (All / Online / Offline / Maintenance)  
**Search:** By name or serial number (client-side filter)

#### 3b. Camera Detail Screen
Tapping a camera card opens a detail screen:
- Camera name, serial number, full address
- Health metrics: CPU, Memory, Temperature, Storage, Last Ping (`health.*` fields)
- Settings overview: Recording enabled, Motion detection, AI features, Retention days
- Action buttons: [Watch Live] [View Recordings] [Talkback]
- Active alert count badge linking to camera-specific alerts

#### 3c. Live View (Camera Stream)

> [!IMPORTANT]
> **Correct Stream Flow — use the Token endpoint only (not both):**
> Both `GET /streams/:cameraId/token` and `POST /streams/start` internally create a `StreamSession` record. Calling both would create **duplicate sessions**. Use the token endpoint flow exclusively:

**APIs (in order):**
1. `GET /api/v1/streams/:cameraId/token` — validates access, registers session, returns `{ sessionId, streamToken, pathName, webrtcUrl }`
2. `POST /api/v1/streams/:cameraId/webrtc/offer` — send SDP offer; backend relays to MediaMTX WHEP; returns `{ type: "answer", sdp, sessionUrl }`
3. Complete WebRTC handshake using the answer SDP in `react-native-webrtc`
4. `POST /api/v1/streams/stop` — call on stream close with `{ cameraId, sessionId }`

**Stream Token Lifetime Note:**
- The `streamToken` returned has a **24-hour TTL** (used by MediaMTX auth webhook)
- The **access token** (JWT) is short-lived (15–30 min). Token refresh is handled silently by the Axios interceptor for all REST calls.
- The WebRTC stream itself will **not be interrupted** by access token expiry — it uses the stream token. Other API calls during an active stream will auto-refresh. No special handling needed in the streaming layer.

**Implementation:**
- Opens in full-screen landscape mode (auto-rotate on stream start)
- `react-native-webrtc` handles WebRTC negotiation using WHEP protocol
- MediaMTX backend manages RTSP → WebRTC transcoding
- The stream token is embedded in the initial `GET /token` call — MediaMTX validates via `/api/v1/streams/auth` webhook

**Controls overlay (shown on tap, auto-hides):**
- 🎙️ Talkback button (if camera supports it)
- ⏺ Snapshot button
- ⬆️ / ⬇️ Quality selector
- 🔊 Audio mute toggle
- ✕ Close / stop stream

**Error states:**
- Camera offline → "Camera is currently offline"
- WebRTC connection failed → show retry button (re-run step 1–3)
- MediaMTX timeout → "Stream source is unreachable" with retry

#### 3d. Recording Playback
**APIs:**
- `GET /api/v1/recordings/:cameraId/timeline?date=YYYY-MM-DD` — hourly availability
- `GET /api/v1/recordings/:cameraId/playback` — chunk URLs (supports both `?start=...&end=...` and `?startTime=...&endTime=...`)
- `POST /api/v1/recordings/:id/download` — generate download link

**UI:**
- Calendar date picker at top
- 24-hour timeline bar showing available recording segments
- Drag/tap on timeline to seek to a point
- Video player renders HLS/MP4 chunks
- Download button for evidence preservation

---

### 8.4 Module 4 — Alert Management

#### 4a. Alert List Screen
**APIs:**
- `GET /api/v1/operator/alerts/pending` — new/unacknowledged alerts
- `GET /api/v1/operator/alerts/active` — acknowledged/in-progress alerts

**Tab Layout:** [Pending] [Active]

**Alert Card:**
- Alert type icon (🚨 motion / 🔥 fire / ⚠️ hazard / 🔧 tampering)
- Priority badge: `low` (grey) / `medium` (yellow) / `high` (orange) / `critical` (red, pulsing)
- Camera name + location
- Description (truncated, expandable)
- Time since created (relative: "2 min ago")
- Quick action: [Acknowledge] button on pending tab

**Realtime Updates:**
- Socket.IO event `new_alert` on `camera_<cameraId>` rooms → insert alert at top of pending list with animation
- On acknowledge/resolve, remove from pending, add to active

#### 4b. Alert Detail Screen
**API:** `GET /api/v1/alerts/:id`

Full detail view:
- Alert type, priority, status
- Camera: name, location, link to camera detail
- Description
- Timestamps: created, acknowledged, resolved
- Resolution notes
- isVerified badge

**Action buttons (context-aware):**
| Status | Available Actions |
|---|---|
| `new` | Acknowledge, Escalate |
| `acknowledged` | Resolve, Escalate |
| `escalated` | Resolve |
| `resolved` | Verify (if unverified) |

#### 4c. Acknowledge Alert
**API:** `PATCH /api/v1/alerts/:id/acknowledge`  
One-tap action. Updates status `new` → `acknowledged`. Logs `ALERT_ACKNOWLEDGED` activity.

#### 4d. Resolve Alert
**API:** `PATCH /api/v1/alerts/:id/resolve`  
**Body:** `{ resolutionNotes: string, isVerified?: boolean }`  
Opens a bottom sheet with:
- Multiline "Resolution Notes" (required)
- "Mark as verified?" toggle

#### 4e. Escalate Alert
**API:** `PATCH /api/v1/alerts/:id/escalate`  
Changes status to `escalated`. Sends notification up the chain. One-tap with confirmation dialog.

#### 4f. Verify Alert
**API:** `POST /api/v1/alerts/:id/verify`  
Formally confirms alert is a genuine event. Marks `isVerified: true`.

#### 4g. Alert Stats (optional badge)
**API:** `GET /api/v1/alerts/stats`  
Used to hydrate the bottom tab badge count showing pending alert count.

---

### 8.5 Module 5 — Incident Management

#### 5a. Incident List Screen
**API:** `GET /api/v1/incidents` (RBAC: operator sees only their assigned incidents)

**Filters:** Status (All / Open / Investigating / Resolved / Closed), Severity  
**Sort:** Newest first

**Incident Card:**
- Title + type icon (🔒 theft / 🏚 vandalism / 🔧 technical / 📄 other)
- Severity badge (low / medium / high / critical)
- Status badge (colour-coded)
- Assigned camera (if any)
- Created timestamp

#### 5b. Incident Detail Screen
**API:** `GET /api/v1/incidents/:id`

Full detail:
- Title, description, type, severity
- Status timeline (status progression with timestamps)
- Linked camera (tappable → camera detail)
- Attachments (photo/video thumbnails)
- Notes list (chronological, with author + timestamp)
- isVerified badge

**Actions:**
- **Update Status** (open → investigating → resolved) — ⚠️ **Only available if `incident.assignedTo === this operator`**. If not assigned, the button must be disabled with tooltip "You must be assigned to this incident to update its status."
- **Close Incident** — separate endpoint `PATCH /api/v1/incidents/:id/close`; requires mandatory `resolutionNotes`
- Add Note — always available
- Upload Media (evidence) — always available
- Verify Incident — always available
- View Timeline

#### 5c. Report New Incident
**API:** `POST /api/v1/incidents` (multipart/form-data, up to 5 attachments)

**Form fields:**
- Title (required)
- Description (required)
- Type: theft / vandalism / technical_issue / other (picker)
- Severity: low / medium / high / critical (picker)
- Camera: searchable picker of assigned cameras (optional)
- Attachments: image/video picker (up to 5 files)

**Flow:** Form → Preview → Submit → Success screen with incident ID

#### 5d. Update Incident Status
**API:** `PATCH /api/v1/incidents/:id/status`  
**Body:** `{ status: "investigating" | "resolved" }`  

> [!IMPORTANT]
> **Backend guard:** The server returns `403 Forbidden` if `incident.assignedTo !== req.user.userId`. The UI must pre-check the assignment before showing the action, and handle the 403 gracefully if the check is stale. Operators **cannot** set status to `closed` via this endpoint — use the separate `PATCH /incidents/:id/close` endpoint for closure.

Bottom sheet picker with confirmation.

#### 5e. Add Investigation Note
**API:** `POST /api/v1/incidents/:id/notes`  
**Body:** `{ text: string }`  
Inline composer at bottom of notes list. Quick text input + send button.

#### 5f. Upload Incident Media
**API:** `POST /api/v1/incidents/:id/media` (up to 10 files)  
Image/video picker with multi-select. Progress indicator during upload.

#### 5g. Verify Incident
**API:** `POST /api/v1/incidents/:id/verify`  
Operator formally confirms the incident is genuine. Toggle with confirmation.

#### 5h. Incident Timeline
**API:** `GET /api/v1/incidents/:id/timeline`  
Chronological list of all activity on this incident (status changes, notes, assignments, media uploads).

---

### 8.6 Module 6 — SOS Alert Response

> SOS alerts are the highest-priority events in the system. They must be surfaced immediately and handled with urgency.

#### 6a. SOS Alert List
**APIs:**
- `GET /api/v1/sos/active` — active SOS alerts
- `GET /api/v1/sos` — paginated list with status filter

**Behaviour:**
- Active SOS alerts shown in RED BANNER at the very top of the Dashboard screen when count > 0
- SOS tab in bottom navigation shows red badge with count (always visible — 5 tabs total)
- List sorted newest first, `active` status pinned to top

> [!WARNING]
> **SOS list gap:** The backend filters the SOS list for operators by `cameraId: { $in: assignedCameras }`. If an SOS was triggered **without a linked camera** (`cameraId` is optional per the schema), it will **not appear** in the operator's SOS list — even though the operator received a push notification for it. The push notification deep link (`operator://sos/:id`) navigating directly to `GET /api/v1/sos/:id` is the only reliable path to reach camera-less SOS events. The app must handle this gracefully: if an SOS ID from a notification cannot be found in the local list, navigate directly to the detail screen by ID.

**SOS Card:**
- 🆘 icon (pulsing animation for `active` status)
- Triggered by (user name)
- Location string
- Linked camera (if any)
- Status badge + timestamps
- Elapsed time counter

#### 6b. SOS Detail Screen
**API:** `GET /api/v1/sos/:id`

- Triggering user info + contact if available
- Location (map pin if coordinates available)
- Linked camera — one-tap to live view
- Notes list
- Full timeline

**Action buttons:**
| Status | Actions |
|---|---|
| `active` | Acknowledge |
| `acknowledged` | Resolve |

#### 6c. Acknowledge SOS
**API:** `POST /api/v1/sos/:id/acknowledge`  
One-tap. Records `acknowledgedBy` (operator ID) + `acknowledgedAt`. Logs `SOS_ACKNOWLEDGED`.

#### 6d. Resolve SOS
**API:** `POST /api/v1/sos/:id/resolve`  
**Body:** `{ resolutionNotes: string }`  
Bottom sheet with mandatory resolution notes field + confirm button.

#### 6e. Add SOS Note
**API:** `POST /api/v1/sos/:id/notes`  
Quick note input during active SOS handling.

#### 6f. SOS Timeline
**API:** `GET /api/v1/sos/:id/timeline`  
Full audit log for the SOS event.

#### 6g. Push Notification for SOS
- Backend sends push via FCM when SOS is triggered (to ALL operators and admins system-wide)
- App handles FCM message in background/foreground
- Notification payload includes `sosId` and optionally `cameraId` (may be absent)
- Tapping notification navigates to SOS Detail screen via deep link `operator://sos/:sosId`
- If operator is on lock screen: full-screen urgent alert (iOS critical alert / Android heads-up)
- **Terminated state:** Read `Linking.getInitialURL()` on app launch to detect a tapped SOS notification and navigate before the main screen renders

---

### 8.7 Module 7 — Talkback (Two-Way Audio)

#### 7a. Talkback from Camera List
Any camera card with `settings.talkbackEnabled: true` shows a 🎙️ button.

#### 7b. Start Talkback Session
**API:** `POST /api/v1/talkback/:cameraId/start`

**Pre-checks:**
1. Check capabilities: `GET /api/v1/talkback/:cameraId/capabilities`
2. Check status: `GET /api/v1/talkback/:cameraId/status` (is another session active?)
3. Request microphone permission (`react-native-permissions`)

**Flow:**
- Bottom sheet appears: "Start talkback on [Camera Name]?"
- Grant mic permission if not already granted
- On confirm → API start → active talkback UI appears
- Audio captured via device microphone; published to MediaMTX via **WHIP protocol** (WebRTC HTTP Ingestion) at the `whipUrl` returned by the start API — same MediaMTX server as video, different path

**Active Talkback UI:**
- Full-screen overlay (semi-transparent)
- Camera name + "TALKBACK ACTIVE" indicator
- Animated sound wave visualizer
- Elapsed duration counter
- [End Call] red button

#### 7c. Stop Talkback Session
**API:** `POST /api/v1/talkback/:cameraId/stop`  
Ends session, records `endedAt` + `durationSeconds`.

#### 7d. Talkback Call Log
**API:** `GET /api/v1/operator/calls`  
Accessed from Profile → "Call History".

> [!NOTE]
> This endpoint returns sessions where **either** this operator was the caller **OR** any other operator initiated talkback on one of this operator's assigned cameras. The list is not limited to this operator's own sessions. Display a "Called by" column to distinguish between the two cases.

---

### 8.8 Module 8 — Notifications

#### 8a. Notification Centre Screen
**APIs:**
- `GET /api/v1/notifications` — paginated list
- `PATCH /api/v1/notifications/:id/read` — mark individual as read
- `PATCH /api/v1/notifications/read-all` — mark all as read
- `DELETE /api/v1/notifications/:id` — delete

**Notification types** (from `NotificationType` in backend schema):
| Type | Icon | Example |
|---|---|---|
| `alert` | 🔔 | "New motion alert on Camera 3" |
| `system` | ⚙️ | "You have been assigned 3 new cameras" |
| `message` | 💬 | System or internal messages |

> [!NOTE]
> The `message` type exists in the `NotificationType` enum but there is **no separate preference toggle** for it in the `notificationPreferences` schema — the backend maps `message` notifications to the `system` preference category. Do not expose a separate `message` preference row in the UI.

**UI:** Swipe left → Delete, Swipe right → Mark as Read  
Unread notifications shown with blue dot indicator

#### 8b. FCM Device Registration
**API:** `POST /api/v1/notifications/register-device`  
**Body:** `{ token: string, platform: "android" | "ios" }`  
Called automatically on first app launch after login and when FCM token refreshes.

#### 8c. Notification Preferences
**API:** `GET /api/v1/notifications/preferences` / `PUT /api/v1/notifications/preferences`

Operator can configure (matches `INotificationPreference` schema exactly):
- **Alerts** (type `alert`): Push ✓, In-App ✓, **Email ✓**
- **System** (types `system` + `message`): Push ✓, In-App ✓, **Email ✓**

> [!IMPORTANT]
> Both categories support **three toggles each** including Email — not just Push and In-App as previously stated. The `alerts` email toggle defaults to `false`; `system` email defaults to `true`. Render all three toggles per row.

Available from Profile → Notification Settings.

---

### 8.9 Module 9 — Timeline & Activity Log

**API:** `GET /api/v1/operator/timeline`

Returns last 100 activity log entries for the operator, newest first.

**Display:** Chronological feed (reverse order, newest at top)  
Each entry shows:
- Action icon (based on `action` enum: OPERATOR_CLOCKED_IN, ALERT_ACKNOWLEDGED, INCIDENT_STATUS_UPDATED, etc.)
- Human-readable description string
- Relative timestamp ("3 hours ago")
- Metadata (expandable): e.g., shiftId, cameraId, alertId

**Use case:** Quick audit trail of "what did I do today?"

**Grouped by date** (Today / Yesterday / Earlier This Week / etc.)

---

### 8.10 Module 10 — Performance Reports

**API:** `GET /api/v1/operator/reports`

Returns last 30 shifts with per-shift metrics and aggregated totals:

```json
{
  "operatorName": "...",
  "summary": {
    "totalShifts": 30,
    "totalIncidentsResolved": 47,
    "totalSosAcknowledged": 12,
    "avgIncidentsPerShift": "1.57"
  },
  "shifts": [...]
}
```

**Also:** `GET /api/v1/operators/:id/performance` — all-time aggregated metrics

**UI — Reports Screen:**

**Summary Cards Row:**
- Total Shifts
- Total Incidents Resolved
- Total SOS Acknowledged
- Avg Incidents / Shift

**Bar Chart:** Incidents resolved per shift (last 30 shifts — hard-coded limit in backend, x-axis = shift date)  
**Line Chart:** SOS acknowledged trend over time  

**Shift Table (scrollable):**
| Date | Duration | Incidents | SOS | Notes |
|---|---|---|---|---|
| Aug 20 | 8h 12m | 3 | 1 | "Handed over to night team" |

---

### 8.11 Module 11 — Profile & Settings

**API:** `GET /api/v1/auth/me`

Displays:
- Operator name, email, phone
- Role badge ("Operator")
- Assigned franchise name *(see note below)*
- Avatar image (Cloudinary URL or local fallback)
- Account status: Active

#### Avatar Upload Flow:
- Uses `PUT /api/v1/users/profile/avatar` with `multipart/form-data` (file field: `avatar`).
- Backed by Cloudinary with automatic 300x300 thumbnail cropping, falling back to local `/uploads` if CDN credentials are unset.

> [!NOTE]
> **Franchise name limitation:** `GET /api/v1/auth/me` returns the operator's `operatorDetails.assignedFranchise` as a **MongoDB ObjectId only** — it is not populated with the franchise document. To display a human-readable franchise name, make a follow-up call: `GET /api/v1/franchises/:franchiseId`. Cache this result; it rarely changes. If the operator has no assigned franchise (`franchiseId` absent from JWT), display "No franchise assigned" as a placeholder.

**Settings sections:**
1. **Notifications** → Preferences screen
2. **Security** → Change Password, Active Sessions
3. **Shift History** → Shift list
4. **Call History** → Talkback log
5. **About** → App version, Terms, Privacy
6. **Logout**

---

## 9. Real-Time Events (Socket.IO)

The app maintains a persistent Socket.IO connection authenticated with the JWT access token.

### Events the App Listens To:

| Event Name | Emission scope | Trigger | App Action |
|---|---|---|---|
| `new_alert` | `camera_<id>` room | New alert created for assigned camera | Insert at top of pending alerts list; show banner; increment badge |
| `sos_triggered` | ⚠️ **GLOBAL** (all connected clients) | Any user triggers SOS | Show full-screen urgent SOS banner; sound local alert if foreground. Listen with `socket.on("sos_triggered", ...)` — **NOT** inside a room join |
| `shift_handover` | **GLOBAL** | Operator clocks out with handover notes | Show dismissable handover notes banner on Dashboard |
| `notification:<userId>` | **GLOBAL** (user-keyed event name) | Any notification sent to this user | Add to notification centre; show in-app toast |
| `talkback_started` | `camera_<id>` room | Talkback session begins on camera | Disable talkback button on that camera card (show "Busy" indicator) |
| `talkback_stopped` | `camera_<id>` room | Talkback session ends | Re-enable talkback button |

### Rooms the App Joins:
- `franchise_<franchiseId>` — join after login **only if `franchiseId` is present in JWT**; skip if absent
- `camera_<cameraId>` — join for each assigned camera after `GET /api/v1/operator/cameras` resolves

> [!CAUTION]
> Do **not** rely on room-based filtering for `sos_triggered`. The backend emits it globally via `socketService.emitGlobal()` (confirmed in `sos.service.ts:65`). Filtering by franchise must be done client-side using the `franchiseId` on the SOS payload if needed.

---

## 10. Push Notifications (FCM)

### URL Scheme Registration

**App URL scheme:** `operator`

| Platform | Configuration |
|---|---|
| Android | `AndroidManifest.xml` — add `<data android:scheme="operator" />` inside the main `<intent-filter>` |
| iOS | `Info.plist` — add `operator` to `CFBundleURLSchemes` array |

Use React Native's built-in `Linking` module:
- **App foregrounded/backgrounded:** `Linking.addEventListener('url', handler)`
- **App terminated:** `Linking.getInitialURL()` in root component before navigation

### Notification Types & Deep Links:

| Trigger | Title | Body | Deep Link |
|---|---|---|---|
| New alert (critical/high priority) | "🚨 Alert: [type]" | "[Camera name] detected [type]" | `operator://alerts/:alertId` |
| SOS triggered | "🆘 SOS Alert!" | "[User] triggered SOS at [location]" | `operator://sos/:sosId` |
| New camera assigned | "📷 Cameras Assigned" | "You have been assigned N new cameras" | `operator://cameras` |
| Shift handover note | "📝 Handover Note" | "From [operator]: [notes preview]" | `operator://dashboard` |
| Incident assigned | "📋 Incident Assigned" | "You've been assigned: [incident title]" | `operator://incidents/:incidentId` |

### Foreground Handling:
- When app is in foreground and an FCM message arrives, display an in-app banner (not OS notification)
- Banner shows for 4 seconds, is tappable to deep-link

### Background/Terminated Handling:
- OS notification delivered normally
- Tapping opens app and navigates to the deep-linked screen
- For terminated state: read `Linking.getInitialURL()` synchronously before rendering the main navigation tree

---

## 11. Offline Behaviour

| Scenario | Behaviour |
|---|---|
| No network on launch | Show cached dashboard from Redux Persist; display "Offline" banner |
| Network lost mid-session | Socket.IO auto-reconnects; REST calls queued or fail gracefully with retry prompt |
| No network during Clock In/Out | Disable action; show "Network required for shift management" |
| Alert list | Show cached list with "last updated X ago" indicator |
| Incident submission | Offline drafts saved locally; auto-submit when network restores |

---

## 12. Security Requirements

| Requirement | Implementation |
|---|---|
| Secure token storage | `react-native-keychain` (Keystore/Secure Enclave) |
| Certificate pinning | Implement for production build |
| Jailbreak/Root detection | `jail-monkey` library; warn user + disable sensitive features |
| Biometric unlock | Face ID / Fingerprint to re-enter app after background (optional in v1) |
| Screen recording prevention | `react-native-prevent-screenshot` for live stream screens |
| Auto-logout | After 30 minutes of inactivity (configurable) |
| No sensitive data in logs | Strip tokens/passwords from console logs in production |

---

## 13. Performance Requirements

| Metric | Target |
|---|---|
| App cold start | < 2.5 seconds |
| Screen navigation | < 300ms |
| API response displayed | < 1 second (P95) |
| Live stream start | < 5 seconds (WebRTC connection) |
| Push notification delivery | < 5 seconds from event creation |
| Battery usage | < 5% per hour in foreground monitoring mode |
| Memory usage | < 200MB during active streaming |

---

## 14. Error Handling Strategy

| Error Type | User-facing treatment |
|---|---|
| Network timeout | Retry button + "Check your connection" message |
| 401 Unauthorized | Silent token refresh → retry; if refresh fails → force logout |
| 403 Forbidden | "You don't have permission to do that" toast |
| 404 Not Found | "Item not found" with back navigation |
| 422 Validation Error | Highlight specific form fields with backend error messages |
| 429 Rate Limited | "Too many requests. Try again in Xs" countdown |
| 500 Server Error | "Something went wrong. Please try again" with error ID |
| WebRTC Failed | "Stream unavailable" with reconnect button |

---

## 15. Screen Inventory

| # | Screen Name | Route Key | Module |
|---|---|---|---|
| 1 | Login | `Login` | Auth |
| 2 | Forgot Password | `ForgotPassword` | Auth |
| 3 | OTP Verification | `OTPVerification` | Auth |
| 4 | Reset Password | `ResetPassword` | Auth |
| 5 | Dashboard | `Dashboard` | Dashboard |
| 6 | Camera List | `CameraList` | Cameras |
| 7 | Camera Detail | `CameraDetail` | Cameras |
| 8 | Live View (full-screen) | `LiveView` | Cameras |
| 9 | Recording Playback | `RecordingPlayback` | Cameras |
| 10 | Alert List | `AlertList` | Alerts |
| 11 | Alert Detail | `AlertDetail` | Alerts |
| 12 | Incident List | `IncidentList` | Incidents |
| 13 | Incident Detail | `IncidentDetail` | Incidents |
| 14 | Report Incident | `ReportIncident` | Incidents |
| 15 | Incident Timeline | `IncidentTimeline` | Incidents |
| 16 | SOS List | `SOSList` | SOS |
| 17 | SOS Detail | `SOSDetail` | SOS |
| 18 | Activity Timeline | `Timeline` | Timeline |
| 19 | Reports | `Reports` | Reports |
| 20 | Shift History | `ShiftHistory` | Shifts |
| 21 | Notification Centre | `Notifications` | Notifications |
| 22 | Profile | `Profile` | Profile |
| 23 | Edit Profile (with Avatar) | `EditProfile` | Profile |
| 24 | Change Password | `ChangePassword` | Profile |
| 25 | Active Sessions | `Sessions` | Profile |
| 26 | Notification Preferences | `NotifPreferences` | Profile |
| 27 | Talkback Active (overlay) | `TalkbackActive` | Talkback |
| 28 | Call History | `CallHistory` | Talkback |

---

## 16. API Endpoint Reference (Operator Scope)

### Auth
| Method | Endpoint | Screen | Notes |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Login | Role check for operator |
| POST | `/api/v1/auth/forgot-password` | ForgotPassword | OTP dispatch to email |
| POST | `/api/v1/auth/verify-otp` | OTPVerification | 6-digit verification |
| POST | `/api/v1/auth/reset-password` | ResetPassword | Set new password |
| POST | `/api/v1/auth/refresh-token` | (interceptor) | Transparent rotation |
| POST | `/api/v1/auth/logout` | Profile | Session invalidation |
| PUT | `/api/v1/auth/change-password` | ChangePassword | Password change |
| GET | `/api/v1/auth/sessions` | Sessions | Active sessions list |
| DELETE | `/api/v1/auth/sessions/:id` | Sessions | Session revocation |
| GET | `/api/v1/auth/me` | Profile | Operator profile |
| PUT | `/api/v1/users/profile/avatar` | EditProfile | Cloudinary avatar upload |

### Operator Panel (self-service)
| Method | Endpoint | Screen | Notes |
|---|---|---|---|
| GET | `/api/v1/operator/dashboard` | Dashboard | Unified operator home |
| GET | `/api/v1/operator/cameras` | CameraList | Assigned cameras list |
| GET | `/api/v1/operator/alerts/pending` | AlertList | Unhandled alerts |
| GET | `/api/v1/operator/alerts/active` | AlertList | In-progress alerts |
| GET | `/api/v1/operator/calls` | CallHistory | Talkback session log |
| PATCH | `/api/v1/operator/shift/start` | Dashboard | Shift clock-in |
| PATCH | `/api/v1/operator/shift/end` | Dashboard | Shift clock-out & handover |
| GET | `/api/v1/operator/shift/status` | Dashboard | Current shift state |
| GET | `/api/v1/operator/timeline` | Timeline | Recent activity log |
| GET | `/api/v1/operator/reports` | Reports | 30-shift reports |

### Operator Admin Routes
| Method | Endpoint | Screen | Notes |
|---|---|---|---|
| GET | `/api/v1/operators/shifts` | ShiftHistory | Historical shift logs |
| GET | `/api/v1/operators/:id/performance` | Reports | All-time performance KPIs |

### Alerts
| Method | Endpoint | Screen | Notes |
|---|---|---|---|
| GET | `/api/v1/alerts` | AlertList | Scoped alert list |
| GET | `/api/v1/alerts/:id` | AlertDetail | Alert details |
| PATCH | `/api/v1/alerts/:id/acknowledge` | AlertDetail | Claim & acknowledge |
| PATCH | `/api/v1/alerts/:id/resolve` | AlertDetail | Resolve alert |
| PATCH | `/api/v1/alerts/:id/escalate` | AlertDetail | Escalate to incident |
| POST | `/api/v1/alerts/:id/verify` | AlertDetail | Mark as verified |
| GET | `/api/v1/alerts/pending` | AlertList | Pending alerts |
| GET | `/api/v1/alerts/stats` | Dashboard badge | Alert statistics |

### Incidents
| Method | Endpoint | Screen | Notes |
|---|---|---|---|
| POST | `/api/v1/incidents` | ReportIncident | Create incident report |
| GET | `/api/v1/incidents` | IncidentList | Assigned incidents |
| GET | `/api/v1/incidents/:id` | IncidentDetail | Incident detail |
| PATCH | `/api/v1/incidents/:id/status` | IncidentDetail | Update status |
| POST | `/api/v1/incidents/:id/notes` | IncidentDetail | Append note |
| POST | `/api/v1/incidents/:id/media` | IncidentDetail | Attach evidence media |
| POST | `/api/v1/incidents/:id/verify` | IncidentDetail | Verify incident |
| GET | `/api/v1/incidents/:id/timeline` | IncidentTimeline | Incident audit trail |

### SOS
| Method | Endpoint | Screen | Notes |
|---|---|---|---|
| GET | `/api/v1/sos` | SOSList | Scoped SOS list |
| GET | `/api/v1/sos/active` | Dashboard | Active emergency alerts |
| GET | `/api/v1/sos/:id` | SOSDetail | SOS event details |
| POST | `/api/v1/sos/:id/acknowledge` | SOSDetail | Acknowledge SOS |
| POST | `/api/v1/sos/:id/resolve` | SOSDetail | Resolve SOS event |
| POST | `/api/v1/sos/:id/notes` | SOSDetail | Add emergency note |
| GET | `/api/v1/sos/:id/timeline` | SOSDetail | SOS event audit timeline |

### Streams
| Method | Endpoint | Screen | Notes |
|---|---|---|---|
| GET | `/api/v1/streams/:cameraId/token` | LiveView | Stream session token |
| POST | `/api/v1/streams/start` | LiveView | Start stream session |
| POST | `/api/v1/streams/stop` | LiveView | Stop stream session |
| GET | `/api/v1/streams/:cameraId/status` | CameraDetail | Camera stream status |
| POST | `/api/v1/streams/:cameraId/webrtc/offer` | LiveView | SDP offer relay |

### Talkback
| Method | Endpoint | Screen | Notes |
|---|---|---|---|
| GET | `/api/v1/talkback/:cameraId/capabilities` | CameraDetail | Check 2-way audio support |
| GET | `/api/v1/talkback/:cameraId/status` | TalkbackActive | Talkback busy check |
| POST | `/api/v1/talkback/:cameraId/start` | TalkbackActive | Start talkback & WHIP URL |
| POST | `/api/v1/talkback/:cameraId/stop` | TalkbackActive | Stop talkback session |
| GET | `/api/v1/talkback/logs` | CallHistory | Talkback session logs |

### Recordings
| Method | Endpoint | Screen | Notes |
|---|---|---|---|
| GET | `/api/v1/recordings/:cameraId/timeline` | RecordingPlayback | Timeline activity |
| GET | `/api/v1/recordings/:cameraId/playback` | RecordingPlayback | Supports `?start=...&end=...` / `?startTime=...&endTime=...` |
| POST | `/api/v1/recordings/:id/download` | RecordingPlayback | Download URL |

### Notifications
| Method | Endpoint | Screen | Notes |
|---|---|---|---|
| POST | `/api/v1/notifications/register-device` | (on login) | Register FCM token |
| GET | `/api/v1/notifications` | Notifications | List notifications |
| PATCH | `/api/v1/notifications/read-all` | Notifications | Mark all read |
| PATCH | `/api/v1/notifications/:id/read` | Notifications | Mark single read |
| DELETE | `/api/v1/notifications/:id` | Notifications | Delete notification |
| GET | `/api/v1/notifications/preferences` | NotifPreferences | Preference settings |
| PUT | `/api/v1/notifications/preferences` | NotifPreferences | Update settings |

---

## 17. Release Phases

### Phase 1 — MVP (v1.0)
Core operator workflows, must ship first:
- [x] Authentication (login, logout, forgot password, token refresh)
- [x] Dashboard with shift status + stats
- [x] Clock In / Clock Out (with handover notes)
- [x] Camera list + Camera detail
- [x] Live stream via WebRTC
- [x] Alert list (pending + active) + Acknowledge + Resolve
- [x] SOS list + Acknowledge + Resolve
- [x] Push notifications (FCM) for alerts & SOS
- [x] Basic notification centre

### Phase 2 — Incident & Timeline (v1.1)
- [x] Incident list + detail + report new incident
- [x] Add notes + upload media to incidents
- [x] Activity timeline screen
- [x] Talkback (two-way audio)

### Phase 3 — Analytics & Polish (v1.2)
- [x] Reports screen with charts (bar + line)
- [x] Recording playback with timeline scrubber & parameter aliasing
- [x] Shift history screen
- [x] Call history screen
- [x] Avatar upload via Cloudinary
- [x] Biometric app lock
- [x] Performance optimisations + offline draft support

---

## 18. Decisions Log ✅

| # | Question | Decision | Rationale |
|---|---|---|---|
| 1 | **Expo vs Bare RN?** | ✅ **Bare React Native** | `react-native-webrtc` requires native module linking unavailable in Expo managed workflow. Bare RN gives full control over native layers needed for WebRTC + talkback. |
| 2 | **iOS Critical Alerts for SOS?** | ✅ **Yes — apply for entitlement** | SOS is a life-safety feature. Critical alerts must bypass Do Not Disturb. Apple entitlement application to be filed alongside app store submission. |
| 3 | **Talkback audio transport?** | ✅ **WebRTC via MediaMTX WHIP protocol** | The backend's `talkback.service.ts` returns a `whipUrl` for dedicated audio ingestion via WHIP on MediaMTX. |
| 4 | **Multi-camera grid view?** | ✅ **One camera at a time in v1** | Simplifies WebRTC session management and reduces device resource demands. Grid view can be evaluated for v2. |
| 5 | **Minimum OS versions?** | ✅ **Android 10+ (API 29) / iOS 15+** | Covers ~95%+ of active devices. `react-native-webrtc` and FCM fully supported on these versions. |
| 6 | **Biometric login in v1?** | ✅ **Not required — deferred to v1.2** | Not a blocker for core operator workflows. Ships with standard session-based auth in v1. |
| 7 | **White-labelling?** | ✅ **Not needed — single shared app** | Handled transparently by backend JWT `franchiseId` scoping. |

---

## 19. Architecture Next Steps

With all decisions locked, the recommended next steps before writing code:

1. **Project initialisation** — `npx react-native init OperatorApp --template react-native-template-typescript`
2. **Folder structure design** — feature-based (`/features/alerts`, `/features/shifts`, etc.)
3. **API client setup** — Axios instance with JWT interceptor + refresh logic
4. **Socket.IO client singleton** — connect on login, disconnect on logout
5. **Navigation scaffold** — Auth Stack + Main Tab Navigator shells
6. **FCM setup** — `@react-native-firebase/messaging` + device token registration flow
7. **RTK Query base API** — define tags for cache invalidation (Alert, Incident, SOS, Camera, Shift)

---

*End of PRD v1.2 — Operator App Decisions Locked & Audit-Approved*
