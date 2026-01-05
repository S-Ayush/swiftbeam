# Phase 2: WebRTC & Signaling Server
## SwiftBeam Development

---

## Overview

| Attribute | Detail |
|-----------|--------|
| **Phase** | 2 of 7 |
| **Focus** | P2P connection infrastructure, signaling |
| **Deliverables** | Working WebRTC connection between two browsers |
| **Dependencies** | Phase 1 (Project Setup) |

---

## 1. WebRTC Fundamentals

### 1.1 How WebRTC Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    WebRTC Connection Flow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   PEER A                    SERVER                    PEER B     │
│     │                         │                         │        │
│     │  1. Create Room         │                         │        │
│     │────────────────────────>│                         │        │
│     │                         │                         │        │
│     │  2. Room Code: ABC123   │                         │        │
│     │<────────────────────────│                         │        │
│     │                         │                         │        │
│     │                         │  3. Join Room ABC123    │        │
│     │                         │<────────────────────────│        │
│     │                         │                         │        │
│     │  4. Peer B Joined       │                         │        │
│     │<────────────────────────│                         │        │
│     │                         │                         │        │
│     │  5. Create Offer (SDP)  │                         │        │
│     │  ──────────────────────>│  6. Forward Offer       │        │
│     │                         │────────────────────────>│        │
│     │                         │                         │        │
│     │                         │  7. Create Answer (SDP) │        │
│     │  8. Forward Answer      │<────────────────────────│        │
│     │<────────────────────────│                         │        │
│     │                         │                         │        │
│     │  9. Exchange ICE Candidates (both directions)     │        │
│     │<────────────────────────────────────────────────>│        │
│     │                         │                         │        │
│     │═══════════════════════════════════════════════════│        │
│     │         10. Direct P2P Connection Established     │        │
│     │═══════════════════════════════════════════════════│        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Concepts

| Term | Description |
|------|-------------|
| **SDP (Session Description Protocol)** | Describes media capabilities, codecs, connection info |
| **ICE (Interactive Connectivity Establishment)** | Framework for finding the best path between peers |
| **ICE Candidate** | A potential connection endpoint (IP + port) |
| **STUN Server** | Helps discover public IP when behind NAT |
| **TURN Server** | Relays traffic when direct connection impossible |
| **Offer/Answer** | SDP exchange pattern to negotiate connection |
| **Data Channel** | WebRTC channel for arbitrary data (files, messages) |

### 1.3 Connection Success Rates

| Scenario | Success Rate | Solution |
|----------|--------------|----------|
| Same network | ~100% | Direct connection |
| Different networks (home routers) | ~75-80% | STUN helps |
| Behind symmetric NAT/firewalls | ~0% without TURN | TURN relay needed |
| Mobile networks (carrier NAT) | ~20-30% | TURN usually required |

---

## 2. ICE Server Configuration

### 2.1 Free STUN Servers

```typescript
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];
```

### 2.2 Free TURN Server (Open Relay Project)

| Property | Value |
|----------|-------|
| Provider | openrelayproject.org |
| Free Limit | 20GB/month |
| Coverage | Global distribution |
| Uptime | 99.999% |
| Ports | 80, 443 (firewall-friendly) |

**Configuration:**
```typescript
{
  urls: 'turn:openrelay.metered.ca:80',
  username: 'openrelayproject',
  credential: 'openrelayproject'
}
```

### 2.3 Complete ICE Configuration

```typescript
const iceConfig: RTCConfiguration = {
  iceServers: [
    // STUN servers (free, for NAT discovery)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },

    // TURN server (free tier, for relay fallback)
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10
};
```

---

## 3. Signaling Server Implementation

### 3.1 Socket.io Server Setup

**Server Events:**

| Event | Direction | Purpose |
|-------|-----------|---------|
| `connection` | Client → Server | New socket connected |
| `room:create` | Client → Server | Create new room |
| `room:created` | Server → Client | Room created with code |
| `room:join` | Client → Server | Join existing room |
| `room:joined` | Server → Client | Successfully joined |
| `room:peer-joined` | Server → Clients | Notify existing peer |
| `room:full` | Server → Client | Room has 2 participants |
| `room:not-found` | Server → Client | Invalid room code |
| `signal:offer` | Client → Server → Client | WebRTC offer |
| `signal:answer` | Client → Server → Client | WebRTC answer |
| `signal:ice-candidate` | Client → Server → Client | ICE candidate |
| `peer:disconnected` | Server → Client | Peer left |
| `disconnect` | Client → Server | Socket disconnected |

### 3.2 Room Management (Redis)

**Room Data Structure:**
```typescript
interface Room {
  code: string;
  createdAt: number;
  lastActivity: number;
  participants: string[];  // Socket IDs
  type: 'anonymous' | 'organization';
  orgId?: string;
}
```

**Redis Keys:**
| Key Pattern | Type | TTL | Purpose |
|-------------|------|-----|---------|
| `room:{code}` | Hash | 15 min | Room metadata |
| `socket:room:{socketId}` | String | - | Socket to room mapping |

### 3.3 Room Code Generation

**Algorithm:**
- Characters: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no 0, O, 1, I, L)
- Length: 6 characters (sufficient for ~2 billion combinations)
- Collision check: Verify uniqueness in Redis before returning

**Why exclude certain characters:**
- `0` and `O` look identical
- `1`, `I`, and `l` are confusable
- Reduces user input errors significantly

---

## 4. Data Channel Configuration

### 4.1 Channel Settings

| Setting | Value | Reason |
|---------|-------|--------|
| `label` | `'swiftbeam'` | Identifier |
| `ordered` | `true` | Preserve message order |
| `maxRetransmits` | `null` | Reliable delivery (retransmit until success) |
| Protocol | SCTP | Built into WebRTC, reliable |

### 4.2 Message Protocol

**Message Types:**
```typescript
type MessageType =
  | 'text'           // Plain text message
  | 'code'           // Code snippet
  | 'file-meta'      // File metadata (name, size, type)
  | 'file-chunk'     // File data chunk
  | 'file-complete'  // File transfer complete
  | 'ping'           // Keep-alive

interface DataMessage {
  type: MessageType;
  id: string;        // Unique message ID
  timestamp: number;
  payload: unknown;
}
```

---

## 5. Client-Side WebRTC Manager

### 5.1 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     WebRTC Manager (Singleton)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────┐    ┌─────────────────┐                   │
│   │  Socket.io      │    │  RTCPeerConnection │                │
│   │  Client         │    │  Instance          │                │
│   └────────┬────────┘    └────────┬───────────┘                │
│            │                      │                             │
│            │    ┌─────────────────┴─────────────────┐          │
│            │    │                                    │          │
│            ▼    ▼                                    ▼          │
│   ┌─────────────────┐              ┌─────────────────┐         │
│   │  Signaling      │              │  Data Channel   │         │
│   │  Handler        │              │  Handler        │         │
│   └─────────────────┘              └─────────────────┘         │
│            │                                │                   │
│            ▼                                ▼                   │
│   ┌─────────────────────────────────────────────────┐          │
│   │              Event Emitter / Callbacks           │          │
│   │  onConnected, onDisconnected, onMessage, etc.   │          │
│   └─────────────────────────────────────────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 State Machine

```
┌──────────┐     create/join     ┌──────────────┐
│   IDLE   │ ─────────────────>  │  CONNECTING  │
└──────────┘                     └──────┬───────┘
     ▲                                  │
     │                          peer joined
     │                                  │
     │                                  ▼
     │                          ┌──────────────┐
     │        disconnect        │  SIGNALING   │
     │  <─────────────────────  │  (offer/ans) │
     │                          └──────┬───────┘
     │                                  │
     │                          ICE complete
     │                                  │
     │                                  ▼
     │                          ┌──────────────┐
     │        disconnect        │  CONNECTED   │
     └──────────────────────────│  (P2P ready) │
                                └──────────────┘
```

**States:**
| State | Description |
|-------|-------------|
| `IDLE` | No connection attempt |
| `CONNECTING` | Waiting for peer or creating room |
| `SIGNALING` | Exchanging offer/answer/ICE |
| `CONNECTED` | P2P data channel open |
| `DISCONNECTED` | Connection lost or closed |

### 5.3 Error Handling

| Error | Cause | Recovery |
|-------|-------|----------|
| ICE Failed | NAT traversal impossible | Retry with TURN only |
| Peer Disconnected | Other user left | Show notification |
| Signal Timeout | Server unreachable | Retry connection |
| Data Channel Error | Transmission failed | Auto-retry or notify |

---

## 6. Tasks Checklist

### 6.1 Backend - Signaling Server
- [ ] Setup Socket.io with Express
- [ ] Implement `room:create` handler
- [ ] Implement `room:join` handler
- [ ] Implement room code generation
- [ ] Store rooms in Redis with TTL
- [ ] Implement signaling relay (offer/answer/ice)
- [ ] Handle disconnection cleanup
- [ ] Add room validation middleware
- [ ] Test with multiple connections

### 6.2 Frontend - WebRTC Manager
- [ ] Create WebRTCManager class/hook
- [ ] Implement socket connection
- [ ] Configure ICE servers
- [ ] Handle offer creation (initiator)
- [ ] Handle answer creation (joiner)
- [ ] Implement ICE candidate exchange
- [ ] Create data channel
- [ ] Add connection state management
- [ ] Implement reconnection logic
- [ ] Add error handling

### 6.3 Frontend - Connection UI
- [ ] Create "Connecting..." loading state
- [ ] Show connection progress steps
- [ ] Display room code prominently
- [ ] Add copy-to-clipboard for code
- [ ] Show "Peer Connected" success state
- [ ] Handle connection errors gracefully

### 6.4 Testing
- [ ] Test same-browser (two tabs)
- [ ] Test same-network (two devices)
- [ ] Test different networks
- [ ] Test with VPN (TURN scenario)
- [ ] Verify data channel message delivery

---

## 7. UI Components

### 7.1 Room Creation State

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│                    Creating secure room...                   │
│                                                               │
│                    ◯ ◯ ◯ (loading dots)                     │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 Waiting for Peer

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│                    Share this code                           │
│                                                               │
│              ┌────────────────────────────┐                  │
│              │        A7X9B2              │    [Copy]        │
│              └────────────────────────────┘                  │
│                                                               │
│              or share this link:                             │
│              ┌────────────────────────────────────────┐      │
│              │ swiftbeam.app/room/A7X9B2    [Copy]   │      │
│              └────────────────────────────────────────┘      │
│                                                               │
│              ◯ Waiting for peer to connect...                │
│                                                               │
│              [Cancel]                                        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 7.3 Connection Progress

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│                    Connecting...                             │
│                                                               │
│              ✓ Peer joined the room                          │
│              ◯ Establishing secure connection...             │
│              ◯ Ready to share                                │
│                                                               │
│              ━━━━━━━━━━━━━━━━░░░░░░░░░░  60%                │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 7.4 Connected State

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│              ✓ Connected to peer                             │
│                                                               │
│              🔒 End-to-end secure                            │
│              Direct P2P connection established               │
│                                                               │
│              [Start Sharing →]                               │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. Validation Criteria

Phase 2 is complete when:

| Criteria | Validation |
|----------|------------|
| Room creation works | Click "Start Sharing" → get room code |
| Room joining works | Enter code → join room |
| Signaling completes | Offer/answer exchanged via server |
| ICE completes | Candidates gathered and exchanged |
| Data channel opens | `onopen` fires on both peers |
| Messages transfer | Send text from A → appears on B |
| Disconnect handled | Peer leaving triggers notification |
| TURN fallback works | Connection works with STUN blocked |

---

## 9. Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "ICE failed" immediately | No STUN/TURN configured | Add ICE servers |
| Works locally, fails remotely | NAT traversal issue | Ensure TURN is configured |
| Offer/answer not exchanged | Signaling server issue | Check Socket.io connection |
| Data channel never opens | ICE candidates not exchanged | Verify ICE candidate relay |
| Connection takes too long | Too many ICE candidates | Use `iceCandidatePoolSize` |
| Works in Chrome, fails Firefox | Browser compatibility | Test chunk sizes < 16KB |

---

## Next Phase

**Phase 3: Anonymous Rooms & Chat UI** - Build the messaging interface and room management
