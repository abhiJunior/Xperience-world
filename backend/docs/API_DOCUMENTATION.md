# The Xperience Assistant — API Documentation & Integration Guide

**The Xperience Assistant** is an AI-powered event management backend providing intent extraction, deterministic cascading impact analysis, rule-based risk detection, automated readiness scoring, and human-in-the-loop decision flows.

---

## Base URLs & Architecture

- **Local Development**: `http://localhost:5000`
- **Versioned API Prefix**: `/api/v1`
- **Authentication**: JWT Bearer Access Token in `Authorization: Bearer <token>` header + HttpOnly Strict-SameSite Cookie for Refresh Tokens.

---

## Authentication Endpoints (`/api/v1/auth`)

| Method | Endpoint | Description | Request Body / Params |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register a new user | `{ "name": "...", "email": "...", "password": "...", "role": "manager" }` |
| `POST` | `/api/v1/auth/login` | Log in and receive JWT access token + HttpOnly cookie | `{ "email": "...", "password": "..." }` |
| `POST` | `/api/v1/auth/refresh` | Rotate access & refresh tokens | None (reads cookie) or `{ "refreshToken": "..." }` |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | Protected (`Bearer <token>`) |
| `POST` | `/api/v1/auth/logout` | Revoke current device refresh token | Protected |
| `POST` | `/api/v1/auth/logout-all`| Revoke all active sessions on all devices | Protected |

---

## Event Management Endpoints (`/api/v1/events`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/events` | Create a new event |
| `GET` | `/api/v1/events?status=&type=&page=&limit=` | List user events with pagination and filters |
| `GET` | `/api/v1/events/:id` | Get event details |
| `PATCH`| `/api/v1/events/:id` | Partial update event metadata, budget, or dates |
| `DELETE`| `/api/v1/events/:id` | Delete event and cascade-delete all 10 child collections |

---

## Nested Resources (Sub-Events, Tasks, Vendors, Guests, Requirements)

### Sub-Events (`/api/v1/events/:eventId/sub-events`)
- `POST /` — Create sub-event (`{ "name", "date", "startTime", "endTime", "expectedGuests", "venueId" }`)
- `GET /` — List chronologically ordered sub-events
- `GET /:id` — Get sub-event details
- `PATCH /:id` — Update sub-event
- `DELETE /:id` — Delete sub-event

### Tasks (`/api/v1/events/:eventId/tasks`)
- `POST /` — Create task (`{ "title", "category", "priority", "dueDate", "subEvent", "dependsOn" }`)
- `GET /?status=&category=&priority=&subEvent=` — List and filter tasks
- `GET /:id` — Get single task
- `PATCH /:id` — Update task status, priority, or blocker reason
- `PATCH /bulk-status` — Bulk update task status (`{ "taskIds": [...], "status": "done" }`)
- `DELETE /:id` — Delete task and clean up dependent references

### Vendors (`/api/v1/events/:eventId/vendors`)
- `POST /` — Create vendor (`{ "name", "category", "status", "contact": { ... } }`)
- `GET /?category=&status=` — List vendors
- `GET /:id` — Get vendor details
- `PATCH /:id` — Update vendor
- `PATCH /:id/status` — Quick status transition (`{ "status": "confirmed" | "unavailable", "notes" }`)
- `DELETE /:id` — Delete vendor

### Guest Groups (`/api/v1/events/:eventId/guest-groups`)
- `POST /` — Create guest group (`{ "label", "count", "needsTransport", "needsAccommodation", "subEventsAttending" }`)
- `GET /` — List guest groups
- `PATCH /:id` — Update guest group count or flags
- `DELETE /:id` — Delete guest group

### Requirements (`/api/v1/events/:eventId/requirements`)
- `POST /` — Create requirement (`{ "type": "vehicle_capacity"|"room_capacity"|"catering_headcount", "required", "provided" }`)
- `GET /` — List requirements and track deficits
- `PATCH /:id` — Update required or provided capacity
- `DELETE /:id` — Delete requirement

---

## AI Chat & Human-in-the-Loop Decision API (`/api/v1/events/:eventId/chat`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/events/:eventId/chat` | Send conversational message. The assistant extracts intent, calculates cascading impact for every proposal, and returns `{ messageId, reply, proposedActions }`. |
| `GET` | `/api/v1/events/:eventId/chat` | Fetch full conversation turn history |
| `POST` | `/api/v1/events/:eventId/chat/actions/:actionId/confirm` | **Human-in-the-Loop Confirmation**: Applies the proposed action to the database, logs audit trail, and recalculates readiness score. |
| `POST` | `/api/v1/events/:eventId/chat/actions/:actionId/reject` | Rejects the proposed action with an optional explanation note. |
| `POST` | `/api/v1/events/:eventId/chat/what-if` | Simulates a hypothetical scenario without mutating the database. |

---

## Deterministic Engine & Dashboard (`/api/v1/events/:eventId/`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/:eventId/dashboard` | Consolidated dashboard: event info, readiness score, upcoming sub-events, pending tasks, top risks, and vendor breakdown in a single call. |
| `GET` | `/:eventId/readiness` | 0–100 Event Readiness Score with categorized weights (Tasks: 30, Vendors: 30, Risks: 25, Budget: 15), readiness status, key gaps, and next milestones. |
| `POST` | `/:eventId/impact` | Cascading impact analysis engine computing downstream effects on dependencies. |
| `POST` | `/:eventId/risks/scan` | Triggers deterministic risk evaluation scan and auto-syncs with SHA-256 fingerprinting. |
| `GET` | `/:eventId/risks?severity=&status=` | List detected risks |
| `PATCH`| `/:eventId/risks/:id/status` | Mark risk as acknowledged, resolved, or dismissed |
| `GET` | `/:eventId/notifications?read=` | In-app notifications from deadline alerts and risk sweeper |
| `PATCH`| `/:eventId/notifications/read-all` | Mark all notifications as read |
| `GET` | `/:eventId/suggestions` | Proactive 1-click suggestions |
| `POST` | `/:eventId/suggestions/:id/accept` | Accept and execute proactive suggestion |
| `GET` | `/:eventId/activity` | Immutable audit timeline feed |

---

## Demo Test Credentials

To test the live seeded system immediately:
- **Email**: `demo@xperience.com`
- **Password**: `Password123!`
- **Command to Re-seed**: `npm run seed`
