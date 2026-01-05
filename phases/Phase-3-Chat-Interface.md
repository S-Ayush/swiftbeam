# Phase 3: Anonymous Rooms & Chat Interface
## SwiftBeam Development

---

## Overview

| Attribute | Detail |
|-----------|--------|
| **Phase** | 3 of 7 |
| **Focus** | Chat UI, message types, room lifecycle |
| **Deliverables** | Complete text/code sharing interface |
| **Dependencies** | Phase 2 (WebRTC & Signaling) |

---

## 1. Chat Interface Design

### 1.1 Design Philosophy

| Principle | Implementation |
|-----------|----------------|
| **Minimal** | Clean, distraction-free interface |
| **Instant** | Real-time message delivery |
| **Clear** | Obvious distinction between sent/received |
| **Accessible** | WCAG AA compliant, keyboard navigable |

**UI Inspirations:**
- iMessage (bubble clarity)
- Slack (input experience)
- WhatsApp Web (connection status)
- WeTransfer (visual simplicity)

### 1.2 Layout Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  HEADER                                                          │
│  Room: A7X9B2    ● Connected    [Copy Link]  [Leave Room]       │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  MESSAGE AREA (scrollable)                                       │
│                                                                   │
│  ┌────────────────────────────────────────┐                      │
│  │ Peer                                    │                      │
│  │ Hey, sending you the project files      │                      │
│  │                               10:32 AM  │                      │
│  └────────────────────────────────────────┘                      │
│                                                                   │
│                      ┌────────────────────────────────────────┐  │
│                      │                                    You │  │
│                      │ Perfect, ready to receive!             │  │
│                      │ 10:32 AM                               │  │
│                      └────────────────────────────────────────┘  │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│  INPUT AREA                                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ [📎] [</>]  Type a message...                      [Send]  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Message Types & Components

### 2.1 Text Message

**Sent Message (Right aligned):**
```
                              ┌──────────────────────────────────┐
                              │ This is my message to you        │
                              │                         10:32 AM │
                              └──────────────────────────────────┘
                                                              [Copy]
```

**Received Message (Left aligned):**
```
┌──────────────────────────────────────┐
│ Peer                                  │
│ This is a message from the peer      │
│ 10:32 AM                              │
└──────────────────────────────────────┘
[Copy]
```

**Styling:**
| Property | Sent | Received |
|----------|------|----------|
| Background | `primary` (blue) | `muted` (gray) |
| Text Color | White | Foreground |
| Alignment | Right | Left |
| Border Radius | 16px (4px bottom-right) | 16px (4px bottom-left) |
| Max Width | 70% of container | 70% of container |

### 2.2 Code Message

```
┌──────────────────────────────────────────────────────────────┐
│ Peer                                                    [Copy]│
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ function hello() {                                        │ │
│ │   console.log("Hello, World!");                          │ │
│ │ }                                                         │ │
│ └──────────────────────────────────────────────────────────┘ │
│ 10:32 AM                                                     │
└──────────────────────────────────────────────────────────────┘
```

**Styling:**
| Property | Value |
|----------|-------|
| Font | `monospace` (JetBrains Mono, Fira Code) |
| Background | `#1e1e1e` (dark) / `#f5f5f5` (light) |
| Padding | 16px |
| Border Radius | 8px |
| Max Height | 300px (scrollable) |
| Syntax Highlighting | None in MVP |

### 2.3 File Message (Preview)

```
┌──────────────────────────────────────────────────────────────┐
│ Peer                                                          │
├──────────────────────────────────────────────────────────────┤
│  ┌────────┐                                                   │
│  │  📄    │  project-files.zip                               │
│  │        │  245 MB • ZIP Archive                            │
│  └────────┘                                                   │
│                                                               │
│  ████████████████████░░░░░░░░ 75%  •  183.5 MB / 245 MB     │
│                                                               │
│  [Cancel]                                                     │
│                                                               │
│ 10:32 AM                                                      │
└──────────────────────────────────────────────────────────────┘
```

*Full file transfer UI covered in Phase 4*

---

## 3. Input Area

### 3.1 Layout

```
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│  [📎]  [</>]  ┌────────────────────────────────┐  [Send →]    │
│               │ Type a message...               │               │
│               └────────────────────────────────┘               │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 3.2 Input Behaviors

| Action | Behavior |
|--------|----------|
| Enter | Send message |
| Shift + Enter | New line |
| Cmd/Ctrl + Enter | Send message |
| Paste file | Trigger file upload |
| Drag file | Show drop zone |

### 3.3 Buttons

| Button | Icon | Action |
|--------|------|--------|
| File | 📎 (Paperclip) | Open file picker |
| Code | </> | Toggle code mode |
| Send | → (Arrow) | Send current message |

### 3.4 Code Mode

When code mode is active:
- Input background changes to code block style
- Monospace font
- Tab key inserts spaces (not focus change)
- Syntax hint: "Paste or type code..."

---

## 4. Room Header

### 4.1 Layout

```
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Room: A7X9B2      ● Connected        [Copy Link] [Leave]     │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 4.2 Connection Status Indicator

| Status | Icon | Color | Text |
|--------|------|-------|------|
| Connected | ● | Green (`#22C55E`) | "Connected" |
| Connecting | ◐ (animated) | Yellow | "Connecting..." |
| Disconnected | ● | Red | "Disconnected" |
| Reconnecting | ◐ (animated) | Yellow | "Reconnecting..." |

### 4.3 Actions

| Action | Icon | Behavior |
|--------|------|----------|
| Copy Link | Link icon | Copy `swiftbeam.app/room/{code}` |
| Leave Room | X or Door icon | Confirm dialog → disconnect |

---

## 5. Room Lifecycle

### 5.1 Room States

```
   ┌─────────┐
   │ CREATED │ ─────── 15 min timeout ──────┐
   └────┬────┘                              │
        │ peer joins                        │
        ▼                                   ▼
   ┌─────────┐                         ┌─────────┐
   │ ACTIVE  │ ─── 15 min inactivity ─>│ EXPIRED │
   └────┬────┘                         └─────────┘
        │                                   ▲
        │ user leaves                       │
        ▼                                   │
   ┌─────────┐                              │
   │ CLOSED  │ ─────────────────────────────┘
   └─────────┘
```

### 5.2 Expiry Warning

**At 12 minutes of inactivity (3 min before expiry):**

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠️  Room expires in 3 minutes                               │
│                                                               │
│  Send a message to keep the room active.                     │
│                                                    [Dismiss]  │
└──────────────────────────────────────────────────────────────┘
```

### 5.3 Room Expired

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│              🕐 Room Expired                                 │
│                                                               │
│              This room has been closed due to                │
│              15 minutes of inactivity.                       │
│                                                               │
│              [Create New Room]   [Go Home]                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. Message Data Structure

### 6.1 Message Interface

```typescript
interface Message {
  id: string;
  type: 'text' | 'code' | 'file';
  content: string;
  sender: 'self' | 'peer';
  timestamp: number;
  status: 'sending' | 'sent' | 'failed';

  // For file messages
  file?: {
    name: string;
    size: number;
    type: string;
    progress?: number;
    status: 'pending' | 'transferring' | 'complete' | 'failed';
  };
}
```

### 6.2 State Management (Zustand)

```typescript
interface ChatState {
  messages: Message[];
  isConnected: boolean;
  roomCode: string | null;
  connectionStatus: ConnectionStatus;

  // Actions
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setConnected: (connected: boolean) => void;
  clearMessages: () => void;
}
```

---

## 7. Animations & Transitions

### 7.1 Message Appearance

| Animation | Duration | Easing |
|-----------|----------|--------|
| New message slide in | 200ms | `ease-out` |
| Message fade in | 150ms | `ease-in` |
| Failed message shake | 300ms | `ease-in-out` |

### 7.2 Status Changes

| Transition | Animation |
|------------|-----------|
| Connected | Green pulse (2x) then solid |
| Disconnected | Fade to red |
| New peer joined | Slide-down notification |

### 7.3 Micro-interactions

| Element | Interaction | Feedback |
|---------|-------------|----------|
| Send button | Click | Scale down 95% → up |
| Copy button | Click | Icon changes to ✓ for 2s |
| Message bubble | Hover | Subtle shadow increase |

---

## 8. Tasks Checklist

### 8.1 Layout Components
- [ ] Create RoomHeader component
- [ ] Create MessageList component (virtualized for performance)
- [ ] Create MessageBubble component
- [ ] Create CodeBlock component
- [ ] Create InputArea component
- [ ] Create ConnectionStatus component

### 8.2 Message Handling
- [ ] Implement message state (Zustand store)
- [ ] Handle text message sending
- [ ] Handle code message sending
- [ ] Display messages in real-time
- [ ] Auto-scroll on new messages
- [ ] Show message timestamps

### 8.3 Input Features
- [ ] Text input with auto-resize
- [ ] Code mode toggle
- [ ] Enter to send / Shift+Enter for newline
- [ ] Empty message prevention
- [ ] Max message length validation

### 8.4 Room Management
- [ ] Display room code prominently
- [ ] Copy room code to clipboard
- [ ] Copy shareable link
- [ ] Leave room with confirmation
- [ ] Handle peer disconnection
- [ ] Implement room expiry warning
- [ ] Handle room expired state

### 8.5 UX Polish
- [ ] Message send animation
- [ ] Connection status indicator
- [ ] Copy feedback (toast/icon change)
- [ ] Loading states
- [ ] Error states
- [ ] Empty state ("Start sharing...")

---

## 9. Responsive Design

### 9.1 Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | < 640px | Full-width messages, stacked header |
| Tablet | 640-1024px | Max-width container |
| Desktop | > 1024px | Centered container, 800px max |

### 9.2 Mobile Adaptations

| Element | Mobile Change |
|---------|---------------|
| Header | Stack room code above actions |
| Messages | 85% max width (vs 70%) |
| Input | Sticky to bottom, larger touch targets |
| Code toggle | Icon only, no label |

---

## 10. Accessibility

### 10.1 Requirements

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | Tab through all interactive elements |
| Screen reader | ARIA labels on all buttons |
| Focus indicators | Visible focus rings |
| Color contrast | 4.5:1 minimum |
| Motion | Respect `prefers-reduced-motion` |

### 10.2 ARIA Labels

| Element | Label |
|---------|-------|
| Send button | "Send message" |
| Copy code button | "Copy room code" |
| Copy link button | "Copy room link" |
| Leave button | "Leave room" |
| File button | "Attach file" |
| Code button | "Toggle code mode" |

---

## 11. Validation Criteria

Phase 3 is complete when:

| Criteria | Validation |
|----------|------------|
| Messages display | Text appears in correct bubble |
| Sent/received distinction | Visual difference clear |
| Code blocks render | Monospace, dark background |
| Real-time delivery | < 100ms local, < 500ms network |
| Room code copyable | Click → clipboard |
| Link copyable | Full URL copied |
| Leave room works | Confirmation → disconnect |
| Expiry warning shows | At 12 minutes inactivity |
| Mobile responsive | Usable on 375px width |
| Keyboard accessible | Full navigation via Tab |

---

## 12. UI Component Library

### Components to Build

| Component | Props |
|-----------|-------|
| `<MessageBubble>` | `message`, `isOwn` |
| `<CodeBlock>` | `code`, `onCopy` |
| `<MessageInput>` | `onSend`, `onFileSelect` |
| `<RoomHeader>` | `roomCode`, `status`, `onLeave` |
| `<ConnectionBadge>` | `status` |
| `<CopyButton>` | `text`, `label` |
| `<EmptyState>` | `title`, `description` |
| `<ExpiryWarning>` | `minutesLeft`, `onDismiss` |

---

## Next Phase

**Phase 4: File Transfer System** - Implement chunked file transfers with progress UI
