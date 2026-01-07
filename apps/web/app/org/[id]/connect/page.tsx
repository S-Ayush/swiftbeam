'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { usePresenceStore, type OnlineMember } from '@/lib/stores/presence-store';
import { useOrganizationsStore } from '@/lib/stores/organizations-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useChatStore } from '@/lib/stores/chat-store';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Loader2,
  Users,
  Wifi,
  WifiOff,
  Zap,
  X,
  Check,
  Clock,
} from 'lucide-react';
import { RadarCanvas } from '@/components/radar';

export default function ConnectPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const orgId = params.id as string;
  const { user } = useAuthStore();
  const { currentOrg, isLoading: orgLoading, fetchOrganization, clearCurrentOrg } = useOrganizationsStore();
  const { setOrgId } = useChatStore();
  const {
    isConnected,
    onlineMembers,
    incomingRequest,
    outgoingRequest,
    acceptedRoomCode,
    connect,
    disconnect,
    requestConnection,
    acceptRequest,
    declineRequest,
    cancelRequest,
    clearAcceptedRoom,
  } = usePresenceStore();

  useEffect(() => {
    fetchOrganization(orgId);
    return () => clearCurrentOrg();
  }, [orgId, fetchOrganization, clearCurrentOrg]);

  // Connect to presence when user and org are loaded
  useEffect(() => {
    if (user && currentOrg) {
      connect(orgId, {
        id: user.id,
        name: user.name,
        email: user.email,
      });
    }

    return () => {
      disconnect();
    };
  }, [user?.id, currentOrg?.id]);

  // Handle accepted connection - redirect to room
  useEffect(() => {
    if (acceptedRoomCode) {
      toast({
        title: 'Connection established!',
        description: 'Redirecting to chat room...',
      });
      // Store orgId for reconnection capability
      setOrgId(orgId);
      clearAcceptedRoom();
      router.push(`/room/${acceptedRoomCode}/chat`);
    }
  }, [acceptedRoomCode, router, toast, clearAcceptedRoom, setOrgId, orgId]);

  const handleMemberClick = (member: OnlineMember) => {
    if (outgoingRequest) {
      toast({
        title: 'Request pending',
        description: 'Please wait for the current request to be answered',
        variant: 'destructive',
      });
      return;
    }
    requestConnection(member);
    toast({
      title: 'Request sent',
      description: `Waiting for ${member.name} to accept...`,
    });
  };

  const handleAccept = () => {
    if (incomingRequest) {
      acceptRequest(incomingRequest.requestId);
    }
  };

  const handleDecline = () => {
    if (incomingRequest) {
      declineRequest(incomingRequest.requestId);
      toast({
        title: 'Request declined',
      });
    }
  };

  const handleCancel = () => {
    if (outgoingRequest) {
      cancelRequest(outgoingRequest.requestId);
      toast({
        title: 'Request cancelled',
      });
    }
  };

  if (orgLoading && !currentOrg) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!currentOrg) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Organization not found</p>
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 container py-12">
          <div className="max-w-4xl mx-auto">
            <Link
              href={`/org/${orgId}`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {currentOrg.name}
            </Link>

            {/* Connection Status */}
            <div className="flex items-center gap-2 mb-8">
              {isConnected ? (
                <>
                  <Wifi className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-green-600">Connected to presence</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-5 w-5 text-red-500" />
                  <span className="text-sm text-red-600">Connecting...</span>
                </>
              )}
            </div>

            {/* Incoming Request Modal */}
            {incomingRequest && (
              <Card className="mb-8 border-primary bg-primary/5 animate-pulse">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-medium">
                        {incomingRequest.from.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{incomingRequest.from.name}</p>
                        <p className="text-sm text-muted-foreground">wants to connect with you</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleDecline}>
                        <X className="mr-1 h-4 w-4" />
                        Decline
                      </Button>
                      <Button size="sm" onClick={handleAccept}>
                        <Check className="mr-1 h-4 w-4" />
                        Accept
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Outgoing Request Status */}
            {outgoingRequest && (
              <Card className="mb-8 border-orange-500/50 bg-orange-500/10">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20 text-orange-400">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                      <div>
                        <p className="font-semibold">Waiting for {outgoingRequest.to.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Request expires in 60 seconds
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      <X className="mr-1 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Online Members - Radar View */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Online Members
                </CardTitle>
                <CardDescription>
                  Click on a member in the radar to connect
                </CardDescription>
              </CardHeader>
              <CardContent className="py-8">
                <RadarCanvas
                  members={onlineMembers}
                  onMemberClick={handleMemberClick}
                  disabled={!!outgoingRequest}
                  pendingMemberId={outgoingRequest?.to.id}
                />
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  How it works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Click on an online member's bubble to send a connection request</li>
                  <li>They will see your request and can accept or decline</li>
                  <li>Once accepted, you'll both be redirected to a private chat room</li>
                  <li>Share files directly peer-to-peer with end-to-end encryption</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
