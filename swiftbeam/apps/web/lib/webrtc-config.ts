// ICE Server Configuration
export const iceServers: RTCIceServer[] = [
  // Google STUN servers (free)
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },

  // Open Relay Project TURN servers (free 20GB/month)
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

export const rtcConfig: RTCConfiguration = {
  iceServers,
  iceCandidatePoolSize: 10,
};

// Data channel configuration
export const dataChannelConfig: RTCDataChannelInit = {
  ordered: true, // Guarantee order for file transfers
};

// Buffer thresholds for file transfer
export const BUFFER_HIGH_THRESHOLD = 1 * 1024 * 1024; // 1MB - pause sending
export const BUFFER_LOW_THRESHOLD = 256 * 1024; // 256KB - resume sending

// Chunk size for file transfer (cross-browser compatible)
export const CHUNK_SIZE = 16 * 1024; // 16KB
