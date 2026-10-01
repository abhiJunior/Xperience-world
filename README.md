# 🎪 Xperience Assistant — AI-Powered Event Management Platform

> A full-stack, AI-augmented platform for planning, managing, and de-risking complex events. Ask the AI about your event, get actionable suggestions, and let the impact engine surface cascading risks before they happen.

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Approach to Solving the Problem](#-approach-to-solving-the-problem)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [API Overview](#-api-overview)
- [Setup Instructions](#-setup-instructions)
- [Environment Variables Reference](#-environment-variables-reference)
- [Key Assumptions & Design Decisions](#-key-assumptions--design-decisions)

---

## 🌟 Overview

Xperience Assistant is a full-stack web application that combines traditional CRUD-based event management with a sophisticated AI layer. Event managers can:

- **Organise** events with sub-events, tasks, vendors, guest groups, requirements, and risks.
- **Chat** with an AI assistant that understands the full context of their event and proposes concrete changes.
- **Simulate** "What-If" scenarios (e.g., *"What if the venue cancels three days before?"*) and receive an AI risk assessment—without mutating any real data.
- **View cascading impact** of every proposed change, scored by severity (`low` → `high` → `critical`), before committing it.
- **Track event readiness** through an automated readiness score computed from task completion, vendor status, and guest confirmations.

---

## 🧠 Approach to Solving the Problem

### 1. Decomposing the Domain

The problem was first broken down into its core entities: **Events**, **SubEvents**, **Tasks**, **Vendors**, **GuestGroups**, **Requirements**, **Risks**, **Suggestions**, and **Notifications**. Each entity has its own Mongoose model, service layer, Zod validators, controller, and versioned route — keeping concerns well separated and independently testable.

### 2. AI as a First-Class Feature, Not an Afterthought

Rather than bolting AI on top of a finished system, the AI layer was designed into the architecture from the start:

- **`llmClient.js`** — A unified adapter that wraps OpenAI, Anthropic, and Google Gemini APIs behind a single `generateStructuredChat()` interface. The active provider is selected via the `LLM_PROVIDER` environment variable, with per-call timeout enforcement.
- **`chatOrchestrator.js`** — Assembles rich event context (all sub-events, tasks, vendors, guest groups, open risks) into a structured prompt, calls the LLM, and enriches every proposed action with a deterministic impact analysis before returning the response.
- **`whatIfSimulator.js`** — Accepts a free-text scenario description, infers the change type (vendor change / guest count / budget) via keyword matching, runs the impact engine in read-only mode, and asks the LLM for a risk narrative — never touching the database.
- **`prompts.js`** — Centralises all system and context prompts, making them easy to iterate on independently of business logic.

### 3. Deterministic Impact Engine

LLM responses are intentionally *advisory*. Severity scoring and dependency tracing are handled deterministically by three dedicated engines in `backend/src/services/engine/`:

| Engine | Responsibility |
|---|---|
| `impactEngine.js` | Computes cascading impact when a vendor, guest count, task, or budget changes. Returns severity, affected entities, cascading risks, and suggested mitigations. |
| `readinessEngine.js` | Produces an overall event readiness score (0–100%) based on task completion rate, vendor contract status, and guest confirmation rate. |
| `riskEngine.js` | Identifies, scores, and surfaces open risks, automatically generating mitigation suggestions. |

This hybrid approach — LLM for natural language + deterministic engines for scoring — gives users trust in the numbers while still allowing free-form AI interaction.

### 4. Security by Default

Security is not optional. Every request passes through:
- **Helmet** — Sets 15+ protective HTTP headers.
- **CORS** — Enforces an origin allowlist; auto-permits `localhost` in development.
- **Rate Limiting** — A global API rate limiter (`express-rate-limit`) prevents brute-force and DDoS attempts.
- **JWT (Access + Refresh)** — Short-lived access tokens (15 min) with HttpOnly cookie-based refresh tokens (7 days).
- **bcryptjs** — All passwords are salted and hashed before storage.

### 5. Frontend State Architecture

Client state is divided strictly:

| State Type | Library | Used For |
|---|---|---|
| Server state | TanStack React Query | All data fetched from the backend — caching, refetching, mutations, optimistic updates |
| Client UI state | Zustand | Auth session, sidebar state, and UI toggles |

This prevents the classic mistake of storing server data in a global store and allows React Query to handle cache invalidation automatically.

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                 │
│  Pages: Events · Dashboard · Tasks · Vendors · Guests   │
│         Risks · Timeline · Activity                      │
│                                                         │
│  State: React Query (server) + Zustand (client)         │
│  Forms: React Hook Form + Zod validation                │
│  UX:    DnD Kit drag-and-drop, Lucide icons             │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP /api/v1 (Axios)
┌──────────────────────▼──────────────────────────────────┐
│               Express.js Backend (Node.js ESM)           │
│                                                         │
│  Middleware: Helmet · CORS · Morgan · Rate Limiter       │
│  Auth:       JWT (access + refresh cookie)              │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Route / Controller Layer             │   │
│  │  /auth  /events  /tasks  /vendors  /guests        │   │
│  │  /risks  /sub-events  /chat  /notifications ...  │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                               │
│  ┌──────────────────────▼───────────────────────────┐   │
│  │              Service Layer                        │   │
│  │  eventService · taskService · vendorService       │   │
│  │  authService · notificationService · …            │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                               │
│  ┌──────────────────────▼───────────────────────────┐   │
│  │              AI Layer                             │   │
│  │  chatOrchestrator → llmClient (Gemini/GPT/Claude) │   │
│  │  whatIfSimulator  → impactEngine (read-only)      │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                               │
│  ┌──────────────────────▼───────────────────────────┐   │
│  │              Deterministic Engines                │   │
│  │  impactEngine · readinessEngine · riskEngine      │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                               │
│  ┌──────────────────────▼───────────────────────────┐   │
│  │           Mongoose Models (MongoDB)               │   │
│  │  Event · SubEvent · Task · Vendor · GuestGroup    │   │
│  │  Requirement · Risk · Conversation · Notification │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠 Technology Stack

### Backend

| Category | Technology | Purpose |
|---|---|---|
| Runtime | **Node.js** (ESM) | Server runtime |
| Framework | **Express.js v5** | HTTP server and routing |
| Database | **MongoDB + Mongoose v9** | Primary data store and ODM |
| Auth | **jsonwebtoken**, **bcryptjs** | JWT-based authentication, password hashing |
| Validation | **Zod** | Schema-based request validation |
| AI — Gemini | **@google/generative-ai** | Default LLM provider |
| AI — OpenAI | **openai** | Optional LLM provider |
| AI — Anthropic | **@anthropic-ai/sdk** | Optional LLM provider |
| Logging | **Winston** + **Morgan** | Structured JSON logs, HTTP access logs |
| Scheduling | **node-cron** | Background jobs (e.g., notification dispatch) |
| Security | **Helmet**, **cors**, **express-rate-limit** | HTTP headers, CORS, rate limiting |

### Frontend

| Category | Technology | Purpose |
|---|---|---|
| Framework | **React 19** | UI rendering |
| Build Tool | **Vite** | Dev server, bundling, proxy |
| Styling | **Tailwind CSS v4** | Utility-first CSS |
| Icons | **Lucide React** | Icon library |
| Server State | **TanStack React Query v5** | Data fetching, caching, mutations |
| Client State | **Zustand v5** | Lightweight global state |
| Forms | **React Hook Form** + **Zod** + **@hookform/resolvers** | Form management and validation |
| Routing | **React Router DOM v6** | Client-side routing, lazy loading |
| HTTP Client | **Axios** | API requests |
| Drag & Drop | **@dnd-kit/core**, **@dnd-kit/sortable** | Sub-event timeline ordering |
| Date Utils | **date-fns** | Date formatting and arithmetic |

### Developer Tooling

| Tool | Purpose |
|---|---|
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Jest** + **Supertest** | Backend integration tests |
| **Nodemon** | Backend hot-reload in development |

---

## 📁 Project Structure

```
Xperience_Assignment/
├── package.json              # Root package (backend scripts & dependencies)
│
├── backend/
│   ├── server.js             # Entry point — connects DB and starts HTTP server
│   ├── app.js                # Express app setup (middleware, routes, error handler)
│   ├── .env.example          # Environment variable template
│   └── src/
│       ├── config/           # Env parsing (Zod-validated)
│       ├── controllers/      # Request handlers (thin — delegates to services)
│       ├── middleware/        # auth, errorHandler, rateLimiter, validate
│       ├── models/           # Mongoose schemas
│       │   ├── Event.js
│       │   ├── SubEvent.js
│       │   ├── Task.js
│       │   ├── Vendor.js
│       │   ├── GuestGroup.js
│       │   ├── Requirement.js
│       │   ├── Risk.js
│       │   ├── Conversation.js
│       │   ├── Notification.js
│       │   ├── Suggestion.js
│       │   ├── ActivityLog.js
│       │   └── User.js
│       ├── routes/v1/        # Versioned REST routes
│       ├── seed/             # seed.js — populates DB with demo data
│       ├── services/
│       │   ├── ai/
│       │   │   ├── llmClient.js         # Unified LLM adapter (Gemini/OpenAI/Anthropic)
│       │   │   ├── chatOrchestrator.js  # Chat pipeline: context → LLM → impact → save
│       │   │   ├── whatIfSimulator.js   # Read-only scenario simulation
│       │   │   ├── actionExecutor.js    # Applies approved AI actions to the DB
│       │   │   └── prompts.js           # System and context prompts
│       │   ├── engine/
│       │   │   ├── impactEngine.js      # Cascading impact analysis
│       │   │   ├── readinessEngine.js   # Event readiness score
│       │   │   └── riskEngine.js        # Risk identification and scoring
│       │   ├── authService.js
│       │   ├── eventService.js
│       │   ├── taskService.js
│       │   ├── vendorService.js
│       │   └── …                        # Other domain services
│       ├── utils/            # logger, ApiError, assertEventOwnership
│       └── validators/       # Zod request schemas per entity
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── .env.example
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── routes.jsx         # Route definitions (lazy-loaded pages)
        ├── api/               # Axios instance and per-entity API modules
        ├── components/
        │   ├── layout/        # AppShell, ProtectedRoute, Sidebar
        │   └── ui/            # Reusable UI primitives (Skeleton, etc.)
        ├── hooks/             # Custom React hooks
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Events.jsx
        │   ├── Dashboard.jsx  # Per-event: AI chat, readiness score, quick stats
        │   ├── Tasks.jsx
        │   ├── Vendors.jsx
        │   ├── Guests.jsx
        │   ├── Risks.jsx
        │   ├── Timeline.jsx   # Drag-and-drop sub-event ordering
        │   └── Activity.jsx
        ├── store/             # Zustand stores (auth, UI)
        └── utils/             # Date helpers, formatters
```

---

## 🔌 API Overview

All routes are prefixed with `/api/v1`. Protected routes require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | ❌ | Create a new user account |
| `POST` | `/auth/login` | ❌ | Login, returns access token + sets refresh cookie |
| `POST` | `/auth/refresh` | ❌ | Issue new access token from HttpOnly refresh cookie |
| `POST` | `/auth/logout` | ✅ | Clear refresh cookie |
| `GET` | `/events` | ✅ | List all events for the authenticated user |
| `POST` | `/events` | ✅ | Create a new event |
| `GET` | `/events/:id` | ✅ | Get a single event by ID |
| `PATCH` | `/events/:id` | ✅ | Update event details |
| `DELETE` | `/events/:id` | ✅ | Delete an event |
| `GET` | `/events/:id/readiness` | ✅ | Get the event's readiness score |
| `GET/POST/PATCH/DELETE` | `/events/:id/tasks` | ✅ | Manage tasks for an event |
| `GET/POST/PATCH/DELETE` | `/events/:id/vendors` | ✅ | Manage vendors for an event |
| `GET/POST/PATCH/DELETE` | `/events/:id/guests` | ✅ | Manage guest groups |
| `GET/POST/PATCH/DELETE` | `/events/:id/risks` | ✅ | Manage risks |
| `GET/POST/PATCH/DELETE` | `/events/:id/sub-events` | ✅ | Manage sub-events / timeline |
| `POST` | `/events/:id/chat` | ✅ | Send a message to the AI assistant |
| `GET` | `/events/:id/chat` | ✅ | Retrieve paginated chat history |
| `POST` | `/events/:id/chat/what-if` | ✅ | Run a What-If scenario simulation |
| `GET` | `/events/:id/activity` | ✅ | View the event's activity log |
| `GET` | `/notifications` | ✅ | List notifications for the current user |

---

## ⚙️ Setup Instructions

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A **MongoDB** instance — [MongoDB Atlas free tier](https://www.mongodb.com/atlas) is recommended

---

### Step 1 — Clone the Repository

```bash
git clone <your-repo-url>
cd Xperience_Assignment
```

---

### Step 2 — Backend Setup

**2a. Install dependencies**

```bash
# From the project root
npm install
```

**2b. Configure environment variables**

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in the required values (see [Environment Variables Reference](#-environment-variables-reference) below).

At minimum you need:
- `MONGODB_URI`
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- An API key for your chosen LLM provider (`GEMINI_API_KEY` is the default)

**2c. (Optional) Generate secure JWT secrets**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Run this twice — once for `JWT_ACCESS_SECRET` and once for `JWT_REFRESH_SECRET`.

**2d. (Optional) Seed the database**

Populates the database with a sample event, tasks, vendors, and guest groups so you can explore the app immediately:

```bash
npm run seed
```

**2e. Start the backend server**

```bash
# Development (with hot-reload via Nodemon)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:5000`.

---

### Step 3 — Frontend Setup

**3a. Navigate to the frontend directory and install dependencies**

```bash
cd frontend
npm install
```

**3b. Configure environment variables**

```bash
cp .env.example .env
```

The default `.env` uses a relative URL so the Vite dev proxy forwards API calls to the backend automatically — **no changes needed for local development**:

```env
VITE_API_BASE_URL=/api/v1
```

**3c. Start the frontend development server**

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000` (or the next free port).

---

### Step 4 — Running Tests

```bash
# From the project root
npm test

# Watch mode
npm run test:watch
```

Tests use **Jest** + **Supertest** and run against a live MongoDB connection (configure `MONGODB_URI` accordingly or use a test database).

---

### Quick Reference — Available NPM Scripts (root)

| Script | Description |
|---|---|
| `npm run dev` | Start backend with Nodemon hot-reload |
| `npm start` | Start backend in production mode |
| `npm run seed` | Seed the database with demo data |
| `npm test` | Run all backend tests |
| `npm run lint` | Lint the backend codebase |
| `npm run format` | Format the backend with Prettier |

---

## 🔐 Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | ✅ | `development` | `development` or `production` |
| `PORT` | ✅ | `5000` | Port the server listens on |
| `LOG_LEVEL` | ❌ | `info` | Winston log level (`error`, `warn`, `info`, `http`, `debug`) |
| `MONGODB_URI` | ✅ | — | Full MongoDB connection string |
| `JWT_ACCESS_SECRET` | ✅ | — | Secret for signing access tokens (min 32 chars) |
| `JWT_ACCESS_EXPIRY` | ❌ | `15m` | Access token lifetime |
| `JWT_REFRESH_SECRET` | ✅ | — | Secret for signing refresh tokens (min 32 chars, different from above) |
| `JWT_REFRESH_EXPIRY` | ❌ | `7d` | Refresh token lifetime |
| `LLM_PROVIDER` | ✅ | `gemini` | Active LLM provider: `gemini`, `openai`, or `anthropic` |
| `LLM_MODEL` | ❌ | Provider default | Override the model name (e.g., `gemini-1.5-pro`) |
| `LLM_TIMEOUT_MS` | ❌ | `30000` | Milliseconds before an LLM call times out |
| `GEMINI_API_KEY` | ⚠️ | — | Required when `LLM_PROVIDER=gemini` |
| `OPENAI_API_KEY` | ⚠️ | — | Required when `LLM_PROVIDER=openai` |
| `ANTHROPIC_API_KEY` | ⚠️ | — | Required when `LLM_PROVIDER=anthropic` |
| `CORS_ORIGINS` | ❌ | `http://localhost:3000` | Comma-separated list of allowed CORS origins |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | ✅ | Base URL for API calls. Use `/api/v1` (relative) in development with the Vite proxy, or the full backend URL in production. |

---

## 💡 Key Assumptions & Design Decisions

### Multi-LLM Strategy
We assumed that locking into a single AI provider creates fragility. The `llmClient.js` adapter normalises all three providers (Gemini, OpenAI, Anthropic) behind one interface. Switching providers requires changing a single environment variable — no code changes. This also allows the team to adopt the best or most cost-effective model as the market evolves.

### LLM + Deterministic Engines (Hybrid Approach)
LLMs are excellent at natural language understanding and generating human-readable summaries, but unreliable for precise numerical scoring. We deliberately offload severity calculation, risk scoring, and readiness percentages to deterministic engines (`impactEngine`, `readinessEngine`, `riskEngine`). The LLM proposes *what* might be affected; the engines compute *how badly*. This gives users confidence in the scores.

### What-If Simulation is Always Read-Only
The `whatIfSimulator` was designed to **never** write to the database. This is a hard constraint enforced at the service layer, not by convention. Users should be able to freely explore hypothetical scenarios without fear of accidentally corrupting real event data.

### ESM-Only Codebase
Both the backend (`"type": "module"`) and the frontend (Vite default) use native ECMAScript Modules. This avoids the dual-module hazard and aligns with the direction of the Node.js ecosystem, at the cost of some additional Jest configuration (`--experimental-vm-modules`).

### Proposed Actions Require Explicit Approval
When the AI suggests changes (e.g., *"Update vendor status to unavailable"*), those actions are stored as `pending` in the conversation. A separate `actionExecutor.js` applies them only when explicitly approved by the user. This prevents the AI from autonomously mutating the event.

### Separation of Server and Client State
`react-query` is used exclusively for data that originates from the server. Zustand is kept deliberately minimal (auth session, UI flags). This means React Query handles all cache invalidation, prevents stale data, and enables optimistic updates — with no manual cache-busting code needed in Zustand.

### Lazy-Loaded Routes
All page components in the frontend are dynamically imported via `React.lazy()`. This means the initial JavaScript bundle is significantly smaller — users only download the code for the pages they actually visit. A skeleton fallback is rendered during the load.

### Request Body Size Limit
The Express body parser caps all incoming JSON at `10kb`. This prevents memory-exhaustion attacks from oversized payloads and is a deliberate security trade-off — acceptable for this domain since all valid event management payloads are well within this limit.

### Activity Logging
Every significant mutation (create/update/delete on events, tasks, vendors, etc.) writes an `ActivityLog` document. This gives event managers a full audit trail and powers the Activity page, without adding overhead to individual service methods via a middleware pattern.
