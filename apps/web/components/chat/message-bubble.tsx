'use client';

import { cn } from '@/lib/utils';
import { Copy, Check, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileMessage } from './file-message';
import { formatRelativeTime, formatTime } from '@/lib/format-time';
import type { Message, MessageDeliveryStatus, MessageReaction } from '@/lib/stores/chat-store';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MessageReactions } from './message-reactions';

interface MessageBubbleProps {
  message: Message;
  onCancelFile?: (fileId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  showTimestamp?: boolean;
}

// Read receipt indicator component
function DeliveryStatus({ status }: { status: MessageDeliveryStatus }) {
  if (status === 'sending') {
    return (
      <span className="text-muted-foreground/50">
        <Check className="h-3 w-3" />
      </span>
    );
  }

  if (status === 'sent') {
    return (
      <span className="text-muted-foreground/70">
        <Check className="h-3 w-3" />
      </span>
    );
  }

  if (status === 'delivered') {
    return (
      <span className="text-muted-foreground">
        <CheckCheck className="h-3 w-3" />
      </span>
    );
  }

  if (status === 'read') {
    return (
      <span className="text-blue-500">
        <CheckCheck className="h-3 w-3" />
      </span>
    );
  }

  return null;
}

// Convert MessageReaction[] to reaction display format
function formatReactions(reactions?: MessageReaction[]) {
  if (!reactions || reactions.length === 0) return [];
  return reactions.map((r) => ({
    emoji: r.emoji,
    count: (r.fromSelf ? 1 : 0) + (r.fromPeer ? 1 : 0),
    hasReacted: r.fromSelf,
  }));
}

export function MessageBubble({
  message,
  onCancelFile,
  onReact,
  isFirstInGroup = true,
  isLastInGroup = true,
  showTimestamp = true,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isOwn = message.sender === 'self';
  const isSystem = message.sender === 'system';

  const copyContent = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  // Handle file messages
  if (message.type === 'file') {
    return <FileMessage message={message} onCancel={onCancelFile} />;
  }

  // Get border radius based on position in group
  const getBubbleRadius = () => {
    if (isOwn) {
      if (isFirstInGroup && isLastInGroup) return 'rounded-2xl rounded-br-md';
      if (isFirstInGroup) return 'rounded-2xl rounded-br-md rounded-r-lg';
      if (isLastInGroup) return 'rounded-2xl rounded-tr-lg rounded-br-md';
      return 'rounded-2xl rounded-r-lg';
    } else {
      if (isFirstInGroup && isLastInGroup) return 'rounded-2xl rounded-bl-md';
      if (isFirstInGroup) return 'rounded-2xl rounded-bl-md rounded-l-lg';
      if (isLastInGroup) return 'rounded-2xl rounded-tl-lg rounded-bl-md';
      return 'rounded-2xl rounded-l-lg';
    }
  };

  if (message.type === 'code') {
    return (
      <div
        className={cn(
          'flex flex-col max-w-[85%]',
          isOwn ? 'ml-auto' : '',
          isFirstInGroup ? 'mt-3' : 'mt-0.5'
        )}
      >
        {!isOwn && isFirstInGroup && (
          <span className="text-xs text-muted-foreground mb-1 ml-1">Peer</span>
        )}
        <div
          className={cn(
            'rounded-xl border overflow-hidden',
            isOwn ? 'bg-primary/5 border-primary/20' : 'bg-muted border-border'
          )}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
            <span className="text-xs text-muted-foreground font-medium">Code</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={copyContent}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
          <pre className="p-3 overflow-x-auto text-sm font-mono bg-[#1e1e1e] text-[#d4d4d4]">
            <code>{message.content}</code>
          </pre>
        </div>
        {showTimestamp && isLastInGroup && (
          <div
            className={cn(
              'flex items-center gap-1.5 mt-1',
              isOwn ? 'justify-end mr-1' : 'ml-1'
            )}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-[10px] text-muted-foreground cursor-default">
                    {formatRelativeTime(message.timestamp)}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {new Date(message.timestamp).toLocaleString()}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {isOwn && <DeliveryStatus status={message.status} />}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col max-w-[75%]',
        isOwn ? 'ml-auto items-end' : 'items-start',
        isFirstInGroup ? 'mt-3' : 'mt-0.5'
      )}
    >
      {!isOwn && isFirstInGroup && (
        <span className="text-xs text-muted-foreground mb-1 ml-3">Peer</span>
      )}
      <div
        className={cn(
          'px-4 py-2.5 group relative transition-colors',
          getBubbleRadius(),
          isOwn
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </p>

        {/* Copy button on hover */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'absolute top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity',
            isOwn
              ? '-left-8 hover:bg-muted'
              : '-right-8 hover:bg-muted'
          )}
          onClick={copyContent}
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground" />
          )}
        </Button>
      </div>

      {/* Reactions */}
      {onReact && (
        <MessageReactions
          messageId={message.id}
          reactions={formatReactions(message.reactions)}
          onReact={onReact}
          isOwn={isOwn}
          className="mt-1 px-1"
        />
      )}

      {/* Timestamp and delivery status */}
      {showTimestamp && isLastInGroup && (
        <div
          className={cn(
            'flex items-center gap-1.5 mt-1',
            isOwn ? 'mr-1' : 'ml-3'
          )}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[10px] text-muted-foreground cursor-default">
                  {formatRelativeTime(message.timestamp)}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {new Date(message.timestamp).toLocaleString()}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {isOwn && <DeliveryStatus status={message.status} />}
        </div>
      )}
    </div>
  );
}
