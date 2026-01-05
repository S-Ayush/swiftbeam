'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, Check, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoomCodeDisplayProps {
  code: string;
  className?: string;
}

export function RoomCodeDisplay({ code, className }: RoomCodeDisplayProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const roomLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/room/${code}`;

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(roomLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Room Code */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">Share this code</p>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-4">
              <span className="text-3xl font-mono font-bold tracking-[0.3em]">
                {code}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={copyCode}
                className="shrink-0"
              >
                {copiedCode ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Separator */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-sm text-muted-foreground">or share link</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Room Link */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground truncate flex-1">
              {roomLink}
            </span>
            <Button variant="outline" size="sm" onClick={copyLink}>
              {copiedLink ? (
                <>
                  <Check className="h-3 w-3 mr-1 text-green-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
