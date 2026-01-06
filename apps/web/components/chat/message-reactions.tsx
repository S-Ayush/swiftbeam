'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SmilePlus } from 'lucide-react';

// Common quick reactions
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface MessageReactionsProps {
  messageId: string;
  reactions: Reaction[];
  onReact: (messageId: string, emoji: string) => void;
  isOwn?: boolean;
  className?: string;
}

export function MessageReactions({
  messageId,
  reactions,
  onReact,
  isOwn = false,
  className,
}: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPicker]);

  const handleReaction = (emoji: string) => {
    onReact(messageId, emoji);
    setShowPicker(false);
  };

  const hasReactions = reactions.length > 0;

  return (
    <div
      className={cn(
        'flex items-center gap-1 flex-wrap',
        isOwn ? 'justify-end' : 'justify-start',
        className
      )}
    >
      {/* Existing reactions */}
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => handleReaction(reaction.emoji)}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all',
            'hover:scale-110 active:scale-95',
            reaction.hasReacted
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'bg-muted hover:bg-muted/80 border border-transparent'
          )}
        >
          <span className="text-sm">{reaction.emoji}</span>
          {reaction.count > 1 && (
            <span className="font-medium">{reaction.count}</span>
          )}
        </button>
      ))}

      {/* Add reaction button */}
      <div className="relative">
        <Button
          ref={buttonRef}
          variant="ghost"
          size="icon"
          className={cn(
            'h-6 w-6 rounded-full',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            showPicker && 'opacity-100'
          )}
          onClick={() => setShowPicker(!showPicker)}
        >
          <SmilePlus className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>

        {/* Reaction picker */}
        {showPicker && (
          <div
            ref={pickerRef}
            className={cn(
              'absolute z-50 bottom-full mb-2',
              'flex items-center gap-1 p-1.5 rounded-full',
              'bg-popover border shadow-lg',
              'animate-in fade-in-0 zoom-in-95 duration-150',
              isOwn ? 'right-0' : 'left-0'
            )}
          >
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={cn(
                  'w-8 h-8 flex items-center justify-center rounded-full text-lg',
                  'hover:bg-muted hover:scale-125 transition-all',
                  'active:scale-100'
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Compact reaction display for message list
export function ReactionBadges({
  reactions,
  className,
}: {
  reactions: Reaction[];
  className?: string;
}) {
  if (reactions.length === 0) return null;

  return (
    <div className={cn('flex items-center gap-1 flex-wrap', className)}>
      {reactions.map((reaction) => (
        <span
          key={reaction.emoji}
          className={cn(
            'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs',
            reaction.hasReacted
              ? 'bg-primary/15 border border-primary/20'
              : 'bg-muted/80'
          )}
        >
          <span>{reaction.emoji}</span>
          {reaction.count > 1 && (
            <span className="text-muted-foreground">{reaction.count}</span>
          )}
        </span>
      ))}
    </div>
  );
}
