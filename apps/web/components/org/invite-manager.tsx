'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  organizationsAPI,
  InviteWithDetails,
  CreateInviteOptions,
} from '@/lib/api/organizations';
import { useToast } from '@/hooks/use-toast';
import {
  Copy,
  Check,
  Loader2,
  Link as LinkIcon,
  UserPlus,
  Trash2,
  XCircle,
  Users,
  Crown,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';

interface InviteManagerProps {
  orgId: string;
  orgName: string;
}

export function InviteManager({ orgId, orgName }: InviteManagerProps) {
  const { toast } = useToast();
  const [invites, setInvites] = useState<InviteWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedInvite, setExpandedInvite] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create invite form state
  const [createOptions, setCreateOptions] = useState<CreateInviteOptions>({
    role: 'MEMBER',
    label: '',
    maxUses: undefined,
    expiresInDays: 7,
  });

  const fetchInvites = async () => {
    try {
      const { invites } = await organizationsAPI.listInvites(orgId);
      setInvites(invites);
    } catch (error) {
      toast({
        title: 'Failed to load invites',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, [orgId]);

  const handleCreateInvite = async () => {
    setIsCreating(true);
    try {
      const options: CreateInviteOptions = {
        role: createOptions.role,
        expiresInDays: createOptions.expiresInDays,
      };
      if (createOptions.label?.trim()) {
        options.label = createOptions.label.trim();
      }
      if (createOptions.maxUses && createOptions.maxUses > 0) {
        options.maxUses = createOptions.maxUses;
      }

      await organizationsAPI.createInvite(orgId, options);
      toast({ title: 'Invite link created' });
      setShowCreateForm(false);
      setCreateOptions({
        role: 'MEMBER',
        label: '',
        maxUses: undefined,
        expiresInDays: 7,
      });
      fetchInvites();
    } catch (error) {
      toast({
        title: 'Failed to create invite',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async (invite: InviteWithDetails) => {
    await navigator.clipboard.writeText(invite.url);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: 'Link copied!' });
  };

  const handleRevoke = async (inviteId: string) => {
    if (!confirm('Revoke this invite? It will no longer be usable.')) return;
    setActionLoading(`revoke-${inviteId}`);
    try {
      await organizationsAPI.revokeInvite(orgId, inviteId);
      toast({ title: 'Invite revoked' });
      fetchInvites();
    } catch (error) {
      toast({
        title: 'Failed to revoke invite',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (inviteId: string) => {
    if (!confirm('Delete this invite permanently?')) return;
    setActionLoading(`delete-${inviteId}`);
    try {
      await organizationsAPI.deleteInvite(orgId, inviteId);
      toast({ title: 'Invite deleted' });
      fetchInvites();
    } catch (error) {
      toast({
        title: 'Failed to delete invite',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getInviteStatus = (invite: InviteWithDetails) => {
    if (invite.revoked) return { label: 'Revoked', color: 'text-red-500 bg-red-50' };
    if (invite.isExpired) return { label: 'Expired', color: 'text-orange-500 bg-orange-50' };
    if (invite.isExhausted) return { label: 'Used up', color: 'text-gray-500 bg-gray-50' };
    return { label: 'Active', color: 'text-green-500 bg-green-50' };
  };

  const activeInvites = invites.filter(i => !i.revoked && !i.isExpired && !i.isExhausted);
  const inactiveInvites = invites.filter(i => i.revoked || i.isExpired || i.isExhausted);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Invite Links
            </CardTitle>
            <CardDescription>
              Create and manage invite links for {orgName}
            </CardDescription>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <UserPlus className="mr-2 h-4 w-4" />
            New Invite
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Create Invite Form */}
        {showCreateForm && (
          <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
            <h4 className="font-medium">Create New Invite Link</h4>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Role</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={createOptions.role === 'MEMBER' ? 'default' : 'outline'}
                    onClick={() => setCreateOptions({ ...createOptions, role: 'MEMBER' })}
                  >
                    <Users className="mr-1 h-3 w-3" />
                    Member
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={createOptions.role === 'ADMIN' ? 'default' : 'outline'}
                    onClick={() => setCreateOptions({ ...createOptions, role: 'ADMIN' })}
                  >
                    <Crown className="mr-1 h-3 w-3" />
                    Admin
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresInDays">Expires in</Label>
                <select
                  id="expiresInDays"
                  className="w-full h-9 px-3 rounded-md border bg-background"
                  value={createOptions.expiresInDays}
                  onChange={(e) => setCreateOptions({ ...createOptions, expiresInDays: Number(e.target.value) })}
                >
                  <option value={1}>1 day</option>
                  <option value={3}>3 days</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="label">Label (optional)</Label>
                <Input
                  id="label"
                  placeholder="e.g., Marketing team"
                  value={createOptions.label}
                  onChange={(e) => setCreateOptions({ ...createOptions, label: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUses">Max uses (optional)</Label>
                <Input
                  id="maxUses"
                  type="number"
                  placeholder="Unlimited"
                  min={1}
                  max={1000}
                  value={createOptions.maxUses || ''}
                  onChange={(e) => setCreateOptions({
                    ...createOptions,
                    maxUses: e.target.value ? Number(e.target.value) : undefined,
                  })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreateInvite} disabled={isCreating}>
                {isCreating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                Create Invite
              </Button>
              <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Active Invites */}
        {activeInvites.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Active Invites</h4>
            {activeInvites.map((invite) => (
              <InviteCard
                key={invite.id}
                invite={invite}
                copiedId={copiedId}
                expandedInvite={expandedInvite}
                actionLoading={actionLoading}
                onCopy={handleCopy}
                onRevoke={handleRevoke}
                onDelete={handleDelete}
                onToggleExpand={(id) => setExpandedInvite(expandedInvite === id ? null : id)}
                getStatus={getInviteStatus}
              />
            ))}
          </div>
        )}

        {/* Inactive Invites */}
        {inactiveInvites.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Inactive Invites</h4>
            {inactiveInvites.map((invite) => (
              <InviteCard
                key={invite.id}
                invite={invite}
                copiedId={copiedId}
                expandedInvite={expandedInvite}
                actionLoading={actionLoading}
                onCopy={handleCopy}
                onRevoke={handleRevoke}
                onDelete={handleDelete}
                onToggleExpand={(id) => setExpandedInvite(expandedInvite === id ? null : id)}
                getStatus={getInviteStatus}
              />
            ))}
          </div>
        )}

        {invites.length === 0 && !showCreateForm && (
          <div className="text-center py-8 text-muted-foreground">
            <LinkIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No invite links yet</p>
            <p className="text-sm">Create one to invite members to your organization</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface InviteCardProps {
  invite: InviteWithDetails;
  copiedId: string | null;
  expandedInvite: string | null;
  actionLoading: string | null;
  onCopy: (invite: InviteWithDetails) => void;
  onRevoke: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleExpand: (id: string) => void;
  getStatus: (invite: InviteWithDetails) => { label: string; color: string };
}

function InviteCard({
  invite,
  copiedId,
  expandedInvite,
  actionLoading,
  onCopy,
  onRevoke,
  onDelete,
  onToggleExpand,
  getStatus,
}: InviteCardProps) {
  const status = getStatus(invite);
  const isActive = !invite.revoked && !invite.isExpired && !invite.isExhausted;
  const isExpanded = expandedInvite === invite.id;

  return (
    <div className={`border rounded-lg ${!isActive ? 'opacity-60' : ''}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                {status.label}
              </span>
              {invite.role === 'ADMIN' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-600 flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  Admin invite
                </span>
              )}
              {invite.label && (
                <span className="text-sm font-medium">{invite.label}</span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Input
                value={invite.url}
                readOnly
                className="font-mono text-xs h-8"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopy(invite)}
                disabled={!isActive}
              >
                {copiedId === invite.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Expires {new Date(invite.expiresAt).toLocaleDateString()}
              </span>
              <span>
                {invite.useCount} / {invite.maxUses ?? '∞'} uses
              </span>
              <span>by {invite.createdBy.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {invite.acceptedBy.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleExpand(invite.id)}
              >
                {invite.acceptedBy.length} joined
                {isExpanded ? (
                  <ChevronUp className="ml-1 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-1 h-4 w-4" />
                )}
              </Button>
            )}
            {isActive && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRevoke(invite.id)}
                disabled={actionLoading === `revoke-${invite.id}`}
                title="Revoke invite"
              >
                {actionLoading === `revoke-${invite.id}` ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 text-orange-500" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(invite.id)}
              disabled={actionLoading === `delete-${invite.id}`}
              title="Delete invite"
            >
              {actionLoading === `delete-${invite.id}` ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 text-destructive" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded section showing who accepted */}
      {isExpanded && invite.acceptedBy.length > 0 && (
        <div className="border-t bg-muted/30 p-4">
          <h5 className="text-xs font-medium text-muted-foreground mb-2">People who joined via this link</h5>
          <div className="space-y-2">
            {invite.acceptedBy.map((acceptance) => (
              <div key={acceptance.user.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {acceptance.user.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{acceptance.user.name}</span>
                  <span className="text-muted-foreground">{acceptance.user.email}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(acceptance.acceptedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
