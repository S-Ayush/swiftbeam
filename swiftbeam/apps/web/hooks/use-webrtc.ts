'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { rtcConfig, dataChannelConfig } from '@/lib/webrtc-config';

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'waiting'
  | 'signaling'
  | 'connected'
  | 'disconnected'
  | 'failed';

interface UseWebRTCOptions {
  onMessage?: (data: any) => void;
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
  leaveRoom: () => void;
  sendMessage: (data: any) => void;
  isDataChannelOpen: boolean;
}

export function useWebRTC(options: UseWebRTCOptions = {}): UseWebRTCReturn {
  const { onMessage, onConnectionChange, onPeerConnected, onPeerDisconnected } =
    options;

  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isInitiator, setIsInitiator] = useState(false);
  const [isDataChannelOpen, setIsDataChannelOpen] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([]);

  // Update status with callback
  const updateStatus = useCallback(
    (newStatus: ConnectionStatus) => {
      setStatus(newStatus);
      onConnectionChange?.(newStatus);
    },
    [onConnectionChange]
  );

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
    return pc;
  }, [updateStatus, onPeerConnected, onPeerDisconnected]);

  // Setup data channel
  const setupDataChannel = useCallback(
    (channel: RTCDataChannel) => {
      channel.onopen = () => {
        console.log('Data channel open');
        setIsDataChannelOpen(true);
      };

      channel.onclose = () => {
        console.log('Data channel closed');
        setIsDataChannelOpen(false);
      };

      channel.onerror = (error) => {
        console.error('Data channel error:', error);
      };

      channel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch {
          onMessage?.(event.data);
        }
      };

      dataChannelRef.current = channel;
    },
    [onMessage]
  );

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
            setRoomCode(data.roomCode);
            setIsInitiator(true);

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
  }, [updateStatus]);

  // Join an existing room
  const joinRoom = useCallback(
    async (code: string): Promise<void> => {
      updateStatus('connecting');

      const socket = connectSocket();
      socketRef.current = socket;

      setRoomCode(code.toUpperCase());
      setIsInitiator(false);

      socket.emit('room:join', { code: code.toUpperCase() });
    },
    [updateStatus]
  );

  // Leave the room
  const leaveRoom = useCallback(() => {
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
    if (socketRef.current) {
      socketRef.current.emit('room:leave');
    }

    // Reset state
    setRoomCode(null);
    setIsInitiator(false);
    setIsDataChannelOpen(false);
    updateStatus('idle');
    pendingCandidatesRef.current = [];

    disconnectSocket();
  }, [updateStatus]);

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
      setIsInitiator(data.isInitiator);

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
    onPeerDisconnected,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveRoom();
    };
  }, [leaveRoom]);

  return {
    status,
    roomCode,
    isInitiator,
    createRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
    isDataChannelOpen,
  };
}
