'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useOrganizationsStore } from '@/lib/stores/organizations-store';
import { FileUp, Users, Plus, Zap, Crown, ChevronRight, Loader2, Wifi } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { organizations, isLoading, fetchOrganizations } = useOrganizationsStore();

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 container py-12">
          <div className="max-w-4xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.name?.split(' ')[0]}
              </h1>
              <p className="text-muted-foreground">
                Start sharing or manage your organizations
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                    <FileUp className="h-6 w-6" />
                  </div>
                  <CardTitle>Quick Share</CardTitle>
                  <CardDescription>
                    Start an anonymous P2P sharing session
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/room/new">
                    <Button className="w-full">
                      <Zap className="mr-2 h-4 w-4" />
                      Start Sharing
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                    <Users className="h-6 w-6" />
                  </div>
                  <CardTitle>Create Organization</CardTitle>
                  <CardDescription>
                    Set up a team to share with colleagues
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/org/new">
                    <Button variant="outline" className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Organization
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Organizations Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Your Organizations</CardTitle>
                  <CardDescription>
                    Organizations you belong to
                  </CardDescription>
                </div>
                {organizations.length > 0 && (
                  <Link href="/org/new">
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      New
                    </Button>
                  </Link>
                )}
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : organizations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-4">You&apos;re not part of any organization yet</p>
                    <Link href="/org/new">
                      <Button variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Create your first organization
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {organizations.map((org) => (
                      <div
                        key={org.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <Link href={`/org/${org.id}`} className="flex items-center gap-3 flex-1">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{org.name}</span>
                              {org.role === 'ADMIN' && (
                                <Crown className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {org.memberCount} member{org.memberCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </Link>
                        <div className="flex items-center gap-2">
                          <Link href={`/org/${org.id}/connect`}>
                            <Button variant="outline" size="sm">
                              <Wifi className="mr-1 h-4 w-4" />
                              Connect
                            </Button>
                          </Link>
                          <Link href={`/org/${org.id}`}>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </Link>
                        </div>
                      </div>
                    ))}
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
