'use client';

import { cn } from '@/lib/utils';
import { Check, Loader2, Circle } from 'lucide-react';
import type { ConnectionStatus } from '@/hooks/use-webrtc';

interface ConnectionProgressProps {
  status: ConnectionStatus;
  isInitiator: boolean;
}

interface Step {
  label: string;
  activeLabel: string;
  status: 'pending' | 'active' | 'complete';
}

export function ConnectionProgress({
  status,
  isInitiator,
}: ConnectionProgressProps) {
  const getSteps = (): Step[] => {
    if (isInitiator) {
      // Room creator flow
      return [
        {
          label: 'Room created',
          activeLabel: 'Creating room...',
          status:
            status === 'connecting'
              ? 'active'
              : status !== 'idle'
                ? 'complete'
                : 'pending',
        },
        {
          label: 'Peer joined',
          activeLabel: 'Waiting for peer...',
          status:
            status === 'waiting'
              ? 'active'
              : ['signaling', 'connected'].includes(status)
                ? 'complete'
                : 'pending',
        },
        {
          label: 'Connected',
          activeLabel: 'Establishing connection...',
          status:
            status === 'signaling'
              ? 'active'
              : status === 'connected'
                ? 'complete'
                : 'pending',
        },
      ];
    } else {
      // Joiner flow
      return [
        {
          label: 'Joined room',
          activeLabel: 'Joining room...',
          status:
            status === 'connecting'
              ? 'active'
              : status !== 'idle'
                ? 'complete'
                : 'pending',
        },
        {
          label: 'Connected',
          activeLabel: 'Establishing connection...',
          status:
            status === 'signaling'
              ? 'active'
              : status === 'connected'
                ? 'complete'
                : 'pending',
        },
      ];
    }
  };

  const steps = getSteps();

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors',
              step.status === 'complete' &&
                'border-green-500 bg-green-500 text-white',
              step.status === 'active' && 'border-primary',
              step.status === 'pending' && 'border-muted-foreground/30'
            )}
          >
            {step.status === 'complete' && <Check className="h-3 w-3" />}
            {step.status === 'active' && (
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            )}
            {step.status === 'pending' && (
              <Circle className="h-2 w-2 text-muted-foreground/30" />
            )}
          </div>
          <span
            className={cn(
              'text-sm transition-colors',
              step.status === 'complete' && 'text-foreground',
              step.status === 'active' && 'text-foreground font-medium',
              step.status === 'pending' && 'text-muted-foreground'
            )}
          >
            {step.status === 'active' ? step.activeLabel : step.label}
          </span>
        </div>
      ))}
    </div>
  );
}
