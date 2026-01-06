# SwiftBeam - Implementation Tasks

Detailed task breakdown for implementing features from IMPROVEMENTS.md.

---

## Phase 1: Core Reliability

### 1.1 Resumable File Transfers

#### Task 1.1.1: Create IndexedDB Storage Layer
**Description:** Set up IndexedDB database for storing transfer state and file chunks.
**Files to create/modify:**
- `lib/indexed-db.ts` - IndexedDB wrapper with CRUD operations
- `lib/stores/transfer-store.ts` - Transfer state management

**Acceptance Criteria:**
- [ ] Create `swiftbeam-transfers` database
- [ ] Define `transfers` object store with transferId as key
- [ ] Define `chunks` object store with composite key (transferId + chunkIndex)
- [ ] Implement methods: `saveTransfer`, `getTransfer`, `updateTransfer`, `deleteTransfer`
- [ ] Implement methods: `saveChunk`, `getChunks`, `clearChunks`
- [ ] Handle storage quota errors gracefully

---

#### Task 1.1.2: Implement Chunked File Sender
**Description:** Modify file sending to use 16KB chunks with sequence numbers.
**Files to modify:**
- `hooks/use-file-transfer.ts` - Add chunking logic
- `lib/file-transfer.ts` - Chunk creation and sending

**Acceptance Criteria:**
- [ ] Split files into 16KB chunks using `file.slice()`
- [ ] Add sequence number and total count to each chunk
- [ ] Implement backpressure using `bufferedamountlow` event
- [ ] Pause sending when buffer exceeds 256KB
- [ ] Send file metadata before chunks (name, size, type, totalChunks)
- [ ] Calculate and display transfer speed

---

#### Task 1.1.3: Implement Chunked File Receiver
**Description:** Receive and reassemble chunked files with progress tracking.
**Files to modify:**
- `hooks/use-file-transfer.ts` - Add reassembly logic
- `lib/file-transfer.ts` - Chunk receiving and storage

**Acceptance Criteria:**
- [ ] Store received chunks in IndexedDB
- [ ] Track received chunk indices
- [ ] Reassemble file when all chunks received
- [ ] Display per-chunk progress (not just total)
- [ ] Handle out-of-order chunk arrival
- [ ] Clean up IndexedDB after successful transfer

---

#### Task 1.1.4: Implement Resume Protocol
**Description:** Allow resuming interrupted transfers on reconnection.
**Files to modify:**
- `hooks/use-webrtc.ts` - Add resume handshake
- `hooks/use-file-transfer.ts` - Resume logic

**Acceptance Criteria:**
- [ ] On reconnect, check IndexedDB for incomplete transfers
- [ ] Send `file_resume` message with transferId and completedChunks
- [ ] Sender resumes from first missing chunk
- [ ] Handle case where sender no longer has file (notify user)
- [ ] Add "Resume" button for paused transfers
- [ ] Auto-resume option in settings

---

#### Task 1.1.5: Add Pause/Resume UI Controls
**Description:** Add UI buttons for manual pause and resume.
**Files to modify:**
- `components/chat/file-message.tsx` - Add controls
- `lib/stores/file-transfer-store.ts` - Pause state

**Acceptance Criteria:**
- [ ] Add pause button during active transfer
- [ ] Add resume button for paused transfers
- [ ] Show paused state visually (different progress bar color)
- [ ] Persist pause state across page refresh
- [ ] Cancel button clears IndexedDB data

---

### 1.2 QR Code Room Sharing

#### Task 1.2.1: Install and Setup QR Code Library
**Description:** Add qrcode.react dependency and create QR component.
**Files to create/modify:**
- `package.json` - Add dependency
- `components/room/qr-code-display.tsx` - QR component

**Acceptance Criteria:**
- [ ] Install `qrcode.react` package
- [ ] Create reusable QRCodeDisplay component
- [ ] Accept roomCode prop, generate full URL
- [ ] Set error correction level M
- [ ] Responsive sizing (200px default, scales on mobile)
- [ ] Dark mode support (invert colors)

---

#### Task 1.2.2: Integrate QR Code in Room Creation
**Description:** Display QR code on room creation page.
**Files to modify:**
- `app/room/create/page.tsx` - Add QR display
- `components/room/room-code-display.tsx` - Enhance with QR

**Acceptance Criteria:**
- [ ] Show QR code below room code
- [ ] Add "Scan to Join" instruction text
- [ ] Show manual code as fallback below QR
- [ ] Add toggle to show/hide QR (for smaller screens)
- [ ] Copy URL button next to QR

---

#### Task 1.2.3: Add QR Scanner for Mobile (Optional)
**Description:** Allow mobile users to scan QR codes to join rooms.
**Files to create:**
- `components/room/qr-scanner.tsx` - Scanner component
- `app/room/scan/page.tsx` - Scanner page

**Acceptance Criteria:**
- [ ] Request camera permission on user action
- [ ] Use `navigator.mediaDevices.getUserMedia()`
- [ ] Detect and decode QR codes from video stream
- [ ] Auto-redirect to room URL on successful scan
- [ ] Handle permission denied gracefully
- [ ] Add manual entry fallback

---

### 1.3 Connection Quality Indicator

#### Task 1.3.1: Create Connection Stats Hook
**Description:** Hook to collect WebRTC connection statistics.
**Files to create:**
- `hooks/use-connection-stats.ts` - Stats collection hook

**Acceptance Criteria:**
- [ ] Call `getStats()` every 1 second after connection
- [ ] Wait 2 seconds before first collection
- [ ] Extract RTT from `candidate-pair` report
- [ ] Calculate throughput from bytesSent/bytesReceived delta
- [ ] Expose current RTT, throughput, and quality level
- [ ] Clean up interval on disconnect

---

#### Task 1.3.2: Create Connection Quality Badge Component
**Description:** Visual indicator showing connection quality.
**Files to create:**
- `components/room/connection-quality.tsx` - Badge component

**Acceptance Criteria:**
- [ ] Display quality as Excellent/Good/Poor with color coding
- [ ] Green for Excellent (RTT < 100ms)
- [ ] Yellow for Good (RTT 100-300ms)
- [ ] Red for Poor (RTT > 300ms)
- [ ] Show tooltip with actual RTT and speed on hover
- [ ] Animate transitions between states

---

#### Task 1.3.3: Add Transfer Speed and ETA Display
**Description:** Show real-time transfer speed and estimated completion time.
**Files to modify:**
- `components/chat/file-message.tsx` - Add speed/ETA
- `hooks/use-file-transfer.ts` - Calculate metrics

**Acceptance Criteria:**
- [ ] Calculate speed: bytes transferred / time elapsed
- [ ] Format speed: KB/s or MB/s based on magnitude
- [ ] Calculate ETA: remaining bytes / current speed
- [ ] Format ETA: "< 1 min", "2 min", "5 min remaining"
- [ ] Update every 500ms during transfer
- [ ] Show "Calculating..." initially

---

#### Task 1.3.4: Integrate Quality Indicator in Chat Header
**Description:** Add connection quality to chat page header.
**Files to modify:**
- `components/chat/chat-header.tsx` - Add indicator

**Acceptance Criteria:**
- [ ] Show quality badge next to peer name
- [ ] Show current speed when transfer active
- [ ] Compact view on mobile (icon only)
- [ ] Click to expand details

---

## Phase 2: Chat UI/UX

### 2.1 Message Bubble Improvements

#### Task 2.1.1: Redesign Message Bubble Styles
**Description:** Update message bubble styling for better visual hierarchy.
**Files to modify:**
- `components/chat/message-bubble.tsx` - Update styles

**Acceptance Criteria:**
- [ ] Sent messages: bg-primary, rounded-2xl rounded-br-md
- [ ] Received messages: bg-muted, rounded-2xl rounded-bl-md
- [ ] Max width 75% of container
- [ ] Padding: px-4 py-2.5
- [ ] Subtle shadow for depth
- [ ] Smooth hover state

---

#### Task 2.1.2: Implement Message Grouping
**Description:** Group consecutive messages from same sender.
**Files to modify:**
- `components/chat/message-list.tsx` - Add grouping logic
- `components/chat/message-bubble.tsx` - Handle group position

**Acceptance Criteria:**
- [ ] Group messages from same sender within 2 minutes
- [ ] First message shows avatar and name
- [ ] Subsequent messages: 4px top margin, no avatar
- [ ] Last message in group has full border radius
- [ ] Middle messages have reduced corner radius on sender side

---

### 2.2 Typing Indicators

#### Task 2.2.1: Create Typing Indicator Component
**Description:** Animated typing indicator with bouncing dots.
**Files to create:**
- `components/chat/typing-indicator.tsx` - Indicator component

**Acceptance Criteria:**
- [ ] Three dots with staggered bounce animation
- [ ] Show peer name: "{name} is typing..."
- [ ] Fade in/out animation
- [ ] Match message bubble styling
- [ ] Respect prefers-reduced-motion

---

#### Task 2.2.2: Implement Typing Event Protocol
**Description:** Send and receive typing events via data channel.
**Files to modify:**
- `hooks/use-webrtc.ts` - Add typing message type
- `components/chat/message-input.tsx` - Send typing events
- `lib/stores/chat-store.ts` - Track peer typing state

**Acceptance Criteria:**
- [ ] Send typing:true on first keystroke (debounce 300ms)
- [ ] Send typing:false on send, blur, or 3s inactivity
- [ ] Clear remote typing indicator after 3s timeout
- [ ] Don't send typing events for empty input
- [ ] Handle multiple rapid keystrokes efficiently

---

### 2.3 Message Timestamps

#### Task 2.3.1: Create Timestamp Formatter Utility
**Description:** Format timestamps as relative or absolute time.
**Files to create:**
- `lib/format-time.ts` - Time formatting utilities

**Acceptance Criteria:**
- [ ] "Just now" for < 1 minute
- [ ] "{n}m ago" for < 60 minutes
- [ ] "HH:MM AM/PM" for same day
- [ ] "Yesterday HH:MM" for yesterday
- [ ] "Jan 5, HH:MM" for older dates
- [ ] Update displayed time periodically (every minute)

---

#### Task 2.3.2: Add Timestamps to Messages
**Description:** Display timestamps on message bubbles.
**Files to modify:**
- `components/chat/message-bubble.tsx` - Add timestamp

**Acceptance Criteria:**
- [ ] Show relative timestamp below message text
- [ ] Subtle gray color (text-muted-foreground)
- [ ] Show full timestamp on hover (tooltip)
- [ ] First message in group shows timestamp
- [ ] Subsequent messages show on hover only

---

#### Task 2.3.3: Add Date Separators
**Description:** Show date separators between messages on different days.
**Files to modify:**
- `components/chat/message-list.tsx` - Add separators

**Acceptance Criteria:**
- [ ] "Today" separator for today's messages
- [ ] "Yesterday" separator
- [ ] "January 5, 2025" for older dates
- [ ] Centered, subtle styling
- [ ] Don't show for first message of conversation

---

### 2.4 Read Receipts

#### Task 2.4.1: Implement Read Receipt Protocol
**Description:** Send and receive read receipts via data channel.
**Files to modify:**
- `hooks/use-webrtc.ts` - Add read_receipt message type
- `lib/stores/chat-store.ts` - Track read status per message

**Acceptance Criteria:**
- [ ] Send read receipt when message enters viewport for 1+ second
- [ ] Batch receipts within 500ms window
- [ ] Store read status in message object
- [ ] Handle receipts for messages sent before connection

---

#### Task 2.4.2: Display Read Receipt Icons
**Description:** Show delivery and read status on sent messages.
**Files to modify:**
- `components/chat/message-bubble.tsx` - Add status icons

**Acceptance Criteria:**
- [ ] Single gray checkmark: Sent
- [ ] Double gray checkmark: Delivered
- [ ] Double blue checkmark: Read
- [ ] Show next to timestamp
- [ ] Animate transition between states

---

### 2.5 File Message Enhancements

#### Task 2.5.1: Create File Type Icon Mapper
**Description:** Map file extensions to appropriate icons.
**Files to create:**
- `lib/file-icons.ts` - Icon mapping utility

**Acceptance Criteria:**
- [ ] Image types → ImageIcon
- [ ] Video types → VideoIcon
- [ ] Audio types → AudioIcon
- [ ] Document types → FileTextIcon
- [ ] Archive types → ArchiveIcon
- [ ] Code types → CodeIcon
- [ ] Default → FileIcon

---

#### Task 2.5.2: Redesign File Message Component
**Description:** Enhanced file message with icon, size, and progress.
**Files to modify:**
- `components/chat/file-message.tsx` - Redesign

**Acceptance Criteria:**
- [ ] Show file type icon
- [ ] Display human-readable file size
- [ ] Progress bar integrated in bubble
- [ ] Status text: Pending → Transferring → Complete
- [ ] Error state with retry button
- [ ] Click to download when complete

---

#### Task 2.5.3: Add Image Thumbnails
**Description:** Show preview thumbnails for image files.
**Files to modify:**
- `components/chat/file-message.tsx` - Add thumbnail

**Acceptance Criteria:**
- [ ] Generate thumbnail for images < 5MB
- [ ] Max thumbnail size: 200x200px
- [ ] Show loading state while generating
- [ ] Click thumbnail to view full image
- [ ] Lazy load thumbnails

---

### 2.6 Message Input Enhancements

#### Task 2.6.1: Implement Auto-resize Textarea
**Description:** Textarea that grows with content up to max height.
**Files to modify:**
- `components/chat/message-input.tsx` - Auto-resize

**Acceptance Criteria:**
- [ ] Min height: 40px (single line)
- [ ] Max height: 120px (5 lines)
- [ ] Smooth height transition
- [ ] Scroll when exceeding max height
- [ ] Reset to min height after send

---

#### Task 2.6.2: Add Emoji Picker
**Description:** Emoji picker button and popover.
**Files to create:**
- `components/chat/emoji-picker.tsx` - Picker component

**Acceptance Criteria:**
- [ ] Button next to send button
- [ ] Popover with emoji categories
- [ ] Recent/frequently used section
- [ ] Search functionality
- [ ] Insert at cursor position
- [ ] Keyboard accessible

---

#### Task 2.6.3: Implement Draft Persistence
**Description:** Save draft message when leaving chat.
**Files to modify:**
- `components/chat/message-input.tsx` - Draft logic
- `lib/stores/chat-store.ts` - Draft storage

**Acceptance Criteria:**
- [ ] Save draft to localStorage on unmount
- [ ] Restore draft on mount
- [ ] Clear draft after successful send
- [ ] Key by room code

---

## Phase 3: Enhanced UX

### 3.1 Multi-File Queue

#### Task 3.1.1: Create File Queue Store
**Description:** Zustand store for managing file transfer queue.
**Files to create:**
- `lib/stores/file-queue-store.ts` - Queue state management

**Acceptance Criteria:**
- [ ] Queue with file entries (id, file, status, progress)
- [ ] Methods: addFiles, removeFile, clearQueue
- [ ] Track individual and total progress
- [ ] Max queue size limit (configurable)

---

#### Task 3.1.2: Update File Drop Zone for Multiple Files
**Description:** Accept multiple files in drop zone.
**Files to modify:**
- `components/chat/file-drop-zone.tsx` - Multi-file support

**Acceptance Criteria:**
- [ ] Accept multiple files on drop
- [ ] Show count of files being added
- [ ] Validate each file (size, type)
- [ ] Show individual validation errors
- [ ] Add all valid files to queue

---

#### Task 3.1.3: Create Queue Panel Component
**Description:** Panel showing all queued files with progress.
**Files to create:**
- `components/chat/file-queue-panel.tsx` - Queue UI

**Acceptance Criteria:**
- [ ] List all queued files
- [ ] Individual progress bars
- [ ] Remove button per file
- [ ] Clear all button
- [ ] Total progress indicator
- [ ] Collapse/expand functionality

---

### 3.2 Desktop Notifications

#### Task 3.2.1: Create Notification Service
**Description:** Service for requesting permission and showing notifications.
**Files to create:**
- `lib/notifications.ts` - Notification utilities

**Acceptance Criteria:**
- [ ] Check permission status
- [ ] Request permission on user action
- [ ] Show notification with title, body, icon
- [ ] Handle click to focus tab
- [ ] Only notify when tab is hidden
- [ ] Store user preference

---

#### Task 3.2.2: Add Notification Settings UI
**Description:** Settings toggle for enabling/disabling notifications.
**Files to create/modify:**
- `components/settings/notification-settings.tsx` - Settings UI

**Acceptance Criteria:**
- [ ] Toggle switch for notifications
- [ ] Show permission status
- [ ] Request permission button if not granted
- [ ] Explain what notifications are sent
- [ ] Persist preference

---

#### Task 3.2.3: Integrate Notifications with Events
**Description:** Trigger notifications on key events.
**Files to modify:**
- `hooks/use-webrtc.ts` - Add notification triggers

**Acceptance Criteria:**
- [ ] Notify on peer connected
- [ ] Notify on file received
- [ ] Notify on message received (when tab hidden)
- [ ] Include relevant info in notification body
- [ ] Respect user preference

---

### 3.3 Keyboard Shortcuts

#### Task 3.3.1: Create Keyboard Shortcut Hook
**Description:** Hook for registering and handling keyboard shortcuts.
**Files to create:**
- `hooks/use-keyboard-shortcuts.ts` - Shortcut hook

**Acceptance Criteria:**
- [ ] Register shortcuts with action callbacks
- [ ] Handle Ctrl/Cmd modifier for cross-platform
- [ ] Prevent default browser behavior
- [ ] Ignore when input is focused (configurable)
- [ ] Clean up listeners on unmount

---

#### Task 3.3.2: Implement Chat Page Shortcuts
**Description:** Add keyboard shortcuts to chat page.
**Files to modify:**
- `app/room/[code]/chat/page.tsx` - Add shortcuts

**Acceptance Criteria:**
- [ ] Ctrl+V: Paste file/image
- [ ] Ctrl+O: Open file picker
- [ ] Ctrl+Enter: Send message
- [ ] Escape: Cancel transfer / Close modal

---

### 3.4 Message Reactions

#### Task 3.4.1: Create Reaction Picker Component
**Description:** Emoji reaction picker that appears on hover/long-press.
**Files to create:**
- `components/chat/reaction-picker.tsx` - Picker component

**Acceptance Criteria:**
- [ ] Show 6 preset reactions: 👍 ❤️ 😂 😮 😢 🎉
- [ ] Appear on hover (desktop) or long-press (mobile)
- [ ] Animate in/out
- [ ] Click to toggle reaction
- [ ] Keyboard accessible

---

#### Task 3.4.2: Implement Reaction Protocol
**Description:** Send and receive reactions via data channel.
**Files to modify:**
- `hooks/use-webrtc.ts` - Add reaction message type
- `lib/stores/chat-store.ts` - Store reactions per message

**Acceptance Criteria:**
- [ ] Send reaction with messageId, emoji, action (add/remove)
- [ ] Store reactions in message object
- [ ] Handle reaction from both peers
- [ ] Limit to predefined emoji set

---

#### Task 3.4.3: Display Reactions on Messages
**Description:** Show reaction badges below messages.
**Files to modify:**
- `components/chat/message-bubble.tsx` - Add reactions display

**Acceptance Criteria:**
- [ ] Show reaction badges below message
- [ ] Stack multiple reactions horizontally
- [ ] Show count if multiple of same reaction
- [ ] Click reaction to add/remove own
- [ ] Tooltip showing who reacted

---

## Phase 4: Security & Mobile

### 4.1 Password-Protected Rooms

#### Task 4.1.1: Add Password Field to Room Creation
**Description:** Optional password input when creating a room.
**Files to modify:**
- `app/room/create/page.tsx` - Add password input

**Acceptance Criteria:**
- [ ] Optional password field with toggle
- [ ] Password strength indicator
- [ ] Show/hide password toggle
- [ ] Hash password before sending to server
- [ ] Show lock icon when password set

---

#### Task 4.1.2: Add Password Verification on Join
**Description:** Require password to join protected rooms.
**Files to modify:**
- `app/room/[code]/page.tsx` - Add password prompt

**Acceptance Criteria:**
- [ ] Check if room is protected on load
- [ ] Show password input if protected
- [ ] Verify password with server
- [ ] Handle incorrect password
- [ ] Remember password for session (optional)

---

#### Task 4.1.3: Update Server for Room Passwords
**Description:** Backend support for password-protected rooms.
**Files to modify:**
- Server-side room management

**Acceptance Criteria:**
- [ ] Store password hash with room
- [ ] Verify password on join request
- [ ] Return protected status in room info
- [ ] Don't expose password hash to clients

---

### 4.2 Copy/Paste File Support

#### Task 4.2.1: Implement Paste Handler
**Description:** Handle paste events for images and files.
**Files to modify:**
- `components/chat/message-input.tsx` - Paste handler
- `app/room/[code]/chat/page.tsx` - Document paste listener

**Acceptance Criteria:**
- [ ] Listen for paste events on chat area
- [ ] Extract images from clipboard
- [ ] Extract files from clipboard (when supported)
- [ ] Add to file queue
- [ ] Show preview of pasted image
- [ ] Handle paste of text normally

---

### 4.3 Mobile Optimizations

#### Task 4.3.1: Implement Native Share API
**Description:** Use Web Share API for room sharing on mobile.
**Files to modify:**
- `components/room/room-code-display.tsx` - Add share button

**Acceptance Criteria:**
- [ ] Detect Share API support
- [ ] Show share button on supported devices
- [ ] Share room URL and title
- [ ] Fallback to copy for unsupported

---

#### Task 4.3.2: Audit and Fix Touch Targets
**Description:** Ensure all interactive elements meet 44px minimum.
**Files to modify:**
- Various component files

**Acceptance Criteria:**
- [ ] Audit all buttons, links, icons
- [ ] Increase size of undersized targets
- [ ] Add padding where needed
- [ ] Ensure 8px spacing between targets
- [ ] Test on actual mobile devices

---

### 4.4 PWA Support

#### Task 4.4.1: Create Web App Manifest
**Description:** Add manifest.json for PWA support.
**Files to create:**
- `public/manifest.json` - App manifest

**Acceptance Criteria:**
- [ ] App name and short name
- [ ] Icons for all sizes
- [ ] Theme and background colors
- [ ] Display: standalone
- [ ] Start URL

---

#### Task 4.4.2: Implement Service Worker
**Description:** Service worker for offline support and caching.
**Files to create:**
- `public/sw.js` - Service worker

**Acceptance Criteria:**
- [ ] Cache static assets
- [ ] Offline fallback page
- [ ] Background sync for pending messages (optional)
- [ ] Handle service worker updates

---

### 4.5 Chat Accessibility

#### Task 4.5.1: Add ARIA Attributes
**Description:** Add proper ARIA roles and attributes to chat.
**Files to modify:**
- `components/chat/message-list.tsx` - Add ARIA
- `components/chat/message-bubble.tsx` - Add ARIA

**Acceptance Criteria:**
- [ ] role="log" on message list
- [ ] aria-live="polite" on message container
- [ ] aria-label on interactive elements
- [ ] Proper heading hierarchy
- [ ] Screen reader announcements

---

#### Task 4.5.2: Implement Keyboard Navigation
**Description:** Allow keyboard navigation in chat.
**Files to modify:**
- `components/chat/message-list.tsx` - Keyboard nav

**Acceptance Criteria:**
- [ ] Arrow keys to navigate messages
- [ ] Enter to interact with message
- [ ] Tab to move between controls
- [ ] Focus indicators visible
- [ ] Skip link to main content

---

## Summary

| Phase | Tasks | Priority |
|-------|-------|----------|
| Phase 1: Core Reliability | 14 tasks | Critical |
| Phase 2: Chat UI/UX | 14 tasks | High |
| Phase 3: Enhanced UX | 10 tasks | Medium |
| Phase 4: Security & Mobile | 10 tasks | Medium |
| **Total** | **48 tasks** | |

---

*Tasks document created: January 2025*
