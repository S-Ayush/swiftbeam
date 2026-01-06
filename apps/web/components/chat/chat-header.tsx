'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConnectionStatusIndicator } from '@/components/room/connection-status';
import { ConnectionQualityIndicator } from '@/components/room/connection-quality';
import { Copy, Check, Link2, LogOut, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';
import type { ConnectionStatus } from '@/hooks/use-webrtc';
import { useConnectionStats, type ConnectionQuality } from '@/hooks/use-connection-stats';

interface ChatHeaderProps {
  roomCode: string;
  status: ConnectionStatus;
  onLeave: () => void;
  peerConnection: RTCPeerConnection | null;
}

export function ChatHeader({ roomCode, status, onLeave, peerConnection }: ChatHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  // Connection quality stats
  const connectionStats = useConnectionStats({
    peerConnection,
    enabled: status === 'connected',
  });

  const copyLink = async () => {
    const link = `${window.location.origin}/room/${roomCode}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left: Logo + Room code */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <span className="font-mono font-medium text-sm hidden sm:inline">
                Room: {roomCode}
              </span>
              <span className="font-mono font-medium text-sm sm:hidden">
                {roomCode}
              </span>

              {/* Connection Status & Quality */}
              <div className="flex items-center gap-2">
                {status === 'connected' ? (
                  <ConnectionQualityIndicator
                    quality={connectionStats.quality}
                    rtt={connectionStats.rtt}
                    throughput={connectionStats.throughput}
                    isCollecting={connectionStats.isCollecting}
                  />
                ) : (
                  <ConnectionStatusIndicator status={status} />
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyLink} className="hidden sm:flex">
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1 text-green-500" />
                  Copied
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-1" />
                  Copy Link
                </>
              )}
            </Button>

            {/* Mobile copy button */}
            <Button variant="outline" size="icon" onClick={copyLink} className="sm:hidden">
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLeaveDialog(true)}
              className="hidden sm:flex"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Leave
            </Button>

            {/* Mobile leave button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowLeaveDialog(true)}
              className="sm:hidden"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Leave confirmation dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Room?</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave? The connection with your peer will
              be closed and any ongoing transfers will be cancelled.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onLeave}>
              Leave Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
