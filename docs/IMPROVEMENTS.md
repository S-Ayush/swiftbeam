# SwiftBeam - Feature Improvements & Roadmap

A focused analysis of features and improvements to enhance SwiftBeam's P2P file sharing experience.

---

## 🔴 Priority 1: Critical Improvements

### 1.1 Resumable File Transfers
**Problem:** If connection drops during large file transfer, users must start over.

**Solution:**
- Implement chunked transfers with sequence indexing
- Store transfer state in IndexedDB
- Allow resume from last successful chunk
- Support pause/resume buttons

**Technical Details:**
- Chunk size: 16KB (cross-browser compatible)
- Index by `fileId + sequenceNumber`
- Use `bufferedAmount` and `bufferedamountlow` events for backpressure

---

### 1.2 QR Code Room Sharing
**Problem:** Sharing room codes between devices (phone to laptop) is cumbersome.

**Solution:**
- Generate QR code for room URL
- Display QR prominently on room creation
- Add "Scan to Join" option on mobile
- Support camera-based QR scanning

**Implementation:**
```
npm install qrcode.react
```

---

### 1.3 Connection Quality Indicator
**Problem:** Users don't know why transfers are slow.

**Solution:**
- Real-time bandwidth measurement
- Connection quality badge (Excellent/Good/Poor)
- Show current transfer speed
- Estimated time remaining (ETA)

**Metrics to Track:**
- Round-trip time (RTT)
- Current throughput (MB/s)
- Connection type indicator

---

## 🟠 Priority 2: High-Impact Features

### 2.1 Password-Protected Rooms
**Problem:** Anyone with room code can join.

**Solution:**
- Optional password when creating room
- Password required to join
- Hash password client-side before verification
- Show lock icon for protected rooms

---

### 2.2 Multiple File Selection & Queue
**Problem:** Users can only send one file at a time.

**Solution:**
- Multi-file drag & drop
- File queue with individual progress
- Batch transfer progress
- Cancel individual files or entire queue

**UI Elements:**
- Queue panel showing all pending files
- Individual progress bars
- Total progress indicator
- Cancel/Remove buttons per file

---

### 2.3 Copy/Paste File Support
**Problem:** Users must drag files or use file picker.

**Solution:**
- Paste images from clipboard (Ctrl+V)
- Paste screenshots directly
- Paste files from file manager
- Support `paste` event on chat area

---

## 🟡 Priority 3: Chat Page UI/UX Enhancements

### 3.1 Message Bubble Improvements
**Current:** Basic message bubbles with sender name.

**Improvements:**
- Larger, more prominent bubbles with subtle shadows
- Consistent 16px border-radius for friendly appearance
- Color differentiation: Blue for sent, Gray for received
- Sender's messages right-aligned, receiver's left-aligned
- Grouped consecutive messages from same sender (reduced spacing)
- First message in group shows avatar/name, subsequent ones don't

**Visual Specs:**
```
Sent: bg-primary text-primary-foreground rounded-2xl rounded-br-md
Received: bg-muted text-foreground rounded-2xl rounded-bl-md
Padding: px-4 py-2.5
Max-width: 75% of container
```

---

### 3.2 Typing Indicators
**Problem:** Users don't know when peer is typing.

**Solution:**
- Animated dots indicator ("...")
- Show peer's name: "Alex is typing..."
- Smooth fade in/out animation
- 3-second timeout after last keystroke
- Position at bottom of message list

**Animation:**
- Three bouncing dots with staggered delays
- Dot size: 8px, spacing: 4px
- Animation: bounce 1.4s infinite

---

### 3.3 Message Timestamps
**Current:** No visible timestamps.

**Improvements:**
- Relative timestamps for recent messages ("Just now", "2m ago")
- Absolute timestamps for older messages ("3:45 PM")
- Date separators between different days ("Today", "Yesterday", "Jan 5")
- Hover to reveal full timestamp
- Subtle gray color (text-muted-foreground)

---

### 3.4 Read Receipts
**Problem:** Sender doesn't know if message was received/read.

**Solution:**
- Single checkmark: Sent
- Double checkmark: Delivered to peer
- Blue double checkmark: Read by peer
- Show status below message timestamp
- Icons: ✓ (sent) ✓✓ (delivered) ✓✓ (read, blue)

---

### 3.5 Message Reactions
**Problem:** Quick reactions require typing a full message.

**Solution:**
- Quick emoji reactions on hover/long-press
- Common reactions: 👍 ❤️ 😂 😮 😢 🎉
- Reaction count displayed below message
- Tap reaction to toggle on/off
- Show who reacted on hover

**UI:**
- Reaction picker appears on hover (desktop) or long-press (mobile)
- Reactions shown as small badges below message
- Multiple reactions stack horizontally

---

### 3.6 File Message Enhancements
**Current:** Basic file message display.

**Improvements:**
- File type icons (document, image, video, audio, archive)
- File size display (human-readable: "2.4 MB")
- Image thumbnails for image files
- Progress bar integrated into message bubble
- Download status: Pending → Downloading → Complete
- Click to download / open
- Error state with retry button

**File Icons by Type:**
| Type | Icon | Extensions |
|------|------|------------|
| Image | 🖼️ | jpg, png, gif, webp |
| Video | 🎬 | mp4, mov, webm |
| Audio | 🎵 | mp3, wav, ogg |
| Document | 📄 | pdf, doc, txt |
| Archive | 📦 | zip, rar, 7z |
| Code | 💻 | js, py, html, css |

---

### 3.7 Message Input Enhancements
**Current:** Basic text input with send button.

**Improvements:**
- Auto-resize textarea (grows with content, max 5 lines)
- Character count for long messages
- Emoji picker button
- File attachment button integrated
- Send button changes color when valid message
- Shift+Enter for new line, Enter to send
- Draft message persistence (save on unmount)

---

### 3.8 Chat Accessibility
**Problem:** Chat may not be fully accessible.

**Improvements:**
- ARIA live regions for new messages
- Screen reader announcements for typing indicators
- Keyboard navigation between messages
- Focus management on new message arrival
- High contrast mode support
- Reduced motion respects `prefers-reduced-motion`

---

## 🟢 Priority 4: Enhanced UX

### 4.1 Improved Drag & Drop
**Current:** Basic drop zone.

**Improvements:**
- Full-page drop zone overlay when dragging
- Visual feedback with animations
- "Drop anywhere" message
- File type icons on hover
- Reject invalid files with error message

---

### 4.2 Desktop Notifications
**Problem:** Users miss transfers when tab is in background.

**Solution:**
- Browser push notifications
- "Peer connected" notification
- "File received" notification
- "Transfer complete" notification
- Sound effects (optional, toggleable)

---

### 4.3 Keyboard Shortcuts
**Problem:** Power users want faster interactions.

**Shortcuts:**
| Key | Action |
|-----|--------|
| `Ctrl+V` | Paste file/image |
| `Ctrl+O` | Open file picker |
| `Ctrl+Enter` | Send message |
| `Escape` | Cancel transfer |
| `Ctrl+C` | Copy room code |

---

### 4.4 Mobile Optimization
**Current:** Responsive but not optimized.

**Improvements:**
- Native share API integration
- Touch-friendly buttons (44px minimum)
- Swipe gestures for actions
- Camera access for QR scanning
- PWA with app-like experience
- Add to Home Screen prompt

---

## 📊 Implementation Phases

### Phase 1: Core Reliability
- [ ] Resumable transfers
- [ ] QR code sharing
- [ ] Connection quality indicator

### Phase 2: Chat UI/UX
- [ ] Message bubble improvements
- [ ] Typing indicators
- [ ] Message timestamps
- [ ] Read receipts
- [ ] File message enhancements
- [ ] Message input improvements

### Phase 3: Enhanced UX
- [ ] Multi-file queue
- [ ] Improved drag & drop
- [ ] Desktop notifications
- [ ] Keyboard shortcuts
- [ ] Message reactions

### Phase 4: Security & Mobile
- [ ] Password-protected rooms
- [ ] Copy/paste support
- [ ] Mobile optimizations
- [ ] PWA support
- [ ] Chat accessibility improvements

---

## 🏆 Competitive Advantages to Build

| Feature | WeTransfer | ShareDrop | ToffeeShare | SwiftBeam (Target) |
|---------|------------|-----------|-------------|-------------------|
| P2P Transfer | ❌ | ✅ | ✅ | ✅ |
| No Signup | ✅ | ✅ | ✅ | ✅ |
| Large Files | 2GB free | No limit | No limit | 15GB |
| Resumable | ❌ | ❌ | ❌ | ✅ (planned) |
| QR Code | ❌ | ❌ | ❌ | ✅ (planned) |
| Organizations | ❌ | ❌ | ❌ | ✅ |
| Presence | ❌ | ❌ | ❌ | ✅ |
| Password Protect | ✅ | ❌ | ❌ | ✅ (planned) |
| PWA | ❌ | ❌ | ❌ | ✅ (planned) |

---

## 💡 Quick Wins (Can implement immediately)

1. **QR Code Display** - Add qrcode.react
2. **Keyboard Shortcuts** - Add hotkey handlers
3. **Desktop Notifications** - Browser Notification API
4. **Copy Room Code Button** - Already partially done, enhance
5. **File Type Icons** - Map extensions to lucide icons
6. **Transfer Speed Display** - Calculate from chunk timing
7. **Sound Effects** - Add optional audio feedback
8. **Paste Support** - Handle paste event for images
9. **Message Timestamps** - Add relative time display
10. **Typing Indicator** - Send typing events via data channel
11. **Message Bubble Styling** - CSS-only improvements
12. **Auto-resize Input** - Textarea grows with content

---

*Document created: January 2025*
