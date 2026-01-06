'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChatHeader } from '@/components/chat/chat-header';
import { MessageList } from '@/components/chat/message-list';
import { MessageInput } from '@/components/chat/message-input';
import { FileDropZone } from '@/components/chat/file-drop-zone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useWebRTC } from '@/hooks/use-webrtc';
import { useFileTransfer } from '@/hooks/use-file-transfer';
import { useChatStore } from '@/lib/stores/chat-store';
import { useNotifications } from '@/hooks/use-notifications';
import { useChatShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { WifiOff, RefreshCw, Users, X, Loader2 } from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const code = (params.code as string).toUpperCase();

  const sendMessageRef = useRef<((data: any) => void) | null>(null);
  const [isWaitingForReconnect, setIsWaitingForReconnect] = useState(false);

  const {
    messages,
    addMessage,
    setConnected,
    setRoomCode,
    clearMessages,
    orgId,
    peerDisconnected,
    setPeerDisconnected,
    peerTyping,
    setPeerTyping,
    markMessageAsRead,
    markMessagesAsDelivered,
    addReaction,
  } = useChatStore();

  // Notifications
  const { showNotification, requestPermission, permission } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // File transfer hook - will be initialized after we have the data channel
  const fileTransferRef = useRef<ReturnType<typeof useFileTransfer> | null>(null);

  const handleMessage = useCallback(
    (data: any) => {
      // Handle file transfer messages
      if (data.type?.startsWith('file-')) {
        fileTransferRef.current?.handleFileMessage(data);
        return;
      }

      // Handle typing indicator
      if (data.type === 'typing') {
        setPeerTyping(data.isTyping);
        return;
      }

      // Handle read receipt
      if (data.type === 'read-receipt') {
        markMessageAsRead(data.messageId);
        return;
      }

      // Handle delivered acknowledgment
      if (data.type === 'delivered') {
        markMessagesAsDelivered();
        return;
      }

      // Handle reaction
      if (data.type === 'reaction') {
        addReaction(data.messageId, data.emoji, true);
        return;
      }

      // Handle text/code messages
      if (data.type === 'text' || data.type === 'code') {
        addMessage({
          type: data.type,
          content: data.content,
          sender: 'peer',
          status: 'sent',
        });
        // Send delivered acknowledgment
        sendMessageRef.current?.({ type: 'delivered' });
        // Show notification
        showNotification('message', {
          preview: data.content.slice(0, 100),
        });
      }
    },
    [addMessage, setPeerTyping, markMessageAsRead, markMessagesAsDelivered, addReaction, showNotification]
  );

  const handleBinaryMessage = useCallback((data: ArrayBuffer) => {
    fileTransferRef.current?.handleBinaryData(data);
  }, []);

  const handlePeerConnected = useCallback(() => {
    setConnected(true);
    setPeerDisconnected(false);
    setIsWaitingForReconnect(false);
    addMessage({
      type: 'system',
      content: 'Peer connected',
      sender: 'system',
      status: 'sent',
    });
    showNotification('peer-connected');
    // Request notification permission on first connection
    if (permission === 'default') {
      requestPermission();
    }
  }, [setConnected, setPeerDisconnected, addMessage, showNotification, permission, requestPermission]);

  const handlePeerDisconnected = useCallback(() => {
    setConnected(false);
    setPeerDisconnected(true);
    addMessage({
      type: 'system',
      content: 'Peer disconnected',
      sender: 'system',
      status: 'sent',
    });
  }, [setConnected, setPeerDisconnected, addMessage]);

  const handlePeerReconnected = useCallback(() => {
    setIsWaitingForReconnect(false);
    setPeerDisconnected(false);
  }, [setPeerDisconnected]);

  const {
    status,
    roomCode,
    joinRoom,
    leaveRoom,
    sendMessage,
    isDataChannelOpen,
    dataChannel,
    peerConnection,
  } = useWebRTC({
    onMessage: handleMessage,
    onBinaryMessage: handleBinaryMessage,
    onPeerConnected: handlePeerConnected,
    onPeerDisconnected: handlePeerDisconnected,
  });

  // Store sendMessage ref for use in callbacks
  sendMessageRef.current = sendMessage;

  // Initialize file transfer hook
  const fileTransfer = useFileTransfer({ dataChannel });
  fileTransferRef.current = fileTransfer;

  // Initialize connection (with guard for React Strict Mode)
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    setRoomCode(code);

    // Only clear messages if this is a fresh connection (not a page navigation)
    if (status === 'idle') {
      clearMessages();
      // Try to join the room if not connected
      joinRoom(code);
    } else {
      console.log('Using existing connection, status:', status);
    }
  }, [code, status, joinRoom, setRoomCode, clearMessages]);

  // Typing indicator timeout ref
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = useCallback(() => {
    // Send typing indicator
    sendMessage({ type: 'typing', isTyping: true });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      sendMessage({ type: 'typing', isTyping: false });
    }, 2000);
  }, [sendMessage]);

  const handleSend = (content: string, type: 'text' | 'code') => {
    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendMessage({ type: 'typing', isTyping: false });
    // Add to local messages
    addMessage({
      type,
      content,
      sender: 'self',
      status: 'sending',
    });

    // Send via WebRTC
    sendMessage({ type, content });
  };

  const handleFilesSelect = (files: File[]) => {
    // Queue multiple files for transfer
    for (const file of files) {
      fileTransfer.sendFile(file);
    }
  };

  const handleFileListSelect = (files: FileList) => {
    // Convert FileList to File array
    handleFilesSelect(Array.from(files));
  };

  const handleCancelFile = (fileId: string) => {
    fileTransfer.cancelTransfer(fileId);
  };

  const handleReact = useCallback(
    (messageId: string, emoji: string) => {
      // Toggle reaction locally
      const message = messages.find((m) => m.id === messageId);
      const existingReaction = message?.reactions?.find((r) => r.emoji === emoji);

      if (existingReaction?.fromSelf) {
        // Remove reaction - but we don't have removeReaction wired yet, so just toggle
        addReaction(messageId, emoji);
      } else {
        addReaction(messageId, emoji);
      }

      // Send to peer
      sendMessage({ type: 'reaction', messageId, emoji });
    },
    [messages, addReaction, sendMessage]
  );

  // Copy room code to clipboard
  const handleCopyRoomCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (err) {
      console.error('Failed to copy room code:', err);
    }
  }, [code]);

  const handleLeave = () => {
    leaveRoom();
    clearMessages();
    router.push('/');
  };

  const handleWaitForReconnect = () => {
    setIsWaitingForReconnect(true);
    setPeerDisconnected(false);
  };

  const handleFindPeerAgain = () => {
    // Go back to connect page for this org
    if (orgId) {
      leaveRoom();
      router.push(`/org/${orgId}/connect`);
    } else {
      // Fallback to dashboard if no orgId
      leaveRoom();
      clearMessages();
      router.push('/dashboard');
    }
  };

  const handleDismissOverlay = () => {
    setPeerDisconnected(false);
  };

  const isConnected = status === 'connected' && isDataChannelOpen;
  const showDisconnectedOverlay = peerDisconnected && !isWaitingForReconnect;

  // Keyboard shortcuts
  useChatShortcuts({
    onOpenFilePicker: () => fileInputRef.current?.click(),
    onCopyRoomCode: handleCopyRoomCode,
    onLeaveRoom: handleLeave,
    onFocusInput: () => messageInputRef.current?.focus(),
    isConnected,
  });

  return (
    <FileDropZone onFilesSelect={handleFilesSelect} disabled={!isConnected}>
      <div className="h-screen flex flex-col relative">
        <ChatHeader
          roomCode={code}
          status={status}
          onLeave={handleLeave}
          peerConnection={peerConnection}
        />

        {/* Disconnection Overlay */}
        {showDisconnectedOverlay && (
          <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
              <CardHeader className="text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600 mx-auto mb-4">
                  <WifiOff className="h-8 w-8" />
                </div>
                <CardTitle>Peer Disconnected</CardTitle>
                <CardDescription>
                  Your peer has disconnected from the session. What would you like to do?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  onClick={handleWaitForReconnect}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Wait for Reconnection
                </Button>

                {orgId && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleFindPeerAgain}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Find Peer Again
                  </Button>
                )}

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleDismissOverlay}
                >
                  <X className="mr-2 h-4 w-4" />
                  Dismiss & Continue
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Waiting for reconnection banner */}
        {isWaitingForReconnect && !isConnected && (
          <div className="bg-orange-50 border-b border-orange-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
              <span className="text-sm text-orange-800">
                Waiting for peer to reconnect...
              </span>
            </div>
            <div className="flex items-center gap-2">
              {orgId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFindPeerAgain}
                >
                  Find Peer Again
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsWaitingForReconnect(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Messages area */}
        <MessageList
          messages={messages}
          peerTyping={peerTyping}
          isConnected={isConnected}
          onCancelFile={handleCancelFile}
          onReact={handleReact}
          className="flex-1"
        />

        {/* Input area */}
        <MessageInput
          onSend={handleSend}
          onFileSelect={handleFileListSelect}
          onTyping={handleTyping}
          disabled={!isConnected}
        />
      </div>
    </FileDropZone>
  );
}
