# Phase 1: Project Setup & Infrastructure
## SwiftBeam Development

---

## Overview

| Attribute | Detail |
|-----------|--------|
| **Phase** | 1 of 7 |
| **Focus** | Project scaffolding, tooling, design system setup |
| **Deliverables** | Configured monorepo, design system, dev environment |
| **Dependencies** | None (starting phase) |

---

## 1. Project Structure

### 1.1 Monorepo Setup with Turborepo

```
swiftbeam/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/                # App Router pages
│   │   ├── components/         # React components
│   │   ├── lib/                # Utilities
│   │   ├── hooks/              # Custom hooks
│   │   └── styles/             # Global styles
│   │
│   └── server/                 # Node.js backend
│       ├── src/
│       │   ├── routes/         # Express routes
│       │   ├── services/       # Business logic
│       │   ├── socket/         # Socket.io handlers
│       │   ├── middleware/     # Auth, validation
│       │   └── utils/          # Helpers
│       └── prisma/             # Database schema
│
├── packages/
│   ├── ui/                     # Shared UI components
│   ├── types/                  # Shared TypeScript types
│   └── config/                 # Shared configs (eslint, tsconfig)
│
├── turbo.json
├── package.json
└── .env.example
```

### 1.2 Technology Versions

| Package | Version | Purpose |
|---------|---------|---------|
| Node.js | 20 LTS | Runtime |
| Next.js | 14.x | Frontend framework |
| React | 18.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.4.x | Styling |
| shadcn/ui | Latest | Component library |
| Express | 4.x | Backend framework |
| Socket.io | 4.x | WebSocket |
| Prisma | 5.x | ORM |
| Zustand | 4.x | State management |

---

## 2. Design System Setup

### 2.1 Why shadcn/ui

| Benefit | Description |
|---------|-------------|
| **Ownership** | Components copied to your codebase, full control |
| **Accessible** | Built on Radix UI, WAI-ARIA compliant |
| **Customizable** | Tailwind-based, easy theming |
| **No Bundle Bloat** | Only include what you use |
| **Industry Standard** | Used by Vercel, Cal.com, and many SaaS products |

### 2.2 Core Components Needed

| Component | Usage in SwiftBeam |
|-----------|-------------------|
| Button | All CTAs, form submissions |
| Input | Room code entry, forms |
| Card | Message bubbles, file cards |
| Dialog | Share requests, confirmations |
| Avatar | User profiles, peer indicators |
| Badge | Online status, file types |
| Progress | File transfer progress |
| Toast | Notifications |
| Dropdown Menu | User menu, org switcher |
| Command | Search members |
| Sheet | Mobile navigation |
| Skeleton | Loading states |

### 2.3 Color System

**Light Mode:**
| Token | Usage | Value |
|-------|-------|-------|
| `--background` | Page background | `#FFFFFF` |
| `--foreground` | Primary text | `#0A0A0A` |
| `--primary` | Buttons, links | `#2563EB` (Blue) |
| `--secondary` | Secondary actions | `#F1F5F9` |
| `--muted` | Subtle backgrounds | `#F8FAFC` |
| `--accent` | Hover states | `#E0E7FF` |
| `--destructive` | Errors, delete | `#EF4444` |
| `--success` | Online, complete | `#22C55E` |

**Dark Mode:**
| Token | Usage | Value |
|-------|-------|-------|
| `--background` | Page background | `#0A0A0A` |
| `--foreground` | Primary text | `#FAFAFA` |
| `--primary` | Buttons, links | `#3B82F6` |
| `--muted` | Subtle backgrounds | `#1C1C1C` |

### 2.4 Typography Scale

| Name | Size | Weight | Usage |
|------|------|--------|-------|
| `h1` | 36px | 700 | Page titles |
| `h2` | 24px | 600 | Section headers |
| `h3` | 20px | 600 | Card titles |
| `body` | 16px | 400 | Default text |
| `small` | 14px | 400 | Secondary text |
| `caption` | 12px | 400 | Timestamps, hints |

**Font Stack:** `Inter, -apple-system, BlinkMacSystemFont, sans-serif`

### 2.5 Spacing System

Follow Tailwind's 4px base unit:
- `space-1`: 4px
- `space-2`: 8px
- `space-3`: 12px
- `space-4`: 16px
- `space-6`: 24px
- `space-8`: 32px

---

## 3. Development Environment

### 3.1 Required Accounts (Free Tier)

| Service | Purpose | Setup |
|---------|---------|-------|
| **GitHub** | Version control | Create repo |
| **Vercel** | Frontend hosting | Connect GitHub |
| **Render** | Backend hosting | Connect GitHub |
| **Neon** | PostgreSQL database | Create project |
| **Upstash** | Redis | Create database |
| **Cloudflare** | DNS, CDN | Add domain |

### 3.2 Local Development Setup

**Prerequisites:**
- Node.js 20+
- pnpm (recommended) or npm
- Git
- VS Code (recommended)

**VS Code Extensions:**
| Extension | Purpose |
|-----------|---------|
| ESLint | Code linting |
| Prettier | Code formatting |
| Tailwind CSS IntelliSense | Tailwind autocomplete |
| Prisma | Database schema highlighting |
| GitLens | Git history |

### 3.3 Environment Variables

**`.env.example`:**
```
# Database
DATABASE_URL=

# Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Auth
JWT_SECRET=
JWT_REFRESH_SECRET=

# WebRTC
NEXT_PUBLIC_STUN_URL=stun:stun.l.google.com:19302
NEXT_PUBLIC_TURN_URL=
NEXT_PUBLIC_TURN_USERNAME=
NEXT_PUBLIC_TURN_PASSWORD=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

---

## 4. Tasks Checklist

### 4.1 Repository Setup
- [ ] Create GitHub repository
- [ ] Initialize Turborepo with `pnpm`
- [ ] Configure TypeScript (strict mode)
- [ ] Setup ESLint + Prettier
- [ ] Add `.gitignore`, `.env.example`
- [ ] Configure Husky + lint-staged (pre-commit hooks)

### 4.2 Frontend Setup (apps/web)
- [ ] Create Next.js 14 app with App Router
- [ ] Install and configure Tailwind CSS
- [ ] Initialize shadcn/ui
- [ ] Add core components (Button, Input, Card, Dialog, Toast)
- [ ] Setup dark mode toggle
- [ ] Create base layout component
- [ ] Configure next.config.js

### 4.3 Backend Setup (apps/server)
- [ ] Initialize Express.js with TypeScript
- [ ] Setup Socket.io server
- [ ] Configure CORS for local development
- [ ] Add health check endpoint
- [ ] Setup Prisma with initial schema
- [ ] Configure environment variable loading

### 4.4 Shared Packages
- [ ] Create `packages/types` for shared TypeScript interfaces
- [ ] Create `packages/config` for shared ESLint/TS configs

### 4.5 Database & Services
- [ ] Create Neon PostgreSQL database
- [ ] Create Upstash Redis instance
- [ ] Run initial Prisma migration
- [ ] Verify database connections

### 4.6 CI/CD Setup
- [ ] Create GitHub Actions workflow for linting
- [ ] Setup Vercel project (auto-deploy on push)
- [ ] Setup Render project (auto-deploy on push)
- [ ] Configure environment variables in hosting platforms

---

## 5. File Structure Details

### 5.1 Frontend Key Files

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout with providers |
| `app/page.tsx` | Homepage |
| `app/globals.css` | Tailwind + CSS variables |
| `components/ui/` | shadcn components |
| `lib/utils.ts` | `cn()` helper for classes |
| `lib/socket.ts` | Socket.io client singleton |
| `hooks/use-socket.ts` | Socket connection hook |

### 5.2 Backend Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | App entry point |
| `src/app.ts` | Express app setup |
| `src/socket/index.ts` | Socket.io initialization |
| `src/middleware/auth.ts` | JWT verification |
| `src/routes/health.ts` | Health check endpoint |
| `prisma/schema.prisma` | Database schema |

---

## 6. Prisma Initial Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String   @map("password_hash")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Relations
  organizations OrganizationMember[]
  createdOrgs   Organization[]       @relation("CreatedBy")
  invitesSent   Invite[]             @relation("InviteSender")
  invitesUsed   Invite[]             @relation("InviteUser")

  @@map("users")
}

model Organization {
  id        String   @id @default(uuid())
  name      String
  createdBy String   @map("created_by")
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  creator User                 @relation("CreatedBy", fields: [createdBy], references: [id])
  members OrganizationMember[]
  invites Invite[]

  @@map("organizations")
}

model OrganizationMember {
  id       String   @id @default(uuid())
  orgId    String   @map("org_id")
  userId   String   @map("user_id")
  role     Role     @default(MEMBER)
  joinedAt DateTime @default(now()) @map("joined_at")

  // Relations
  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([orgId, userId])
  @@map("organization_members")
}

model Invite {
  id        String   @id @default(uuid())
  orgId     String   @map("org_id")
  token     String   @unique
  createdBy String   @map("created_by")
  expiresAt DateTime @map("expires_at")
  used      Boolean  @default(false)
  usedBy    String?  @map("used_by")

  // Relations
  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  creator      User         @relation("InviteSender", fields: [createdBy], references: [id])
  usedByUser   User?        @relation("InviteUser", fields: [usedBy], references: [id])

  @@map("invites")
}

enum Role {
  ADMIN
  MEMBER
}
```

---

## 7. Validation Criteria

Phase 1 is complete when:

| Criteria | Validation |
|----------|------------|
| Monorepo runs | `pnpm dev` starts both frontend and backend |
| Frontend accessible | `localhost:3000` shows homepage |
| Backend accessible | `localhost:3001/health` returns OK |
| Database connected | Prisma can query the database |
| Redis connected | Can set/get a test key |
| Components render | shadcn Button renders correctly |
| Dark mode works | Toggle switches theme |
| Types shared | Frontend can import from `@swiftbeam/types` |
| Linting passes | `pnpm lint` has no errors |

---

## 8. UI Reference: Homepage Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│   [Logo]  SwiftBeam                    [Login]  [Sign Up]        │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│                                                                   │
│              Share files instantly.                              │
│              No signup. No storage. Just P2P.                    │
│                                                                   │
│              "Your files go directly to your peer.               │
│               We never see or store them."                       │
│                                                                   │
│                                                                   │
│         ┌─────────────────────────────────────────┐              │
│         │                                         │              │
│         │          Start Sharing                  │              │
│         │                                         │              │
│         └─────────────────────────────────────────┘              │
│                    (Primary CTA - Blue)                          │
│                                                                   │
│                          OR                                       │
│                                                                   │
│         ┌──────────────────────┐  ┌─────────┐                   │
│         │  Enter Room Code     │  │  Join   │                   │
│         └──────────────────────┘  └─────────┘                   │
│                                                                   │
│                                                                   │
│         ───────────────────────────────────────────              │
│                                                                   │
│         Want team features?                                       │
│         [Create Organization →]                                   │
│                                                                   │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
│                                                                   │
│   Privacy First • Open Source • No Tracking                      │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Design Notes:**
- Clean, centered layout (WeTransfer-inspired)
- Maximum 600px content width
- Large whitespace around CTA
- Subtle gradient or illustration background (optional)
- Trust indicators at bottom

---

## Next Phase

**Phase 2: WebRTC & Signaling Server** - Implement core P2P connection infrastructure
