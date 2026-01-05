# SwiftBeam

A web-based peer-to-peer data sharing platform that enables users to share text, code, and files directly without server-side storage. Data transfers happen in real-time and disappear once the session ends.

## Features

- **Anonymous P2P Sharing** - Share files without creating an account via room codes
- **Direct Peer-to-Peer Transfers** - No server storage, data goes directly between peers
- **Real-time Chat Interface** - Send text, code snippets, and files in a chat-like UI
- **Large File Support** - Transfer files up to 15GB with progress tracking
- **Organizations** - Create teams and share with colleagues
- **Real-time Presence** - See who's online in your organization
- **Connection Requests** - Click on online members to initiate secure P2P sessions
- **Ephemeral Sessions** - Rooms auto-expire after 15 minutes of inactivity

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL with Prisma ORM |
| Real-time | Socket.io for signaling and presence |
| P2P | WebRTC Data Channels |
| State Management | Zustand |
| UI Components | Radix UI, Lucide Icons |
| Package Manager | pnpm with Turborepo |

## Project Structure

```
swiftbeam/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/                # App router pages
│   │   │   ├── dashboard/      # User dashboard
│   │   │   ├── login/          # Authentication
│   │   │   ├── signup/
│   │   │   ├── org/            # Organization pages
│   │   │   │   ├── [id]/       # Org details
│   │   │   │   │   └── connect/ # Real-time presence
│   │   │   │   └── new/        # Create org
│   │   │   ├── room/           # P2P chat rooms
│   │   │   │   ├── [code]/
│   │   │   │   │   └── chat/   # Chat interface
│   │   │   │   └── new/        # Create room
│   │   │   └── invite/         # Org invite acceptance
│   │   ├── components/         # React components
│   │   │   ├── ui/             # Shadcn UI components
│   │   │   ├── chat/           # Chat components
│   │   │   ├── auth/           # Auth components
│   │   │   └── org/            # Organization components
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── use-webrtc.ts   # WebRTC connection hook
│   │   │   ├── use-file-transfer.ts
│   │   │   └── use-toast.ts
│   │   └── lib/                # Utilities and stores
│   │       ├── stores/         # Zustand stores
│   │       ├── api/            # API clients
│   │       └── socket.ts       # Socket.io client
│   │
│   └── server/                 # Express backend
│       ├── src/
│       │   ├── routes/         # API routes
│       │   │   ├── auth.ts     # Authentication
│       │   │   ├── rooms.ts    # Room management
│       │   │   ├── organizations.ts
│       │   │   └── health.ts
│       │   ├── socket/         # Socket.io handlers
│       │   │   └── index.ts    # WebRTC signaling & presence
│       │   ├── middleware/     # Express middleware
│       │   └── utils/          # Helpers
│       └── prisma/
│           └── schema.prisma   # Database schema
│
├── packages/
│   └── types/                  # Shared TypeScript types
│
├── package.json                # Root package.json
├── pnpm-workspace.yaml         # pnpm workspace config
└── turbo.json                  # Turborepo config
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+
- PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/swiftbeam.git
   cd swiftbeam
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create `.env` file in `apps/server/`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/swiftbeam"
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_REFRESH_SECRET="your-refresh-token-secret"
   CORS_ORIGIN="http://localhost:3000"
   PORT=3001
   ```

   Create `.env.local` file in `apps/web/`:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:3001"
   NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
   ```

4. **Set up the database**
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

5. **Start development servers**
   ```bash
   pnpm dev
   ```

   This starts:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps for production |
| `pnpm lint` | Run ESLint across all apps |
| `pnpm format` | Format code with Prettier |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm clean` | Clean build artifacts and node_modules |

## User Flows

### Anonymous Sharing
1. Visit homepage → Click "Start Sharing"
2. Room created with unique code (e.g., `A7X9B2`)
3. Share code/link with recipient
4. Recipient joins → P2P connection established
5. Share text, code, or files directly
6. Session ends when either party leaves or after 15 min inactivity

### Organization Sharing
1. Create account → Create organization
2. Invite team members via invite links
3. Go to "Connect" page to see online members
4. Click on member → Send connection request
5. Member accepts → Both redirected to private chat room
6. Share files peer-to-peer within organization context

## Architecture

```
┌─────────────┐         ┌─────────────┐
│   User A    │         │   User B    │
│  (Browser)  │         │  (Browser)  │
└──────┬──────┘         └──────┬──────┘
       │                       │
       │    ┌───────────┐      │
       ├────┤ Signaling ├──────┤   (Socket.io)
       │    │  Server   │      │
       │    └───────────┘      │
       │                       │
       └───────────────────────┘
              WebRTC P2P
           (Direct Transfer)
```

**Key Points:**
- Server only handles signaling (connection setup) and presence
- Actual file/message data flows directly between peers via WebRTC
- No data is stored on the server
- Rooms are ephemeral and stored in Redis/memory

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Rooms
- `POST /api/rooms` - Create room
- `GET /api/rooms/:code` - Get room info

### Organizations
- `POST /api/orgs` - Create organization
- `GET /api/orgs` - List user's organizations
- `GET /api/orgs/:id` - Get org details
- `PATCH /api/orgs/:id` - Update org
- `DELETE /api/orgs/:id` - Delete org

### Members & Invites
- `GET /api/orgs/:id/members` - List members
- `DELETE /api/orgs/:id/members/:userId` - Remove member
- `POST /api/orgs/:id/invites` - Create invite
- `GET /api/orgs/:id/invites` - List invites
- `POST /api/orgs/:id/invites/:id/revoke` - Revoke invite
- `GET /api/orgs/invites/:token` - Get invite info
- `POST /api/orgs/invites/:token/accept` - Accept invite

## Socket Events

### Room Events
- `room:join` - Join a room
- `room:joined` - Successfully joined
- `room:peer-joined` - Peer joined the room
- `room:leave` - Leave room
- `peer:disconnected` - Peer disconnected

### WebRTC Signaling
- `signal:offer` - Send WebRTC offer
- `signal:answer` - Send WebRTC answer
- `signal:ice-candidate` - Exchange ICE candidates

### Organization Presence
- `org:join` - Join org presence channel
- `org:leave` - Leave org presence
- `org:members-online` - Receive online members list
- `org:member-joined` - Member came online
- `org:member-left` - Member went offline
- `org:request-connect` - Request connection with member
- `org:connection-request` - Receive connection request
- `org:accept-request` - Accept connection
- `org:decline-request` - Decline connection
- `org:request-accepted` - Connection accepted notification

## Security

- Password hashing with bcrypt
- JWT-based authentication with refresh tokens
- HTTP-only cookies for tokens
- CORS protection
- Rate limiting on API endpoints
- Input validation with Zod
- Blocked executable file extensions
- Room codes prevent brute force with alphanumeric format

## Blocked File Types

For security, the following file types cannot be transferred:
```
.exe, .msi, .bat, .cmd, .com, .scr, .pif, .vbs, .vbe,
.js, .jse, .ws, .wsf, .wsc, .wsh, .ps1, .ps1xml, .ps2,
.ps2xml, .psc1, .psc2, .msh, .msh1, .msh2, .mshxml,
.dll, .sys, .drv, .ocx, .cpl, .jar, .app, .deb, .rpm,
.dmg, .pkg, .bin, .run, .apk, .lnk, .inf, .reg
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Acknowledgments

- [WebRTC](https://webrtc.org/) for peer-to-peer communication
- [Socket.io](https://socket.io/) for real-time signaling
- [Shadcn UI](https://ui.shadcn.com/) for beautiful components
- [Turborepo](https://turbo.build/) for monorepo management
