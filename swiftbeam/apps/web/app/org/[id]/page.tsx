'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { InviteManager } from '@/components/org/invite-manager';
import { useOrganizationsStore } from '@/lib/stores/organizations-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Loader2,
  Users,
  Settings,
  Trash2,
  LogOut,
  Crown,
  FileUp,
  Zap,
} from 'lucide-react';

export default function OrganizationPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const orgId = params.id as string;
  const { user } = useAuthStore();
  const {
    currentOrg,
    isLoading,
    error,
    fetchOrganization,
    updateOrganization,
    deleteOrganization,
    leaveOrganization,
    removeMember,
    clearCurrentOrg,
  } = useOrganizationsStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganization(orgId);
    return () => clearCurrentOrg();
  }, [orgId, fetchOrganization, clearCurrentOrg]);

  useEffect(() => {
    if (currentOrg) {
      setEditName(currentOrg.name);
    }
  }, [currentOrg]);

  const isAdmin = currentOrg?.currentUserRole === 'ADMIN';

  const handleUpdateName = async () => {
    if (editName.trim().length < 3) {
      toast({
        title: 'Invalid name',
        description: 'Organization name must be at least 3 characters',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateOrganization(orgId, editName.trim());
      setIsEditing(false);
      toast({ title: 'Organization updated' });
    } catch (err) {
      toast({
        title: 'Failed to update',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from the organization?`)) return;

    setActionLoading(`remove-${memberId}`);
    try {
      await removeMember(orgId, memberId);
      toast({ title: 'Member removed' });
    } catch (err) {
      toast({
        title: 'Failed to remove member',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this organization?')) return;

    setActionLoading('leave');
    try {
      await leaveOrganization(orgId);
      toast({ title: 'Left organization' });
      router.push('/dashboard');
    } catch (err) {
      toast({
        title: 'Failed to leave',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this organization? This cannot be undone.')) return;

    setActionLoading('delete');
    try {
      await deleteOrganization(orgId);
      toast({ title: 'Organization deleted' });
      router.push('/dashboard');
    } catch (err) {
      toast({
        title: 'Failed to delete',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading && !currentOrg) {
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

  if (error || !currentOrg) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">{error || 'Organization not found'}</p>
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
              href="/dashboard"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>

            {/* Organization Header */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Users className="h-8 w-8" />
                </div>
                <div>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-2xl font-bold h-auto py-1"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleUpdateName}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold">{currentOrg.name}</h1>
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsEditing(true)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                  <p className="text-muted-foreground">
                    {currentOrg.members.length} member{currentOrg.members.length !== 1 ? 's' : ''} ·{' '}
                    {isAdmin ? 'Admin' : 'Member'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="flex gap-3">
                <Link href={`/org/${orgId}/connect`}>
                  <Button>
                    <Users className="mr-2 h-4 w-4" />
                    Connect with Members
                  </Button>
                </Link>
                <Link href="/room/new">
                  <Button variant="outline">
                    <FileUp className="mr-2 h-4 w-4" />
                    Create Room Manually
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Invite Management (Admin only) */}
            {isAdmin && (
              <div className="mb-8">
                <InviteManager orgId={orgId} orgName={currentOrg.name} />
              </div>
            )}

            {/* Members */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Members
                </CardTitle>
                <CardDescription>
                  People who have access to this organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentOrg.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                          {member.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{member.user.name}</span>
                            {member.role === 'ADMIN' && (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            )}
                            {member.userId === user?.id && (
                              <span className="text-xs bg-muted px-2 py-0.5 rounded">You</span>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">{member.user.email}</span>
                        </div>
                      </div>

                      {isAdmin && member.userId !== user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemoveMember(member.userId, member.user.name)}
                          disabled={actionLoading === `remove-${member.userId}`}
                        >
                          {actionLoading === `remove-${member.userId}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isAdmin && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Leave Organization</p>
                      <p className="text-sm text-muted-foreground">
                        You will lose access to this organization
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={handleLeave}
                      disabled={actionLoading === 'leave'}
                    >
                      {actionLoading === 'leave' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="mr-2 h-4 w-4" />
                      )}
                      Leave
                    </Button>
                  </div>
                )}

                {isAdmin && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Delete Organization</p>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete this organization and all its data
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={actionLoading === 'delete'}
                    >
                      {actionLoading === 'delete' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
