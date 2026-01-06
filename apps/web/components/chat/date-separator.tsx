'use client';

import { cn } from '@/lib/utils';
import { getDateSeparator } from '@/lib/format-time';

interface DateSeparatorProps {
  timestamp: number;
  className?: string;
}

export function DateSeparator({ timestamp, className }: DateSeparatorProps) {
  const label = getDateSeparator(timestamp);

  return (
    <div className={cn('flex items-center gap-4 py-4', className)}>
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs font-medium text-muted-foreground px-2">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
