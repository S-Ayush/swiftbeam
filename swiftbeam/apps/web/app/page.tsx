'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowRight,
  Shield,
  Zap,
  Users,
  Lock,
  Globe,
  FileUp,
} from 'lucide-react';

export default function HomePage() {
  const [roomCode, setRoomCode] = useState('');

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      // Will navigate to room
      console.log('Joining room:', roomCode.toUpperCase());
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl opacity-50" />
          </div>

          <div className="container py-24 lg:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="secondary" className="mb-6">
                <Zap className="mr-1 h-3 w-3" />
                No signup required
              </Badge>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Share files{' '}
                <span className="text-gradient">instantly</span>
                <br />
                with anyone, anywhere
              </h1>

              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
                Peer-to-peer file sharing that respects your privacy. No server
                storage, no accounts needed. Your files go directly from you to
                your recipient.
              </p>

              {/* Main CTA */}
              <div className="mt-10 flex flex-col items-center gap-6">
                <Link href="/room/new">
                  <Button size="xl" className="group">
                    <FileUp className="mr-2 h-5 w-5" />
                    Start Sharing
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>or join an existing room</span>
                </div>

                {/* Join Room */}
                <Card className="w-full max-w-md">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <Input
                        placeholder="Enter room code"
                        value={roomCode}
                        onChange={(e) =>
                          setRoomCode(e.target.value.toUpperCase())
                        }
                        className="font-mono text-center text-lg tracking-widest uppercase"
                        maxLength={8}
                      />
                      <Button
                        onClick={handleJoinRoom}
                        disabled={!roomCode.trim()}
                      >
                        Join
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Features Section */}
        <section className="container py-24">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why SwiftBeam?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Built for privacy, speed, and simplicity
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Lock className="h-6 w-6" />}
              title="End-to-End Secure"
              description="Files transfer directly between peers using WebRTC. We never see or store your data."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Lightning Fast"
              description="No upload to servers means faster transfers. Files go straight from sender to receiver."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="No Signup Required"
              description="Start sharing immediately. No accounts, no email verification, no friction."
            />
            <FeatureCard
              icon={<Globe className="h-6 w-6" />}
              title="Works Everywhere"
              description="Browser-based technology works on any device. No app downloads needed."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Team Features"
              description="Create an organization to share with your team. See who's online and share instantly."
            />
            <FeatureCard
              icon={<FileUp className="h-6 w-6" />}
              title="Large Files OK"
              description="Transfer files up to 15GB. Perfect for videos, archives, and large datasets."
            />
          </div>
        </section>

        <Separator />

        {/* CTA Section */}
        <section className="container py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to share?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Create an organization for your team and enjoy real-time presence
              and instant sharing.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/room/new">
                <Button size="lg">
                  <FileUp className="mr-2 h-4 w-4" />
                  Start Sharing Now
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Create Organization
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">SwiftBeam</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                Terms
              </Link>
              <span>Open Source</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
