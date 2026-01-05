'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { rtcConfig, dataChannelConfig } from '@/lib/webrtc-config';

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'waiting'
  | 'signaling'
  | 'connected'
  | 'disconnected'
  | 'failed';

// Use window to store connection state - survives Hot Reload and page navigation
interface WebRTCGlobalState {
  peerConnection: RTCPeerConnection | null;
  dataChannel: RTCDataChannel | null;
  roomCode: string | null;
  isInitiator: boolean;
  status: ConnectionStatus;
  isDataChannelOpen: boolean;
}

declare global {
  interface Window {
    __webrtcState?: WebRTCGlobalState;
  }
}

function getGlobalState(): WebRTCGlobalState {
  if (typeof window === 'undefined') {
    return {
      peerConnection: null,
      dataChannel: null,
      roomCode: null,
      isInitiator: false,
      status: 'idle',
      isDataChannelOpen: false,
    };
  }
  if (!window.__webrtcState) {
    window.__webrtcState = {
      peerConnection: null,
      dataChannel: null,
      roomCode: null,
      isInitiator: false,
      status: 'idle',
      isDataChannelOpen: false,
    };
  }
  return window.__webrtcState;
}

interface UseWebRTCOptions {
  onMessage?: (data: any) => void;
  onBinaryMessage?: (data: ArrayBuffer) => void;
  onConnectionChange?: (status: ConnectionStatus) => void;
  onPeerConnected?: () => void;
  onPeerDisconnected?: () => void;
}

interface UseWebRTCReturn {
  status: ConnectionStatus;
  roomCode: string | null;
  isInitiator: boolean;
  createRoom: () => Promise<string>;
  joinRoom: (code: string) => Promise<void>;
  leaveRoom: (shouldDisconnect?: boolean) => void;
  sendMessage: (data: any) => void;
  sendBinary: (data: ArrayBuffer) => void;
  isDataChannelOpen: boolean;
  dataChannel: RTCDataChannel | null;
}

export function useWebRTC(options: UseWebRTCOptions = {}): UseWebRTCReturn {
  const { onMessage, onBinaryMessage, onConnectionChange, onPeerConnected, onPeerDisconnected } =
    options;

  // Get global state (survives Hot Reload and page navigation)
  const globalState = getGlobalState();

  // Initialize from global state to preserve across page navigations
  const [status, setStatus] = useState<ConnectionStatus>(globalState.status);
  const [roomCode, setRoomCode] = useState<string | null>(globalState.roomCode);
  const [isInitiator, setIsInitiator] = useState(globalState.isInitiator);
  const [isDataChannelOpen, setIsDataChannelOpen] = useState(globalState.isDataChannelOpen);

  const socketRef = useRef<Socket | null>(getSocket());
  const peerConnectionRef = useRef<RTCPeerConnection | null>(globalState.peerConnection);
  const dataChannelRef = useRef<RTCDataChannel | null>(globalState.dataChannel);
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([]);

  // Wrapper functions that update both local and global state immediately
  const updateStatus = useCallback(
    (newStatus: ConnectionStatus) => {
      getGlobalState().status = newStatus;
      setStatus(newStatus);
      onConnectionChange?.(newStatus);
    },
    [onConnectionChange]
  );

  const updateRoomCode = useCallback((code: string | null) => {
    getGlobalState().roomCode = code;
    setRoomCode(code);
  }, []);

  const updateIsInitiator = useCallback((value: boolean) => {
    getGlobalState().isInitiator = value;
    setIsInitiator(value);
  }, []);

  const updateIsDataChannelOpen = useCallback((value: boolean) => {
    getGlobalState().isDataChannelOpen = value;
    setIsDataChannelOpen(value);
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(rtcConfig);

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('signal:ice-candidate', {
          candidate: JSON.stringify(event.candidate),
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);

      switch (pc.iceConnectionState) {
        case 'connected':
        case 'completed':
          updateStatus('connected');
          onPeerConnected?.();
          break;
        case 'disconnected':
          updateStatus('disconnected');
          onPeerDisconnected?.();
          break;
        case 'failed':
          updateStatus('failed');
          onPeerDisconnected?.();
          break;
      }
    };

    pc.ondatachannel = (event) => {
      console.log('Received data channel');
      setupDataChannel(event.channel);
    };

    peerConnectionRef.current = pc;
    getGlobalState().peerConnection = pc;
    return pc;
  }, [updateStatus, onPeerConnected, onPeerDisconnected]);

  // Store callbacks in refs so we can update handlers without recreating channel
  const onMessageRef = useRef(onMessage);
  const onBinaryMessageRef = useRef(onBinaryMessage);
  onMessageRef.current = onMessage;
  onBinaryMessageRef.current = onBinaryMessage;

  // Setup data channel
  const setupDataChannel = useCallback(
    (channel: RTCDataChannel) => {
      // Enable binary type for file transfers
      channel.binaryType = 'arraybuffer';

      channel.onopen = () => {
        console.log('Data channel open');
        updateIsDataChannelOpen(true);
      };

      channel.onclose = () => {
        console.log('Data channel closed');
        updateIsDataChannelOpen(false);
      };

      channel.onerror = (error) => {
        console.error('Data channel error:', error);
      };

      channel.onmessage = (event) => {
        // Handle binary data (file chunks)
        if (event.data instanceof ArrayBuffer) {
          onBinaryMessageRef.current?.(event.data);
          return;
        }

        // Handle JSON messages
        try {
          const data = JSON.parse(event.data);
          onMessageRef.current?.(data);
        } catch {
          onMessageRef.current?.(event.data);
        }
      };

      dataChannelRef.current = channel;
      getGlobalState().dataChannel = channel;
    },
    [] // No dependencies - uses refs for callbacks
  );

  // Reattach handlers to existing data channel when hook mounts
  useEffect(() => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      console.log('Reattaching handlers to existing data channel');
      setupDataChannel(dataChannelRef.current);
      updateIsDataChannelOpen(true);
    }
  }, [setupDataChannel, updateIsDataChannelOpen]);

  // Create data channel (initiator only)
  const createDataChannel = useCallback(() => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    const channel = pc.createDataChannel('swiftbeam', dataChannelConfig);
    setupDataChannel(channel);
  }, [setupDataChannel]);

  // Handle incoming offer
  const handleOffer = useCallback(
    async (data: { sdp: string; from: string }) => {
      const pc = peerConnectionRef.current || createPeerConnection();

      try {
        await pc.setRemoteDescription(JSON.parse(data.sdp));

        // Add any pending ICE candidates
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(candidate);
        }
        pendingCandidatesRef.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketRef.current?.emit('signal:answer', {
          sdp: JSON.stringify(answer),
        });

        updateStatus('signaling');
      } catch (error) {
        console.error('Error handling offer:', error);
        updateStatus('failed');
      }
    },
    [createPeerConnection, updateStatus]
  );

  // Handle incoming answer
  const handleAnswer = useCallback(async (data: { sdp: string }) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      await pc.setRemoteDescription(JSON.parse(data.sdp));

      // Add any pending ICE candidates
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(candidate);
      }
      pendingCandidatesRef.current = [];
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }, []);

  // Handle incoming ICE candidate
  const handleIceCandidate = useCallback(
    async (data: { candidate: string }) => {
      const pc = peerConnectionRef.current;
      const candidate = new RTCIceCandidate(JSON.parse(data.candidate));

      if (pc?.remoteDescription) {
        await pc.addIceCandidate(candidate);
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    },
    []
  );

  // Create a new room
  const createRoom = useCallback(async (): Promise<string> => {
    updateStatus('connecting');

    const socket = connectSocket();
    socketRef.current = socket;

    return new Promise((resolve, reject) => {
      // Request room creation from server
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/rooms`, {
        method: 'POST',
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.roomCode) {
            updateRoomCode(data.roomCode);
            updateIsInitiator(true);

            // Join the socket room
            socket.emit('room:join', { code: data.roomCode });
            updateStatus('waiting');
            resolve(data.roomCode);
          } else {
            reject(new Error('Failed to create room'));
          }
        })
        .catch(reject);
    });
  }, [updateStatus, updateRoomCode, updateIsInitiator]);

  // Join an existing room
  const joinRoom = useCallback(
    async (code: string): Promise<void> => {
      updateStatus('connecting');

      const socket = connectSocket();
      socketRef.current = socket;

      updateRoomCode(code.toUpperCase());
      updateIsInitiator(false);

      socket.emit('room:join', { code: code.toUpperCase() });
    },
    [updateStatus, updateRoomCode, updateIsInitiator]
  );

  // Leave the room (optionally disconnect socket)
  const leaveRoom = useCallback((shouldDisconnect = true) => {
    // Close data channel
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Leave socket room
    if (socketRef.current?.connected) {
      socketRef.current.emit('room:leave');
    }

    // Reset local and global state (wrapper functions update both)
    updateRoomCode(null);
    updateIsInitiator(false);
    updateIsDataChannelOpen(false);
    updateStatus('idle');
    pendingCandidatesRef.current = [];
    socketRef.current = null;

    // Also reset the connection refs in global state
    const gs = getGlobalState();
    gs.peerConnection = null;
    gs.dataChannel = null;

    // Only disconnect socket when explicitly requested (user navigation)
    // Don't disconnect during React Strict Mode cleanup cycles
    if (shouldDisconnect) {
      disconnectSocket();
    }
  }, [updateStatus, updateRoomCode, updateIsInitiator, updateIsDataChannelOpen]);

  // Send message through data channel
  const sendMessage = useCallback((data: any) => {
    const channel = dataChannelRef.current;
    if (channel?.readyState === 'open') {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      channel.send(message);
    } else {
      console.warn('Data channel not open');
    }
  }, []);

  // Send binary data through data channel
  const sendBinary = useCallback((data: ArrayBuffer) => {
    const channel = dataChannelRef.current;
    if (channel?.readyState === 'open') {
      channel.send(data);
    } else {
      console.warn('Data channel not open');
    }
  }, []);

  // Setup socket event listeners
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onRoomJoined = (data: {
      roomCode: string;
      participantCount: number;
      isInitiator: boolean;
    }) => {
      console.log('Room joined:', data);
      // Always set roomCode from server response to ensure consistency
      updateRoomCode(data.roomCode);
      updateIsInitiator(data.isInitiator);

      if (data.isInitiator) {
        updateStatus('waiting');
      } else {
        updateStatus('signaling');
      }
    };

    const onPeerJoined = async () => {
      console.log('Peer joined, creating offer');
      updateStatus('signaling');

      const pc = createPeerConnection();
      createDataChannel();

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('signal:offer', {
          sdp: JSON.stringify(offer),
        });
      } catch (error) {
        console.error('Error creating offer:', error);
        updateStatus('failed');
      }
    };

    const onRoomFull = () => {
      console.log('Room is full');
      updateStatus('failed');
    };

    const onRoomNotFound = () => {
      console.log('Room not found');
      updateStatus('failed');
    };

    const onPeerDisconnectedSocket = () => {
      console.log('Peer disconnected');
      updateStatus('disconnected');
      onPeerDisconnected?.();
    };

    socket.on('room:joined', onRoomJoined);
    socket.on('room:peer-joined', onPeerJoined);
    socket.on('room:full', onRoomFull);
    socket.on('room:not-found', onRoomNotFound);
    socket.on('signal:offer', handleOffer);
    socket.on('signal:answer', handleAnswer);
    socket.on('signal:ice-candidate', handleIceCandidate);
    socket.on('peer:disconnected', onPeerDisconnectedSocket);

    return () => {
      socket.off('room:joined', onRoomJoined);
      socket.off('room:peer-joined', onPeerJoined);
      socket.off('room:full', onRoomFull);
      socket.off('room:not-found', onRoomNotFound);
      socket.off('signal:offer', handleOffer);
      socket.off('signal:answer', handleAnswer);
      socket.off('signal:ice-candidate', handleIceCandidate);
      socket.off('peer:disconnected', onPeerDisconnectedSocket);
    };
  }, [
    createPeerConnection,
    createDataChannel,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    updateStatus,
    updateRoomCode,
    updateIsInitiator,
    onPeerDisconnected,
  ]);

  // Store leaveRoom in a ref to avoid cleanup issues
  const leaveRoomRef = useRef(leaveRoom);
  leaveRoomRef.current = leaveRoom;

  // Track if component is mounted to handle React Strict Mode
  const isMountedRef = useRef(true);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount only - delayed to handle React Strict Mode and page navigation
  useEffect(() => {
    isMountedRef.current = true;

    // Cancel any pending cleanup from Strict Mode's unmount or page navigation
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }

    return () => {
      isMountedRef.current = false;

      // Delay cleanup to allow Strict Mode remount or page navigation to cancel it
      cleanupTimeoutRef.current = setTimeout(() => {
        // Only clean up if no component has remounted with the connection
        // Check global status - if another page has taken over, don't clean up
        const gs = getGlobalState();
        if (!isMountedRef.current && gs.status === 'idle') {
          console.log('Cleaning up WebRTC connection');
          leaveRoomRef.current(true); // Actually disconnect
        } else if (!isMountedRef.current) {
          console.log('Skipping cleanup - connection still active on another page, status:', gs.status);
        }
      }, 200); // Slightly longer delay to allow page navigation
    };
  }, []);

  return {
    status,
    roomCode,
    isInitiator,
    createRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendBinary,
    isDataChannelOpen,
    dataChannel: dataChannelRef.current,
  };
}
