'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChatHeader } from '@/components/chat/chat-header';
import { MessageBubble } from '@/components/chat/message-bubble';
import { MessageInput } from '@/components/chat/message-input';
import { FileDropZone } from '@/components/chat/file-drop-zone';
import { useWebRTC } from '@/hooks/use-webrtc';
import { useFileTransfer } from '@/hooks/use-file-transfer';
import { useChatStore } from '@/lib/stores/chat-store';
import { MessageSquare } from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const code = (params.code as string).toUpperCase();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, addMessage, setConnected, setRoomCode, clearMessages } =
    useChatStore();

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
    addMessage({
      type: 'system',
      content: 'Peer connected',
      sender: 'system',
      status: 'sent',
    });
  }, [setConnected, addMessage]);

  const handlePeerDisconnected = useCallback(() => {
    setConnected(false);
    addMessage({
      type: 'system',
      content: 'Peer disconnected',
      sender: 'system',
      status: 'sent',
    });
  }, [setConnected, addMessage]);

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

  const isConnected = status === 'connected' && isDataChannelOpen;

  return (
    <FileDropZone onFileSelect={handleFileSelect} disabled={!isConnected}>
      <div className="h-screen flex flex-col">
        <ChatHeader
          roomCode={code}
          status={status}
          onLeave={handleLeave}
        />

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
