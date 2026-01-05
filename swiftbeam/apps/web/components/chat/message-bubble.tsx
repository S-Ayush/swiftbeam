'use client';

import { cn } from '@/lib/utils';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Message } from '@/lib/stores/chat-store';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
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
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (message.type === 'code') {
    return (
      <div
        className={cn('flex flex-col max-w-[85%] mb-3', isOwn ? 'ml-auto' : '')}
      >
        {!isOwn && (
          <span className="text-xs text-muted-foreground mb-1 ml-1">Peer</span>
        )}
        <div
          className={cn(
            'rounded-xl border overflow-hidden',
            isOwn ? 'bg-primary/5 border-primary/20' : 'bg-muted border-border'
          )}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
            <span className="text-xs text-muted-foreground">Code</span>
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
          <pre className="p-3 overflow-x-auto text-sm font-mono">
            <code>{message.content}</code>
          </pre>
        </div>
        <span
          className={cn(
            'text-xs text-muted-foreground mt-1',
            isOwn ? 'text-right mr-1' : 'ml-1'
          )}
        >
          {formatTime(message.timestamp)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn('flex flex-col max-w-[75%] mb-3', isOwn ? 'ml-auto' : '')}
    >
      {!isOwn && (
        <span className="text-xs text-muted-foreground mb-1 ml-3">Peer</span>
      )}
      <div
        className={cn(
          'px-4 py-2.5 rounded-2xl group relative',
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted rounded-bl-md'
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>

        {/* Copy button on hover */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'absolute -right-8 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity',
            isOwn && '-left-8 -right-auto'
          )}
          onClick={copyContent}
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      <span
        className={cn(
          'text-xs text-muted-foreground mt-1',
          isOwn ? 'text-right mr-3' : 'ml-3'
        )}
      >
        {formatTime(message.timestamp)}
      </span>
    </div>
  );
}
