'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { usePresenceStore, OnlineMember } from '@/lib/stores/presence-store';
import { useOrganizationsStore } from '@/lib/stores/organizations-store';
import { useAuthStore } from '@/lib/stores/auth-store';
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

export default function ConnectPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const orgId = params.id as string;
  const { user } = useAuthStore();
  const { currentOrg, isLoading: orgLoading, fetchOrganization, clearCurrentOrg } = useOrganizationsStore();
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
      clearAcceptedRoom();
      router.push(`/room/${acceptedRoomCode}/chat`);
    }
  }, [acceptedRoomCode, router, toast, clearAcceptedRoom]);

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
              <Card className="mb-8 border-orange-200 bg-orange-50">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
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

            {/* Online Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Online Members
                </CardTitle>
                <CardDescription>
                  Click on a member to send a connection request
                </CardDescription>
              </CardHeader>
              <CardContent>
                {onlineMembers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No other members online</p>
                    <p className="text-sm">Wait for team members to come online</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-4">
                    {onlineMembers.map((member) => (
                      <MemberBubble
                        key={member.socketId}
                        member={member}
                        onClick={() => handleMemberClick(member)}
                        disabled={!!outgoingRequest}
                      />
                    ))}
                  </div>
                )}
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

interface MemberBubbleProps {
  member: OnlineMember;
  onClick: () => void;
  disabled: boolean;
}

function MemberBubble({ member, onClick, disabled }: MemberBubbleProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative flex flex-col items-center gap-2 p-4 rounded-xl
        border-2 border-transparent hover:border-primary
        bg-muted/50 hover:bg-primary/5
        transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {/* Online indicator */}
      <div className="absolute top-2 right-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
      </div>

      {/* Avatar */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-medium group-hover:scale-110 transition-transform">
        {member.name.charAt(0).toUpperCase()}
      </div>

      {/* Name */}
      <div className="text-center">
        <p className="font-medium text-sm">{member.name}</p>
        <p className="text-xs text-muted-foreground truncate max-w-[120px]">{member.email}</p>
      </div>

      {/* Hover hint */}
      {!disabled && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded whitespace-nowrap">
            Click to connect
          </span>
        </div>
      )}
    </button>
  );
}
