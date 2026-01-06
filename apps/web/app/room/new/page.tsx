'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Users,
  Shield,
  Zap,
  Lock,
} from 'lucide-react';

export default function StartSharingPage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      setIsJoining(true);
      router.push(`/room/${roomCode.toUpperCase()}`);
    }
  };

  const handleCreateRoom = () => {
    router.push('/room/create');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinRoom();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container py-12">
        <div className="max-w-lg mx-auto">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Start Sharing</h1>
            <p className="text-muted-foreground mt-2">
              Join an existing room or create a new one
            </p>
          </div>

          {/* Join Existing Room */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-5 w-5 text-primary" />
                Join a Room
              </CardTitle>
              <CardDescription>
                Enter the room code shared by your peer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter room code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  onKeyDown={handleKeyDown}
                  className="font-mono text-center text-lg tracking-widest uppercase"
                  maxLength={8}
                  disabled={isJoining}
                />
                <Button
                  onClick={handleJoinRoom}
                  disabled={!roomCode.trim() || isJoining}
                  className="shrink-0"
                >
                  {isJoining ? 'Joining...' : 'Join'}
                  {!isJoining && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Divider */}
          <div className="relative my-8">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-sm text-muted-foreground">
              or
            </span>
          </div>

          {/* Create New Room */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Plus className="h-5 w-5 text-primary" />
                Create New Room
              </CardTitle>
              <CardDescription>
                Start a new room and share the code with your peer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleCreateRoom}
                className="w-full group"
                size="lg"
              >
                <Zap className="mr-2 h-5 w-5" />
                Create Room
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>

              {/* Features list */}
              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 text-green-500 shrink-0" />
                  <span>End-to-end encrypted transfers</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4 text-green-500 shrink-0" />
                  <span>No files stored on servers</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4 text-green-500 shrink-0" />
                  <span>Direct peer-to-peer connection</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
