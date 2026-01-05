# Phase 4: File Transfer System
## SwiftBeam Development

---

## Overview

| Attribute | Detail |
|-----------|--------|
| **Phase** | 4 of 7 |
| **Focus** | Chunked file transfers, progress UI, validation |
| **Deliverables** | Complete file sharing up to 15GB |
| **Dependencies** | Phase 3 (Chat Interface) |

---

## 1. File Transfer Architecture

### 1.1 Transfer Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        FILE TRANSFER FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   SENDER                                           RECEIVER      │
│                                                                  │
│   1. User selects file                                          │
│      ↓                                                          │
│   2. Validate file type                                         │
│      ↓                                                          │
│   3. Send FILE_META ─────────────────────────> 4. Receive meta  │
│                                                    Show preview │
│                                                                  │
│   5. Read file as ArrayBuffer                                   │
│      ↓                                                          │
│   6. Split into 16KB chunks                                     │
│      ↓                                                          │
│   7. Send CHUNK ─────────────────────────────> 8. Receive chunk │
│      ↓                                             Store chunk  │
│   9. Check buffer                                               │
│      If full, pause                                             │
│      ↓                                                          │
│   10. Repeat 7-9 until complete                                 │
│      ↓                                                          │
│   11. Send FILE_COMPLETE ────────────────────> 12. Assemble     │
│                                                    Create Blob  │
│                                                    Enable DL    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Chunking Strategy

| Parameter | Value | Reason |
|-----------|-------|--------|
| Chunk Size | 16 KB (16384 bytes) | Cross-browser compatibility |
| Buffer Limit | 1 MB | Prevent memory overflow |
| Buffer Low Threshold | 256 KB | Resume sending |

**Why 16KB chunks:**
- Chrome: Max reliable message ~256KB
- Firefox: Supports larger but fragments internally
- Safari: Similar to Chrome
- 16KB ensures zero fragmentation issues

### 1.3 Message Protocol

```typescript
// File metadata message
interface FileMetaMessage {
  type: 'file-meta';
  fileId: string;
  name: string;
  size: number;
  mimeType: string;
  totalChunks: number;
}

// File chunk message
interface FileChunkMessage {
  type: 'file-chunk';
  fileId: string;
  index: number;
  data: ArrayBuffer;
}

// File complete message
interface FileCompleteMessage {
  type: 'file-complete';
  fileId: string;
  checksum?: string;  // Optional integrity check
}

// File error message
interface FileErrorMessage {
  type: 'file-error';
  fileId: string;
  error: string;
}
```

---

## 2. File Validation

### 2.1 Blocked Extensions

```typescript
const BLOCKED_EXTENSIONS = new Set([
  // Windows executables
  '.exe', '.msi', '.bat', '.cmd', '.com', '.scr', '.pif',

  // Scripts
  '.vbs', '.vbe', '.js', '.jse', '.ws', '.wsf', '.wsc', '.wsh',

  // PowerShell
  '.ps1', '.ps1xml', '.ps2', '.ps2xml', '.psc1', '.psc2',

  // Shell scripts
  '.msh', '.msh1', '.msh2', '.mshxml', '.msh1xml', '.msh2xml',

  // System files
  '.scf', '.lnk', '.inf', '.reg', '.dll', '.sys', '.drv', '.ocx', '.cpl',

  // Java
  '.jar',

  // macOS/Linux
  '.app', '.dmg', '.pkg', '.deb', '.rpm', '.bin', '.run',

  // Android
  '.apk'
]);
```

### 2.2 Validation Rules

| Rule | Value | Error Message |
|------|-------|---------------|
| Max Size | 15 GB (15,000,000,000 bytes) | "File exceeds 15GB limit" |
| Blocked Extension | See list above | "This file type is not allowed" |
| Empty File | 0 bytes | "Cannot send empty files" |

### 2.3 Client-Side Validation

Validate on both sender AND receiver:
- Sender: Before initiating transfer
- Receiver: Before saving/assembling

---

## 3. UI Components

### 3.1 File Drop Zone

**Default State:**
```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│                                                               │
│                    [📎]  [</>]  [Type a message...]  [→]     │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Drag Active State (overlay):**
```
┌──────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────────┐ │
│ │                                                          │ │
│ │            ┌─────────────────────┐                       │ │
│ │            │        📁           │                       │ │
│ │            │                     │                       │ │
│ │            └─────────────────────┘                       │ │
│ │                                                          │ │
│ │              Drop file to send                          │ │
│ │                                                          │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**Styling:**
| State | Border | Background |
|-------|--------|------------|
| Default | None | Transparent |
| Drag Over | 2px dashed primary | Primary/10% |
| Invalid File | 2px dashed destructive | Destructive/10% |

### 3.2 File Preview (Sending)

**Before Send:**
```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  📄  project-files.zip                               │   │
│  │      245 MB • ZIP Archive                            │   │
│  │                                                       │   │
│  │  [Cancel]                           [Send File →]    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 Transfer Progress (Sender View)

```
┌──────────────────────────────────────────────────────────────┐
│                                                          You │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  📄  project-files.zip                               │   │
│  │      245 MB • ZIP Archive                            │   │
│  │                                                       │   │
│  │  ━━━━━━━━━━━━━━━━━━━━░░░░░░░░  75%                   │   │
│  │  183.5 MB / 245 MB  •  12.3 MB/s  •  ~5s remaining  │   │
│  │                                                       │   │
│  │  [Cancel Transfer]                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                    10:32 AM  │
└──────────────────────────────────────────────────────────────┘
```

### 3.4 Transfer Progress (Receiver View)

```
┌──────────────────────────────────────────────────────────────┐
│ Peer                                                          │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  📄  project-files.zip                               │   │
│  │      245 MB • ZIP Archive                            │   │
│  │                                                       │   │
│  │  ━━━━━━━━━━━━━━━━━━━━░░░░░░░░  75%                   │   │
│  │  Receiving...  183.5 MB / 245 MB                     │   │
│  │                                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│ 10:32 AM                                                     │
└──────────────────────────────────────────────────────────────┘
```

### 3.5 Transfer Complete

```
┌──────────────────────────────────────────────────────────────┐
│ Peer                                                          │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ✓  project-files.zip                                │   │
│  │      245 MB • ZIP Archive                            │   │
│  │                                                       │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  Complete         │   │
│  │                                                       │   │
│  │  [Download]                    [Save As...]          │   │
│  └──────────────────────────────────────────────────────┘   │
│ 10:32 AM                                                     │
└──────────────────────────────────────────────────────────────┘
```

### 3.6 Transfer Failed

```
┌──────────────────────────────────────────────────────────────┐
│ Peer                                                          │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ✕  project-files.zip                                │   │
│  │      245 MB • ZIP Archive                            │   │
│  │                                                       │   │
│  │  Transfer failed: Connection lost                    │   │
│  │                                                       │   │
│  │  [Dismiss]                                            │   │
│  └──────────────────────────────────────────────────────┘   │
│ 10:32 AM                                                     │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Progress Calculation

### 4.1 Metrics to Track

| Metric | Calculation |
|--------|-------------|
| Progress % | `(chunksReceived / totalChunks) * 100` |
| Bytes Transferred | `chunksReceived * CHUNK_SIZE` |
| Speed (MB/s) | `bytesInLastSecond / 1,000,000` |
| Time Remaining | `bytesRemaining / currentSpeed` |

### 4.2 Speed Calculation

Use rolling average over last 3 seconds:
1. Track bytes transferred each second
2. Average last 3 readings
3. Smooth out fluctuations

### 4.3 Progress Bar Animation

| Property | Value |
|----------|-------|
| Transition | `width 200ms ease-out` |
| Update Frequency | Every 10 chunks or 100ms |
| Color | Primary (blue) |
| Height | 8px |
| Border Radius | 4px |

---

## 5. File Type Icons

### 5.1 Icon Mapping

| Category | Extensions | Icon |
|----------|------------|------|
| Image | jpg, png, gif, svg, webp | 🖼️ |
| Video | mp4, mov, avi, mkv, webm | 🎬 |
| Audio | mp3, wav, flac, m4a, ogg | 🎵 |
| Document | pdf, doc, docx, txt, rtf | 📄 |
| Spreadsheet | xls, xlsx, csv | 📊 |
| Presentation | ppt, pptx | 📽️ |
| Archive | zip, rar, 7z, tar, gz | 📦 |
| Code | js, ts, py, java, html, css | 💻 |
| Design | psd, ai, sketch, fig, xd | 🎨 |
| Default | * | 📎 |

### 5.2 Implementation

Use a simple lookup function, fallback to default icon.

---

## 6. Buffer Management

### 6.1 Sender Buffer Control

```
┌─────────────────────────────────────────────────────────────┐
│                    BUFFER MANAGEMENT                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   datachannel.bufferedAmount                                │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐  │
│   │ LOW (< 256KB)      │ NORMAL        │ HIGH (> 1MB)    │  │
│   │    ← Resume        │               │    Pause →      │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                              │
│   Strategy:                                                  │
│   1. Send chunks until bufferedAmount > 1MB                 │
│   2. Pause and wait for 'bufferedamountlow' event           │
│   3. Resume sending when buffer drains                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Configuration

```typescript
const BUFFER_CONFIG = {
  highWaterMark: 1 * 1024 * 1024,  // 1 MB - pause threshold
  lowWaterMark: 256 * 1024,        // 256 KB - resume threshold
};

// Set low water mark on data channel
dataChannel.bufferedAmountLowThreshold = BUFFER_CONFIG.lowWaterMark;
```

---

## 7. Error Handling

### 7.1 Error Types

| Error | Cause | User Message |
|-------|-------|--------------|
| `FILE_TOO_LARGE` | > 15GB | "File exceeds 15GB limit" |
| `FILE_TYPE_BLOCKED` | Blocked extension | "This file type is not allowed for security" |
| `TRANSFER_CANCELLED` | User cancelled | "Transfer cancelled" |
| `CONNECTION_LOST` | Peer disconnected | "Connection lost during transfer" |
| `BUFFER_OVERFLOW` | Memory issue | "Transfer failed. Try a smaller file." |

### 7.2 Recovery Strategy

| Scenario | Action |
|----------|--------|
| Small buffer overflow | Auto-retry after 1s |
| Connection drop | Notify user, cannot resume (MVP) |
| Invalid file detected | Reject immediately |
| Receiver cancelled | Notify sender |

---

## 8. Tasks Checklist

### 8.1 File Selection
- [ ] Implement file input button
- [ ] Implement drag-and-drop zone
- [ ] File type validation
- [ ] File size validation
- [ ] Show file preview before send
- [ ] Multiple file queue (optional MVP)

### 8.2 Sending
- [ ] Read file as ArrayBuffer
- [ ] Split into 16KB chunks
- [ ] Send file metadata first
- [ ] Implement chunked sending loop
- [ ] Buffer management (pause/resume)
- [ ] Send completion message
- [ ] Cancel transfer functionality

### 8.3 Receiving
- [ ] Parse file metadata
- [ ] Create chunk storage array
- [ ] Receive and store chunks
- [ ] Track progress
- [ ] Assemble Blob on complete
- [ ] Trigger download

### 8.4 UI
- [ ] Drag overlay component
- [ ] File preview card
- [ ] Progress bar component
- [ ] Speed/time estimation display
- [ ] Download button
- [ ] Cancel button
- [ ] Error states

### 8.5 Edge Cases
- [ ] Handle 0-byte files
- [ ] Handle very small files (< 16KB)
- [ ] Handle connection drop mid-transfer
- [ ] Handle browser tab close warning
- [ ] Test with large files (1GB+)

---

## 9. Performance Optimization

### 9.1 Memory Management

| Strategy | Implementation |
|----------|----------------|
| Streaming read | Use `FileReader.readAsArrayBuffer` in chunks |
| Chunk disposal | Clear sent chunks from memory |
| Receiver assembly | Use `Blob` constructor (efficient) |

### 9.2 UI Performance

| Optimization | Implementation |
|--------------|----------------|
| Progress throttling | Update UI max 10 times/second |
| Virtualized list | Use if many file messages |
| Web Worker | Consider for large file processing |

---

## 10. Validation Criteria

Phase 4 is complete when:

| Criteria | Validation |
|----------|------------|
| File selection works | Button and drag-drop both work |
| Validation works | Blocked files show error |
| Small files transfer | < 1MB file transfers instantly |
| Large files transfer | 100MB+ file completes |
| Progress accurate | % matches actual transfer |
| Speed shown | MB/s displays and updates |
| Download works | Click download → file saves |
| Cancel works | Sender can stop transfer |
| Error handled | Connection drop shows message |

---

## 11. Testing Scenarios

### 11.1 File Types to Test

| Type | Size | Expected |
|------|------|----------|
| image.jpg | 5 MB | Success |
| video.mp4 | 500 MB | Success |
| archive.zip | 2 GB | Success |
| script.exe | 1 MB | Blocked |
| document.pdf | 10 MB | Success |
| empty.txt | 0 bytes | Error |

### 11.2 Network Conditions

| Condition | Test |
|-----------|------|
| Fast connection | Transfer speed matches bandwidth |
| Slow connection | Progress updates smoothly |
| Connection drop | Error shown, no crash |
| High latency | Transfer completes (slower) |

---

## Next Phase

**Phase 5: Authentication System** - User accounts, JWT auth, session management
