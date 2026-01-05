# Technical Specification
# SwiftBeam - P2P Data Sharing Platform

**Version:** 1.0 (MVP)
**Last Updated:** January 5, 2026
**Status:** Draft

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│         ┌──────────┐                           ┌──────────┐             │
│         │ Browser A │                           │ Browser B │             │
│         │  (React)  │                           │  (React)  │             │
│         └─────┬─────┘                           └─────┬─────┘             │
│               │                                       │                   │
│               │         WebRTC Data Channel           │                   │
│               └───────────────────────────────────────┘                   │
│                         (Direct P2P Transfer)                             │
└─────────────────────────────────────────────────────────────────────────┘
                    │                           │
                    │ WebSocket                 │ WebSocket
                    │ (Signaling)               │ (Signaling)
                    ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACKEND SERVICES                               │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     Node.js Application Server                    │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │    │
│  │  │  REST API   │  │  Signaling  │  │  Presence Manager       │  │    │
│  │  │  (Express)  │  │  (Socket.io)│  │  (Redis Pub/Sub)        │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                    │                           │                         │
│                    ▼                           ▼                         │
│  ┌─────────────────────────┐    ┌─────────────────────────────────┐    │
│  │      PostgreSQL         │    │            Redis                 │    │
│  │  (Users, Orgs, Invites) │    │  (Sessions, Rooms, Presence)    │    │
│  └─────────────────────────┘    └─────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                │
│     ┌──────────────┐              ┌──────────────────────────────┐      │
│     │ STUN Servers │              │ TURN Server (Fallback)       │      │
│     │ (Google/Free)│              │ (Coturn - Self-hosted/Paid)  │      │
│     └──────────────┘              └──────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Core Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Privacy First** | No file/message storage on server; P2P transfers only |
| **Ephemeral Data** | Rooms expire; messages lost on session end |
| **Minimal Server Role** | Server only handles signaling, auth, and org management |
| **Graceful Degradation** | TURN fallback when direct P2P fails (~20-25% of connections) |

---

## 2. Technology Stack

### 2.1 Frontend

| Component | Technology | Justification |
|-----------|------------|---------------|
| Framework | **Next.js 14+** | SSR for SEO, App Router, built-in API routes |
| State Management | **Zustand** | Lightweight, no boilerplate, good for real-time state |
| Styling | **Tailwind CSS** | Rapid UI development, consistent design system |
| WebRTC | **Native RTCPeerConnection** | No wrapper needed for simple 1:1 connections |
| WebSocket | **Socket.io-client** | Automatic reconnection, fallback transports |
| Forms | **React Hook Form + Zod** | Type-safe validation |

### 2.2 Backend

| Component | Technology | Justification |
|-----------|------------|---------------|
| Runtime | **Node.js 20 LTS** | Async I/O ideal for real-time apps |
| Framework | **Express.js** | Mature, extensive middleware ecosystem |
| WebSocket | **Socket.io** | Room support, auto-reconnect, cross-browser |
| Database | **PostgreSQL 16** | ACID compliance, relational integrity for orgs |
| Cache/Pub-Sub | **Redis 7** | In-memory speed for rooms, presence, sessions |
| ORM | **Prisma** | Type-safe queries, migrations, good DX |
| Auth | **JWT + bcrypt** | Stateless auth, secure password hashing |

### 2.3 Infrastructure (Free Tier)

| Component | Technology | Free Tier Limits |
|-----------|------------|------------------|
| Frontend Hosting | **Vercel** | 100GB bandwidth/month, serverless functions |
| Backend Hosting | **Render** | 750 hours/month (sleeps after 15min inactive) |
| Database | **Neon PostgreSQL** | 0.5GB storage, 1 project, auto-sleep |
| Cache/Pub-Sub | **Upstash Redis** | 10K commands/day, 256MB storage |
| CDN/SSL | **Cloudflare** | Unlimited bandwidth, free SSL |
| STUN | **Google Public STUN** | Free, unlimited |
| TURN | **Open Relay Project** | 20GB/month (community-based) |

---

## 3. Database Design

### 3.1 PostgreSQL Schema

**Users Table**
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default uuid_generate_v4() |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | DEFAULT NOW() |

**Organizations Table**
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(50) | NOT NULL |
| created_by | UUID | FK → Users |
| created_at | TIMESTAMP | DEFAULT NOW() |

**Organization_Members Table**
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| org_id | UUID | FK → Organizations |
| user_id | UUID | FK → Users |
| role | ENUM | 'admin' / 'member' |
| joined_at | TIMESTAMP | DEFAULT NOW() |
| | | UNIQUE(org_id, user_id) |

**Invites Table**
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| org_id | UUID | FK → Organizations |
| token | VARCHAR(64) | UNIQUE, NOT NULL |
| created_by | UUID | FK → Users |
| expires_at | TIMESTAMP | NOT NULL (7 days) |
| used | BOOLEAN | DEFAULT FALSE |
| used_by | UUID | FK → Users, NULLABLE |

### 3.2 Redis Data Structures

| Key Pattern | Type | TTL | Purpose |
|-------------|------|-----|---------|
| `room:{code}` | Hash | 15 min | Room metadata (participants, created_at, last_activity) |
| `session:{token}` | String | 7 days | JWT session storage for invalidation |
| `presence:{org_id}` | Set | - | Online user IDs for an organization |
| `user:socket:{user_id}` | String | - | Socket ID mapping for direct messaging |
| `ratelimit:{ip}:{action}` | Counter | 1 min | Rate limiting |

---

## 4. API Design

### 4.1 REST Endpoints

**Authentication**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/signup` | Create account | No |
| POST | `/api/auth/login` | Login, return JWT | No |
| POST | `/api/auth/logout` | Invalidate session | Yes |
| GET | `/api/auth/me` | Get current user | Yes |

**Rooms**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/rooms` | Create room, return code | No |
| GET | `/api/rooms/:code` | Validate room exists | No |
| DELETE | `/api/rooms/:code` | Close room | No |

**Organizations**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/orgs` | Create organization | Yes |
| GET | `/api/orgs` | List user's orgs | Yes |
| GET | `/api/orgs/:id` | Get org details | Yes |
| DELETE | `/api/orgs/:id` | Delete org | Yes (Admin) |

**Members & Invites**
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/orgs/:id/members` | List members + status | Yes |
| POST | `/api/orgs/:id/invites` | Generate invite link | Yes (Admin) |
| DELETE | `/api/orgs/:id/members/:userId` | Remove member | Yes (Admin) |
| POST | `/api/invites/:token/accept` | Accept invite | Yes |
| GET | `/api/invites/:token` | Validate invite | No |

### 4.2 WebSocket Events

**Room & Signaling Events**
| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `room:join` | Client → Server | `{ code }` | Join a room |
| `room:joined` | Server → Client | `{ roomCode, peerId }` | Confirm join |
| `room:peer-joined` | Server → Client | `{ peerId }` | Peer entered room |
| `room:peer-left` | Server → Client | `{ peerId }` | Peer left room |
| `room:full` | Server → Client | - | Room has 2 participants |
| `room:expired` | Server → Client | - | Room timed out |
| `signal:offer` | Client → Server → Client | `{ sdp }` | WebRTC offer |
| `signal:answer` | Client → Server → Client | `{ sdp }` | WebRTC answer |
| `signal:ice-candidate` | Client → Server → Client | `{ candidate }` | ICE candidate |

**Presence Events (Org Members)**
| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `presence:online` | Server → Clients | `{ userId, orgId }` | User came online |
| `presence:offline` | Server → Clients | `{ userId, orgId }` | User went offline |
| `share:request` | Client → Server → Client | `{ fromUserId, toUserId }` | Share request |
| `share:accept` | Client → Server → Client | `{ roomCode }` | Request accepted |
| `share:decline` | Client → Server → Client | - | Request declined |

---

## 5. WebRTC Implementation

### 5.1 Connection Flow

```
┌────────────┐                  ┌────────────┐                  ┌────────────┐
│  Peer A    │                  │  Signaling │                  │  Peer B    │
│ (Initiator)│                  │   Server   │                  │ (Joiner)   │
└─────┬──────┘                  └─────┬──────┘                  └─────┬──────┘
      │                               │                               │
      │ 1. Create Room                │                               │
      │──────────────────────────────>│                               │
      │                               │                               │
      │ 2. Room Code: A7X9B2          │                               │
      │<──────────────────────────────│                               │
      │                               │                               │
      │                               │ 3. Join Room (A7X9B2)         │
      │                               │<──────────────────────────────│
      │                               │                               │
      │ 4. Peer Joined                │                               │
      │<──────────────────────────────│                               │
      │                               │                               │
      │ 5. Create Offer (SDP)         │                               │
      │──────────────────────────────>│ 6. Forward Offer              │
      │                               │──────────────────────────────>│
      │                               │                               │
      │                               │ 7. Answer (SDP)               │
      │               8. Forward      │<──────────────────────────────│
      │<──────────────────────────────│                               │
      │                               │                               │
      │ 9. ICE Candidates             │ 10. ICE Candidates            │
      │<─────────────────────────────>│<─────────────────────────────>│
      │                               │                               │
      │ ════════════════════════════════════════════════════════════ │
      │              11. Direct P2P Connection Established            │
      │ ════════════════════════════════════════════════════════════ │
```

### 5.2 ICE Server Configuration

| Type | Servers | Usage |
|------|---------|-------|
| STUN | `stun:stun.l.google.com:19302`, `stun:stun1.l.google.com:19302` | NAT discovery (free) |
| TURN | `turn:your-turn-server.com:3478` | Relay fallback (~20-25% of connections need this) |

**TURN Server Options (Free):**
- **Open Relay Project**: Free 20GB/month, global distribution, 99.999% uptime
- **Coturn on Oracle Cloud**: Free tier VM (always free), self-managed
- **Metered.ca**: Paid fallback if free limits exceeded

### 5.3 Data Channel Configuration

| Setting | Value | Reason |
|---------|-------|--------|
| `ordered` | `true` | File integrity requires ordered delivery |
| `maxRetransmits` | `null` (reliable) | Ensure all chunks arrive |
| Chunk Size | **16 KB** | Cross-browser compatibility (Chrome/Firefox/Safari) |
| Buffer Threshold | 1 MB | Pause sending when `bufferedAmount` exceeds this |

### 5.4 File Transfer Strategy

**Chunking Approach:**
1. Read file as ArrayBuffer using FileReader
2. Split into 16 KB chunks
3. Send chunk with metadata: `{ type: 'chunk', fileId, index, total, data }`
4. Monitor `bufferedAmount` - pause if > 1MB, resume on `bufferedamountlow`
5. Receiver assembles chunks, creates Blob, triggers download

**Progress Tracking:**
- Sender: Track chunks sent / total chunks
- Receiver: Track chunks received / total expected
- Update UI every 10 chunks or 100ms (whichever is less frequent)

---

## 6. Security Implementation

### 6.1 Authentication Security

| Aspect | Implementation |
|--------|----------------|
| Password Hashing | bcrypt with cost factor 12 |
| JWT Secret | 256-bit random, stored in env variable |
| Token Expiry | Access: 15 minutes, Refresh: 7 days |
| Session Storage | Redis with ability to invalidate |

### 6.2 Input Validation

| Input | Validation |
|-------|------------|
| Email | RFC 5322 format, max 255 chars |
| Password | Min 8 chars, require letter + number |
| Org Name | 3-50 chars, alphanumeric + spaces |
| Room Code | Exactly 6-8 alphanumeric chars |
| File Extension | Block list check before transfer |

### 6.3 Rate Limiting

| Action | Limit | Window |
|--------|-------|--------|
| Room Creation | 10 | 1 minute |
| Login Attempts | 5 | 15 minutes |
| Signup | 3 | 1 hour |
| Invite Generation | 20 | 1 hour |
| API Requests (general) | 100 | 1 minute |

### 6.4 File Security

**Blocked Extensions:** `.exe`, `.msi`, `.bat`, `.cmd`, `.com`, `.scr`, `.pif`, `.vbs`, `.vbe`, `.js`, `.jse`, `.ws`, `.wsf`, `.wsc`, `.wsh`, `.ps1`, `.dll`, `.sys`, `.jar`, `.app`, `.dmg`, `.pkg`, `.apk`, and others (full list in PRD)

**Validation:** Check extension on both sender (before transfer) and receiver (before save)

---

## 7. Real-Time Presence System

### 7.1 Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   User A    │      │   User B    │      │   User C    │
│  (Server 1) │      │  (Server 1) │      │  (Server 2) │
└──────┬──────┘      └──────┬──────┘      └──────┬──────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│                   Redis Pub/Sub                          │
│  Channel: org:{org_id}:presence                         │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Presence Flow

1. **User Connects:** Add to `presence:{org_id}` set, publish `presence:online`
2. **User Disconnects:** Remove from set, publish `presence:offline`
3. **Heartbeat:** Every 30 seconds to confirm alive
4. **Timeout:** If no heartbeat for 60 seconds, mark offline

### 7.3 Multi-Tab Handling

- Track connection count per user in Redis
- Only broadcast `offline` when count reaches 0
- All tabs share presence state

---

## 8. Room Management

### 8.1 Room Lifecycle

| State | Duration | Trigger |
|-------|----------|---------|
| Created | - | User clicks "Send/Receive" |
| Waiting | Until peer joins or 15 min | - |
| Active | Until inactive for 15 min | Peer joins |
| Warning | 3 min before expiry | 12 min of inactivity |
| Expired | - | 15 min inactivity or manual close |

### 8.2 Room Code Generation

- **Characters:** `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (excludes 0, O, 1, I, L)
- **Length:** 6-8 characters (random)
- **Collision Check:** Verify uniqueness in Redis before returning
- **Case Handling:** Normalize to uppercase on input

### 8.3 Room Data (Redis Hash)

| Field | Type | Description |
|-------|------|-------------|
| `created_at` | Timestamp | Room creation time |
| `last_activity` | Timestamp | Last message/action |
| `participant_1` | Socket ID | First peer |
| `participant_2` | Socket ID | Second peer (or null) |
| `type` | String | 'anonymous' or 'organization' |
| `org_id` | UUID | Only if type = 'organization' |

---

## 9. Deployment Architecture (100% Free)

### 9.1 Free Tier Stack

```
┌─────────────────────────────────────────────────────────┐
│                 Cloudflare (Free SSL + CDN)              │
└─────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
┌─────────────────┐              ┌─────────────────────────┐
│     Vercel      │              │        Render           │
│  (Frontend)     │              │  (Backend + Socket.io)  │
│  Next.js App    │              │  Node.js + Express      │
│  Free: 100GB BW │              │  Free: 750 hrs/month    │
└─────────────────┘              └───────────┬─────────────┘
                                             │
                       ┌─────────────────────┴────────────────────┐
                       ▼                                          ▼
          ┌─────────────────────┐                   ┌─────────────────────┐
          │   Neon PostgreSQL   │                   │   Upstash Redis     │
          │  Free: 0.5GB, 1 proj│                   │  Free: 10K cmd/day  │
          │  Auto-sleep on idle │                   │  256MB storage      │
          └─────────────────────┘                   └─────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    WebRTC Infrastructure                 │
│  STUN: Google (Free)    │    TURN: Open Relay (20GB/mo) │
└─────────────────────────────────────────────────────────┘
```

### 9.2 Free Tier Limitations & Workarounds

| Service | Limitation | Workaround |
|---------|------------|------------|
| **Render** | Sleeps after 15min inactive | Acceptable for MVP; users wait ~30s on cold start |
| **Neon** | 0.5GB storage | Sufficient for ~100 users with orgs |
| **Upstash** | 10K commands/day | Use in-memory fallback for rooms if limit hit |
| **Open Relay** | 20GB TURN/month | ~80% connections are direct P2P anyway |
| **Vercel** | 100GB bandwidth | More than enough for ~100 users |

### 9.3 Alternative Free Options

| Component | Primary | Alternative |
|-----------|---------|-------------|
| Frontend | Vercel | Netlify (100GB), Cloudflare Pages (unlimited) |
| Backend | Render | Koyeb (free tier), Fly.io (3 shared VMs) |
| Database | Neon | Supabase (500MB, 2 projects) |
| Redis | Upstash | Redis Cloud (30MB free) |

### 9.4 Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | 256-bit secret for JWT signing |
| `JWT_REFRESH_SECRET` | Separate secret for refresh tokens |
| `TURN_SERVER_URL` | TURN server URL |
| `TURN_USERNAME` | TURN credentials |
| `TURN_PASSWORD` | TURN credentials |
| `CORS_ORIGINS` | Allowed frontend origins |
| `NODE_ENV` | production / development |

---

## 10. Performance Considerations

### 10.1 Expected Load (MVP)

| Metric | Target |
|--------|--------|
| Concurrent Users | ~100 |
| Concurrent Rooms | ~50 |
| Peak WebSocket Connections | ~200 |
| Database Connections | Pool of 20 |

### 10.2 Optimizations

| Area | Strategy |
|------|----------|
| Database | Connection pooling, indexed queries |
| Redis | Pipeline commands where possible |
| WebSocket | Namespace separation for orgs |
| File Transfer | 16KB chunks, buffer management |
| Frontend | Code splitting, lazy loading |

### 10.3 Scaling Path (Future)

1. **Horizontal Scaling:** Add Redis adapter for Socket.io to sync across instances
2. **Database:** Read replicas for member queries
3. **CDN:** Edge caching for static assets
4. **TURN:** Multiple TURN servers in different regions

---

## 11. Monitoring & Error Handling

### 11.1 Logging

| Level | What to Log |
|-------|-------------|
| INFO | Room created, user joined, file transfer started/completed |
| WARN | Rate limit hit, TURN fallback used, room expiry warning |
| ERROR | WebRTC failure, database errors, auth failures |

### 11.2 Key Metrics to Track

| Metric | Purpose |
|--------|---------|
| P2P Connection Success Rate | Target > 85% |
| TURN Fallback Rate | Expected ~20-25% |
| Room Creation to First Message | Target < 30s |
| WebSocket Reconnection Rate | Monitor stability |
| File Transfer Completion Rate | Identify failures |

### 11.3 Error Handling Strategy

| Scenario | Handling |
|----------|----------|
| WebRTC Connection Failure | Retry with TURN, show error after 3 attempts |
| WebSocket Disconnect | Auto-reconnect with exponential backoff |
| Room Not Found | Redirect to home with message |
| File Type Blocked | Show error before transfer starts |
| Peer Disconnected Mid-Transfer | Notify user, cannot resume (MVP) |

---

## 12. Testing Strategy

### 12.1 Test Coverage

| Type | Focus Areas |
|------|-------------|
| Unit | Room code generation, file validation, JWT handling |
| Integration | API endpoints, WebSocket events, database operations |
| E2E | Full user flows: anonymous sharing, org creation, member invite |
| Manual | Cross-browser WebRTC, file transfers, mobile responsiveness |

### 12.2 Critical Test Scenarios

1. Two users connect via room code and exchange text
2. File transfer (small: 1MB, medium: 100MB, large: 1GB)
3. Room expiry after 15 minutes of inactivity
4. Blocked file extension rejection
5. Org admin invites member, member joins
6. Online/offline presence updates
7. Direct share request between org members

---

## 13. Development Milestones

### Milestone 1: Core P2P Infrastructure
- WebRTC connection with signaling server
- Room creation and joining
- Text message exchange
- Basic UI for chat interface

### Milestone 2: File Transfer
- File chunking and transfer
- Progress indicators
- File type validation
- Download functionality

### Milestone 3: Authentication & Users
- Signup/Login flows
- JWT implementation
- Session management
- User dashboard

### Milestone 4: Organizations
- Org creation
- Invite system
- Member management
- Role-based permissions

### Milestone 5: Presence & Org Sharing
- Online/offline status
- Real-time presence updates
- Direct share requests
- Org dashboard

### Milestone 6: Polish & Deploy
- Error handling
- Rate limiting
- Security hardening
- Production deployment

---

## 14. Open Technical Decisions

| Decision | Options | Recommendation |
|----------|---------|----------------|
| TURN Provider | Metered.ca vs Self-hosted Coturn | Metered.ca for MVP (simpler) |
| Hosting | Railway vs Render vs Vercel | Railway (good WebSocket support) |
| File Size Validation | Client-only vs Server-check | Client-side (no server upload) |
| Multi-org Switching | Dropdown vs Separate tabs | Dropdown in nav (simpler UX) |

---

## 15. References

- [WebRTC Data Channels - web.dev](https://web.dev/articles/webrtc-datachannels)
- [RTCDataChannel Message Size Limits](https://webrtc.link/en/articles/rtcdatachannel-usage-and-message-size-limits/)
- [WebSocket Scaling Best Practices - Ably](https://ably.com/topic/websocket-architecture-best-practices)
- [WebRTC Signaling with Node.js - LogRocket](https://blog.logrocket.com/webrtc-signaling-websocket-node-js/)
- [STUN/TURN Overview - MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Protocols)
- [WebSocket Scale in 2025 - VideoSDK](https://www.videosdk.live/developer-hub/websocket/websocket-scale)

---

**Document Status:** Ready for Review
**Next Step:** Development team review and sprint planning
