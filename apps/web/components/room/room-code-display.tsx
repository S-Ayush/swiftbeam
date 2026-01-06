'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, Check, Link2, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QRCodeDisplay } from './qr-code-display';

interface RoomCodeDisplayProps {
  code: string;
  className?: string;
  showQR?: boolean;
}

export function RoomCodeDisplay({ code, className, showQR = true }: RoomCodeDisplayProps) {
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

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: 'Join my SwiftBeam room',
          text: `Join my secure file sharing room with code: ${code}`,
          url: roomLink,
        });
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* QR Code Section */}
      {showQR && (
        <div className="flex justify-center">
          <QRCodeDisplay code={code} size={160} />
        </div>
      )}

      {/* Separator */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-sm text-muted-foreground">or use code</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Room Code */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center">
            {/* Code display */}
            <div className="flex-1 py-4 px-6 bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1 text-center">Room Code</p>
              <p className="text-3xl font-mono font-bold tracking-[0.3em] text-center">
                {code}
              </p>
            </div>
            {/* Copy button */}
            <div className="border-l">
              <Button
                variant="ghost"
                size="lg"
                onClick={copyCode}
                className="h-full rounded-none px-4 hover:bg-muted/50"
              >
                {copiedCode ? (
                  <div className="flex flex-col items-center gap-1">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-xs text-green-500">Copied</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Copy className="h-5 w-5" />
                    <span className="text-xs text-muted-foreground">Copy</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share/Link Section */}
      <div className="flex gap-2">
        <Card className="flex-1">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground truncate flex-1 font-mono">
                {roomLink.replace('https://', '').replace('http://', '')}
              </span>
            </div>
          </CardContent>
        </Card>
        <Button
          variant="outline"
          size="default"
          onClick={handleShare}
          className="shrink-0"
        >
          {typeof navigator !== 'undefined' && 'share' in navigator ? (
            <>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </>
          ) : copiedLink ? (
            <>
              <Check className="h-4 w-4 mr-2 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
