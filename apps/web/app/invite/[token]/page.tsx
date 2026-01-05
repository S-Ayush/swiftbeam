'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { organizationsAPI, InviteInfo } from '@/lib/api/organizations';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, UserPlus, AlertCircle, CheckCircle, Crown, User } from 'lucide-react';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const token = params.token as string;
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [joinedOrgId, setJoinedOrgId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvite() {
      try {
        const { invite } = await organizationsAPI.getInviteInfo(token);
        setInviteInfo(invite);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invite');
      } finally {
        setIsLoading(false);
      }
    }

    fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const result = await organizationsAPI.acceptInvite(token);
      setAccepted(true);
      setJoinedOrgId(result.organization.id);
      toast({
        title: 'Welcome!',
        description: `You've joined ${result.organization.name}`,
      });
    } catch (err) {
      toast({
        title: 'Failed to accept invite',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardHeader className="text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mx-auto mb-4">
                <AlertCircle className="h-6 w-6" />
              </div>
              <CardTitle>Invalid Invite</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href="/">
                <Button variant="outline">Go Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardHeader className="text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 mx-auto mb-4">
                <CheckCircle className="h-6 w-6" />
              </div>
              <CardTitle>You're In!</CardTitle>
              <CardDescription>
                You've successfully joined {inviteInfo?.organization.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link href={`/org/${joinedOrgId}`}>
                <Button>Go to Organization</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-4">
              <Users className="h-8 w-8" />
            </div>
            <CardTitle>You're Invited!</CardTitle>
            <CardDescription>
              {inviteInfo?.invitedBy} invited you to join
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{inviteInfo?.organization.name}</p>

              {/* Role badge */}
              <div className="flex items-center justify-center gap-2 mt-3">
                {inviteInfo?.role === 'ADMIN' ? (
                  <span className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                    <Crown className="h-4 w-4" />
                    You'll join as Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    <User className="h-4 w-4" />
                    You'll join as Member
                  </span>
                )}
              </div>

              <div className="text-sm text-muted-foreground mt-3 space-y-1">
                <p>Expires {new Date(inviteInfo?.expiresAt || '').toLocaleDateString()}</p>
                {inviteInfo?.remainingUses !== null && inviteInfo?.remainingUses !== undefined && (
                  <p>{inviteInfo.remainingUses} use{inviteInfo.remainingUses !== 1 ? 's' : ''} remaining</p>
                )}
              </div>
            </div>

            {isAuthenticated ? (
              <Button className="w-full" onClick={handleAccept} disabled={isAccepting}>
                {isAccepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Accept Invite
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-center text-muted-foreground">
                  Sign in or create an account to join this organization
                </p>
                <div className="flex gap-3">
                  <Link href={`/login?redirect=/invite/${token}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      Log in
                    </Button>
                  </Link>
                  <Link href={`/signup?redirect=/invite/${token}`} className="flex-1">
                    <Button className="w-full">Sign up</Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
