# PulsePoll

> **"Create polls. Share instantly. Watch responses live."**

PulsePoll is a modern, high-performance real-time polling platform built with React, Go (Gin), MongoDB, Redis, and WebSockets.

---

## Architecture Overview

PulsePoll implements an end-to-end real-time architecture where votes are persisted in MongoDB, counted atomically in Redis, distributed across server instances using Redis Pub/Sub, and broadcasted to connected web clients via WebSockets without requiring a page refresh.

```
React (Vite + Tailwind + shadcn/ui)
      │
      │ HTTP (REST)
      ▼
Go + Gin Server
      │
      ├──────────────────────► MongoDB (Source of Truth)
      │                         ├── Users collection (unique emails)
      │                         ├── Polls collection (unique share codes)
      │                         └── Votes collection (unique pollId + voterToken)
      │
      └──────────────────────► Redis (Real-time Speed Layer)
                                ├── Fast Vote Counters: HINCRBY poll:{pollId} {optionId} 1
                                └── Pub/Sub Channel: poll:{pollId}
                                          │
                                          ▼
                                Go Redis Subscriber (Background Worker)
                                          │
                                          ▼
                                 WebSocket Hub (Gorilla WebSockets)
                                          │
                                          ▼
                            Connected Audience & Creator Clients
                                (No page refresh needed!)
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite, TypeScript | Modern, high-performance client interface |
| **Styling & UI** | Tailwind CSS, shadcn/ui, Radix UI, Lucide Icons | Accessible, responsive, SaaS design system |
| **Backend** | Go 1.21+ (Go 1.27), Gin Framework | Fast, concurrent REST API & WebSocket server |
| **Database** | MongoDB (mongo-driver) | Persistent storage for users, polls, and votes |
| **Realtime / Cache** | Redis (go-redis/v9) | Atomic vote counting (`HINCRBY`) & Pub/Sub event bus |
| **Realtime Push** | WebSockets (gorilla/websocket) | Bi-directional streaming of live vote count updates |
| **Authentication** | JWT (golang-jwt/v5) + bcrypt | Stateless authentication & secure password hashing |

---

## Realtime Architecture & Flow

### When an audience member casts a vote:
1. **Client Request**: React sends `POST /api/v1/polls/:id/votes` with `{ optionId, voterToken }`.
2. **Server Validation**: Go validates that the poll is active, the option exists, and the `voterToken` has not already voted on this poll.
3. **MongoDB Persistence**: The vote is saved to MongoDB (`votes` collection) with a compound unique index on `(pollId, voterToken)` to prevent duplicate voting.
4. **Redis Counter Increment**: Redis executes `HINCRBY poll:{pollId} {optionId} 1` atomically.
5. **Event Emission**: Go publishes a `POLL_RESULTS_UPDATED` JSON event to the Redis Pub/Sub channel `poll:{pollId}`:
   ```json
   {
     "type": "POLL_RESULTS_UPDATED",
     "pollId": "65f0123456789abcdef01234",
     "counts": {
       "java": 42,
       "python": 39,
       "javascript": 20
     },
     "totalVotes": 101,
     "timestamp": "2026-09-19T10:15:30Z"
   }
   ```
6. **Hub Broadcast**: The background Redis subscriber receives the event and passes it to the WebSocket Hub, which broadcasts the payload to all clients connected to that specific poll's room (`/ws/polls/:pollId`).
7. **Instant UI Update**: Connected React clients update their state and progress bars immediately without reloading the page.

---

## Features

- **Authentication & Security**:
  - Sign up & Login with email validation and password length checks.
  - Passwords hashed using bcrypt.
  - JWT issued upon authentication with protected route middleware.
  - Creators can only edit, close, or delete their own polls.
- **Poll Creation & Management**:
  - Dynamic options (2 to 10 options per poll).
  - Unique shareable URLs (e.g. `/p/:shareCode`).
  - QR Code generation using `qrcode.react` for instant mobile audience voting.
  - Close poll functionality to stop incoming votes.
  - Delete poll with cascading deletion of associated votes.
- **Audience Experience**:
  - Anonymous voting without requiring an account.
  - Automatic browser voter token generation with duplicate vote prevention.
  - Responsive voting cards with touch-friendly layout.
  - Immediate transition to live results with animated progress bars.
- **Resilient Realtime Connection**:
  - Live status indicator: `● Live`, `◌ Connecting...`, `↻ Reconnecting...`, `○ Offline`.
  - Automatic reconnection with exponential backoff on network disruptions.

---

## API Documentation

### Public Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health status |
| `POST` | `/api/v1/auth/signup` | Register a new user |
| `POST` | `/api/v1/auth/login` | Log in and receive JWT |
| `GET` | `/api/v1/public/polls/:shareCode` | Get poll by share code (public-safe) |
| `GET` | `/api/v1/public/polls/:shareCode/results` | Get latest results for a poll |
| `GET` | `/ws/polls/:pollId` | WebSocket connection for live updates |

### Protected Endpoints (Bearer Token required)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/auth/me` | Get current authenticated user profile |
| `POST` | `/api/v1/polls` | Create a new poll |
| `GET` | `/api/v1/polls` | List polls created by authenticated user |
| `GET` | `/api/v1/polls/:id` | Get poll details and live stats |
| `PATCH` | `/api/v1/polls/:id` | Update poll title or description |
| `DELETE` | `/api/v1/polls/:id` | Delete poll and its votes |
| `POST` | `/api/v1/polls/:id/close` | Close poll to disable voting |
| `POST` | `/api/v1/polls/:id/votes` | Cast a vote on a poll |

---

## Local Setup & Development

### Prerequisites
- Node.js 18+ and npm
- Go 1.21+
- MongoDB and Redis (or Docker)

### 1. Start Infrastructure via Docker Compose
```bash
docker-compose up -d
```
*Starts MongoDB on `localhost:27017` and Redis on `localhost:6379`.*

### 2. Run Backend
```bash
cd backend
cp .env.example .env
go run cmd/server/main.go
```
*Backend server runs on `http://localhost:8080`.*

### 3. Run Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## Running Tests

### Backend Unit Tests
```bash
cd backend
go test -v ./...
```
Tests cover:
- Password hashing & verification
- JWT generation & claims validation
- Share code uniqueness
- Auth input validators
- Poll creation validators & option uniqueness
- Vote request validators

### Frontend Build & Typecheck
```bash
cd frontend
npm run build
```

---

## Security & Data Integrity

- **Database Separation**: MongoDB holds persistent records. Redis counters can be rebuilt on startup from MongoDB aggregates.
- **Duplicate Vote Prevention**: MongoDB compound unique index `(pollId, voterToken)` combined with Redis atomic increments guarantees vote integrity.
- **Protected Authorization**: User identity is verified against `poll.creatorId` before any mutation is allowed.
