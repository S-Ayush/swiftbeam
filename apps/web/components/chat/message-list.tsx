'use client';

import { useRef, useEffect } from 'react';
import { MessageBubble } from './message-bubble';
import { DateSeparator } from './date-separator';
import { TypingIndicator } from './typing-indicator';
import { shouldGroupMessages, isSameDay } from '@/lib/format-time';
import type { Message } from '@/lib/stores/chat-store';
import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  peerTyping?: boolean;
  isConnected?: boolean;
  onCancelFile?: (fileId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  className?: string;
}

export function MessageList({
  messages,
  peerTyping = false,
  isConnected = false,
  onCancelFile,
  onReact,
  className,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, peerTyping]);

  // Empty state
  if (messages.length === 0) {
    return (
      <div className={cn('h-full flex flex-col items-center justify-center text-center p-8', className)}>
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
    );
  }

  // Process messages to add grouping info
  const processedMessages = messages.map((message, index) => {
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

    // Check if this message needs a date separator
    const needsDateSeparator =
      !prevMessage || !isSameDay(prevMessage.timestamp, message.timestamp);

    // Check grouping with previous message
    const isFirstInGroup =
      !prevMessage ||
      prevMessage.sender === 'system' ||
      message.sender === 'system' ||
      !shouldGroupMessages(
        prevMessage.timestamp,
        message.timestamp,
        prevMessage.sender,
        message.sender
      ) ||
      needsDateSeparator;

    // Check grouping with next message
    const isLastInGroup =
      !nextMessage ||
      nextMessage.sender === 'system' ||
      message.sender === 'system' ||
      !shouldGroupMessages(
        message.timestamp,
        nextMessage.timestamp,
        message.sender,
        nextMessage.sender
      ) ||
      (nextMessage && !isSameDay(message.timestamp, nextMessage.timestamp));

    return {
      message,
      needsDateSeparator,
      isFirstInGroup,
      isLastInGroup,
    };
  });

  return (
    <div
      ref={containerRef}
      className={cn('flex-1 overflow-y-auto p-4 momentum-scroll', className)}
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
      aria-relevant="additions"
      tabIndex={0}
    >
      <div className="max-w-3xl mx-auto">
        {processedMessages.map(({ message, needsDateSeparator, isFirstInGroup, isLastInGroup }) => (
          <div key={message.id}>
            {needsDateSeparator && <DateSeparator timestamp={message.timestamp} />}
            <MessageBubble
              message={message}
              onCancelFile={onCancelFile}
              onReact={onReact}
              isFirstInGroup={isFirstInGroup}
              isLastInGroup={isLastInGroup}
              showTimestamp={isLastInGroup}
            />
          </div>
        ))}

        {/* Typing indicator */}
        <TypingIndicator isTyping={peerTyping} />

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
