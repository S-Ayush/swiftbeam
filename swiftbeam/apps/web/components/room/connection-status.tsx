'use client';

import { cn } from '@/lib/utils';
import { Loader2, CheckCircle2, XCircle, Wifi, WifiOff } from 'lucide-react';
import type { ConnectionStatus } from '@/hooks/use-webrtc';

interface ConnectionStatusProps {
  status: ConnectionStatus;
  className?: string;
}

const statusConfig: Record<
  ConnectionStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  idle: {
    label: 'Not connected',
    color: 'text-muted-foreground',
    icon: <WifiOff className="h-4 w-4" />,
  },
  connecting: {
    label: 'Connecting...',
    color: 'text-yellow-500',
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
  },
  waiting: {
    label: 'Waiting for peer...',
    color: 'text-yellow-500',
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
  },
  signaling: {
    label: 'Establishing connection...',
    color: 'text-blue-500',
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
  },
  connected: {
    label: 'Connected',
    color: 'text-green-500',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  disconnected: {
    label: 'Disconnected',
    color: 'text-red-500',
    icon: <XCircle className="h-4 w-4" />,
  },
  failed: {
    label: 'Connection failed',
    color: 'text-red-500',
    icon: <XCircle className="h-4 w-4" />,
  },
};

export function ConnectionStatusBadge({
  status,
  className,
}: ConnectionStatusProps) {
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm font-medium',
        config.color,
        className
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}

export function ConnectionStatusIndicator({
  status,
}: {
  status: ConnectionStatus;
}) {
  const isConnected = status === 'connected';
  const isConnecting = ['connecting', 'waiting', 'signaling'].includes(status);

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'h-2 w-2 rounded-full',
          isConnected && 'bg-green-500',
          isConnecting && 'bg-yellow-500 animate-pulse',
          status === 'disconnected' && 'bg-red-500',
          status === 'failed' && 'bg-red-500',
          status === 'idle' && 'bg-muted-foreground'
        )}
      />
      <span className="text-sm text-muted-foreground">
        {statusConfig[status].label}
      </span>
    </div>
  );
}
