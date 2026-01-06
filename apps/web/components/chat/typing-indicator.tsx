'use client';

import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  isTyping: boolean;
  className?: string;
}

export function TypingIndicator({ isTyping, className }: TypingIndicatorProps) {
  if (!isTyping) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-200',
        className
      )}
    >
      {/* Avatar placeholder */}
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
        P
      </div>

      {/* Typing bubble */}
      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce-dot" />
          <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce-dot" />
          <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce-dot" />
        </div>
      </div>

      {/* Label */}
      <span className="text-xs text-muted-foreground">typing...</span>
    </div>
  );
}

// Compact typing indicator for inline use
export function TypingIndicatorCompact({ isTyping }: { isTyping: boolean }) {
  if (!isTyping) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground animate-in fade-in-0 duration-200">
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce-dot" />
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce-dot" />
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce-dot" />
    </span>
  );
}
