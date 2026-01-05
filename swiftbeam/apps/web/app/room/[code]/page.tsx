'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConnectionProgress } from '@/components/room/connection-progress';
import { useWebRTC } from '@/hooks/use-webrtc';
import { ArrowLeft, Shield, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function JoinRoomPage() {
  const router = useRouter();
  const params = useParams();
  const code = (params.code as string).toUpperCase();

  const [isJoining, setIsJoining] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    status,
    roomCode,
    isInitiator,
    joinRoom,
    leaveRoom,
    isDataChannelOpen,
  } = useWebRTC({
    onPeerConnected: () => {
      console.log('Connected to peer!');
    },
    onPeerDisconnected: () => {
      console.log('Peer disconnected');
    },
    onConnectionChange: (newStatus) => {
      if (newStatus === 'failed') {
        setError('Failed to connect. The room may have expired or be full.');
      }
    },
  });

  // Join room on mount (with guard for React Strict Mode)
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    if (hasJoinedRef.current) return;
    hasJoinedRef.current = true;

    const initJoin = async () => {
      try {
        await joinRoom(code);
        setIsJoining(false);
      } catch (err) {
        console.error('Failed to join room:', err);
        setError('Failed to join room');
        setIsJoining(false);
      }
    };

    initJoin();
  }, [code, joinRoom]);

  // Redirect to chat when connected
  useEffect(() => {
    if (status === 'connected' && isDataChannelOpen && roomCode) {
      router.push(`/room/${roomCode}/chat`);
    }
  }, [status, isDataChannelOpen, roomCode, router]);

  const handleCancel = () => {
    leaveRoom();
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-12">
        <div className="max-w-md mx-auto">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {error
                  ? 'Connection Error'
                  : isJoining
                    ? 'Joining Room...'
                    : status === 'connected'
                      ? 'Connected!'
                      : 'Connecting to Peer'}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {error ? (
                <div className="text-center py-8">
                  <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <p className="text-destructive mb-2">{error}</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Please check the room code and try again.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => router.push('/')}>
                      Go Home
                    </Button>
                    <Button onClick={() => window.location.reload()}>
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : isJoining ? (
                <div className="flex flex-col items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">
                    Joining room {code}...
                  </p>
                </div>
              ) : (
                <>
                  {/* Room Code */}
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Joining room
                    </p>
                    <p className="text-2xl font-mono font-bold tracking-[0.3em]">
                      {code}
                    </p>
                  </div>

                  {/* Connection Progress */}
                  <div className="pt-4 border-t">
                    <ConnectionProgress
                      status={status}
                      isInitiator={isInitiator}
                    />
                  </div>

                  {/* Security note */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Shield className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">End-to-end secure</p>
                      <p className="text-muted-foreground">
                        Direct peer-to-peer connection. No data passes through
                        our servers.
                      </p>
                    </div>
                  </div>

                  {/* Cancel button */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
