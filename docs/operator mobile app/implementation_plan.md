# Implementation Plan: CCTV Operator Mobile App (React Native Bare Workflow)
### Audit Version: v1.1 — Cross-referenced against all 20 Postman Collections, 20 Testing Guides & PRD v1.2

---

## ⚠️ Discrepancies & Corrections Log

> [!CAUTION]
> The following errors were found in the original plan (v1.0) by cross-referencing every doc in `/docs`. Each item is corrected in the Proposed Changes section below.

| # | Original Plan Error | Source of Truth | Correction Applied |
|---|---|---|---|
| **1** | FCM device registration body documented as `{ token, platform }` | `notification_testing_guide.md` + `Notification_Postman_Collection.json` | Correct field is `{ token, deviceType }` — NOT `platform`. Value is `"android"` / `"ios"` / `"web"` |
| **2** | Auth reset password described as a 3-step flow ending at `POST /auth/reset-password` with body `{ newPassword, confirmPassword }` | `auth_testing_guide.md` | Step 2 returns a `resetToken` (not just OTP pass-through). Step 3 body is `{ resetToken, newPassword, confirmPassword }` — the `resetToken` from step 2 is **required** |
| **3** | Plan mentioned "Revoke Session: `DELETE /auth/sessions/:id`" | `auth_testing_guide.md` | Correct path is `DELETE /auth/sessions/:sessionId` (using sessionId UUID, not MongoDB `_id`). Also, `DELETE /auth/sessions` (no param) mass-revokes ALL other sessions — both must be handled in the Sessions screen |
| **4** | Stream flow stated token endpoint "registers session" and said `POST /streams/start` must NOT be called | `stream_testing_guide.md` | `GET /streams/:cameraId/token` issues a fresh token **without creating a StreamSession record**. It does NOT return `sessionId`. `POST /streams/start` creates a StreamSession and returns `sessionId`. Since stop requires `sessionId`, the recommended flow is: use `POST /streams/start` for the full flow including stop, or use `GET /token` only if stop is not needed |
| **5** | Plan claimed analytics (`/api/v1/analytics/*`) is accessible by operators | `analytics_testing_guide.md` | Operators get `403 Forbidden` on ALL analytics endpoints. Only `/api/v1/operator/reports` is accessible to operators |
| **6** | Incident type enum listed as: `theft`, `vandalism`, `technical_issue`, `other` | `incident_testing_guide.md` | Correct enum: `theft`, `vandalism`, `safety`, `maintenance`, `other` — `technical_issue` does NOT exist |
| **7** | Incident list scoping: "operator sees only their assigned incidents" | `incident_testing_guide.md` | Operators see incidents assigned to them **OR** incidents on cameras they monitor — broader scope |
| **8** | `PATCH /incidents/:id/status` body listed as `{ status }` only | `incident_testing_guide.md` | Body: `{ status, resolutionNotes? }` — optional field exists |
| **9** | `GET /incidents/:id/report` endpoint omitted entirely | `incident_testing_guide.md` | Endpoint exists — returns JSON incident summary report. Must be added as "Generate Report" action |
| **10** | Socket.IO table missing `sos_acknowledged` and `sos_resolved` global events | `sos_testing_guide.md` | Both are emitted globally on acknowledge and resolve. App must listen for both to update SOS detail and list screens |
| **11** | Talkback `/start` idempotency behaviour not documented | `talkback_testing_guide.md` | Same operator calling `/start` again gets `200 OK` with existing session — UI must handle this without erroring |
| **12** | Sessions screen only showed `DELETE /auth/sessions/:id` | `auth_testing_guide.md` | Two endpoints needed: `DELETE /auth/sessions/:sessionId` (individual) + `DELETE /auth/sessions` (mass-revoke all others) |

---

## Goal Description

Build a production-grade **CCTV Operator Mobile App** in React Native (TypeScript, Bare Workflow) following the [PRD v1.2](file:///home/rishab/Personal/App%20dev/docs/operator%20mobile%20app/PRD/operator_mobile_app_prd.md), all 20 Postman Collections, and all 20 Testing Guides.

---

## User Review Required

> [!IMPORTANT]
> **React Native Bare Workflow is mandatory.** `react-native-webrtc` requires native linking — Expo managed workflow is explicitly excluded by the PRD.

> [!NOTE]
> **Backend is already built.** This is a pure mobile client. The Node.js backend runs at `http://localhost:5000/api/v1`. All endpoints, Socket.IO events, and WebRTC relay logic are live.

---

## Proposed Architecture & Structure

```
/home/rishab/Personal/App dev/
├── docs/                                   # All reference docs (untouched)
└── apps/
    └── operator-mobile-app/
        ├── android/                        # Native Android (FCM, deep link: operator://)
        ├── ios/                            # Native iOS (Keychain, Critical Alerts entitlement)
        └── src/
            ├── api/
            │   ├── client.ts               # Axios instance: Bearer + 401 refresh interceptor
            │   └── endpoints/              # RTK Query split endpoints per module
            ├── components/
            │   ├── common/                 # Button, Card, Badge, StatusPill, Input, Skeleton
            │   ├── feedback/               # BannerAlert, Toast, BottomSheet, ConfirmDialog
            │   └── media/                  # WebRTCPlayer, WaveformVisualizer, TimelineScrubber
            ├── features/
            │   ├── auth/
            │   ├── dashboard/
            │   ├── shifts/
            │   ├── cameras/
            │   ├── alerts/
            │   ├── incidents/
            │   ├── sos/
            │   ├── talkback/
            │   ├── notifications/
            │   ├── timeline/
            │   ├── reports/
            │   └── profile/
            ├── navigation/
            │   ├── RootNavigator.tsx
            │   ├── AuthNavigator.tsx
            │   ├── MainTabNavigator.tsx    # 5 tabs: Dashboard, Cameras, Alerts, SOS, Profile
            │   └── deepLinking.ts          # operator:// scheme config
            ├── services/
            │   ├── socket.service.ts       # Socket.IO singleton
            │   ├── storage.service.ts      # react-native-keychain wrapper
            │   ├── fcm.service.ts          # Firebase Cloud Messaging
            │   └── webrtc.service.ts       # WHEP/WHIP helpers
            ├── store/
            │   ├── index.ts                # Redux store + Redux Persist
            │   └── slices/
            ├── theme/                      # React Native Paper theme (dark-first)
            ├── types/                      # TypeScript interfaces matching backend schemas
            └── utils/                      # Date formatters, permissions, error handlers
```

---

## Corrected API Reference

### 🔐 Auth
| Method | Endpoint | Notes |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Body: `{ email?, phone?, password }`. Supports email OR phone login |
| `POST` | `/api/v1/auth/forgot-password` | Body: `{ email }` → Returns `{ maskedEmail }` |
| `POST` | `/api/v1/auth/verify-otp` | Body: `{ email, otp }` → **Returns `{ resetToken }`** — save this |
| `POST` | `/api/v1/auth/reset-password` | Body: `{ resetToken, newPassword, confirmPassword }` ← **resetToken required** |
| `POST` | `/api/v1/auth/refresh-token` | Body: `{ refreshToken }`. Token rotation — old token invalidated immediately |
| `POST` | `/api/v1/auth/logout` | No body. Clears session server-side |
| `PUT` | `/api/v1/auth/change-password` | Body: `{ currentPassword, newPassword, confirmPassword }` |
| `GET` | `/api/v1/auth/me` | `assignedFranchise` is ObjectId only — needs follow-up franchise fetch |
| `GET` | `/api/v1/auth/sessions` | Returns `{ currentSessionId, sessions[] }` |
| `DELETE` | `/api/v1/auth/sessions/:sessionId` | Revoke specific by **sessionId UUID** (not MongoDB _id) |
| `DELETE` | `/api/v1/auth/sessions` | Mass-revoke all OTHER sessions |
| `PUT` | `/api/v1/users/profile/avatar` | `multipart/form-data`, field name: `avatar` |

### 🖥️ Operator Panel (Self-Service `/api/v1/operator/...`)
| Method | Endpoint | Notes |
|---|---|---|
| `GET` | `/api/v1/operator/dashboard` | Stats scoping: incidents = operator-only, SOS = franchise-wide |
| `GET` | `/api/v1/operator/cameras` | Assigned cameras only |
| `GET` | `/api/v1/operator/alerts/pending` | Unacknowledged alerts |
| `GET` | `/api/v1/operator/alerts/active` | In-progress alerts |
| `GET` | `/api/v1/operator/calls` | Talkback log alias |
| `PATCH` | `/api/v1/operator/shift/start` | Clock in — use this, NOT `/operators/clock-in` |
| `GET` | `/api/v1/operator/shift/status` | `{ isOnShift, currentShift, durationMs, lastShift }` |
| `PATCH` | `/api/v1/operator/shift/end` | Body: `{ handoverNotes? }` — use this, NOT `/operators/clock-out` |
| `GET` | `/api/v1/operator/timeline` | Last 100 activity entries |
| `GET` | `/api/v1/operator/reports` | 30-shift report data |

### 📢 Alerts
| Method | Endpoint | Notes |
|---|---|---|
| `GET` | `/api/v1/alerts` | Scoped list: `?status&priority&type&page&limit` |
| `GET` | `/api/v1/alerts/:id` | Detail with populated camera object |
| `GET` | `/api/v1/alerts/pending` | Scoped to operator cameras |
| `GET` | `/api/v1/alerts/stats` | Badge count data |
| `PATCH` | `/api/v1/alerts/:id/acknowledge` | No body |
| `PATCH` | `/api/v1/alerts/:id/escalate` | No body |
| `PATCH` | `/api/v1/alerts/:id/resolve` | Body: `{ resolutionNotes: string, isVerified?: boolean }` |
| `POST` | `/api/v1/alerts/:id/verify` | Body: `{ isVerified: boolean, notes?: string }` |

### 🚨 Incidents (CORRECTED)
| Method | Endpoint | Notes |
|---|---|---|
| `POST` | `/api/v1/incidents` | `multipart/form-data`. File field: **`attachments`** (up to 5). Type enum: `theft`, `vandalism`, `safety`, `maintenance`, `other` |
| `GET` | `/api/v1/incidents` | Operator scope: assigned to them **OR** on their cameras |
| `GET` | `/api/v1/incidents/:id` | Full detail |
| `PATCH` | `/api/v1/incidents/:id/status` | Body: `{ status: "investigating"\|"resolved", resolutionNotes?: string }`. 403 if not assignedTo |
| `POST` | `/api/v1/incidents/:id/notes` | Body: `{ text: string }` |
| `POST` | `/api/v1/incidents/:id/media` | `multipart/form-data`. File field: **`media`** (up to 10 files) |
| `POST` | `/api/v1/incidents/:id/verify` | Body: `{ notes?: string }` |
| `GET` | `/api/v1/incidents/:id/timeline` | Audit trail |
| **`GET`** | **`/api/v1/incidents/:id/report`** | **← ADDED. JSON incident summary report** |
| `PATCH` | `/api/v1/incidents/:id/close` | Body: `{ resolutionNotes: string }` — mandatory |

### 🆘 SOS
| Method | Endpoint | Notes |
|---|---|---|
| `GET` | `/api/v1/sos/active` | Active SOS list |
| `GET` | `/api/v1/sos` | `?status=active\|acknowledged\|resolved&page&limit` |
| `GET` | `/api/v1/sos/:id` | `triggeredBy` is populated user object with name + phone |
| `POST` | `/api/v1/sos/:id/acknowledge` | No body. Returns `{ acknowledgedBy, acknowledgedAt }` |
| `POST` | `/api/v1/sos/:id/notes` | Body: `{ text: string }` |
| `GET` | `/api/v1/sos/:id/timeline` | Audit trail |
| `POST` | `/api/v1/sos/:id/resolve` | Body: `{ resolutionNotes: string }` — 400 if missing |

### 📹 Streams (CORRECTED FLOW)
> [!IMPORTANT]
> Since `POST /streams/stop` requires `sessionId`, and `GET /token` does NOT return a `sessionId`, use `POST /streams/start` to obtain the `sessionId` required for stopping.

| Method | Endpoint | Notes |
|---|---|---|
| `POST` | `/api/v1/streams/start` | Body: `{ cameraId }`. Returns `{ sessionId, streamToken, pathName, webrtcUrl, hlsUrl }` |
| `POST` | `/api/v1/streams/:cameraId/webrtc/offer` | Body: `{ sdp, type: "offer" }`. Returns `{ type: "answer", sdp, sessionUrl }` |
| `GET` | `/api/v1/streams/:cameraId/status` | Live/offline + viewer count |
| `POST` | `/api/v1/streams/stop` | Body: `{ cameraId, sessionId }` |

### 🎙️ Talkback (CORRECTED)
| Method | Endpoint | Notes |
|---|---|---|
| `GET` | `/api/v1/talkback/:cameraId/capabilities` | `{ audioOut, codec, sampleRate, channels }` |
| `GET` | `/api/v1/talkback/:cameraId/status` | `{ isActive, session }` |
| `POST` | `/api/v1/talkback/:cameraId/start` | Returns `{ session: {_id, operatorId, status, startedAt}, whipUrl }`. **Idempotent: same operator → 200 OK with existing session** |
| `POST` | `/api/v1/talkback/:cameraId/stop` | No body. Returns `{ session: {status: "completed", endedAt, durationSeconds} }` |
| `GET` | `/api/v1/operator/calls` | Operator panel talkback log |

### 📼 Recordings
| Method | Endpoint | Notes |
|---|---|---|
| `GET` | `/api/v1/recordings/:cameraId/timeline` | `?date=YYYY-MM-DD` |
| `GET` | `/api/v1/recordings/:cameraId/playback` | `?start=...&end=...` OR `?startTime=...&endTime=...` |
| `POST` | `/api/v1/recordings/:id/download` | Returns `{ downloadUrl, expiresAt }` |

### 🔔 Notifications (CORRECTED)
| Method | Endpoint | Notes |
|---|---|---|
| `POST` | `/api/v1/notifications/register-device` | Body: `{ token: string, deviceType: "android"\|"ios"\|"web" }` ← **`deviceType` NOT `platform`** |
| `GET` | `/api/v1/notifications` | `?page&limit&isRead=false` |
| `GET` | `/api/v1/notifications/:id` | 404 if cross-user access |
| `PATCH` | `/api/v1/notifications/:id/read` | Mark individual read |
| `PATCH` | `/api/v1/notifications/read-all` | Mark all read |
| `DELETE` | `/api/v1/notifications/:id` | 404 if cross-user access |
| `GET` | `/api/v1/notifications/preferences` | `{ alerts: {push,inApp,email}, system: {push,inApp,email} }` |
| `PUT` | `/api/v1/notifications/preferences` | Partial-update safe |

### 📊 Operator Admin
| Method | Endpoint | Notes |
|---|---|---|
| `GET` | `/api/v1/operators/shifts` | `?page=1&limit=20` |
| `GET` | `/api/v1/operators/:id/performance` | All-time KPIs |
| `GET` | `/api/v1/franchises/:franchiseId` | Franchise name lookup |

---

## Corrected Socket.IO Event Reference

| Event | Scope | Trigger | App Action |
|---|---|---|---|
| `new_alert` | `camera_<id>` room | Alert created | Insert at top of pending list; banner; badge++ |
| `sos_triggered` | **GLOBAL** | Any SOS triggered | Full-screen urgent overlay; sound if foreground |
| **`sos_acknowledged`** | **GLOBAL** | **← ADDED. SOS acknowledged** | **Update SOS detail status; update list** |
| **`sos_resolved`** | **GLOBAL** | **← ADDED. SOS resolved** | **Update SOS detail; dismiss active banner** |
| `shift_handover` | **GLOBAL** | Operator clocks out with notes | Dashboard handover banner |
| `notification:<userId>` | **GLOBAL** | Any notification for this user | Toast + notification centre |
| `talkback_started` | `camera_<id>` room | Talkback begins | Disable talkback button ("Busy") |
| `talkback_stopped` | `camera_<id>` room | Talkback ends | Re-enable talkback button |

> [!CAUTION]
> `sos_triggered` is a GLOBAL emit — never filter by room. Client-side franchise filtering via `sos.franchiseId` if needed.

---

## Phased Implementation Roadmap

### Phase 1: Foundation, Tooling & Authentication

**Core dependencies:**
- Navigation: `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`
- State: `@reduxjs/toolkit`, `react-redux`, `redux-persist`
- UI: `react-native-paper`, `react-native-vector-icons`
- Security: `react-native-keychain`
- Realtime: `socket.io-client`
- HTTP: `axios`
- Forms: `react-hook-form`, `zod`, `@hookform/resolvers`
- Push: `@react-native-firebase/app`, `@react-native-firebase/messaging`
- Permissions: `react-native-permissions`

**Auth flow (corrected):**
1. Login → role guard (`role === "operator"`) → store tokens in Keychain
2. Forgot Password → OTP (60s resend timer) → verify OTP → **save `resetToken` from response** → Reset Password with `{ resetToken, newPassword, confirmPassword }`
3. 401 interceptor: silently refresh → retry. Token rotation: always replace BOTH tokens after refresh
4. Sessions screen: list + individual revoke (`DELETE /sessions/:sessionId`) + mass revoke (`DELETE /sessions`)

### Phase 2: Dashboard & Shift Management

1. Dashboard: Shift Banner, Stats Row (incidents=personal, SOS=franchise), Quick Actions, Socket handover listener
2. Clock In: `PATCH /operator/shift/start` — confirmation modal
3. Clock Out: `PATCH /operator/shift/end` — bottom sheet with optional `handoverNotes`; warn if open incidents
4. Hydrate shift state on launch via `GET /operator/shift/status`
5. Shift History: `GET /operators/shifts` paginated

### Phase 3: Real-Time Socket.IO System

1. Singleton service: connect post-login, attach to JWT access token
2. Room joins: `franchise_<franchiseId>` (only if present in JWT) + `camera_<id>` per assigned camera
3. **Global listeners: `sos_triggered`, `sos_acknowledged`, `sos_resolved`, `shift_handover`, `notification:<userId>`**
4. Room listeners: `new_alert`, `talkback_started`, `talkback_stopped`

### Phase 4: Camera Management & WebRTC Streaming

1. Camera list with status filter + search
2. Camera detail: health metrics, talkback badge
3. **Live stream flow (corrected):**
   - `POST /streams/start` → `{ sessionId, streamToken, webrtcUrl }`
   - `POST /streams/:cameraId/webrtc/offer` → SDP answer
   - WebRTC handshake via `react-native-webrtc`
   - On close: `POST /streams/stop` with `{ cameraId, sessionId }`
4. Recording playback: timeline scrubber + HLS/MP4 player

### Phase 5: Alert & SOS

1. Alert list (Pending/Active tabs), badge from `/alerts/stats`
2. Alert detail: context-aware actions per status
3. SOS red banner on Dashboard (pulsing, `activeSos > 0`)
4. SOS list with `active` pinned at top
5. SOS detail: acknowledge (no body), notes, resolve (mandatory notes)
6. Deep link fallback: `operator://sos/:id` → `GET /sos/:id` if not in list
7. **Listen for `sos_acknowledged` + `sos_resolved` to update UI**

### Phase 6: Incidents & Talkback

**Incidents (corrected):**
1. Create: `multipart/form-data`, field `attachments`, type enum `theft|vandalism|safety|maintenance|other`
2. Incident list scope: assigned to operator OR on their cameras
3. Status update: body includes `resolutionNotes?`; 403 guard in UI
4. Media upload: field `media` (not `attachments`)
5. **Add "Generate Report" button → `GET /incidents/:id/report`**

**Talkback (corrected):**
1. Pre-checks: capabilities → status → mic permission
2. Start: `POST /talkback/:cameraId/start`. **Handle 200 (idempotent, existing session) same as 201**
3. WHIP audio: `react-native-webrtc` to `whipUrl`
4. Active overlay: waveform, timer, End Call
5. Stop: `POST /talkback/:cameraId/stop`

### Phase 7: Notifications, Profile & Reports

**Notifications (corrected):**
- Register: `{ token, deviceType: "android"|"ios" }` — **`deviceType` not `platform`**
- Preferences: 3 toggles per category (Push/InApp/Email) — no separate `message` row

**Profile:**
- `/auth/me` → franchise ObjectId → follow-up `GET /franchises/:id`
- Avatar: `PUT /users/profile/avatar` multipart field `avatar`
- Sessions: individual + mass-revoke both implemented

**Reports:**
- `GET /operator/reports` for 30-shift data (bar + line charts)
- `GET /operators/:id/performance` for all-time KPIs
- **Do NOT use `/api/v1/analytics/*` — 403 for operators**

---

## Verification Plan

### Automated Tests
- `npx tsc --noEmit` — TypeScript strict check
- Jest: reducer unit tests, Zod schema validation, interceptor mock (token rotation)
- Test all 5 incident type enum values, all alert status transitions

### Manual Integration Verification
- Match each screen against `docs/testing guides/<module>_testing_guide.md`
- Validate request/response against `docs/Postman Collections/<Module>_Postman_Collection.json`
- Deep links: `operator://sos/:id`, `operator://alerts/:id`, `operator://incidents/:id`, `operator://cameras`, `operator://dashboard`
- Token rotation: verify old refresh token → 401 with session invalidation
- Talkback idempotency: same operator re-calling `/start` returns 200 OK
- SOS camera-less gap: SOS without cameraId not in operator list → direct ID lookup

---

*Corrected Implementation Plan v1.1 — 12 discrepancies identified and resolved*
