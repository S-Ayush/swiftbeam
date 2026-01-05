'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useOrganizationsStore } from '@/lib/stores/organizations-store';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Users } from 'lucide-react';

export default function CreateOrganizationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { createOrganization, isLoading, error } = useOrganizationsStore();
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (name.trim().length < 3) {
      toast({
        title: 'Invalid name',
        description: 'Organization name must be at least 3 characters',
        variant: 'destructive',
      });
      return;
    }

    try {
      const org = await createOrganization(name.trim());
      toast({
        title: 'Organization created',
        description: `${org.name} has been created successfully`,
      });
      router.push(`/org/${org.id}`);
    } catch (err) {
      toast({
        title: 'Failed to create organization',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 container py-12">
          <div className="max-w-md mx-auto">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>

            <Card>
              <CardHeader className="text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle>Create Organization</CardTitle>
                <CardDescription>
                  Set up a team to share files with your colleagues
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Organization Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Acme Inc."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isLoading}
                      minLength={3}
                      maxLength={50}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      3-50 characters. You can change this later.
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Organization'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
