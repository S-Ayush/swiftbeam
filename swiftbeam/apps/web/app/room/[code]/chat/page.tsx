'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChatHeader } from '@/components/chat/chat-header';
import { MessageBubble } from '@/components/chat/message-bubble';
import { MessageInput } from '@/components/chat/message-input';
import { useWebRTC } from '@/hooks/use-webrtc';
import { useChatStore } from '@/lib/stores/chat-store';
import { MessageSquare } from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const code = (params.code as string).toUpperCase();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, addMessage, setConnected, setRoomCode, clearMessages } =
    useChatStore();

  const handleMessage = useCallback(
    (data: any) => {
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
  } = useWebRTC({
    onMessage: handleMessage,
    onPeerConnected: handlePeerConnected,
    onPeerDisconnected: handlePeerDisconnected,
  });

  // Initialize connection (with guard for React Strict Mode)
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    setRoomCode(code);
    clearMessages();

    // If we're not connected, try to join/create the room
    if (status === 'idle') {
      joinRoom(code);
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

  const handleLeave = () => {
    leaveRoom();
    clearMessages();
    router.push('/');
  };

  const isConnected = status === 'connected' && isDataChannelOpen;

  return (
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
                ? 'Send a message or share a file. Everything is end-to-end encrypted and goes directly to your peer.'
                : 'Once your peer connects, you can start sharing messages and files.'}
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <MessageInput
        onSend={handleSend}
        disabled={!isConnected}
      />
    </div>
  );
}
