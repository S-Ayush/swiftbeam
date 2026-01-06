'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RoomCodeDisplay } from '@/components/room/room-code-display';
import { ConnectionProgress } from '@/components/room/connection-progress';
import { useWebRTC } from '@/hooks/use-webrtc';
import { ArrowLeft, Shield, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateRoomPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(true);

  const {
    status,
    roomCode,
    isInitiator,
    createRoom,
    leaveRoom,
    isDataChannelOpen,
  } = useWebRTC({
    onPeerConnected: () => {
      console.log('Peer connected!');
    },
    onPeerDisconnected: () => {
      console.log('Peer disconnected');
    },
  });

  // Create room on mount (with guard for React Strict Mode)
  const hasCreatedRef = useRef(false);

  useEffect(() => {
    if (hasCreatedRef.current) return;
    hasCreatedRef.current = true;

    const initRoom = async () => {
      try {
        const code = await createRoom();
        console.log('Room created:', code);
        setIsCreating(false);
      } catch (error) {
        console.error('Failed to create room:', error);
        setIsCreating(false);
      }
    };

    initRoom();
  }, [createRoom]);

  // Redirect to chat when connected
  useEffect(() => {
    console.log('Redirect check:', { status, isDataChannelOpen, roomCode });
    if (status === 'connected' && isDataChannelOpen && roomCode) {
      console.log('Redirecting to chat...');
      router.push(`/room/${roomCode}/chat`);
    }
  }, [status, isDataChannelOpen, roomCode, router]);

  const handleCancel = () => {
    leaveRoom();
    router.push('/room/new');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-12">
        <div className="max-w-md mx-auto">
          {/* Back button */}
          <Link
            href="/room/new"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {isCreating
                  ? 'Creating Room...'
                  : status === 'connected'
                    ? 'Connected!'
                    : 'Share with Your Peer'}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {isCreating ? (
                <div className="flex flex-col items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">
                    Setting up secure room...
                  </p>
                </div>
              ) : roomCode ? (
                <>
                  {/* Room Code Display */}
                  <RoomCodeDisplay code={roomCode} />

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
                        Your files and messages go directly to your peer. We
                        never see them.
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
              ) : (
                <div className="text-center py-8">
                  <p className="text-destructive mb-4">
                    Failed to create room. Please try again.
                  </p>
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
