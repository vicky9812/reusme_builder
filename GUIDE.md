# CV Builder Backend – Developer Guide

Author: vicky neosoft test builder app

This single-page guide explains how to run, understand, and extend the backend. It also documents environment, Supabase setup, architecture, business rules, and API endpoints, plus how to generate API docs (Typedoc).

**Note**: This guide is for the backend service. The backend is now located in the `backend/` folder. For full project setup, see the root [README.md](README.md).

## Quick Start

1) Prerequisites
- Node.js >= 18
- npm
- Supabase project (URL and keys)

2) Install
```bash
cd backend
npm install
```

3) Configure environment (.env)
```
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=change-me
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=change-me-refresh
JWT_REFRESH_EXPIRES_IN=30d

# Supabase
SUPABASE_URL=your-url
SUPABASE_ANON_KEY=your-anon
SUPABASE_SERVICE_ROLE_KEY=your-service-role
```

4) Run (dev)
```bash
cd backend
npm run dev
```
Backend starts on http://localhost:3001 (API base: /api)

5) Build & run (prod)
```bash
cd backend
npm run build
npm start
```

6) Generate API docs (Typedoc)
```bash
cd backend
npm run docs
# Open backend/docs/index.html
```

7) Serve docs on localhost:8080 (optional)
```bash
cd backend
npx http-server docs -p 8080 --silent
# Then open http://localhost:8080
```

8) Start frontend (optional)
```powershell
# PowerShell: run commands separately
cd frontend
npm start
```

## Run with Docker (backend + docs)

Build images and start containers (detached):
```bash
# From project root
docker compose build backend docs
docker compose up -d
```

Open services:
- Backend API: http://localhost:3001
- API health: http://localhost:3001/health and http://localhost:3001/api/health
- Docs: http://localhost:8080

Common actions:
```bash
# View logs
docker compose logs -f backend
docker compose logs -f docs

# Rebuild after code changes
docker compose build backend docs && docker compose up -d

# Stop and remove containers
docker compose down
```

## Supabase Setup

Schema core tables (see backend/database/schema.sql):
- users: account identity, role, contact_number, timestamps
- cvs: user_id FK, title, layout, status, is_public, download_count, share_count, timestamps

Keys required in .env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
Service role key is used server-side for writes and secure operations.

## Architecture Overview

Project structure (backend/src/):
- `_shared/` – constants, types, domain rules (business/authorization)
- `config/` – environment and database client wiring (Supabase)
- `controllers/` – HTTP adapters; validate, authorize, call models/services, format responses
- `middleware/` – authN/authZ, validation, rate limiting, error handling
- `models/` – data access layer (Supabase queries, aggregates)
- `routes/` – Express route definitions; thin, no logic
- `services/` – domain services (e.g., AuthService: JWT, hashing, refresh)
- `utils/` – logger, response helpers, validation helpers
- `server.ts` – Express bootstrap (security, CORS, logging, health, routes, errors)

Design principles:
- SRP: each module owns one responsibility
- Controllers have no persistence; Models have no HTTP
- ResponseUtil ensures consistent `{ success, message, data }`
- Environment read centralized in config/environment

### Backend folders explained

- `_shared/`
  - What: Cross-cutting domain pieces used everywhere.
  - Contains: `constants.ts` (roles, limits, statuses), `types.ts` (shared TS types), `rules.ts` (domain rules like permissions and limits).
  - Why: Keeps business facts and contracts in one place so controllers/models don’t duplicate logic.

- `config/`
  - What: Application wiring and configuration.
  - Contains: `environment.ts` (reads/validates env), `database.ts` (Supabase client factory).
  - Why: Centralizes side‑effects and env access; other modules import typed config.

- `controllers/`
  - What: HTTP adapters only.
  - Contains: `AuthController.ts`, `CVController.ts`, `PaymentController.ts`.
  - Why: Validate input, authorize, call services/models, and return `ResponseUtil` shapes. No database code here.

- `middleware/`
  - What: Express middleware chain.
  - Contains: `auth.ts` (JWT + permissions), `validation.ts` (request schema checks), `rateLimiter.ts`, `errorHandler.ts`.
  - Why: Reusable HTTP concerns applied per route or globally.

- `models/`
  - What: Data access layer (DAL).
  - Contains: `User.ts`, `CV.ts`, `Payment.ts` with all Supabase queries and aggregates.
  - Why: Single place that knows how the database is queried; easy to change without touching controllers.

- `routes/`
  - What: Route registration.
  - Contains: `index.ts` (aggregator), `auth.ts`, `cv.ts`, `payment.ts`.
  - Why: Declarative wiring for paths, params validation, and middleware composition.

- `services/`
  - What: Domain services (pure logic + integrations).
  - Contains: `AuthService.ts` (hashing, tokens, refresh flow).
  - Why: Keeps domain logic testable and separate from HTTP and DAL.

- `types/`
  - What: Type augmentations.
  - Contains: `express.d.ts` to extend `Request` with `user` (for `AuthenticatedRequest`).
  - Why: Safer typing of middleware/controller contracts.

- `utils/`
  - What: Infrastructure helpers.
  - Contains: `logger.ts` (winston + morgan stream), `response.ts` (standard JSON responses), `validation.ts` (helpers).
  - Why: Shared utilities that are not business rules.

- `validators/`
  - What: (If used) Reusable validation schemas/helpers independent of Express.
  - Why: Keep complex validation logic out of controllers.

- `server.ts`
  - What: Application entrypoint.
  - Does: Helmet/CORS/Morgan, rate limiter, JSON parsing, `/health`, mounts `/api`, not-found + global error handlers, graceful shutdown.
  - Why: A single place to bootstrap and configure the server.

### Key files at a glance

- `server.ts`: Express bootstrap (helmet, cors, morgan, rateLimiter, JSON parsing, `/health`, routes, global errors, graceful shutdown)
- `routes/index.ts`: aggregates feature routers under `/api`, adds `/api/health` and API 404
- `routes/auth.ts`, `routes/cv.ts`, `routes/payment.ts`: route wiring, param validation, auth, permission checks
- `controllers/AuthController.ts`: register/login/refresh/logout/profile using `AuthService`
- `controllers/CVController.ts`: CRUD, list, dashboard stats, download/share with `UserRules`/`CVRules`
- `controllers/PaymentController.ts`: payment processing entry (records + triggers client invoice flow)
- `models/User.ts`, `models/CV.ts`, `models/Payment.ts`: all Supabase I/O for respective entities
- `middleware/auth.ts`: JWT verify, role permissions, `hasPermission('verb:scope')`
- `middleware/validation.ts`: request validation helpers
- `middleware/errorHandler.ts`: notFound + global error formatter
- `middleware/rateLimiter.ts`: sensible per-IP limits
- `_shared/rules.ts`: domain/business rules (ownership, monthly limits, allowlists)
- `_shared/constants.ts`: roles, statuses, limits, reusable strings
- `_shared/types.ts` + `types/express.d.ts`: shared TS types and request augmentation
- `config/environment.ts`: typed env loader; only place reading `process.env`
- `config/database.ts`: initializes Supabase client
- `utils/response.ts`: standard JSON shapes; `success`, `badRequest`, `forbidden`, etc.
- `utils/logger.ts`: winston logger and morgan stream

## Authentication Flow

- Login: POST `/api/auth/login` → validates credentials (controllers/AuthController → services/AuthService), issues JWT and refresh token, returns user profile + tokens.
- Profile: GET `/api/auth/profile` → middleware verifies JWT, returns user fields from token.
- Refresh: POST `/api/auth/refresh` → validates refresh token, issues new access token.
- Logout: POST `/api/auth/logout` → invalidates refresh token (if store/blacklist enabled).

Tokens:
- Access token (short-lived) for Authorization: Bearer <token>
- Refresh token (long-lived) to rotate access tokens

## CV Domain Flow

- Create: POST `/api/cv` → validates payload, creates CV tied to `req.user.userId`.
- List: GET `/api/cv` → pagination, filters by status/search, scoped to user.
- Get by ID: GET `/api/cv/:cvId`
- Update: PUT `/api/cv/:cvId`
- Delete/Archive: DELETE `/api/cv/:cvId` or specific archive endpoint (if present)
- Dashboard stats: GET `/api/cv/dashboard-stats` → aggregates totals (downloads/shares from counters; views currently 0 by design).
- Download: POST `/api/cv/:cvId/download` → permission check + monthly limits; increments download_count.
- Share: POST `/api/cv/:cvId/share` → permission + monthly share limit; increments share_count.

Implementation notes:
- `models/CV.ts` encapsulates all Supabase queries.
- `controllers/CVController.ts` enforces rules and formats responses.
- Counters use read-then-update to avoid resetting; ensure atomicity as needed.

## Payment Flow (stub for upgrades)

- POST `/api/payment/process` → accepts metadata (plan, last4, cardholder), records/validates; in our UI, also triggers client PDF invoice generation.

## Business Rules & Permissions

Defined in `_shared/rules.ts` and `middleware/auth.ts`:
- Role permissions: `user` (own), `premium` (unlimited download/share), `admin` (read/write/delete all, unlimited download/share)
- `hasPermission(action)` accepts strings like `download:own`.
- Middleware maps `:unlimited` to satisfy `:own` where applicable.
- Ownership checks: user.id must equal cv.user_id for own actions.
- Limits: `CVRules.canUserDownloadMore` / `canUserShareMore` enforce monthly quotas (values from `_shared/constants.ts`).

Rationale:
- Keep authorization in middleware and rules (reusable, testable).
- Keep limits in domain rules to avoid scattering constants in controllers.

## Dependencies & Rationale

- **express**: minimal, performant HTTP layer with rich ecosystem
- **cors**, **helmet**, **morgan**: production-grade security headers and request logs
- **express-rate-limit**: protect from brute-force / abuse without extra infra
- **@supabase/supabase-js**: typed client to Postgres + storage/auth features
- **jsonwebtoken**, **bcryptjs**: de-facto standards for token auth and password hashing
- **winston**: structured logs suitable for local files/CLIs and cloud targets
- **express-validator**: declarative input validation/transforms
- **ts-node**, **tsconfig-paths**: fast DX + path aliases during dev
- **typedoc**: keeps documentation close to code (TSDoc), versionable and searchable

Trade-offs:
- Using Supabase client simplifies Auth and DB access; vendor lock-in acceptable for assignment.
- Counters increment with read-then-update; for high concurrency, consider RPC or DB-side atomic increments.

## Error Handling & Responses

- `middleware/errorHandler.ts` centralizes error formatting
- `utils/response.ts` ensures consistent success/error shapes and status codes

## How To Maintain & Extend

- Add features by creating a model (data), controller (HTTP), route (wiring), and rules (authorization/limits) as needed.
- Add TSDoc above every exported class/function.
- Run `npm run docs` after changes to refresh docs.

## Endpoint Reference (selected)

Auth
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/refresh`
- POST `/api/auth/logout`
- GET `/api/auth/profile`

CV
- POST `/api/cv`
- GET `/api/cv`
- GET `/api/cv/:cvId`
- PUT `/api/cv/:cvId`
- POST `/api/cv/:cvId/download`
- POST `/api/cv/:cvId/share`
- GET `/api/cv/dashboard-stats`

Payment
- POST `/api/payment/process`

## Regenerating API Docs (Typedoc)

1) Write/adjust TSDoc (/** ... */) above exported items
2) Run `cd backend && npm run docs`
3) Open `backend/docs/index.html`

## Notes

- Health: GET `/health` and `/api/health`
- Server hardens headers with helmet; CORS is permissive in development
- Rate limiting applied globally; tune thresholds in `middleware/rateLimiter.ts`


