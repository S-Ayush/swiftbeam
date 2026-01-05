'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ChatHeader } from '@/components/chat/chat-header';
import { MessageBubble } from '@/components/chat/message-bubble';
import { MessageInput } from '@/components/chat/message-input';
import { FileDropZone } from '@/components/chat/file-drop-zone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useWebRTC } from '@/hooks/use-webrtc';
import { useFileTransfer } from '@/hooks/use-file-transfer';
import { useChatStore } from '@/lib/stores/chat-store';
import { MessageSquare, WifiOff, RefreshCw, Users, X, Loader2 } from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const code = (params.code as string).toUpperCase();

  const messagesEndRef = useRef<HTMLDivElement>(null);
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
  } = useChatStore();

  // File transfer hook - will be initialized after we have the data channel
  const fileTransferRef = useRef<ReturnType<typeof useFileTransfer> | null>(null);

  const handleMessage = useCallback(
    (data: any) => {
      // Handle file transfer messages
      if (data.type?.startsWith('file-')) {
        fileTransferRef.current?.handleFileMessage(data);
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
      }
    },
    [addMessage]
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
  }, [setConnected, setPeerDisconnected, addMessage]);

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
  } = useWebRTC({
    onMessage: handleMessage,
    onBinaryMessage: handleBinaryMessage,
    onPeerConnected: handlePeerConnected,
    onPeerDisconnected: handlePeerDisconnected,
  });

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

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (content: string, type: 'text' | 'code') => {
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

  const handleFileSelect = (file: File) => {
    fileTransfer.sendFile(file);
  };

  const handleFilesSelect = (files: FileList) => {
    // Handle first file for now (can extend to multiple later)
    if (files.length > 0) {
      fileTransfer.sendFile(files[0]);
    }
  };

  const handleCancelFile = (fileId: string) => {
    fileTransfer.cancelTransfer(fileId);
  };

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

  return (
    <FileDropZone onFileSelect={handleFileSelect} disabled={!isConnected}>
      <div className="h-screen flex flex-col relative">
        <ChatHeader
          roomCode={code}
          status={status}
          onLeave={handleLeave}
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
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">
                {isConnected ? 'Start sharing' : 'Waiting for connection...'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {isConnected
                  ? 'Send a message, drop a file, or click the attachment button. Everything goes directly to your peer.'
                  : 'Once your peer connects, you can start sharing messages and files.'}
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onCancelFile={handleCancelFile}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <MessageInput
          onSend={handleSend}
          onFileSelect={handleFilesSelect}
          disabled={!isConnected}
        />
      </div>
    </FileDropZone>
  );
}
