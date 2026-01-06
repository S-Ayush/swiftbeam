'use client';

import { cn } from '@/lib/utils';
import {
  ConnectionQuality,
  formatThroughput,
  formatRtt,
} from '@/hooks/use-connection-stats';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Wifi, WifiOff, Signal, SignalLow, SignalMedium, SignalHigh } from 'lucide-react';

interface ConnectionQualityBadgeProps {
  quality: ConnectionQuality;
  rtt: number | null;
  throughput: number | null;
  isCollecting: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const qualityConfig = {
  excellent: {
    label: 'Excellent',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    icon: SignalHigh,
    bars: 4,
  },
  good: {
    label: 'Good',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    icon: SignalMedium,
    bars: 3,
  },
  poor: {
    label: 'Poor',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    icon: SignalLow,
    bars: 1,
  },
  unknown: {
    label: 'Connecting',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    borderColor: 'border-border',
    icon: Signal,
    bars: 0,
  },
};

const sizeConfig = {
  sm: {
    badge: 'px-1.5 py-0.5 text-xs gap-1',
    icon: 'h-3 w-3',
    bars: { width: 2, heights: [4, 6, 8, 10], gap: 0.5 },
  },
  md: {
    badge: 'px-2 py-1 text-sm gap-1.5',
    icon: 'h-4 w-4',
    bars: { width: 3, heights: [5, 8, 11, 14], gap: 1 },
  },
  lg: {
    badge: 'px-3 py-1.5 text-sm gap-2',
    icon: 'h-5 w-5',
    bars: { width: 4, heights: [6, 10, 14, 18], gap: 1 },
  },
};

// Animated signal bars indicator
function SignalBars({
  quality,
  size = 'md',
  className,
}: {
  quality: ConnectionQuality;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const config = qualityConfig[quality];
  const sizeConf = sizeConfig[size];
  const activeBars = config.bars;

  return (
    <div
      className={cn('flex items-end', className)}
      style={{ gap: `${sizeConf.bars.gap}px` }}
    >
      {[0, 1, 2, 3].map((index) => {
        const isActive = index < activeBars;
        const height = sizeConf.bars.heights[index];

        return (
          <div
            key={index}
            className={cn(
              'rounded-sm transition-all duration-300',
              isActive ? config.color.replace('text-', 'bg-') : 'bg-muted-foreground/30'
            )}
            style={{
              width: `${sizeConf.bars.width}px`,
              height: `${height}px`,
            }}
          />
        );
      })}
    </div>
  );
}

export function ConnectionQualityBadge({
  quality,
  rtt,
  throughput,
  isCollecting,
  showLabel = false,
  size = 'md',
  className,
}: ConnectionQualityBadgeProps) {
  const config = qualityConfig[quality];
  const sizeConf = sizeConfig[size];

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center rounded-full border transition-colors cursor-default',
              config.bgColor,
              config.borderColor,
              sizeConf.badge,
              className
            )}
          >
            <SignalBars quality={quality} size={size} />
            {showLabel && (
              <span className={cn('font-medium', config.color)}>
                {config.label}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="p-0">
          <ConnectionQualityTooltip
            quality={quality}
            rtt={rtt}
            throughput={throughput}
            isCollecting={isCollecting}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Detailed tooltip content
function ConnectionQualityTooltip({
  quality,
  rtt,
  throughput,
  isCollecting,
}: {
  quality: ConnectionQuality;
  rtt: number | null;
  throughput: number | null;
  isCollecting: boolean;
}) {
  const config = qualityConfig[quality];

  return (
    <div className="min-w-[180px] p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SignalBars quality={quality} size="sm" />
          <span className={cn('font-medium', config.color)}>
            {config.label}
          </span>
        </div>
        {isCollecting && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Live
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Latency</span>
          <span className="font-mono font-medium">{formatRtt(rtt)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Speed</span>
          <span className="font-mono font-medium">{formatThroughput(throughput)}</span>
        </div>
      </div>

      {/* Quality indicator bar */}
      <div className="pt-2 border-t">
        <div className="flex gap-1">
          <div className={cn(
            'h-1.5 flex-1 rounded-full transition-colors',
            quality !== 'unknown' ? 'bg-red-500' : 'bg-muted'
          )} />
          <div className={cn(
            'h-1.5 flex-1 rounded-full transition-colors',
            quality === 'good' || quality === 'excellent' ? 'bg-yellow-500' : 'bg-muted'
          )} />
          <div className={cn(
            'h-1.5 flex-1 rounded-full transition-colors',
            quality === 'excellent' ? 'bg-green-500' : 'bg-muted'
          )} />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
          <span>Poor</span>
          <span>Good</span>
          <span>Excellent</span>
        </div>
      </div>
    </div>
  );
}

// Compact inline indicator (for chat header)
export function ConnectionQualityIndicator({
  quality,
  rtt,
  throughput,
  isCollecting,
  className,
}: ConnectionQualityBadgeProps) {
  const config = qualityConfig[quality];

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-1.5', className)}>
            <SignalBars quality={quality} size="sm" />
            <span className={cn('text-xs font-medium hidden sm:inline', config.color)}>
              {rtt !== null ? `${rtt}ms` : '--'}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="p-0">
          <ConnectionQualityTooltip
            quality={quality}
            rtt={rtt}
            throughput={throughput}
            isCollecting={isCollecting}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Full-width status bar for room pages
export function ConnectionQualityBar({
  quality,
  rtt,
  throughput,
  isCollecting,
  className,
}: ConnectionQualityBadgeProps) {
  const config = qualityConfig[quality];

  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-2 rounded-lg border',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div className="flex items-center gap-3">
        <SignalBars quality={quality} size="md" />
        <div>
          <p className={cn('text-sm font-medium', config.color)}>
            {config.label} Connection
          </p>
          <p className="text-xs text-muted-foreground">
            {isCollecting ? 'Monitoring connection quality' : 'Waiting for connection...'}
          </p>
        </div>
      </div>

      {isCollecting && (
        <div className="flex items-center gap-4 text-sm">
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Latency</p>
            <p className="font-mono font-medium">{formatRtt(rtt)}</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Speed</p>
            <p className="font-mono font-medium">{formatThroughput(throughput)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
