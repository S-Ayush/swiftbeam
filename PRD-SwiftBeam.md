# Product Requirements Document (PRD)
# SwiftBeam - P2P Data Sharing Platform

**Version:** 1.0 (MVP)
**Last Updated:** January 5, 2026
**Status:** Draft

---

## 1. Product Overview

### 1.1 Vision
SwiftBeam is a web-based peer-to-peer data sharing platform that enables users to share text, code, and files directly with others without server-side storage. Data transfers happen in real-time and disappear once the session ends.

### 1.2 Problem Statement
Current file/data sharing solutions require:
- Uploading to a central server first
- Creating accounts for simple shares
- Data persisting longer than needed (privacy concern)
- Complex setup for quick transfers

### 1.3 Solution
SwiftBeam provides:
- Direct peer-to-peer transfers (no server storage)
- Anonymous sharing without accounts
- Organization support for teams
- Ephemeral data (disappears after session)
- Simple room codes for easy connection

### 1.4 Product Name
**SwiftBeam** (Selected)

---

## 2. Target Users

### 2.1 User Personas

| Persona | Description | Primary Use Case |
|---------|-------------|------------------|
| **Casual User** | Individual needing quick file/text share | Share files with friends without signup |
| **Developer** | Shares code snippets with colleagues | Quick code sharing during pairing/debugging |
| **Team Member** | Part of an organization | Share files with teammates visible online |
| **Org Admin** | Manages organization members | Invite/remove team members |

### 2.2 Expected Scale (MVP)
- ~100 users initially
- Web platform only

---

## 3. Features (MVP Scope)

### 3.1 Feature Overview

| Feature | Priority | Description |
|---------|----------|-------------|
| Anonymous P2P Sharing | P0 | Share without account via room code |
| Room Generation | P0 | Create room with 6-8 alphanumeric code |
| Text/Code Sharing | P0 | Chat-like interface for text messages |
| File Sharing | P0 | Share files up to 15GB |
| Organization Creation | P0 | Create/manage organizations |
| Org Member Directory | P0 | View online org members |
| User Authentication | P0 | Login/Signup for org features |
| Room Auto-Expiry | P1 | Rooms expire after 15 min inactivity |
| Multi-Org Support | P1 | Users can join multiple orgs |

### 3.2 Detailed Feature Specifications

---

#### 3.2.1 Anonymous P2P Sharing (No Organization)

**Description:**
Users can share data without creating an account. A temporary room is created with a unique code.

**Acceptance Criteria:**
- [ ] User can click "Send/Receive" button on homepage
- [ ] System generates a room with 6-8 character alphanumeric code
- [ ] User can copy the room code OR shareable link
- [ ] Link format: `https://[domain]/room/[CODE]`
- [ ] Second user can enter code manually OR click shared link
- [ ] Both users connect peer-to-peer once in same room
- [ ] No account required for either party
- [ ] Room supports exactly 2 participants (1:1)

**Room Code Format:**
- Length: 6-8 characters
- Characters: Alphanumeric (A-Z, 0-9)
- Case-insensitive for user input
- Example: `A7X9B2`, `K3M8P2Q1`

---

#### 3.2.2 Chat-Like Sharing Interface

**Description:**
Once connected, users see a chat-like interface to share text, code, and files.

**Acceptance Criteria:**
- [ ] Messages appear in chronological order
- [ ] Each message shows sender identifier (You / Peer)
- [ ] Text messages display inline
- [ ] Code messages display in monospace font (no syntax highlighting in MVP)
- [ ] File messages show: filename, size, download button
- [ ] Messages are NOT persisted (lost on session end)
- [ ] Clear visual distinction between sent and received

**Message Types:**
| Type | Display | Actions |
|------|---------|---------|
| Text | Inline text bubble | Copy |
| Code | Monospace block | Copy |
| File | File card with metadata | Download |

---

#### 3.2.3 File Sharing

**Description:**
Users can share files directly via P2P connection.

**Acceptance Criteria:**
- [ ] Drag-and-drop file upload supported
- [ ] Click-to-browse file upload supported
- [ ] Maximum file size: 15GB
- [ ] Progress indicator during transfer
- [ ] Blocked file types show error message

**Blocked File Extensions:**
```
.exe, .msi, .bat, .cmd, .com, .scr, .pif,
.vbs, .vbe, .js (standalone), .jse, .ws, .wsf,
.wsc, .wsh, .ps1, .ps1xml, .ps2, .ps2xml,
.psc1, .psc2, .msh, .msh1, .msh2, .mshxml,
.msh1xml, .msh2xml, .scf, .lnk, .inf, .reg,
.dll, .sys, .drv, .ocx, .cpl, .jar
```

**File Transfer Flow:**
1. Sender selects/drops file
2. File metadata sent to receiver
3. Receiver sees incoming file notification
4. P2P transfer begins automatically
5. Progress shown on both ends
6. Download button enabled on completion

---

#### 3.2.4 Room Management

**Description:**
Rooms are temporary and auto-expire.

**Acceptance Criteria:**
- [ ] Room expires after 15 minutes of inactivity
- [ ] Inactivity = no messages sent by either party
- [ ] Warning shown at 12 minutes (3 min before expiry)
- [ ] Both users notified when room expires
- [ ] Either user can manually close/leave room
- [ ] Room code cannot be reused after expiry

---

#### 3.2.5 Organization Creation

**Description:**
Users can create organizations and invite team members.

**Acceptance Criteria:**
- [ ] "Create Organization" button accessible from dashboard
- [ ] Creator must signup/login to create org
- [ ] Required fields: Organization Name, Admin Email, Password
- [ ] Creator becomes Admin automatically
- [ ] Organization gets unique identifier
- [ ] Admin redirected to org dashboard after creation

**Organization Properties:**
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| name | string | Yes | 3-50 characters |
| admin_email | string | Yes | Valid email format |
| created_at | timestamp | Auto | - |
| id | uuid | Auto | - |

---

#### 3.2.6 Organization Member Management

**Description:**
Admins can invite and remove members from organization.

**Roles:**
| Role | Permissions |
|------|-------------|
| Admin | Invite members, Remove members, Share data |
| Member | Share data, View online members |

**Invite Flow:**
1. Admin clicks "Invite Member"
2. System generates unique invite link
3. Admin shares link with invitee
4. Invitee clicks link
5. Invitee signs up OR logs in
6. Invitee added to organization as Member

**Acceptance Criteria:**
- [ ] Admin can generate invite links
- [ ] Invite links are single-use
- [ ] Invite links expire after 7 days
- [ ] Admin can view all members list
- [ ] Admin can remove any member (not self)
- [ ] Removed members lose org access immediately
- [ ] Members cannot invite others

---

#### 3.2.7 Organization Directory & Sharing

**Description:**
Organization members can see online colleagues and initiate direct sharing.

**Acceptance Criteria:**
- [ ] Dashboard shows list of org members
- [ ] Online members highlighted/sorted to top
- [ ] Member status: Online / Offline
- [ ] Click on online member to initiate share
- [ ] Search/filter members by name
- [ ] Direct P2P connection established on accept

**Direct Share Flow:**
1. User A clicks on online User B
2. User B receives share request notification
3. User B accepts/declines
4. If accepted: P2P room created between A and B
5. Same chat interface as anonymous sharing
6. Same 15 min inactivity expiry applies

---

#### 3.2.8 User Authentication

**Description:**
Authentication required for organization features.

**Signup Fields:**
| Field | Type | Required |
|-------|------|----------|
| name | string | Yes |
| email | string | Yes |
| password | string | Yes |

**Acceptance Criteria:**
- [ ] Email/password signup
- [ ] Email/password login
- [ ] Password minimum 8 characters
- [ ] Session persists across browser sessions
- [ ] Logout functionality
- [ ] User can belong to multiple organizations
- [ ] Org switcher in navigation (if multiple orgs)

---

#### 3.2.9 Anonymous Mode in Organization

**Description:**
Even logged-in org members can use anonymous sharing.

**Acceptance Criteria:**
- [ ] "Anonymous Share" option available to logged-in users
- [ ] Works exactly like non-org anonymous sharing
- [ ] Org context not attached to anonymous shares
- [ ] Room code generated same as anonymous flow

---

## 4. User Flows

### 4.1 Anonymous Sharing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         SENDER                                   │
├─────────────────────────────────────────────────────────────────┤
│  1. Visit Homepage                                               │
│  2. Click "Send/Receive"                                         │
│  3. Room created → Code displayed (e.g., A7X9B2)                │
│  4. Copy code OR shareable link                                  │
│  5. Share with recipient (external: SMS, email, etc.)           │
│  6. Wait for recipient to join                                   │
│  7. "Peer Connected" notification                                │
│  8. Start sharing text/code/files                                │
│  9. Session ends on close or 15 min inactivity                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        RECEIVER                                  │
├─────────────────────────────────────────────────────────────────┤
│  Option A: Via Link                                              │
│  1. Click shared link                                            │
│  2. Automatically joins room                                     │
│  3. "Connected to Peer" notification                             │
│  4. Start sharing                                                │
│                                                                  │
│  Option B: Via Code                                              │
│  1. Visit Homepage                                               │
│  2. Click "Send/Receive"                                         │
│  3. Enter room code                                              │
│  4. Click "Join"                                                 │
│  5. "Connected to Peer" notification                             │
│  6. Start sharing                                                │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Organization Creation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Click "Create Organization"                                  │
│  2. If not logged in → Redirect to Signup/Login                 │
│  3. Enter Organization Name                                      │
│  4. Click "Create"                                               │
│  5. Organization created → User is Admin                        │
│  6. Redirect to Org Dashboard                                    │
│  7. Generate invite links to add members                         │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Organization Sharing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER A (Initiator)                        │
├─────────────────────────────────────────────────────────────────┤
│  1. Login → Go to Org Dashboard                                 │
│  2. View online members                                          │
│  3. Click on User B (online)                                     │
│  4. "Share Request Sent" notification                            │
│  5. Wait for acceptance                                          │
│  6. "User B Connected" notification                              │
│  7. Chat interface opens                                         │
│  8. Start sharing                                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        USER B (Receiver)                         │
├─────────────────────────────────────────────────────────────────┤
│  1. Logged in on Org Dashboard                                   │
│  2. Receives share request popup/notification                    │
│  3. Sees: "User A wants to share with you"                      │
│  4. Clicks "Accept" or "Decline"                                │
│  5. If Accept → Chat interface opens                            │
│  6. Start sharing                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Technical Requirements

### 5.1 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | JavaScript (React.js or Next.js recommended) |
| Backend | Node.js (Express or Fastify) |
| P2P | WebRTC with signaling server |
| Real-time | WebSocket (Socket.io or native WS) |
| Database | PostgreSQL or MongoDB |
| Auth | JWT-based sessions |
| Hosting | Any cloud provider (Vercel, AWS, etc.) |

### 5.2 Architecture Overview

```
┌─────────────┐         ┌─────────────┐
│   User A    │         │   User B    │
│  (Browser)  │         │  (Browser)  │
└──────┬──────┘         └──────┬──────┘
       │                       │
       │    ┌───────────┐      │
       ├────┤ Signaling ├──────┤   (WebSocket)
       │    │  Server   │      │
       │    └───────────┘      │
       │                       │
       └───────────────────────┘
              WebRTC P2P
           (Direct Transfer)
```

**Key Components:**

1. **Signaling Server**
   - Handles room creation/joining
   - Facilitates WebRTC connection setup
   - Manages presence (online status for orgs)
   - Does NOT see/store transferred data

2. **Application Server**
   - User authentication
   - Organization management
   - Invite link generation
   - Room code generation

3. **Database**
   - User accounts
   - Organizations
   - Org memberships
   - Invite links (temporary)

4. **Client Application**
   - WebRTC peer connections
   - File chunking for large transfers
   - Chat UI rendering

### 5.3 WebRTC Considerations

**For Large File Transfers (up to 15GB):**
- Implement file chunking (recommended: 16KB-64KB chunks)
- Use data channels with ordered, reliable delivery
- Show progress based on chunks transferred
- Handle connection drops with resume capability (nice-to-have)

**STUN/TURN Servers:**
- Use free STUN servers for NAT traversal
- Consider TURN server for fallback (when P2P fails)
- Note: TURN relay may be needed for ~10-15% of connections

### 5.4 API Endpoints (High-Level)

#### Authentication
```
POST   /api/auth/signup        - Create new account
POST   /api/auth/login         - Login
POST   /api/auth/logout        - Logout
GET    /api/auth/me            - Get current user
```

#### Rooms (Anonymous)
```
POST   /api/rooms              - Create new room (returns code)
GET    /api/rooms/:code        - Join room by code
DELETE /api/rooms/:code        - Close room
```

#### Organizations
```
POST   /api/orgs               - Create organization
GET    /api/orgs               - List user's organizations
GET    /api/orgs/:id           - Get org details
DELETE /api/orgs/:id           - Delete org (admin only)
```

#### Organization Members
```
GET    /api/orgs/:id/members          - List members
POST   /api/orgs/:id/invites          - Generate invite link
DELETE /api/orgs/:id/members/:userId  - Remove member
POST   /api/invites/:token/accept     - Accept invite
```

#### Presence (WebSocket Events)
```
Event: user:online      - User came online
Event: user:offline     - User went offline
Event: share:request    - Share request sent
Event: share:accept     - Share request accepted
Event: share:decline    - Share request declined
```

---

## 6. Data Models

### 6.1 User
```javascript
{
  id: UUID,
  name: String,
  email: String (unique),
  password_hash: String,
  created_at: Timestamp,
  updated_at: Timestamp
}
```

### 6.2 Organization
```javascript
{
  id: UUID,
  name: String,
  created_by: UUID (ref: User),
  created_at: Timestamp
}
```

### 6.3 OrganizationMember
```javascript
{
  id: UUID,
  org_id: UUID (ref: Organization),
  user_id: UUID (ref: User),
  role: Enum ['admin', 'member'],
  joined_at: Timestamp
}
```

### 6.4 Invite
```javascript
{
  id: UUID,
  org_id: UUID (ref: Organization),
  token: String (unique),
  created_by: UUID (ref: User),
  expires_at: Timestamp,
  used: Boolean,
  used_by: UUID (ref: User, nullable)
}
```

### 6.5 Room (In-Memory Only)
```javascript
{
  code: String,
  created_at: Timestamp,
  last_activity: Timestamp,
  participants: [SocketID, SocketID],
  type: Enum ['anonymous', 'organization'],
  org_id: UUID (nullable)
}
```

---

## 7. UI/UX Requirements

### 7.1 Pages

| Page | Route | Auth Required |
|------|-------|---------------|
| Homepage | `/` | No |
| Room (Share) | `/room/:code` | No |
| Login | `/login` | No |
| Signup | `/signup` | No |
| Dashboard | `/dashboard` | Yes |
| Org Dashboard | `/org/:id` | Yes |
| Org Settings | `/org/:id/settings` | Yes (Admin) |
| Accept Invite | `/invite/:token` | No (redirects) |

### 7.2 Homepage Layout

```
┌────────────────────────────────────────────────────────┐
│  Logo                              [Login] [Signup]    │
├────────────────────────────────────────────────────────┤
│                                                        │
│              Share files instantly.                    │
│              No signup. No storage. Just P2P.          │
│                                                        │
│         ┌─────────────────────────────────┐            │
│         │        Send / Receive           │            │
│         └─────────────────────────────────┘            │
│                                                        │
│                        OR                              │
│                                                        │
│         ┌─────────────────────────────────┐            │
│         │  Enter Room Code    [Join]      │            │
│         └─────────────────────────────────┘            │
│                                                        │
│         [Create Organization →]                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 7.3 Room/Chat Interface

```
┌────────────────────────────────────────────────────────┐
│  Room: A7X9B2              [Copy Link]  [Leave Room]   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Peer                                              │  │
│  │ Hey, sending you the project files               │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │                                             You  │  │
│  │ Perfect, ready to receive!                       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Peer                                              │  │
│  │ 📎 project-files.zip (245 MB)                    │  │
│  │ ████████████░░░░░░░░ 60%                         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
├────────────────────────────────────────────────────────┤
│  [📎]  Type a message...                     [Send]   │
└────────────────────────────────────────────────────────┘
```

### 7.4 Organization Dashboard

```
┌────────────────────────────────────────────────────────┐
│  [← Back]   Acme Corp                    [Settings]   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Online Members (3)                    [Search...]    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🟢 John Doe                          [Share →]   │  │
│  │ 🟢 Jane Smith                        [Share →]   │  │
│  │ 🟢 Bob Wilson                        [Share →]   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Offline Members (2)                                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ⚫ Alice Brown                                    │  │
│  │ ⚫ Charlie Davis                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ─────────────────────────────────────────────────    │
│  [Anonymous Share] - Share without org context        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 8. Security Considerations (MVP)

### 8.1 Implemented in MVP
- [ ] Password hashing (bcrypt)
- [ ] JWT token authentication
- [ ] Executable file blocking
- [ ] Room code rate limiting (prevent brute force)
- [ ] Input validation and sanitization
- [ ] HTTPS only

### 8.2 NOT in MVP (Future)
- End-to-end encryption
- Audit logs
- Data loss prevention
- Admin controls
- IP allowlisting

---

## 9. Success Metrics

| Metric | Target (MVP) |
|--------|--------------|
| Successful P2P connections | > 85% success rate |
| Average file transfer speed | Dependent on user bandwidth |
| Room creation to first share | < 30 seconds |
| User signup completion | > 70% |
| Org invite acceptance | > 60% |

---

## 10. Out of Scope (MVP)

The following features are explicitly NOT included in MVP:

- Mobile applications (iOS/Android)
- End-to-end encryption
- Message history/persistence
- Typing indicators
- Online status indicators (except for org members)
- Syntax highlighting for code
- Markdown rendering
- Message reactions
- Audit logs
- Data loss prevention
- Admin controls beyond invite/remove
- Monetization features
- GDPR compliance tools
- Group/channel sharing
- File resume on connection drop

---

## 11. Future Roadmap (Post-MVP)

### Phase 2
- End-to-end encryption
- Mobile-responsive improvements
- Syntax highlighting for code
- Markdown support

### Phase 3
- Mobile apps (React Native)
- Group sharing within orgs
- File transfer resume
- Audit logs for organizations

### Phase 4
- Monetization (paid org tiers)
- Enterprise features (SSO, compliance)
- API for integrations

---

## 12. Open Questions

1. **TURN Server:** Should we budget for a TURN server for fallback when P2P fails, or accept that some connections may not work?

2. **Room Code Collision:** How to handle the rare case of code collision? Suggest: Check uniqueness on generation, retry if exists.

3. **File Transfer Interruption:** If connection drops mid-transfer, should we:
   - Start over (simpler, MVP approach)
   - Resume from last chunk (complex, future)

4. **Multi-tab Handling:** If user opens same org in multiple tabs, how to handle presence? Suggest: Count as single online user.

---

## 13. Appendix

### A. Blocked File Extensions (Complete List)

```
.exe, .msi, .bat, .cmd, .com, .scr, .pif, .vbs, .vbe,
.js, .jse, .ws, .wsf, .wsc, .wsh, .ps1, .ps1xml, .ps2,
.ps2xml, .psc1, .psc2, .msh, .msh1, .msh2, .mshxml,
.msh1xml, .msh2xml, .scf, .lnk, .inf, .reg, .dll,
.sys, .drv, .ocx, .cpl, .jar, .app, .deb, .rpm,
.dmg, .pkg, .bin, .run, .apk
```

### B. Room Code Generation Logic

```javascript
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing: 0,O,1,I
  const length = 6 + Math.floor(Math.random() * 3); // 6-8 chars
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
```

### C. Suggested Development Timeline

> **Note:** Actual timeline depends on team size and experience.

**Milestone 1:** Core P2P + Anonymous Sharing
**Milestone 2:** Authentication + User Management
**Milestone 3:** Organization Features
**Milestone 4:** Polish + Testing + Deploy

---

**Document Status:** Ready for Review
**Next Step:** Dev team review and technical feasibility assessment
