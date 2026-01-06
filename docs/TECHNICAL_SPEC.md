# SwiftBeam - Technical Specification

Technical specifications for implementing the features outlined in IMPROVEMENTS.md.

---

## 1. Data Channel Message Protocol

### Message Types
All messages sent via RTCDataChannel use JSON format with a `type` field.

| Type | Purpose | Reliability |
|------|---------|-------------|
| `chat` | Text messages | Reliable, ordered |
| `typing` | Typing indicator | Unreliable (optional loss OK) |
| `read_receipt` | Message read confirmation | Reliable, ordered |
| `reaction` | Emoji reaction | Reliable, ordered |
| `file_meta` | File transfer metadata | Reliable, ordered |
| `file_chunk` | File binary data | Reliable, ordered |
| `file_ack` | Chunk acknowledgment | Reliable, ordered |

### Message Schemas

**Typing Indicator**
- Fields: `type`, `isTyping`, `timestamp`
- Debounce: 300ms on keypress
- Timeout: Clear indicator after 3 seconds of no updates
- Send on: First keystroke, stop typing, blur input

**Read Receipt**
- Fields: `type`, `messageId`, `readAt`
- Trigger: Message enters viewport for 1+ second
- Batch: Group multiple receipts within 500ms window

**Reaction**
- Fields: `type`, `messageId`, `emoji`, `action` (add/remove)
- Allowed emojis: Predefined set of 6 reactions

---

## 2. Resumable File Transfers

### Chunking Strategy
- **Chunk size**: 16KB (cross-browser compatible)
- **Buffer threshold**: 256KB (browser default)
- **Backpressure**: Use `bufferedamountlow` event to pause/resume

### Transfer State Schema
Store in IndexedDB for persistence:

| Field | Type | Description |
|-------|------|-------------|
| `transferId` | string | Unique transfer identifier |
| `fileId` | string | Hash of file metadata |
| `fileName` | string | Original file name |
| `fileSize` | number | Total size in bytes |
| `mimeType` | string | File MIME type |
| `totalChunks` | number | Total chunk count |
| `completedChunks` | number[] | Array of received chunk indices |
| `chunks` | Blob[] | Stored chunk data |
| `status` | enum | pending/active/paused/completed/failed |
| `createdAt` | timestamp | Transfer start time |
| `updatedAt` | timestamp | Last activity time |

### Resume Protocol
1. On reconnect, receiver sends `file_resume` with `transferId` and `completedChunks`
2. Sender skips acknowledged chunks, resumes from first missing
3. Receiver reassembles using chunk indices, not arrival order

### File Reading
- Use `file.slice(start, end)` to read chunks on-demand
- Prevents loading entire file into memory
- FileReader for async chunk reading

---

## 3. Connection Quality Monitoring

### Metrics Collection
Use `RTCPeerConnection.getStats()` every 1 second after connection.

| Metric | Source | Calculation |
|--------|--------|-------------|
| RTT | `candidate-pair` | `currentRoundTripTime` |
| Throughput | `data-channel` | `(bytesSent[t] - bytesSent[t-1]) / interval` |
| Available bandwidth | `candidate-pair` | `availableOutgoingBitrate` |

### Quality Thresholds

| Quality | RTT | Throughput |
|---------|-----|------------|
| Excellent | < 100ms | > 5 MB/s |
| Good | 100-300ms | 1-5 MB/s |
| Poor | > 300ms | < 1 MB/s |

### Important Notes
- Wait 2+ seconds after connection before collecting RTT stats
- `remote-inbound-rtp` reports unavailable in first 2 seconds
- For P2P (no media server), RTT reflects true end-to-end latency

---

## 4. QR Code Generation

### Library
Use `qrcode.react` - lightweight, React-native, no external dependencies.

### QR Content
- Format: Full room URL `https://swiftbeam.app/room/{CODE}`
- Error correction: Level M (15% recovery)
- Size: 200x200px default, responsive

### Display Context
- Show on room creation page
- Include manual code below QR as fallback
- Add "Scan with phone camera" instruction

---

## 5. Desktop Notifications

### Permission Strategy
- **Never** request on page load
- Request after user clicks "Enable notifications" button
- Show custom prompt explaining benefits first (double opt-in)
- Store preference in localStorage

### Notification Events

| Event | Title | Body | When |
|-------|-------|------|------|
| Peer connected | "Peer Connected" | "{name} joined the room" | `peer.connected` |
| File received | "File Received" | "{filename} ({size})" | `file.complete` |
| Message received | "New Message" | Message preview (truncated) | `chat.message` + tab hidden |

### Requirements
- Check `Notification.permission` before requesting
- Use `document.hidden` to only notify when tab is background
- Respect user's system notification settings
- Mobile: Use ServiceWorker `showNotification()` instead of constructor

---

## 6. Chat UI Technical Requirements

### Message Grouping
- Group consecutive messages from same sender within 2 minutes
- First message in group: Show avatar, name, full timestamp
- Subsequent messages: Reduced top margin (4px), time on hover only

### Timestamp Display
- < 1 min: "Just now"
- < 60 min: "{n}m ago"
- Same day: "HH:MM AM/PM"
- Different day: Date separator component

### Typing Indicator Animation
- 3 dots with staggered bounce animation
- Animation: 1.4s infinite, 0.16s delay between dots
- Position: Fixed at bottom of message list, above input

### Message Bubble Constraints
- Max width: 75% of container
- Min width: 60px (for short messages)
- Border radius: 16px, with 4px on sender's corner

### Auto-resize Input
- Min height: 40px (single line)
- Max height: 120px (approximately 5 lines)
- Overflow: Scroll when exceeding max height
- Reset to min height after send

### Accessibility
- `aria-live="polite"` on message container
- `role="log"` on message list
- Focus trap in emoji picker
- Announce new messages to screen readers

---

## 7. Keyboard Shortcuts

### Implementation
- Use `keydown` event listener on document
- Check `event.ctrlKey` or `event.metaKey` for Mac
- Prevent default browser behavior for overridden shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl/Cmd + V` | Paste file/image | Chat page |
| `Ctrl/Cmd + O` | Open file picker | Chat page |
| `Ctrl/Cmd + Enter` | Send message | Input focused |
| `Escape` | Cancel transfer / Close modal | Any |
| `Ctrl/Cmd + C` | Copy room code | Room page (no text selected) |

---

## 8. Mobile Considerations

### Touch Targets
- Minimum touch target: 44x44px (Apple HIG)
- Spacing between targets: 8px minimum

### Native APIs
- Share API: `navigator.share()` for room sharing
- Camera API: `navigator.mediaDevices.getUserMedia()` for QR scanning
- Vibration API: `navigator.vibrate()` for haptic feedback (optional)

### PWA Requirements
- `manifest.json` with app metadata
- Service Worker for offline capability
- `display: standalone` for app-like experience
- Apple touch icons for iOS

---

## References

- [WebRTC Data Channels - MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels)
- [WebRTC getStats - W3C](https://www.w3.org/TR/webrtc-stats/)
- [Notification API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API)
- [WebRTC File Transfer Best Practices](https://webrtc.github.io/samples/src/content/datachannel/filetransfer/)
- [Connection Quality Monitoring](https://webrtchacks.com/power-up-getstats-for-client-monitoring/)

---

*Spec created: January 2025*
