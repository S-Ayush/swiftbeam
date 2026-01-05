# SwiftBeam Development Phases
## Complete Implementation Guide

---

## Quick Overview

| Phase | Focus | Key Deliverables |
|-------|-------|------------------|
| [Phase 1](./Phase-1-Project-Setup.md) | Project Setup | Monorepo, design system, dev environment |
| [Phase 2](./Phase-2-WebRTC-Signaling.md) | WebRTC & Signaling | P2P connections, room codes |
| [Phase 3](./Phase-3-Chat-Interface.md) | Chat Interface | Real-time messaging UI |
| [Phase 4](./Phase-4-File-Transfer.md) | File Transfer | Chunked uploads, progress UI |
| [Phase 5](./Phase-5-Authentication.md) | Authentication | JWT auth, user accounts |
| [Phase 6](./Phase-6-Organizations.md) | Organizations | Teams, invites, presence |
| [Phase 7](./Phase-7-Polish-Deployment.md) | Polish & Deploy | Production deployment |

---

## Phase Dependencies

```
Phase 1: Project Setup
    │
    ▼
Phase 2: WebRTC & Signaling ───────────────┐
    │                                       │
    ▼                                       │
Phase 3: Chat Interface                    │
    │                                       │
    ▼                                       │
Phase 4: File Transfer                     │
    │                                       │
    │   ┌───────────────────────────────────┘
    │   │
    │   ▼
    │  Phase 5: Authentication
    │   │
    │   ▼
    │  Phase 6: Organizations
    │   │
    └───┴──────────────┐
                       │
                       ▼
              Phase 7: Polish & Deploy
```

---

## Technology Stack Summary

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 14 | React framework |
| Tailwind CSS | Styling |
| shadcn/ui | Component library |
| Zustand | State management |
| Socket.io-client | WebSocket |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js 20 | Runtime |
| Express.js | HTTP server |
| Socket.io | WebSocket |
| Prisma | ORM |
| JWT | Authentication |

### Infrastructure (100% Free)
| Service | Purpose | Limits |
|---------|---------|--------|
| Vercel | Frontend hosting | 100GB/mo |
| Render | Backend hosting | 750 hrs/mo |
| Neon | PostgreSQL | 0.5GB |
| Upstash | Redis | 10K cmd/day |
| Cloudflare | CDN/SSL | Unlimited |
| Open Relay | TURN server | 20GB/mo |

---

## Feature Breakdown by Phase

### Phase 1: Foundation
- Turborepo monorepo
- shadcn/ui components
- Prisma database schema
- TypeScript configuration
- ESLint + Prettier

### Phase 2: P2P Core
- WebRTC peer connections
- Socket.io signaling server
- Room code generation
- ICE/STUN/TURN configuration
- Connection state management

### Phase 3: Messaging
- Text message bubbles
- Code snippet sharing
- Real-time message delivery
- Room expiry handling
- Copy room code/link

### Phase 4: Files
- Drag-and-drop upload
- 16KB chunk transfers
- Progress bar with speed
- File type validation
- Buffer management

### Phase 5: Users
- Signup/login forms
- JWT access + refresh tokens
- Protected routes
- Session management
- Rate limiting

### Phase 6: Teams
- Organization CRUD
- Invite link generation
- Real-time presence
- Direct share requests
- Role-based permissions

### Phase 7: Production
- Error boundaries
- Security headers
- Performance optimization
- Deployment configuration
- Monitoring setup

---

## UI Design System

### Colors
| Token | Light | Dark |
|-------|-------|------|
| Background | #FFFFFF | #0A0A0A |
| Foreground | #0A0A0A | #FAFAFA |
| Primary | #2563EB | #3B82F6 |
| Success | #22C55E | #22C55E |
| Destructive | #EF4444 | #EF4444 |

### Typography
- Font: Inter
- H1: 36px / 700
- Body: 16px / 400
- Small: 14px / 400

### Components
- Button (primary, secondary, ghost)
- Input (with validation states)
- Card (for messages, files)
- Dialog (modals)
- Toast (notifications)
- Avatar (user icons)
- Badge (status indicators)
- Progress (file transfers)

---

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm
- Git

### Quick Start
```bash
# Clone repo
git clone https://github.com/your-username/swiftbeam.git
cd swiftbeam

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Fill in your credentials

# Run database migrations
pnpm db:migrate

# Start development
pnpm dev
```

### Development URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Database Studio: http://localhost:5555 (Prisma)

---

## Key Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Chunk size | 16KB | Cross-browser WebRTC compatibility |
| Token storage | httpOnly cookie + memory | XSS protection |
| Presence | Redis Pub/Sub | Real-time + multi-server support |
| File validation | Client-side only | No server upload |
| Room expiry | 15 minutes | Ephemeral by design |

---

## Related Documents

- [PRD-SwiftBeam.md](../PRD-SwiftBeam.md) - Product Requirements
- [TechSpec-SwiftBeam.md](../TechSpec-SwiftBeam.md) - Technical Specification

---

## Research Sources

- [WebRTC Data Channels](https://web.dev/articles/webrtc-datachannels)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Socket.io Documentation](https://socket.io/docs)
- [Prisma Documentation](https://prisma.io/docs)
- [WebRTC Scaling Best Practices](https://webrtc.link)
